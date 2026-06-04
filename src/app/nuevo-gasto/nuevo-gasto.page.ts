import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, qrCodeOutline } from 'ionicons/icons';
import { GastosService } from '../services/gastos.service';

export interface NuevoGastoFormValue {
  concepto: string;
  monto: number | null;
  fecha: string;
  categoria: string;
  metodo_pago: string;
  notas: string | null;
}

@Component({
  selector: 'app-nuevo-gasto',
  templateUrl: 'nuevo-gasto.page.html',
  styleUrls: ['nuevo-gasto.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonCol,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonRow,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
})
export class NuevoGastoPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly gastosService = inject(GastosService);
  private readonly router = inject(Router);

  categorias = ['Comida', 'Transporte', 'Servicios', 'Ocio', 'Estudios', 'Salud'];
  metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia'];
  guardando = false;
  errorGuardado = '';

  gastoForm = this.formBuilder.group({
    concepto: ['', Validators.required],
    monto: [null as number | null, Validators.required],
    fecha: [this.obtenerFechaActual(), Validators.required],
    categoria: ['', Validators.required],
    metodo_pago: ['Efectivo', Validators.required],
    notas: [''],
  });

  constructor() {
    addIcons({ personCircleOutline, qrCodeOutline });
  }

  obtenerFechaActual(): string {
    return new Date().toISOString().split('T')[0];
  }

  seleccionarMetodoPago(metodo: string): void {
    this.gastoForm.patchValue({ metodo_pago: metodo });
    this.gastoForm.get('metodo_pago')?.markAsTouched();
  }

  async guardarGasto(): Promise<void> {
    if (this.gastoForm.invalid || this.guardando) {
      this.gastoForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.errorGuardado = '';
    const formValue = this.gastoForm.getRawValue();
    const nuevoGasto: NuevoGastoFormValue = {
      concepto: formValue.concepto ?? '',
      monto: formValue.monto,
      fecha: this.normalizarFecha(formValue.fecha ?? ''),
      categoria: formValue.categoria ?? '',
      metodo_pago: formValue.metodo_pago ?? '',
      notas: formValue.notas || null,
    };

    try {
      await this.gastosService.crearGasto({
        ...nuevoGasto,
        monto: Number(nuevoGasto.monto),
      });
      this.gastoForm.reset({
        concepto: '',
        monto: null,
        fecha: this.obtenerFechaActual(),
        categoria: '',
        metodo_pago: 'Efectivo',
        notas: '',
      });
      await this.router.navigate(['/gastos']);
    } catch (error) {
      console.error('No se pudo guardar el gasto:', error);
      this.errorGuardado = 'No se pudo guardar el gasto. Intenta nuevamente.';
    } finally {
      this.guardando = false;
    }
  }

  private normalizarFecha(fecha: string): string {
    return new Date(`${fecha}T12:00:00`).toISOString();
  }
}