// src/app/pages/msi/msi.page.ts
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonBackButton, 
  IonButtons, 
  IonContent, 
  IonHeader, 
  IonIcon, 
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle, 
  IonToolbar, 
  ToastController 
} from '@ionic/angular/standalone';
import { MsiService } from '../services/msi.service';
import { CategoriasService } from '../services/categorias.service';
import { Categoria } from '../services/categorias.service';

@Component({
  selector: 'app-msi',
  templateUrl: 'msi.page.html',
  styleUrls: ['msi.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
})
export class MsiPage {
  private readonly fb = inject(FormBuilder);
  private readonly msiService = inject(MsiService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  categorias: Categoria[] = [];
  mesesOpciones = [3, 6, 9, 12, 18, 24];
  simulacion: { pagoMensual: number; promedioGastos: number; totalMensual: number } | null = null;
  guardando = false;

  msiForm = this.fb.group({
    concepto: ['', Validators.required],
    monto_total: [null as number | null, [Validators.required, Validators.min(1)]],
    meses: [6, Validators.required],
    fecha_compra: [this.obtenerFechaActual(), Validators.required],
    categoria_id: [null as number | null],
    metodo_pago: ['Tarjeta'],
    notas: ['']
  });

  metodosPago = ['Tarjeta', 'Efectivo', 'Transferencia'];

  constructor() {}

  async ionViewWillEnter(): Promise<void> {
    await this.cargarCategorias();
    await this.calcularSimulacion();
  }

  private obtenerFechaActual(): string {
    return new Date().toISOString().split('T')[0];
  }

  private async cargarCategorias(): Promise<void> {
    try {
      this.categorias = await this.categoriasService.obtenerCategorias({ incluirInactivas: false });
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  }

  async calcularSimulacion(): Promise<void> {
    const monto = this.msiForm.get('monto_total')?.value;
    const meses = this.msiForm.get('meses')?.value;

    if (!monto || !meses) {
      this.simulacion = null;
      return;
    }

    try {
      this.simulacion = await this.msiService.calcularSimulacionMSI(monto, meses);
    } catch (error) {
      console.error('Error al calcular simulación:', error);
    }
  }

  seleccionarMeses(meses: number): void {
    this.msiForm.patchValue({ meses });
    this.calcularSimulacion();
  }

  seleccionarMetodoPago(metodo: string): void {
    this.msiForm.patchValue({ metodo_pago: metodo });
  }

  async guardarMSI(): Promise<void> {
    if (this.msiForm.invalid || this.guardando) {
      this.msiForm.markAllAsTouched();
      return;
    }

    this.guardando = true;

    const formValue = this.msiForm.getRawValue();

    try {
      await this.msiService.crearCompraMSI({
        concepto: formValue.concepto?.trim() ?? '',
        monto_total: Number(formValue.monto_total),
        meses_total: Number(formValue.meses),
        fecha_compra: formValue.fecha_compra ?? this.obtenerFechaActual(),
        categoria_id: formValue.categoria_id,
        metodo_pago: formValue.metodo_pago ?? 'Tarjeta',
        notas: formValue.notas?.trim() || null
      });

      await this.mostrarToast('✅ Compra a MSI guardada correctamente', 'success');
      this.router.navigate(['/gastos']);
    } catch (error) {
      console.error('Error al guardar MSI:', error);
      await this.mostrarToast('❌ Error al guardar la compra a MSI', 'danger');
    } finally {
      this.guardando = false;
    }
  }

  irHistorial(): void {
    this.router.navigate(['/historial-msi']);
  }

  // Método público para usar en el template
  irAGastos(): void {
    this.router.navigate(['/gastos']);
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