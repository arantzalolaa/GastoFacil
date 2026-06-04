import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  calendarOutline,
  carOutline,
  flashOutline,
  gameControllerOutline,
  medkitOutline,
  receiptOutline,
  restaurantOutline,
  schoolOutline,
  searchOutline,
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
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonFab, IonFabButton, IonIcon, IonSearchbar],
})
export class GastosPage {
  private readonly gastosService = inject(GastosService);

  terminoBusqueda = '';
  categoriaSeleccionada = 'Todos';
  fechaDesde = '';
  fechaHasta = '';
  gastos: GastoListado[] = [];

  filtros = [
    { etiqueta: 'Fecha', icono: 'calendar-outline' },
    { etiqueta: 'Todos' },
    ...obtenerCategoriasVisuales().map((categoria) => ({ etiqueta: categoria.etiqueta })),
  ];

  constructor() {
    addIcons({
      add,
      calendarOutline,
      carOutline,
      flashOutline,
      gameControllerOutline,
      medkitOutline,
      receiptOutline,
      restaurantOutline,
      schoolOutline,
      searchOutline,
      walletOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.cargarGastos();
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

  seleccionarFiltro(filtro: string): void {
    this.categoriaSeleccionada = filtro;
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
    }
  }

  private formatearFechaCorta(fecha: string): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(fecha));
  }

  private coincideRangoFecha(fecha: string): boolean {
    if (!this.fechaDesde && !this.fechaHasta) {
      return true;
    }

    const fechaGasto = new Date(fecha).getTime();
    const desde = this.fechaDesde ? new Date(`${this.fechaDesde}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    const hasta = this.fechaHasta ? new Date(`${this.fechaHasta}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;

    return fechaGasto >= desde && fechaGasto <= hasta;
  }
}
