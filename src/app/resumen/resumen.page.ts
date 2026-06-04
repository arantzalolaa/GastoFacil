import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  carOutline,
  restaurantOutline,
  shapesOutline,
  trendingUpOutline,
  walletOutline,
  wifiOutline,
} from 'ionicons/icons';
import { normalizarCategoria } from '../services/categorias.util';
import { Gasto, GastosService } from '../services/gastos.service';

export interface ResumenCategoria {
  categoria: string;
  total: number;
  porcentaje: number;
  icono: string;
  color: string;
}

@Component({
  selector: 'app-resumen',
  templateUrl: 'resumen.page.html',
  styleUrls: ['resumen.page.scss'],
  imports: [CommonModule, IonContent, IonIcon],
})
export class ResumenPage {
  private readonly gastosService = inject(GastosService);

  variacionMesAnterior = 0;
  ahorroSemanaAnterior = 0;
  totalAcumulado = 0;
  desgloseCategorias: ResumenCategoria[] = this.calcularDesgloseCategorias([]);
  categoriaPrincipal = this.desgloseCategorias[0];
  chartGradient = this.crearGradienteCategorias();

  constructor() {
    addIcons({
      barChartOutline,
      carOutline,
      restaurantOutline,
      shapesOutline,
      trendingUpOutline,
      walletOutline,
      wifiOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.cargarResumen();
  }

  categoriaClass(categoria: string): string {
    return categoria.toLowerCase();
  }

  private async cargarResumen(): Promise<void> {
    try {
      const gastos = await this.gastosService.obtenerGastos();
      const ahora = new Date();
      const gastosMesActual = gastos.filter((gasto) => this.esMismoMes(gasto.fecha, ahora));
      const gastosMesAnterior = gastos.filter((gasto) => this.esMesAnterior(gasto.fecha, ahora));
      const gastosSemanaActual = gastos.filter((gasto) => this.esMismaSemana(gasto.fecha, ahora));
      const gastosSemanaAnterior = gastos.filter((gasto) => this.esSemanaAnterior(gasto.fecha, ahora));

      this.totalAcumulado = this.sumarMontos(gastosMesActual);
      this.variacionMesAnterior = this.calcularVariacion(this.totalAcumulado, this.sumarMontos(gastosMesAnterior));
      this.ahorroSemanaAnterior = this.calcularAhorro(
        this.sumarMontos(gastosSemanaActual),
        this.sumarMontos(gastosSemanaAnterior),
      );
      this.desgloseCategorias = this.calcularDesgloseCategorias(gastosMesActual);
      this.categoriaPrincipal = this.desgloseCategorias.reduce((principal, item) =>
        item.total > principal.total ? item : principal,
      );
      this.chartGradient = this.crearGradienteCategorias();
    } catch (error) {
      console.error('No se pudo cargar el resumen:', error);
      this.totalAcumulado = 0;
      this.variacionMesAnterior = 0;
      this.ahorroSemanaAnterior = 0;
      this.desgloseCategorias = this.calcularDesgloseCategorias([]);
      this.categoriaPrincipal = this.desgloseCategorias[0];
      this.chartGradient = this.crearGradienteCategorias();
    }
  }

  private calcularDesgloseCategorias(gastos: Gasto[]): ResumenCategoria[] {
    const totales = gastos.reduce<Record<string, number>>((acc, gasto) => {
      const categoriaNormalizada = normalizarCategoria(gasto.categoria);
      const categoriaAgrupada =
        categoriaNormalizada === 'comida'
          ? 'Comida'
          : categoriaNormalizada === 'servicios'
            ? 'Servicios'
            : categoriaNormalizada === 'transporte'
              ? 'Transporte'
              : 'Otros';

      acc[categoriaAgrupada] = (acc[categoriaAgrupada] ?? 0) + gasto.monto;
      return acc;
    }, {});

    const iconosPorCategoria: Record<string, string> = {
      Comida: 'restaurant-outline',
      Servicios: 'wifi-outline',
      Transporte: 'car-outline',
      Otros: 'shapes-outline',
    };
    const coloresPorCategoria: Record<string, string> = {
      Comida: 'var(--app-chart-comida)',
      Servicios: 'var(--app-chart-servicios)',
      Transporte: 'var(--app-chart-transporte)',
      Otros: 'var(--app-chart-otros)',
    };

    return ['Comida', 'Servicios', 'Transporte', 'Otros'].map((categoria) => ({
      categoria,
      total: totales[categoria] ?? 0,
      porcentaje: this.totalAcumulado > 0 ? Math.round(((totales[categoria] ?? 0) / this.totalAcumulado) * 100) : 0,
      icono: iconosPorCategoria[categoria],
      color: coloresPorCategoria[categoria],
    }));
  }

  private crearGradienteCategorias(): string {
    const valoresVisuales = this.desgloseCategorias.map((item) => Math.max(item.total, 1));
    const totalVisual = valoresVisuales.reduce((total, valor) => total + valor, 0);
    let inicio = 0;
    const segmentos = this.desgloseCategorias.map((item, index) => {
      const fin =
        index === this.desgloseCategorias.length - 1
          ? 360
          : inicio + (valoresVisuales[index] / totalVisual) * 360;
      const segmento = `${item.color} ${inicio.toFixed(2)}deg ${fin.toFixed(2)}deg`;

      inicio = fin;
      return segmento;
    });

    return `conic-gradient(from -90deg, ${segmentos.join(', ')})`;
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

  private calcularAhorro(actual: number, anterior: number): number {
    if (anterior === 0) {
      return 0;
    }

    return Math.max(0, Math.round(((anterior - actual) / anterior) * 100));
  }

  private esMismoMes(fecha: string, referencia: Date): boolean {
    const fechaGasto = new Date(fecha);

    return fechaGasto.getFullYear() === referencia.getFullYear() && fechaGasto.getMonth() === referencia.getMonth();
  }

  private esMesAnterior(fecha: string, referencia: Date): boolean {
    const mesAnterior = new Date(referencia.getFullYear(), referencia.getMonth() - 1, 1);

    return this.esMismoMes(fecha, mesAnterior);
  }

  private esMismaSemana(fecha: string, referencia: Date): boolean {
    const fechaGasto = new Date(fecha);
    const inicioSemana = this.obtenerInicioSemana(referencia);
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 7);

    return fechaGasto >= inicioSemana && fechaGasto < finSemana;
  }

  private esSemanaAnterior(fecha: string, referencia: Date): boolean {
    const fechaGasto = new Date(fecha);
    const inicioSemanaActual = this.obtenerInicioSemana(referencia);
    const inicioSemanaAnterior = new Date(inicioSemanaActual);
    inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7);

    return fechaGasto >= inicioSemanaAnterior && fechaGasto < inicioSemanaActual;
  }

  private obtenerInicioSemana(fecha: Date): Date {
    const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const dia = inicio.getDay();
    const diff = dia === 0 ? -6 : 1 - dia;
    inicio.setDate(inicio.getDate() + diff);

    return inicio;
  }
}
