import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonInput,
  ToastController,
} from '@ionic/angular/standalone';
import { Categoria, CategoriasService } from '../services/categorias.service';
import { IconosService } from '../services/iconos.service';

export interface CategoriaConColores extends Categoria {
  bgColor: string;
  iconColor: string;
  mostrarAcciones: boolean;
}

@Component({
  selector: 'app-categorias',
  templateUrl: 'categorias.page.html',
  styleUrls: ['categorias.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonIcon,
    IonInput,
  ],
})
export class CategoriasPage {
  private readonly categoriasService = inject(CategoriasService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastController = inject(ToastController);
  private readonly iconosService = inject(IconosService);

  categorias: CategoriaConColores[] = [];
  mostrandoFormulario = false;
  categoriaEditando: Categoria | null = null;
  cargando = false;
  guardando = false;
  error = '';

  mostrandoConfirmacionGuardar = false;
  mostrandoConfirmacionEliminar = false;
  categoriaPendienteEliminar: CategoriaConColores | null = null;
  datosPorGuardar: { nombre: string; icono: string; color: string } | null = null;
  esReactivacion = false;

  // Obtener iconos del servicio global
  iconos = this.iconosService.getListaIconos();

  colores = [
    '#FEF3C7', '#FDE8E8', '#EDEBFE', '#DEF7EC', '#E1EFFE', '#FCE8F3',
    '#FFF3E0', '#E0F7FA', '#E8F5E9', '#F3E5F5', '#E3F2FD', '#FFF8E1',
    '#FFEBEE', '#F1F8E9', '#E0F2F1', '#FBE9E7', '#ECEFF1', '#F5F5F5',
    '#F9FBE7', '#E8EAF6', '#FCE4EC', '#FFE0B2', '#C8E6C9', '#BBDEFB'
  ];

  categoriaForm = this.formBuilder.group({
    nombre: ['', Validators.required],
    icono: ['pricetag-outline', Validators.required],
    color: ['#E6E8EA', Validators.required],
  });

  constructor() {
    // Ya no es necesario addIcons aquí
  }

  async ionViewWillEnter(): Promise<void> {
    await this.cargarCategorias();
  }

  get categoriasActivas(): CategoriaConColores[] {
    return this.categorias.filter((categoria) => categoria.activa);
  }

  get categoriasInactivas(): CategoriaConColores[] {
    return this.categorias.filter((categoria) => !categoria.activa);
  }

  async cargarCategorias(): Promise<void> {
    this.cargando = true;
    this.error = '';

    try {
      const categorias = await this.categoriasService.obtenerCategorias({ incluirInactivas: true });

      this.categorias = categorias.map((cat) => ({
        ...cat,
        bgColor: cat.activa ? (cat.color || '#E6E8EA') : '#9CA3AF',
        iconColor: cat.activa ? this.saturateColor(cat.color) : '#6B7280',
        mostrarAcciones: false
      }));
    } catch (error) {
      console.error(error);
      this.error = 'No se pudieron cargar las categorías.';
    } finally {
      this.cargando = false;
    }
  }

  toggleAcciones(id: number): void {
    const categoria = this.categorias.find((cat) => cat.id === id);

    if (!categoria) return;

    if (categoria.mostrarAcciones) {
      categoria.mostrarAcciones = false;
      return;
    }

    this.categorias.forEach((cat) => {
      cat.mostrarAcciones = false;
    });

    categoria.mostrarAcciones = true;
  }

  abrirFormulario(): void {
    this.mostrandoFormulario = true;
    this.categoriaEditando = null;
    this.esReactivacion = false;
    this.error = '';

    this.categoriaForm.reset({
      nombre: '',
      icono: 'pricetag-outline',
      color: '#E6E8EA',
    });
  }

  editar(categoria: Categoria): void {
    this.toggleAcciones(categoria.id);

    this.mostrandoFormulario = true;
    this.categoriaEditando = categoria;
    this.esReactivacion = false;
    this.error = '';

    this.categoriaForm.reset({
      nombre: categoria.nombre,
      icono: categoria.icono || 'pricetag-outline',
      color: categoria.color || '#E6E8EA',
    });
  }

  reactivar(categoria: Categoria): void {
    this.toggleAcciones(categoria.id);

    this.mostrandoFormulario = true;
    this.categoriaEditando = categoria;
    this.esReactivacion = true;
    this.error = '';

    this.categoriaForm.reset({
      nombre: categoria.nombre,
      icono: categoria.icono || 'pricetag-outline',
      color: categoria.color || '#E6E8EA',
    });
  }

  cerrarFormulario(): void {
    this.mostrandoFormulario = false;
    this.categoriaEditando = null;
    this.esReactivacion = false;
    this.error = '';
  }

  seleccionarIcono(icono: string): void {
    this.categoriaForm.patchValue({ icono });
  }

  seleccionarColor(color: string): void {
    this.categoriaForm.patchValue({ color });
  }

  guardar(): void {
    if (this.categoriaForm.invalid || this.guardando) {
      this.categoriaForm.markAllAsTouched();
      return;
    }

    const formValue = this.categoriaForm.getRawValue();

    this.datosPorGuardar = {
      nombre: formValue.nombre ?? '',
      icono: formValue.icono ?? 'pricetag-outline',
      color: formValue.color ?? '#E6E8EA',
    };

    this.mostrandoFormulario = false;
    this.mostrandoConfirmacionGuardar = true;
  }

  cancelarGuardarCategoria(): void {
    this.mostrandoConfirmacionGuardar = false;
    this.datosPorGuardar = null;
    this.mostrandoFormulario = true;
  }

  async confirmarGuardarCategoria(): Promise<void> {
    this.mostrandoConfirmacionGuardar = false;

    if (!this.datosPorGuardar) return;

    this.guardando = true;
    this.error = '';

    try {
      if (this.categoriaEditando) {
        if (this.esReactivacion) {
          await this.categoriasService.reactivarCategoria(
            this.categoriaEditando.id,
            this.datosPorGuardar
          );
          await this.mostrarToast('Categoría reactivada correctamente.', 'success');
        } else {
          await this.categoriasService.editarCategoria(
            this.categoriaEditando.id,
            this.datosPorGuardar
          );
          await this.mostrarToast('Categoría actualizada correctamente.', 'success');
        }
      } else {
        await this.categoriasService.crearCategoria(this.datosPorGuardar);
        await this.mostrarToast('Categoría guardada correctamente.', 'success');
      }

      await this.cargarCategorias();
      this.cerrarFormulario();
    } catch (error) {
      console.error(error);

      this.error = error instanceof Error
        ? error.message
        : 'No se pudo guardar la categoría.';

      this.mostrandoFormulario = true;
    } finally {
      this.guardando = false;
      this.datosPorGuardar = null;
      this.esReactivacion = false;
    }
  }

  eliminar(categoria: CategoriaConColores): void {
    this.toggleAcciones(categoria.id);
    this.categoriaPendienteEliminar = categoria;
    this.mostrandoConfirmacionEliminar = true;
  }

  cancelarEliminarCategoria(): void {
    this.mostrandoConfirmacionEliminar = false;
    this.categoriaPendienteEliminar = null;
  }

  async eliminarCategoriaConfirmado(): Promise<void> {
    if (!this.categoriaPendienteEliminar) return;

    const id = this.categoriaPendienteEliminar.id;

    try {
      await this.categoriasService.eliminarCategoria(id);
      
      const categoria = this.categorias.find(c => c.id === id);
      if (categoria) {
        categoria.activa = false;
        categoria.bgColor = '#9CA3AF';
        categoria.iconColor = '#6B7280';
      }

      this.mostrandoConfirmacionEliminar = false;
      this.categoriaPendienteEliminar = null;

      await this.mostrarToast('Categoría eliminada correctamente.', 'success');
    } catch (error) {
      console.error(error);

      this.error = error instanceof Error
        ? error.message
        : 'No se pudo eliminar la categoría.';

      this.mostrandoConfirmacionEliminar = false;
      this.categoriaPendienteEliminar = null;
    }
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

      s = l > 0.5
        ? d / (2 - max - min)
        : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: h * 360,
      s: s * 100,
      l: l * 100
    };
  }

  private hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    s /= 100;

    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);

    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));

    const toHex = (x: number) =>
      Math.round(255 * x).toString(16).padStart(2, '0');

    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  }

  private saturateColor(hex: string | null): string {
    if (!hex) return '#64748b';

    const { r, g, b } = this.hexToRgb(hex);
    let { h, s, l } = this.rgbToHsl(r, g, b);

    s = Math.min(100, s + 50);
    l = Math.max(0, l - 45);

    return this.hslToHex(h, s, l);
  }

  private async mostrarToast(
    mensaje: string,
    color: 'success' | 'warning' | 'danger' = 'success'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 1800,
      position: 'bottom',
      color
    });

    await toast.present();
  }
}