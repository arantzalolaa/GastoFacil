// src/app/pages/historial-msi/historial-msi.page.ts
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { 
  IonBackButton, 
  IonButton, 
  IonButtons, 
  IonContent, 
  IonHeader, 
  IonIcon, 
  IonSpinner,
  IonTitle, 
  IonToolbar, 
  ToastController 
} from '@ionic/angular/standalone';
import { MsiService } from '../services/msi.service';
import { CompraMSI } from '../models/msi.model';

@Component({
  selector: 'app-historial-msi',
  templateUrl: 'historial-msi.page.html',
  styleUrls: ['historial-msi.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class HistorialMsiPage {
  private readonly msiService = inject(MsiService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  comprasMSI: CompraMSI[] = [];
  cargando = true;

  mostrarLiquidadas = false;

  constructor() {}

  async ionViewWillEnter(): Promise<void> {
    await this.cargarHistorial();
  }

  async cargarHistorial(): Promise<void> {
    this.cargando = true;
    try {
      this.comprasMSI = await this.msiService.obtenerComprasMSI({
        incluirLiquidadas: this.mostrarLiquidadas
      });
    } catch (error) {
      console.error('Error al cargar historial MSI:', error);
      await this.mostrarToast('Error al cargar el historial', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  toggleMostrarLiquidadas(): void {
    this.mostrarLiquidadas = !this.mostrarLiquidadas;
    this.cargarHistorial();
  }

  async eliminarCompra(id: number): Promise<void> {
    if (!confirm('¿Estás seguro de eliminar esta compra a MSI?')) return;

    try {
      await this.msiService.eliminarCompraMSI(id);
      await this.cargarHistorial();
      await this.mostrarToast('Compra eliminada correctamente', 'success');
    } catch (error) {
      console.error('Error al eliminar compra:', error);
      await this.mostrarToast('Error al eliminar la compra', 'danger');
    }
  }

  async liquidarCompra(compra: CompraMSI): Promise<void> {
    const fechaLiquidacion = new Date().toISOString().split('T')[0];
    if (!confirm(`¿Liquidar "${compra.concepto}" por $${compra.monto_total.toFixed(2)}?`)) return;

    try {
      await this.msiService.liquidarCompraMSI(compra.id, fechaLiquidacion);
      await this.cargarHistorial();
      await this.mostrarToast('✅ Compra liquidada correctamente', 'success');
    } catch (error) {
      console.error('Error al liquidar compra:', error);
      await this.mostrarToast('Error al liquidar la compra', 'danger');
    }
  }

  getPorcentajeCompletado(compra: CompraMSI): number {
    if (compra.meses_total === 0) return 0;
    const pagados = compra.meses_total - compra.meses_restantes;
    return Math.round((pagados / compra.meses_total) * 100);
  }

  getColorProgreso(compra: CompraMSI): string {
    if (compra.liquidada) return '#10b981';
    const porcentaje = this.getPorcentajeCompletado(compra);
    if (porcentaje > 75) return '#10b981';
    if (porcentaje > 50) return '#f59e0b';
    if (porcentaje > 25) return '#f97316';
    return '#ef4444';
  }

  calcularMesesRestantes(compra: CompraMSI): string {
    if (compra.liquidada) return 'Liquidada';
    if (compra.meses_restantes === 0) return 'Último mes';
    if (compra.meses_restantes === 1) return '1 mes restante';
    return `${compra.meses_restantes} meses restantes`;
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'warning' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}