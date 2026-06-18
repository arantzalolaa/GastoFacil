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
  arrowDown,
  arrowUp,
  calendar,
  calendarOutline,
  carOutline,
  chevronBackOutline,
  chevronForward,
  chevronForwardOutline,
  closeOutline,
  flashOutline,
  gameControllerOutline,
  medkitOutline,
  notificationsOutline,
  personCircleOutline,
  qrCode,
  receipt,
  receiptOutline,
  restaurantOutline,
  schoolOutline,
  search,
  shapesOutline,
  trendingUpOutline,
  walletOutline,
  wifiOutline,
} from 'ionicons/icons';
import { capitalizarCategoria, obtenerCategoriaVisual } from '../services/categorias.util';
import { Gasto, GastosService } from '../services/gastos.service';

export interface GastoReciente extends Gasto {
  fechaRelativa: string;
  icono: string;
}

interface MesDelAnio {
  numero: number;
  nombre: string;
  corto: string;
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

  etiquetaDia = 'Hoy';
  etiquetaMesSeleccionado = '';

  selectorMesAbierto = false;
  anioSelector = new Date().getFullYear();
  mesSeleccionado = new Date().getMonth();
  anioSeleccionado = new Date().getFullYear();

  mesesDelAnio: MesDelAnio[] = [
    { numero: 0, nombre: 'Enero', corto: 'Ene' },
    { numero: 1, nombre: 'Febrero', corto: 'Feb' },
    { numero: 2, nombre: 'Marzo', corto: 'Mar' },
    { numero: 3, nombre: 'Abril', corto: 'Abr' },
    { numero: 4, nombre: 'Mayo', corto: 'May' },
    { numero: 5, nombre: 'Junio', corto: 'Jun' },
    { numero: 6, nombre: 'Julio', corto: 'Jul' },
    { numero: 7, nombre: 'Agosto', corto: 'Ago' },
    { numero: 8, nombre: 'Septiembre', corto: 'Sep' },
    { numero: 9, nombre: 'Octubre', corto: 'Oct' },
    { numero: 10, nombre: 'Noviembre', corto: 'Nov' },
    { numero: 11, nombre: 'Diciembre', corto: 'Dic' },
  ];

  private gastos: Gasto[] = [];

