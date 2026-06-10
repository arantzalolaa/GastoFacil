import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bagHandleOutline,
  calendarOutline,
  cashOutline,
  chevronDownOutline,
  documentTextOutline,
  eyeOutline,
  restaurantOutline,
  sparkles,
  storefrontOutline,
  bulbOutline,
  carOutline,
  gameControllerOutline,
  schoolOutline,
  medkitOutline,
  shapesOutline,
  closeOutline // <-- Agregamos el icono de cerrar
} from 'ionicons/icons';
import { GastosService } from '../services/gastos.service';
import { AnalisisTicketService, GastoIA } from '../services/analisis-ticket.service';
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

  cargando = true;
  errorAnalisis = false;
  imagenTicketBase64: string | null = null;
  mostrarVisor = false; // <-- Controla si se ve el visor o no

  gastoDetectado: GastoIA = {
    establecimiento: '',
    concepto: '',
    monto: 0,
    fecha: '',
    categoria: '',
    metodo_pago: '',
    notas: '',
  };

  constructor() {
    addIcons({
      bagHandleOutline,
      calendarOutline,
      cashOutline,
      chevronDownOutline,
      documentTextOutline,
      eyeOutline,
      restaurantOutline,
      sparkles,
      storefrontOutline,
      bulbOutline,
      carOutline,
      gameControllerOutline,
      schoolOutline,
      medkitOutline,
      shapesOutline,
      closeOutline // <-- Registramos el icono
    });
  }

  ionViewWillEnter(): void {
    void this.iniciarAnalisis();
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
      this.gastoDetectado = await this.analisisService.analizarTicket();
    } catch (error) {
      this.errorAnalisis = true;
      console.error(error);
    } finally {
      this.cargando = false;
    }
  }

  // Funciones para controlar el visor
  abrirVisor(): void {
    this.mostrarVisor = true;
  }

  cerrarVisor(): void {
    this.mostrarVisor = false;
  }

  obtenerIconoCategoria(categoria: string): string {
    const cat = normalizarCategoria(categoria);
    const mapaIconos: Record<string, string> = {
      comida: 'restaurant-outline',
      servicios: 'bulb-outline',
      transporte: 'car-outline',
      ocio: 'game-controller-outline',
      estudios: 'school-outline',
      salud: 'medkit-outline',
      otros: 'shapes-outline'
    };

    return mapaIconos[cat] || 'shapes-outline';
  }

  async confirmarYGuardar(): Promise<void> {
    await this.gastosService.crearGasto({
      concepto: this.gastoDetectado.concepto,
      monto: this.gastoDetectado.monto,
      fecha: this.normalizarFechaDetectada(this.gastoDetectado.fecha),
      categoria: this.gastoDetectado.categoria,
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