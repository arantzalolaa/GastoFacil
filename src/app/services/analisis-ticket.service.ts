import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../environments/environment';

export interface GastoIA {
  establecimiento: string;
  concepto: string;
  monto: number;
  fecha: string;
  categoria: string;
  metodo_pago: string;
  notas: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalisisTicketService {
  private imagenBase64: string | null = null;
  // Se inicializa el SDK con la clave del environment
  private genAI = new GoogleGenerativeAI(environment.geminiApiKey);

  setImagen(base64: string): void {
    this.imagenBase64 = base64;
  }

  getImagen(): string | null {
    return this.imagenBase64;
  }

  async analizarTicket(): Promise<GastoIA> {
    if (!this.imagenBase64) {
      throw new Error('No hay imagen para analizar');
    }

    // Gemini requiere el Base64 puro, sin el prefijo de data URI
    const base64Data = this.imagenBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    // Se utiliza el modelo 1.5-flash optimizado para multimodalidad rápida
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Analiza el siguiente recibo o ticket de compra. Extrae la información y responde ÚNICAMENTE con un objeto JSON válido, sin bloques de código markdown ni texto adicional. 
      Usa exactamente las siguientes llaves y tipos de datos:
      - "establecimiento": Nombre del lugar (string).
      - "concepto": Un resumen muy corto de lo que se compró (string).
      - "monto": El total pagado, solo números y decimales (number).
      - "fecha": Fecha en formato "DD/MM/YYYY" (string). Si no se distingue, usa la fecha de hoy.
      - "categoria": Elige la opción más lógica de esta lista estricta: "Comida", "Servicios", "Transporte", "Ocio", "Estudios", "Salud" u "Otros" (string).
      - "metodo_pago": Elige la opción más lógica de esta lista estricta: "Efectivo", "Tarjeta" o "Transferencia" (string). Si no se indica, asume "Efectivo".
      - "notas": Una breve nota de 1 línea de lo detectado, o "Escaneado con IA" (string).
    `;

    const imageParts = [{
      inlineData: {
        data: base64Data,
        mimeType: 'image/jpeg'
      }
    }];

    try {
      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      let text = response.text().trim();
      
      // Limpieza de formato markdown por seguridad
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(text) as GastoIA;
    } catch (error) {
      console.error('Error procesando la imagen con Gemini:', error);
      throw error;
    }
  }
}