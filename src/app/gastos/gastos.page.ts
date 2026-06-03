import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
  wifiOutline,
} from 'ionicons/icons';

export interface Gasto {
  id: number;
  categoria: string;
  concepto: string;
  monto: number;
  fecha: string;
  metodo_pago: string;
  notas: string | null;
}

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
  terminoBusqueda = '';
  categoriaSeleccionada = 'Todos';

  filtros = [
    { etiqueta: 'Fecha', icono: 'calendar-outline' },
    { etiqueta: 'Todos' },
    { etiqueta: 'Comida' },
  ];

  gastos: GastoListado[] = [
    {
      id: 1,
      categoria: 'Servicios',
      concepto: 'Pago de internet',
      monto: 600,
      fecha: '2026-10-05T10:30:00-06:00',
      fechaCorta: '05/10',
      metodo_pago: 'Tarjeta',
      notas: 'Mensualidad de internet del hogar',
      icono: 'wifi-outline',
    },
    {
      id: 2,
      categoria: 'Salud',
      concepto: 'Compra en farmacia',
      monto: 230,
      fecha: '2026-10-04T18:15:00-06:00',
      fechaCorta: '04/10',
      metodo_pago: 'Efectivo',
      notas: null,
      icono: 'medkit-outline',
    },
    {
      id: 3,
      categoria: 'Transporte',
      concepto: 'Transporte en taxi',
      monto: 150,
      fecha: '2026-10-03T20:15:00-06:00',
      fechaCorta: '03/10',
      metodo_pago: 'Efectivo',
      notas: null,
      icono: 'car-outline',
    },
    {
      id: 4,
      categoria: 'Comida',
      concepto: 'Comida en cafetería',
      monto: 120,
      fecha: '2026-10-02T11:00:00-06:00',
      fechaCorta: '02/10',
      metodo_pago: 'Tarjeta',
      notas: null,
      icono: 'cafe-outline',
    },
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
      wifiOutline,
    });
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
        gasto.categoria.toLowerCase().includes(termino);

      return coincideCategoria && coincideBusqueda;
    });
  }

  seleccionarFiltro(filtro: string): void {
    this.categoriaSeleccionada = filtro;
  }

  iconBackgroundClass(categoria: string): string {
    return `expense-icon--${categoria.toLowerCase()}`;
  }

  tagClass(categoria: string): string {
    return `category-tag--${categoria.toLowerCase()}`;
  }
}
