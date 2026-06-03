import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonCard,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonGrid,
  IonIcon,
  IonRow,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  arrowUpOutline,
  cafeOutline,
  calendarOutline,
  carOutline,
  cartOutline,
  chevronForwardOutline,
  qrCodeOutline,
  receiptOutline,
  restaurantOutline,
  trendingUpOutline,
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

export interface GastoReciente extends Gasto {
  icono: string;
}

@Component({
  selector: 'app-inicio',
  templateUrl: 'inicio.page.html',
  styleUrls: ['inicio.page.scss'],
  imports: [
    CommonModule,
    RouterLink,
    IonCard,
    IonCol,
    IonContent,
    IonFab,
    IonFabButton,
    IonGrid,
    IonIcon,
    IonRow,
  ],
})
export class InicioPage {
  totalMes = 4500;
  variacionMesAnterior = 12;
  totalHoy = 120;
  totalTransacciones = 15;
  categoriaTop = 'Comida';

  gastosRecientes: GastoReciente[] = [
    {
      id: 1,
      categoria: 'Compras',
      concepto: 'Compra en OXXO',
      monto: 85,
      fecha: 'Hoy, 2:30 PM',
      metodo_pago: 'Tarjeta',
      notas: null,
      icono: 'cart-outline',
    },
    {
      id: 2,
      categoria: 'Transporte',
      concepto: 'Transporte en taxi',
      monto: 150,
      fecha: 'Ayer, 8:15 PM',
      metodo_pago: 'Efectivo',
      notas: null,
      icono: 'car-outline',
    },
    {
      id: 3,
      categoria: 'Comida',
      concepto: 'Comida en cafetería',
      monto: 120,
      fecha: '12 Oct, 11:00 AM',
      metodo_pago: 'Tarjeta',
      notas: null,
      icono: 'cafe-outline',
    },
  ];

  constructor() {
    addIcons({
      add,
      arrowUpOutline,
      cafeOutline,
      calendarOutline,
      carOutline,
      cartOutline,
      chevronForwardOutline,
      qrCodeOutline,
      receiptOutline,
      restaurantOutline,
      trendingUpOutline,
    });
  }
}
