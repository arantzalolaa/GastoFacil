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
    const gastoParaSupabase = {
      establecimiento: this.gastoDetectado.establecimiento,
      concepto: this.gastoDetectado.concepto,
      monto: this.gastoDetectado.monto,
      fecha: this.gastoDetectado.fecha,
      categoria: this.gastoDetectado.categoria,
      metodo_pago: this.gastoDetectado.metodo_pago,
      notas: this.gastoDetectado.notas,
    };

    console.log('Gasto listo para guardar en Supabase:', gastoParaSupabase);
    await Promise.resolve(gastoParaSupabase);
    await this.router.navigate(['/inicio']);
  }

  corregirManualmente(): void {
    this.router.navigate(['/nuevo-gasto']);
  }
}