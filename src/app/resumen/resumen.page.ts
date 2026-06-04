import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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

export interface Gasto {
  id: number;
  categoria: string;
  concepto: string;
  monto: number;
  fecha: string;
  metodo_pago: string;
  notas: string | null;
}

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
  variacionMesAnterior = 8;
  ahorroSemanaAnterior = 12;

  gastosMock: Gasto[] = [
    {
      id: 1,
      categoria: 'Comida',
      concepto: 'Supermercado semanal',
      monto: 980.5,
      fecha: '2026-10-05T13:20:00-06:00',
      metodo_pago: 'Tarjeta',
      notas: null,
    },
    {
      id: 2,
      categoria: 'Comida',
      concepto: 'Restaurante familiar',
      monto: 850,
      fecha: '2026-10-11T20:45:00-06:00',
      metodo_pago: 'Efectivo',
      notas: 'Cena de fin de semana',
    },
    {
      id: 3,
      categoria: 'Servicios',
      concepto: 'Pago de internet',
      monto: 600,
      fecha: '2026-10-06T09:00:00-06:00',
      metodo_pago: 'Transferencia',
      notas: null,
    },
    {
      id: 4,
      categoria: 'Servicios',
      concepto: 'Electricidad',
      monto: 600,
      fecha: '2026-10-10T12:00:00-06:00',
      metodo_pago: 'Transferencia',
      notas: null,
    },
    {
      id: 5,
      categoria: 'Transporte',
      concepto: 'Gasolina y taxi',
      monto: 950,
      fecha: '2026-10-14T19:30:00-06:00',
      metodo_pago: 'Tarjeta',
      notas: null,
    },
    {
      id: 6,
      categoria: 'Ocio',
      concepto: 'Cine y entretenimiento',
      monto: 520,
      fecha: '2026-10-16T21:00:00-06:00',
      metodo_pago: 'Tarjeta',
      notas: null,
    },
    {
      id: 7,
      categoria: 'Estudios',
      concepto: 'Curso en línea',
      monto: 480,
      fecha: '2026-10-18T16:15:00-06:00',
      metodo_pago: 'Tarjeta',
      notas: null,
    },
    {
      id: 8,
      categoria: 'Salud',
      concepto: 'Consulta médica',
      monto: 249.5,
      fecha: '2026-10-20T10:30:00-06:00',
      metodo_pago: 'Efectivo',
      notas: null,
    },
  ];

  totalAcumulado = this.gastosMock.reduce((total, gasto) => total + gasto.monto, 0);
  desgloseCategorias = this.calcularDesgloseCategorias();
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

  categoriaClass(categoria: string): string {
    return categoria.toLowerCase();
  }

  private calcularDesgloseCategorias(): ResumenCategoria[] {
    const totales = this.gastosMock.reduce<Record<string, number>>((acc, gasto) => {
      const categoriaAgrupada = ['Comida', 'Servicios', 'Transporte'].includes(gasto.categoria)
        ? gasto.categoria
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
      porcentaje: Math.round(((totales[categoria] ?? 0) / this.totalAcumulado) * 100),
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
}