  constructor() {
    addIcons({
      add,
      arrowUp,
      arrowDown,
      calendar,
      calendarOutline,
      receipt,
      receiptOutline,
      qrCode,
      chevronForward,
      chevronForwardOutline,
      chevronBackOutline,
      closeOutline,
      notificationsOutline,
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
      trendingUpOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.cargarResumenInicio();
  }

  abrirSelectorMes(): void {
    this.anioSelector = this.anioSeleccionado;
    this.selectorMesAbierto = true;
  }

  cerrarSelectorMes(): void {
    this.selectorMesAbierto = false;
  }

  cambiarAnioSelector(cambio: number): void {
    this.anioSelector += cambio;
  }

  seleccionarMes(mes: number): void {
    this.mesSeleccionado = mes;
    this.anioSeleccionado = this.anioSelector;
    this.selectorMesAbierto = false;
    this.aplicarFiltroMes();
  }

  esMesActivo(mes: number): boolean {
    return this.anioSelector === this.anioSeleccionado && mes === this.mesSeleccionado;
  }

  private async cargarResumenInicio(): Promise<void> {
    try {
      this.gastos = await this.gastosService.obtenerGastos();

      if (!this.etiquetaMesSeleccionado) {
        const hoy = new Date();
        this.mesSeleccionado = hoy.getMonth();
        this.anioSeleccionado = hoy.getFullYear();
        this.anioSelector = hoy.getFullYear();
      }

      this.aplicarFiltroMes();
    } catch (error) {
      console.error('No se pudieron cargar los gastos de inicio:', error);
      this.resetearDatos();
    }
  }

  private aplicarFiltroMes(): void {
    const fechaSeleccionada = new Date(this.anioSeleccionado, this.mesSeleccionado, 1);
    const fechaMesAnterior = new Date(this.anioSeleccionado, this.mesSeleccionado - 1, 1);

    const gastosMesSeleccionado = this.gastos.filter((gasto) =>
      this.esMismoMes(gasto.fecha, fechaSeleccionada)
    );

    const gastosMesAnterior = this.gastos.filter((gasto) =>
      this.esMismoMes(gasto.fecha, fechaMesAnterior)
    );

    const hoy = new Date();

    const esMesActual =
      this.anioSeleccionado === hoy.getFullYear() &&
      this.mesSeleccionado === hoy.getMonth();

    this.etiquetaDia = esMesActual ? 'Hoy' : 'Mes';
    this.etiquetaMesSeleccionado = this.formatearMes(fechaSeleccionada);

    this.totalMes = this.sumarMontos(gastosMesSeleccionado);

    this.totalHoy = esMesActual
      ? this.sumarMontos(
          gastosMesSeleccionado.filter((gasto) =>
            this.esMismoDiaClasico(new Date(gasto.fecha), hoy)
          )
        )
      : this.totalMes;

    this.totalTransacciones = gastosMesSeleccionado.length;

    this.variacionMesAnterior = this.calcularVariacion(
      this.totalMes,
      this.sumarMontos(gastosMesAnterior)
    );

    this.tendenciaPositiva = this.variacionMesAnterior >= 0;
    this.variacionAbsoluta = Math.abs(this.variacionMesAnterior);

    this.categoriaTop = this.obtenerCategoriaTop(gastosMesSeleccionado);
    this.iconoTop = this.obtenerCategoriaTopIcono(gastosMesSeleccionado);

    this.gastosRecientes = gastosMesSeleccionado.slice(0, 3).map((gasto) => ({
      ...gasto,
      fechaRelativa: this.formatearFechaReciente(gasto.fecha),
      icono: this.iconoPorCategoria(gasto.categoria),
    }));
  }

  private resetearDatos(): void {
    const hoy = new Date();

    this.totalMes = 0;
    this.totalHoy = 0;
    this.totalTransacciones = 0;
    this.variacionMesAnterior = 0;
    this.variacionAbsoluta = 0;
    this.tendenciaPositiva = true;
    this.categoriaTop = 'Sin datos';
    this.iconoTop = 'restaurant-outline';
    this.gastosRecientes = [];
    this.gastos = [];

    this.mesSeleccionado = hoy.getMonth();
    this.anioSeleccionado = hoy.getFullYear();
    this.anioSelector = hoy.getFullYear();
    this.etiquetaDia = 'Hoy';
    this.etiquetaMesSeleccionado = this.formatearMes(hoy);
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

    const totales = this.agruparTotales(gastos);

    return capitalizarCategoria(
      Object.entries(totales).sort(([, a], [, b]) => b - a)[0][0]
    );
  }

  private obtenerCategoriaTopIcono(gastos: Gasto[]): string {
    if (!gastos.length) {
      return 'restaurant-outline';
    }

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
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  private esMismoMes(fecha: string, referencia: Date): boolean {
    const d = new Date(fecha);

    return (
      d.getFullYear() === referencia.getFullYear() &&
      d.getMonth() === referencia.getMonth()
    );
  }

  private formatearMes(fecha: Date): string {
    const mes = fecha.toLocaleDateString('es-MX', {
      month: 'long',
      year: 'numeric',
    });

    return mes.charAt(0).toUpperCase() + mes.slice(1);
  }

  private formatearFechaReciente(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    const ayer = new Date(hoy);

    ayer.setDate(ayer.getDate() - 1);

    const opcionesHora: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    const horaStr = fecha.toLocaleTimeString('es-MX', opcionesHora).toUpperCase();

    if (this.esMismoDiaClasico(fecha, hoy)) {
      return `Hoy, ${horaStr}`;
    }

    if (this.esMismoDiaClasico(fecha, ayer)) {
      return `Ayer, ${horaStr}`;
    }

    const opcionesFecha: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
    };

    const fechaFormat = fecha.toLocaleDateString('es-MX', opcionesFecha);

    return `${fechaFormat}, ${horaStr}`;
  }

  private iconoPorCategoria(categoria: string): string {
    return obtenerCategoriaVisual(categoria).icono;
  }
}