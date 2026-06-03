import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  categorias = ['Comida', 'Transporte', 'Servicios', 'Ocio', 'Estudios', 'Salud'];
  metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia'];

  gastoForm = this.formBuilder.group({
    concepto: ['', Validators.required],
    monto: [null as number | null, Validators.required],
    fecha: [this.obtenerFechaActual(), Validators.required],
    categoria: ['', Validators.required],
    metodo_pago: ['Efectivo', Validators.required],
    notas: [''],
  });

  constructor(private readonly formBuilder: FormBuilder) {
    addIcons({ personCircleOutline, qrCodeOutline });
  }

  seleccionarMetodoPago(metodo: string): void {
    this.gastoForm.patchValue({ metodo_pago: metodo });
    this.gastoForm.get('metodo_pago')?.markAsTouched();
  }

  guardarGasto(): void {
    if (this.gastoForm.invalid) {
      this.gastoForm.markAllAsTouched();
      return;
    }

    const formValue = this.gastoForm.getRawValue();
    const nuevoGasto: NuevoGastoFormValue = {
      concepto: formValue.concepto ?? '',
      monto: formValue.monto,
      fecha: formValue.fecha ?? '',
      categoria: formValue.categoria ?? '',
      metodo_pago: formValue.metodo_pago ?? '',
      notas: formValue.notas || null,
    };

    console.log('Nuevo gasto listo para Supabase:', nuevoGasto);
  }

  private obtenerFechaActual(): string {
    return new Date().toISOString().slice(0, 10);
  }
}