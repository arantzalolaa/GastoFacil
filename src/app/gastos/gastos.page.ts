import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  bulbOutline,
  calendarOutline,
  carOutline,
  closeOutline,
  createOutline,
  flashOutline,
  gameControllerOutline,
  medkitOutline,
  receiptOutline,
  restaurantOutline,
  schoolOutline,
  search,
  shapesOutline,
  trashOutline,
  walletOutline,
} from 'ionicons/icons';
import {
  CategoriaClave,
  capitalizarCategoria,
  normalizarCategoria,
  obtenerCategoriaVisual,
  obtenerCategoriasVisuales,
} from '../services/categorias.util';
import { Gasto, GastosService } from '../services/gastos.service';

export interface GastoListado extends Gasto {
  categoriaClave: CategoriaClave;
  categoriaFormateada: string;
  fechaCorta: string;
  icono: string;
}

@Component({
  selector: 'app-gastos',
  templateUrl: 'gastos.page.html',
  styleUrls: ['gastos.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonSearchbar,
  ],
})
export class GastosPage {
  private readonly gastosService = inject(GastosService);
  private readonly toastController = inject(ToastController);

  terminoBusqueda = '';
  categoriaSeleccionada = 'Todos';
  fechaDesde = '';
  fechaHasta = '';
  gastos: GastoListado[] = [];
  categoriasOrdenadas: { etiqueta: string }[] = [];
  filtros: { etiqueta: string; icono?: string }[] = [];

  gastoEditando: GastoListado | null = null;
  gastoPendienteEliminar: GastoListado | null = null;

  formEditar = {
    concepto: '',
    monto: 0,
    categoria: '',
    fecha: '',
    metodo_pago: '',
    notas: '',
  };

  constructor() {
    addIcons({
      add,
      bulbOutline,
      calendarOutline,
      carOutline,
      closeOutline,
      createOutline,
      flashOutline,
      gameControllerOutline,
      medkitOutline,
      receiptOutline,
      restaurantOutline,
      schoolOutline,
      search,
      shapesOutline,
      trashOutline,
      walletOutline,
    });

    const categoriasBase = obtenerCategoriasVisuales().map((categoria) => ({
      etiqueta: categoria.etiqueta,
    }));

    if (!categoriasBase.some((categoria) => categoria.etiqueta === 'Otros')) {
      categoriasBase.push({ etiqueta: 'Otros' });
    }

    this.filtros = [
      { etiqueta: 'Fecha', icono: 'calendar-outline' },
      { etiqueta: 'Todos' },
      ...categoriasBase,
    ];

    this.categoriasOrdenadas = [...categoriasBase].sort((a, b) =>
      a.etiqueta.localeCompare(b.etiqueta)
    );
  }

  async ionViewWillEnter(): Promise<void> {
    await this.cargarGastos();
  }

  get mostrarFiltroFecha(): boolean {
    return this.categoriaSeleccionada === 'Fecha';
  }

  get gastosFiltrados(): GastoListado[] {
    const termino = this.terminoBusqueda.trim().toLowerCase();
    const categoriaActiva = normalizarCategoria(this.categoriaSeleccionada);

    return this.gastos.filter((gasto) => {
      const coincideCategoria =
        this.categoriaSeleccionada === 'Todos' ||
        this.categoriaSeleccionada === 'Fecha' ||
        gasto.categoriaClave === categoriaActiva;

      const coincideBusqueda =
        !termino ||
        gasto.concepto.toLowerCase().includes(termino) ||
        gasto.categoriaFormateada.toLowerCase().includes(termino) ||
        gasto.metodo_pago.toLowerCase().includes(termino) ||
        (gasto.notas?.toLowerCase().includes(termino) ?? false);

      const coincideFecha = this.coincideRangoFecha(gasto.fecha);

      return coincideCategoria && coincideBusqueda && coincideFecha;
    });
  }

  seleccionarFiltro(filtro: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    this.categoriaSeleccionada = filtro;

    if (filtro !== 'Fecha') {
      this.limpiarFiltroFecha();
    }
  }

  limpiarFiltroFecha(): void {
    this.fechaDesde = '';
    this.fechaHasta = '';
  }

  iconBackgroundClass(categoria: string): string {
    return `expense-icon--${normalizarCategoria(categoria)}`;
  }

  tagClass(categoria: string): string {
    return `category-tag--${normalizarCategoria(categoria)}`;
  }

