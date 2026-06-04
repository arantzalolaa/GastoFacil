import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonFooter, IonIcon } from '@ionic/angular/standalone';
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
} from 'ionicons/icons';
import { GastosService } from '../services/gastos.service';

export interface GastoIA {
  establecimiento: string;
  concepto: string;
  monto: number;
  fecha: string;
  categoria: string;
  metodo_pago: string;
  notas: string;
}

@Component({
  selector: 'app-confirmar-gasto',
  templateUrl: 'confirmar-gasto.page.html',
  styleUrls: ['confirmar-gasto.page.scss'],
  imports: [CommonModule, IonButton, IonContent, IonFooter, IonIcon],
})
export class ConfirmarGastoPage {
  private readonly router = inject(Router);
  private readonly gastosService = inject(GastosService);

  gastoDetectado: GastoIA = {
    establecimiento: 'OXXO',
    concepto: 'Refresco y botana',
    monto: 85,
    fecha: '12/10/2023',
    categoria: 'Comida',
    metodo_pago: 'Efectivo',
    notas: 'Escaneado desde ticket',
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
    });
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
    const [dia, mes, anio] = fecha.split('/').map(Number);

    return new Date(anio, mes - 1, dia, 12).toISOString();
  }
}