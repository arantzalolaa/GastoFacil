import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { GastosService } from '../services/gastos.service';
import { AnalisisTicketService, GastoIA } from '../services/analisis-ticket.service';
import { CategoriasService } from '../services/categorias.service';
import { normalizarCategoria } from '../services/categorias.util';

@Component({
  selector: 'app-confirmar-gasto',
  templateUrl: 'confirmar-gasto.page.html',
  styleUrls: ['confirmar-gasto.page.scss'],
  imports: [CommonModule, IonButton, IonContent, IonIcon, IonSpinner],
})
export class ConfirmarGastoPage {
  private readonly router = inject(Router);
  private readonly gastosService = inject(GastosService);
  private readonly analisisService = inject(AnalisisTicketService);
  private readonly categoriasService = inject(CategoriasService);

  cargando = true;
  errorAnalisis = false;
  imagenTicketBase64: string | null = null;
  mostrarVisor = false;

  gastoDetectado: GastoIA = {
    establecimiento: '',
    concepto: '',
    monto: 0,
    fecha: '',
    categoria: '',
    metodo_pago: '',
    notas: '',
  };

  private nombreCategoriaMap = new Map<string, number>();

  constructor() {
    // Ya no es necesario addIcons aquí
  }

  async ionViewWillEnter(): Promise<void> {
    await this.cargarMapaCategorias();
    await this.iniciarAnalisis();
  }

  private async cargarMapaCategorias(): Promise<void> {
    try {
      const cats = await this.categoriasService.obtenerCategorias({ incluirInactivas: false });
      cats.forEach(c => this.nombreCategoriaMap.set(c.nombre.toLowerCase().trim(), c.id));
    } catch (error) {
      console.error('No se pudo cargar el mapa de categorías:', error);
    }
  }

  private async iniciarAnalisis(): Promise<void> {
    this.cargando = true;
    this.errorAnalisis = false;
    this.imagenTicketBase64 = this.analisisService.getImagen();

    if (!this.imagenTicketBase64) {
      this.router.navigate(['/escanear']);
      return;
    }

    try {
      const resultado = await this.analisisService.analizarTicket();
      
      if (!resultado || !resultado.monto || resultado.monto === 0) {
        this.errorAnalisis = true;
        console.error('La IA no pudo analizar correctamente el ticket');
        return;
      }
      
      this.gastoDetectado = resultado;
    } catch (error) {
      this.errorAnalisis = true;
      console.error('Error al analizar con IA:', error);
    } finally {
      this.cargando = false;
    }
  }

  abrirVisor(): void { this.mostrarVisor = true; }
  cerrarVisor(): void { this.mostrarVisor = false; }

  obtenerIconoCategoria(categoria: string): string {
    const cat = normalizarCategoria(categoria);
    const mapaIconos: Record<string, string> = {
      comida: 'restaurant-outline', servicios: 'bulb-outline', transporte: 'car-outline',
      ocio: 'game-controller-outline', estudios: 'school-outline', salud: 'medkit-outline',
      otros: 'shapes-outline'
    };
    return mapaIconos[cat] || 'shapes-outline';
  }

  async confirmarYGuardar(): Promise<void> {
    const nombreCatIa = this.gastoDetectado.categoria.toLowerCase().trim();
    const categoriaIdTraducido = this.nombreCategoriaMap.get(nombreCatIa) ?? null;

    await this.gastosService.crearGasto({
      concepto: this.gastoDetectado.concepto,
      monto: this.gastoDetectado.monto,
      fecha: this.normalizarFechaDetectada(this.gastoDetectado.fecha),
      categoria_id: categoriaIdTraducido,
      metodo_pago: this.gastoDetectado.metodo_pago,
      notas: this.gastoDetectado.notas,
    });
    await this.router.navigate(['/inicio']);
  }

  corregirManualmente(): void {
    this.router.navigate(['/nuevo-gasto']);
  }

  private normalizarFechaDetectada(fecha: string): string {
    if (!fecha || !fecha.includes('/')) return new Date().toISOString();
    const [dia, mes, anio] = fecha.split('/').map(Number);
    return new Date(anio, mes - 1, dia, 12).toISOString();
  }
}