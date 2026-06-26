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
import { GastosService } from '../services/gastos.service';
import { Categoria, CategoriasService } from '../services/categorias.service';

@Component({
  selector: 'app-nuevo-gasto',
  templateUrl: 'nuevo-gasto.page.html',
  styleUrls: ['nuevo-gasto.page.scss'],
  standalone: true,
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
  private readonly categoriasService = inject(CategoriasService);

  categorias: Categoria[] = [];
  metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia'];

  guardando = false;
  errorGuardado = '';

  gastoForm = this.formBuilder.group({
    concepto: ['', Validators.required],
    monto: [null as number | null, Validators.required],
    fecha: [this.obtenerFechaActual(), Validators.required],
    categoria_id: [null as number | null, Validators.required],
    metodo_pago: ['Efectivo', Validators.required],
    notas: [''],
  });

  constructor() {}

  async ionViewWillEnter(): Promise<void> {
    await this.cargarCategorias();
  }

  private async cargarCategorias(): Promise<void> {
    try {
      this.categorias = await this.categoriasService.obtenerCategorias({ incluirInactivas: false });
    } catch (error) {
      console.error('No se pudieron cargar las categorías:', error);
      this.categorias = [];
      this.errorGuardado = 'No se pudieron cargar tus categorías.';
    }
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

    try {
      await this.gastosService.crearGasto({
        concepto: formValue.concepto?.trim() ?? '',
        monto: Number(formValue.monto),
        fecha: this.normalizarFecha(formValue.fecha ?? ''),
        categoria_id: formValue.categoria_id,
        metodo_pago: formValue.metodo_pago ?? '',
        notas: formValue.notas?.trim() || null,
      });

      this.gastoForm.reset({
        concepto: '',
        monto: null,
        fecha: this.obtenerFechaActual(),
        categoria_id: null,
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