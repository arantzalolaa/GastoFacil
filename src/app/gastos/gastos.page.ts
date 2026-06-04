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
  medkitOutline,
  calendarOutline,
  carOutline,
  cafeOutline,
  receiptOutline,
  searchOutline,
  walletOutline,
  wifiOutline,
} from 'ionicons/icons';
import { Gasto, GastosService } from '../services/gastos.service';

export interface GastoListado extends Gasto {
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
  gastos: GastoListado[] = [];

  filtros = [
    { etiqueta: 'Fecha', icono: 'calendar-outline' },
    { etiqueta: 'Todos' },
    { etiqueta: 'Comida' },
    { etiqueta: 'Transporte' },
    { etiqueta: 'Servicios' },
  ];

  constructor() {
    addIcons({
      add,
      medkitOutline,
      calendarOutline,
      carOutline,
      cafeOutline,
      receiptOutline,
      searchOutline,
      walletOutline,
      wifiOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.cargarGastos();
  }

  get gastosFiltrados(): GastoListado[] {
    const termino = this.terminoBusqueda.trim().toLowerCase();

    return this.gastos.filter((gasto) => {
      const coincideCategoria =
        this.categoriaSeleccionada === 'Todos' ||
        this.categoriaSeleccionada === 'Fecha' ||
        gasto.categoria === this.categoriaSeleccionada;
      const coincideBusqueda =
        !termino ||
        gasto.concepto.toLowerCase().includes(termino) ||
        gasto.categoria.toLowerCase().includes(termino) ||
        gasto.metodo_pago.toLowerCase().includes(termino);

      return coincideCategoria && coincideBusqueda;
    });
  }

  seleccionarFiltro(filtro: string): void {
    this.categoriaSeleccionada = filtro;
  }

  iconBackgroundClass(categoria: string): string {
    return `expense-icon--${this.normalizarCategoria(categoria)}`;
  }

  tagClass(categoria: string): string {
    return `category-tag--${this.normalizarCategoria(categoria)}`;
  }

  private async cargarGastos(): Promise<void> {
    try {
      const gastos = await this.gastosService.obtenerGastos();
      this.gastos = gastos.map((gasto) => ({
        ...gasto,
        fechaCorta: this.formatearFechaCorta(gasto.fecha),
        icono: this.iconoPorCategoria(gasto.categoria),
      }));
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

  private iconoPorCategoria(categoria: string): string {
    const iconos: Record<string, string> = {
      comida: 'cafe-outline',
      salud: 'medkit-outline',
      servicios: 'wifi-outline',
      transporte: 'car-outline',
    };

    return iconos[this.normalizarCategoria(categoria)] ?? 'wallet-outline';
  }

  private normalizarCategoria(categoria: string): string {
    return categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
