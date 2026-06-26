import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Gasto, GastosService } from '../services/gastos.service';

export interface ResumenCategoria {
  categoria: string;
  total: number;
  porcentaje: number;
  icono: string;
  colorHex: string;      // Color base (se mantiene igual)
  colorBg: string;       // Color para el fondo del icono (pastel)
  colorIcon: string;     // Color saturado para el icono, donut y puntitos
  activa: boolean;
}

@Component({
  selector: 'app-resumen',
  templateUrl: 'resumen.page.html',
  styleUrls: ['resumen.page.scss'],
  imports: [CommonModule, IonContent, IonIcon],
})
export class ResumenPage {
  private readonly gastosService = inject(GastosService);

  variacionMesAnterior = 0;
  totalAcumulado = 0;
  desgloseCategorias: ResumenCategoria[] = [];
  categoriaPrincipal: ResumenCategoria | null = null;
  chartGradient = '';
  
  tituloFeedback = '¡Vas por buen camino!';
  mensajeFeedback = '';

  private readonly paletaColores = [
    '#c98500', '#a23b43', '#1267b4', '#7c3aed', '#d9468f', 
    '#0b8a61', '#4b5563', '#e11d48', '#0284c7', '#65a30d',
    '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#3b82f6'
  ];

  constructor() {}

  ionViewWillEnter(): void {
    void this.cargarResumen();
  }

  private async cargarResumen(): Promise<void> {
    try {
      const gastos = await this.gastosService.obtenerGastos();
      const ahora = new Date();
      
      const gastosMesActual = gastos.filter((gasto) => this.esMismoMes(gasto.fecha, ahora));
      const gastosMesAnterior = gastos.filter((gasto) => this.esMesAnterior(gasto.fecha, ahora));

      this.totalAcumulado = this.sumarMontos(gastosMesActual);
      this.variacionMesAnterior = this.calcularVariacion(this.totalAcumulado, this.sumarMontos(gastosMesAnterior));
      
      this.desgloseCategorias = this.calcularDesgloseCategorias(gastosMesActual);
      
      const maxCategoria = [...this.desgloseCategorias].sort((a, b) => b.total - a.total)[0];
      this.categoriaPrincipal = maxCategoria && maxCategoria.total > 0 ? maxCategoria : null;

      this.chartGradient = this.crearGradienteCategorias();
      this.generarMensajeFeedback();

    } catch (error) {
      console.error('No se pudo cargar el resumen:', error);
      this.resetearDatos();
    }
  }

  private calcularDesgloseCategorias(gastos: Gasto[]): ResumenCategoria[] {
    if (gastos.length === 0) return [];

    const mapaAgrupado = new Map<number, { 
      nombre: string; 
      icono: string; 
      color: string;
      total: number;
      activa: boolean;
    }>();
    
    gastos.forEach(gasto => {
      const id = gasto.categoria_id ?? -1;
      const nombre = gasto.categoria?.nombre || 'Sin categoría';
      const icono = gasto.categoria?.icono || 'receipt-outline';
      const color = gasto.categoria?.color || '#64748b';
      const activa = gasto.categoria?.activa ?? true;
      
      const datosActuales = mapaAgrupado.get(id);
      const totalActual = datosActuales?.total || 0;
      
      mapaAgrupado.set(id, { 
        nombre, 
        icono, 
        color,
        total: totalActual + gasto.monto,
        activa
      });
    });

    const resultado: ResumenCategoria[] = [];
    let indiceColor = 0;

    const categoriasOrdenadas = Array.from(mapaAgrupado.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total);

    categoriasOrdenadas.forEach((item) => {
      const porcentaje = this.totalAcumulado > 0 
        ? Math.round((item.total / this.totalAcumulado) * 100) 
        : 0;

      const esInactiva = !item.activa;
      
      const colorBase = esInactiva ? '#9CA3AF' : (item.color || this.paletaColores[indiceColor % this.paletaColores.length]);
      
      // COLOR SATURADO para donut, puntitos e iconos
      const colorSaturado = esInactiva ? '#6B7280' : this.saturateColor(colorBase);
      
      // COLOR PASTEL solo para el fondo del icono (bg)
      const colorPastel = esInactiva ? '#D1D5DB' : this.desaturateColor(colorBase);

      resultado.push({
        categoria: item.nombre,
        total: item.total,
        porcentaje,
        icono: esInactiva ? 'alert-circle-outline' : item.icono,
        colorHex: colorSaturado,   // ✅ Ahora usa color SATURADO para puntitos
        colorBg: colorPastel,      // ✅ Color pastel para fondo del icono
        colorIcon: colorSaturado,  // ✅ Color saturado para icono y donut
        activa: item.activa
      });
      indiceColor++;
    });

    return resultado;
  }

