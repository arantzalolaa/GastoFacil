import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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
  walletOutline,
  wifiOutline,
} from 'ionicons/icons';
import { Gasto, GastosService } from '../services/gastos.service';

export interface GastoReciente extends Gasto {
  fechaRelativa: string;
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
  private readonly gastosService = inject(GastosService);

  totalMes = 0;
  variacionMesAnterior = 0;
  totalHoy = 0;
  totalTransacciones = 0;
  categoriaTop = 'Sin datos';
  gastosRecientes: GastoReciente[] = [];

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
      walletOutline,
      wifiOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.cargarResumenInicio();
  }

  private async cargarResumenInicio(): Promise<void> {
    try {
      const gastos = await this.gastosService.obtenerGastos();
      const ahora = new Date();
      const gastosMesActual = gastos.filter((gasto) => this.esMismoMes(gasto.fecha, ahora));
      const gastosMesAnterior = gastos.filter((gasto) => this.esMesAnterior(gasto.fecha, ahora));

      this.totalMes = this.sumarMontos(gastosMesActual);
      this.totalHoy = this.sumarMontos(gastos.filter((gasto) => this.esMismoDia(gasto.fecha, ahora)));
      this.totalTransacciones = gastosMesActual.length;
      this.variacionMesAnterior = this.calcularVariacion(this.totalMes, this.sumarMontos(gastosMesAnterior));
      this.categoriaTop = this.obtenerCategoriaTop(gastosMesActual);
      this.gastosRecientes = gastos.slice(0, 3).map((gasto) => ({
        ...gasto,
        fechaRelativa: this.formatearFechaReciente(gasto.fecha),
        icono: this.iconoPorCategoria(gasto.categoria),
      }));
    } catch (error) {
      console.error('No se pudieron cargar los gastos de inicio:', error);
      this.totalMes = 0;
      this.totalHoy = 0;
      this.totalTransacciones = 0;
      this.variacionMesAnterior = 0;
      this.categoriaTop = 'Sin datos';
      this.gastosRecientes = [];
    }
  }

  private sumarMontos(gastos: Gasto[]): number {
    return gastos.reduce((total, gasto) => total + gasto.monto, 0);
  }

  private calcularVariacion(actual: number, anterior: number): number {
    if (anterior === 0) {
      return actual > 0 ? 100 : 0;
    }

    return Math.round(((actual - anterior) / anterior) * 100);
  }

  private obtenerCategoriaTop(gastos: Gasto[]): string {
    if (!gastos.length) {
      return 'Sin datos';
    }

    const totales = gastos.reduce<Record<string, number>>((acc, gasto) => {
      acc[gasto.categoria] = (acc[gasto.categoria] ?? 0) + gasto.monto;
      return acc;
    }, {});

    return Object.entries(totales).sort(([, totalA], [, totalB]) => totalB - totalA)[0][0];
  }

  private esMismoDia(fecha: string, referencia: Date): boolean {
    const fechaGasto = new Date(fecha);

    return fechaGasto.toDateString() === referencia.toDateString();
  }

  private esMismoMes(fecha: string, referencia: Date): boolean {
    const fechaGasto = new Date(fecha);

    return fechaGasto.getFullYear() === referencia.getFullYear() && fechaGasto.getMonth() === referencia.getMonth();
  }

  private esMesAnterior(fecha: string, referencia: Date): boolean {
    const mesAnterior = new Date(referencia.getFullYear(), referencia.getMonth() - 1, 1);

    return this.esMismoMes(fecha, mesAnterior);
  }

  private formatearFechaReciente(fecha: string): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(fecha));
  }

  private iconoPorCategoria(categoria: string): string {
    const iconos: Record<string, string> = {
      Comida: 'cafe-outline',
      Compras: 'cart-outline',
      Servicios: 'wifi-outline',
      Transporte: 'car-outline',
    };

    return iconos[categoria] ?? 'wallet-outline';
  }
}