  editarGasto(gasto: GastoListado): void {
    this.gastoEditando = gasto;

    this.formEditar = {
      concepto: gasto.concepto,
      monto: gasto.monto,
      categoria: gasto.categoriaFormateada,
      fecha: this.obtenerFechaInput(gasto.fecha),
      metodo_pago: gasto.metodo_pago,
      notas: gasto.notas ?? '',
    };
  }

  cerrarModalEditar(): void {
    this.gastoEditando = null;

    this.formEditar = {
      concepto: '',
      monto: 0,
      categoria: '',
      fecha: '',
      metodo_pago: '',
      notas: '',
    };
  }

  async guardarEdicionGasto(): Promise<void> {
    if (!this.gastoEditando) {
      return;
    }

    const concepto = this.formEditar.concepto.trim();
    const monto = Number(this.formEditar.monto);
    const categoria = this.formEditar.categoria.trim();
    const fecha = this.formEditar.fecha.trim();
    const metodoPago = this.formEditar.metodo_pago.trim();
    const notas = this.formEditar.notas.trim();

    if (!concepto || Number.isNaN(monto) || monto <= 0) {
      await this.mostrarToast('Ingresa un concepto y un monto válido.', 'warning');
      return;
    }

    if (!categoria) {
      await this.mostrarToast('Selecciona una categoría.', 'warning');
      return;
    }

    if (!fecha) {
      await this.mostrarToast('Selecciona una fecha.', 'warning');
      return;
    }

    if (!metodoPago) {
      await this.mostrarToast('Ingresa un método de pago.', 'warning');
      return;
    }

    try {
      await this.gastosService.actualizarGasto(this.gastoEditando.id, {
        concepto,
        monto,
        categoria,
        fecha,
        metodo_pago: metodoPago,
        notas: notas || null,
      });

      await this.cargarGastos();
      this.cerrarModalEditar();
      await this.mostrarToast('Gasto actualizado correctamente.', 'success');
    } catch (error) {
      console.error('No se pudo actualizar el gasto:', error);
      await this.mostrarToast('No se pudo actualizar el gasto.', 'danger');
    }
  }

  confirmarEliminarGasto(gasto: GastoListado): void {
    this.gastoPendienteEliminar = gasto;
  }

  cancelarEliminarGasto(): void {
    this.gastoPendienteEliminar = null;
  }

  async eliminarGastoConfirmado(): Promise<void> {
    if (!this.gastoPendienteEliminar) {
      return;
    }

    try {
      await this.gastosService.eliminarGasto(this.gastoPendienteEliminar.id);
      await this.cargarGastos();

      this.gastoPendienteEliminar = null;

      await this.mostrarToast('Gasto eliminado correctamente.', 'success');
    } catch (error) {
      console.error('No se pudo eliminar el gasto:', error);
      await this.mostrarToast('No se pudo eliminar el gasto.', 'danger');
    }
  }

  private async cargarGastos(): Promise<void> {
    try {
      const gastos = await this.gastosService.obtenerGastos();

      this.gastos = gastos.map((gasto) => {
        const categoriaVisual = obtenerCategoriaVisual(gasto.categoria);

        return {
          ...gasto,
          categoriaClave: categoriaVisual.clave,
          categoriaFormateada: capitalizarCategoria(gasto.categoria),
          fechaCorta: this.formatearFechaCorta(gasto.fecha),
          icono: categoriaVisual.icono,
        };
      });
    } catch (error) {
      console.error('No se pudieron cargar los gastos:', error);
      this.gastos = [];
      await this.mostrarToast('No se pudieron cargar los gastos.', 'danger');
    }
  }

  private formatearFechaCorta(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');

    return `${dia}/${mes}`;
  }

  private obtenerFechaInput(fechaStr: string): string {
    if (!fechaStr) {
      return '';
    }

    const fecha = new Date(fechaStr);

    if (Number.isNaN(fecha.getTime())) {
      return fechaStr.slice(0, 10);
    }

    const anio = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private coincideRangoFecha(fecha: string): boolean {
    if (!this.fechaDesde && !this.fechaHasta) {
      return true;
    }

    const fechaGasto = new Date(fecha).getTime();

    const desde = this.fechaDesde
      ? new Date(`${this.fechaDesde}T00:00:00`).getTime()
      : Number.NEGATIVE_INFINITY;

    const hasta = this.fechaHasta
      ? new Date(`${this.fechaHasta}T23:59:59`).getTime()
      : Number.POSITIVE_INFINITY;

    return fechaGasto >= desde && fechaGasto <= hasta;
  }

  private async mostrarToast(
    mensaje: string,
    color: 'success' | 'warning' | 'danger' = 'success'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 1800,
      position: 'bottom',
      color,
    });

    await toast.present();
  }
}