  private crearGradienteCategorias(): string {
    if (this.totalAcumulado === 0 || this.desgloseCategorias.length === 0) {
      return 'conic-gradient(#E6E8EA 0deg 360deg)';
    }

    let inicio = 0;
    const segmentos = this.desgloseCategorias
      .filter(item => item.total > 0)
      .map((item, index, array) => {
        const proporcion = item.total / this.totalAcumulado;
        const grados = proporcion * 360;
        const fin = index === array.length - 1 ? 360 : inicio + grados;
        const segmento = `${item.colorIcon} ${inicio.toFixed(2)}deg ${fin.toFixed(2)}deg`;
        inicio = fin;
        return segmento;
      });

    return `conic-gradient(${segmentos.join(', ')})`;
  }

  private generarMensajeFeedback(): void {
    const absVariacion = Math.abs(this.variacionMesAnterior);
    const nombreCategoria = this.categoriaPrincipal ? this.categoriaPrincipal.categoria : 'tus gastos';

    if (this.variacionMesAnterior <= 0) {
      this.tituloFeedback = '¡Vas por buen camino!';
      this.mensajeFeedback = `Has ahorrado un ${absVariacion}% comparado con el mes anterior. Mantén el enfoque en tu categoría de ${nombreCategoria}.`;
    } else {
      this.tituloFeedback = '¡Cuidado con tus gastos!';
      this.mensajeFeedback = `Has gastado un ${absVariacion}% más comparado con el mes anterior. Revisa bien tus gastos en la categoría de ${nombreCategoria}.`;
    }
  }

  private desaturateColor(hex: string): string {
    if (!hex) return '#D1D5DB';
    
    const { r, g, b } = this.hexToRgb(hex);
    let { h, s, l } = this.rgbToHsl(r, g, b);
    
    s = Math.max(0, s - 40);
    l = Math.min(100, l + 20);
    
    return this.hslToHex(h, s, l);
  }

  private sumarMontos(gastos: Gasto[]): number {
    return gastos.reduce((total, gasto) => total + gasto.monto, 0);
  }

  private calcularVariacion(actual: number, anterior: number): number {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return Math.round(((actual - anterior) / anterior) * 100);
  }

  private esMismoMes(fecha: string, referencia: Date): boolean {
    const d = new Date(fecha);
    return d.getFullYear() === referencia.getFullYear() && d.getMonth() === referencia.getMonth();
  }

  private esMesAnterior(fecha: string, referencia: Date): boolean {
    const mesAnterior = new Date(referencia.getFullYear(), referencia.getMonth() - 1, 1);
    return this.esMismoMes(fecha, mesAnterior);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    let c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    return {
      r: parseInt(c[0] + c[1], 16),
      g: parseInt(c[2] + c[3], 16),
      b: parseInt(c[4] + c[5], 16)
    };
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    s /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  }

  private saturateColor(hex: string): string {
    if (!hex) return '#64748b';

    const { r, g, b } = this.hexToRgb(hex);
    let { h, s, l } = this.rgbToHsl(r, g, b);

    s = Math.min(100, s + 50);
    l = Math.max(0, l - 45);

    return this.hslToHex(h, s, l);
  }

  private resetearDatos(): void {
    this.totalAcumulado = 0;
    this.variacionMesAnterior = 0;
    this.desgloseCategorias = [];
    this.categoriaPrincipal = null;
    this.chartGradient = 'conic-gradient(#E6E8EA 0deg 360deg)';
  }
}