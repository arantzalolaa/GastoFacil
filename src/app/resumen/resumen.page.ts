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
  trendingDownOutline,
  walletOutline,
  bulbOutline,
  gameControllerOutline,
  schoolOutline,
  medkitOutline
} from 'ionicons/icons';
import { normalizarCategoria } from '../services/categorias.util';
import { Gasto, GastosService } from '../services/gastos.service';

export interface ResumenCategoria {
  categoria: string;
  total: number;
  porcentaje: number;
  icono: string;
  colorHex: string;
  clase: string;
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
  totalAcumulado = 0;
  desgloseCategorias: ResumenCategoria[] = [];
  categoriaPrincipal: ResumenCategoria | null = null;
  chartGradient = '';
  
  tituloFeedback = '¡Vas por buen camino!';
  mensajeFeedback = '';

  constructor() {
    addIcons({
      barChartOutline,
      carOutline,
      restaurantOutline,
      shapesOutline,
      trendingUpOutline,
      trendingDownOutline,
      walletOutline,
      bulbOutline,
      gameControllerOutline,
      schoolOutline,
      medkitOutline
    });
  }

  ionViewWillEnter(): void {
    void this.cargarResumen();
  }

  private async cargarResumen(): Promise<void> {
    try {
      const gastos = await this.gastosService.obtenerGastos();
      const ahora = new Date();
      const gastosMesActual = gastos.filter((gasto) => this.esMismoMes(gasto.fecha, ahora));
      const gastosMesAnterior = gastos.filter((gasto) => this.esMesAnterior(gasto.fecha, ahora));

      this.totalAcumulado = this.sumarMontos(gastosMesActual);
      this.variacionMesAnterior = this.calcularVariacion(this.totalAcumulado, this.sumarMontos(gastosMesAnterior));
      
      this.desgloseCategorias = this.calcularDesgloseCategorias(gastosMesActual);
      
      const maxCategoria = [...this.desgloseCategorias].sort((a, b) => b.total - a.total)[0];
      this.categoriaPrincipal = maxCategoria && maxCategoria.total > 0 ? maxCategoria : null;

      this.chartGradient = this.crearGradienteCategorias();
      this.generarMensajeFeedback();

    } catch (error) {
      console.error('No se pudo cargar el resumen:', error);
      this.resetearDatos();
    }
  }

  private calcularDesgloseCategorias(gastos: Gasto[]): ResumenCategoria[] {
    const totales = gastos.reduce<Record<string, number>>((acc, gasto) => {
      const cat = normalizarCategoria(gasto.categoria);
      acc[cat] = (acc[cat] ?? 0) + gasto.monto;
      return acc;
    }, {});

    const categoriasBase = [
      { id: 'comida', nombre: 'Comida', icono: 'restaurant-outline', color: '#c98500' },
      { id: 'servicios', nombre: 'Servicios', icono: 'bulb-outline', color: '#a23b43' },
      { id: 'transporte', nombre: 'Transporte', icono: 'car-outline', color: '#1267b4' },
      { id: 'ocio', nombre: 'Ocio', icono: 'game-controller-outline', color: '#7c3aed' },
      { id: 'estudios', nombre: 'Estudios', icono: 'school-outline', color: '#d9468f' },
      { id: 'salud', nombre: 'Salud', icono: 'medkit-outline', color: '#0b8a61' }
    ];

    const resultado = categoriasBase.map(base => {
      const total = totales[base.id] ?? 0;
      const porcentaje = this.totalAcumulado > 0 ? Math.round((total / this.totalAcumulado) * 100) : 0;
      return {
        categoria: base.nombre,
        total,
        porcentaje,
        icono: base.icono,
        colorHex: base.color,
        clase: base.id
      };
    });

    const totalOtros = totales['otros'] ?? 0;
    if (totalOtros > 0) {
      const porcentajeOtros = this.totalAcumulado > 0 ? Math.round((totalOtros / this.totalAcumulado) * 100) : 0;
      resultado.push({
        categoria: 'Otros',
        total: totalOtros,
        porcentaje: porcentajeOtros,
        icono: 'shapes-outline',
        colorHex: '#4b5563',
        clase: 'otros'
      });
    }

    return resultado.sort((a, b) => b.total - a.total);
  }

  private crearGradienteCategorias(): string {
    if (this.totalAcumulado === 0) return 'conic-gradient(#E6E8EA 0deg 360deg)';

    let inicio = 0;
    const segmentos = this.desgloseCategorias
      .filter(item => item.total > 0)
      .map((item, index, array) => {
        const proporcion = item.total / this.totalAcumulado;
        const grados = proporcion * 360;
        const fin = index === array.length - 1 ? 360 : inicio + grados;
        const segmento = `${item.colorHex} ${inicio.toFixed(2)}deg ${fin.toFixed(2)}deg`;
        inicio = fin;
        return segmento;
      });

    return `conic-gradient(${segmentos.join(', ')})`;
  }

  private generarMensajeFeedback(): void {
    const absVariacion = Math.abs(this.variacionMesAnterior);
    const nombreCategoria = this.categoriaPrincipal ? this.categoriaPrincipal.categoria : 'tus gastos';

    if (this.variacionMesAnterior <= 0) {
      this.tituloFeedback = '¡Vas por buen camino!';
      this.mensajeFeedback = `Has ahorrado un ${absVariacion}% comparado con el mes anterior. Mantén el enfoque en tu categoría de ${nombreCategoria}.`;
    } else {
      this.tituloFeedback = '¡Cuidado con tus gastos!';
      this.mensajeFeedback = `Has gastado un ${absVariacion}% más comparado con el mes anterior. Revisa bien tus gastos en la categoría de ${nombreCategoria}.`;
    }
  }

  private sumarMontos(gastos: Gasto[]): number {
    return gastos.reduce((total, gasto) => total + gasto.monto, 0);
  }

  private calcularVariacion(actual: number, anterior: number): number {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return Math.round(((actual - anterior) / anterior) * 100);
  }

  private esMismoMes(fecha: string, referencia: Date): boolean {
    const d = new Date(fecha);
    return d.getFullYear() === referencia.getFullYear() && d.getMonth() === referencia.getMonth();
  }

  private esMesAnterior(fecha: string, referencia: Date): boolean {
    const mesAnterior = new Date(referencia.getFullYear(), referencia.getMonth() - 1, 1);
    return this.esMismoMes(fecha, mesAnterior);
  }

  private resetearDatos(): void {
    this.totalAcumulado = 0;
    this.variacionMesAnterior = 0;
    this.desgloseCategorias = [];
    this.categoriaPrincipal = null;
    this.chartGradient = 'conic-gradient(#E6E8EA 0deg 360deg)';
  }
}