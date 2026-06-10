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
  arrowUp,
  arrowDown,
  calendar,
  receipt,
  qrCode,
  chevronForward,
  personCircleOutline,
  search,
  flashOutline,
  gameControllerOutline,
  medkitOutline,
  restaurantOutline,
  schoolOutline,
  walletOutline,
  wifiOutline,
  carOutline,
  shapesOutline,
} from 'ionicons/icons';
import { capitalizarCategoria, obtenerCategoriaVisual } from '../services/categorias.util';
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
  variacionAbsoluta = 0;
  tendenciaPositiva = true;
  totalHoy = 0;
  totalTransacciones = 0;
  categoriaTop = 'Sin datos';
  iconoTop = 'restaurant-outline';
  gastosRecientes: GastoReciente[] = [];

  constructor() {
    addIcons({
      add,
      arrowUp,
      arrowDown,
      calendar,
      receipt,
      qrCode,
      chevronForward,
      personCircleOutline,
      search,
      carOutline,
      flashOutline,
      gameControllerOutline,
      medkitOutline,
      restaurantOutline,
      schoolOutline,
      walletOutline,
      wifiOutline,
      shapesOutline,
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
      this.totalHoy = this.sumarMontos(gastos.filter((gasto) => this.esMismoDiaClasico(new Date(gasto.fecha), ahora)));
      this.totalTransacciones = gastosMesActual.length;
      
      this.variacionMesAnterior = this.calcularVariacion(this.totalMes, this.sumarMontos(gastosMesAnterior));
      this.tendenciaPositiva = this.variacionMesAnterior >= 0;
      this.variacionAbsoluta = Math.abs(this.variacionMesAnterior);

      this.categoriaTop = this.obtenerCategoriaTop(gastosMesActual);
      this.iconoTop = this.obtenerCategoriaTopIcono(gastosMesActual);

      this.gastosRecientes = gastos.slice(0, 3).map((gasto) => ({
        ...gasto,
        fechaRelativa: this.formatearFechaReciente(gasto.fecha),
        icono: this.iconoPorCategoria(gasto.categoria),
      }));
    } catch (error) {
      console.error('No se pudieron cargar los gastos de inicio:', error);
      this.resetearDatos();
    }
  }

  private resetearDatos() {
    this.totalMes = 0;
    this.totalHoy = 0;
    this.totalTransacciones = 0;
    this.variacionMesAnterior = 0;
    this.variacionAbsoluta = 0;
    this.tendenciaPositiva = true;
    this.categoriaTop = 'Sin datos';
    this.iconoTop = 'restaurant-outline';
    this.gastosRecientes = [];
  }

  private sumarMontos(gastos: Gasto[]): number {
    return gastos.reduce((total, gasto) => total + gasto.monto, 0);
  }

  private calcularVariacion(actual: number, anterior: number): number {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return Math.round(((actual - anterior) / anterior) * 100);
  }

  private obtenerCategoriaTop(gastos: Gasto[]): string {
    if (!gastos.length) return 'Sin datos';
    const totales = this.agruparTotales(gastos);
    return capitalizarCategoria(Object.entries(totales).sort(([, a], [, b]) => b - a)[0][0]);
  }

  private obtenerCategoriaTopIcono(gastos: Gasto[]): string {
    if (!gastos.length) return 'restaurant-outline';
    const totales = this.agruparTotales(gastos);
    const topCat = Object.entries(totales).sort(([, a], [, b]) => b - a)[0][0];
    return this.iconoPorCategoria(topCat);
  }

  private agruparTotales(gastos: Gasto[]): Record<string, number> {
    return gastos.reduce<Record<string, number>>((acc, gasto) => {
      acc[gasto.categoria] = (acc[gasto.categoria] ?? 0) + gasto.monto;
      return acc;
    }, {});
  }

  private esMismoDiaClasico(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getDate() === d2.getDate();
  }

  private esMismoMes(fecha: string, referencia: Date): boolean {
    const d = new Date(fecha);
    return d.getFullYear() === referencia.getFullYear() && d.getMonth() === referencia.getMonth();
  }

  private esMesAnterior(fecha: string, referencia: Date): boolean {
    const mesAnterior = new Date(referencia.getFullYear(), referencia.getMonth() - 1, 1);
    return this.esMismoMes(fecha, mesAnterior);
  }

  private formatearFechaReciente(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const opcionesHora: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const horaStr = fecha.toLocaleTimeString('es-MX', opcionesHora).toUpperCase();

    if (this.esMismoDiaClasico(fecha, hoy)) {
      return `Hoy, ${horaStr}`;
    } else if (this.esMismoDiaClasico(fecha, ayer)) {
      return `Ayer, ${horaStr}`;
    } else {
      const opcionesFecha: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      const fechaFormat = fecha.toLocaleDateString('es-MX', opcionesFecha);
      return `${fechaFormat}, ${horaStr}`;
    }
  }

  private iconoPorCategoria(categoria: string): string {
    return obtenerCategoriaVisual(categoria).icono;
  }
}