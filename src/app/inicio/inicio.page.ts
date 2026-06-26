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
import { GastosService, Gasto } from '../services/gastos.service';
import { CategoriasService } from '../services/categorias.service';
import { MsiService } from '../services/msi.service';
import { PagoMSIMensual } from '../models/msi.model';

export interface GastoReciente extends Gasto {
  fechaRelativa: string;
  icono: string;
  bgColor: string;
  iconColor: string;
  esMSI?: boolean;
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
  private readonly categoriasService = inject(CategoriasService);
  private readonly msiService = inject(MsiService);

  totalMes = 0;
  variacionMesAnterior = 0;
  variacionAbsoluta = 0;
  tendenciaPositiva = true;
  totalHoy = 0;
  totalTransacciones = 0;
  categoriaTop = 'Sin datos';
  iconoTop = 'restaurant-outline';
  gastosRecientes: GastoReciente[] = [];

  pagosMSIMes: PagoMSIMensual[] = [];
  totalMSIMes = 0;

  etiquetaDia = 'Hoy';
  etiquetaMesSeleccionado = '';
  mensajeTendencia = 'Sin comparación';
  hayDatosMesAnterior = false;

  selectorMesAbierto = false;
  anioSelector = new Date().getFullYear();
  mesSeleccionado = new Date().getMonth();
  anioSeleccionado = new Date().getFullYear();

  fechaMinima: Date = new Date();
  fechaMaxima: Date = new Date();

  private categoriasMap = new Map<number, { nombre: string; icono: string; color: string; activa: boolean }>();

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
  private todosLosMeses: Set<string> = new Set();

  async ionViewWillEnter(): Promise<void> {
    await this.cargarCategorias();
    await this.cargarResumenInicio();
  }

  private async cargarCategorias(): Promise<void> {
    try {
      const cats = await this.categoriasService.obtenerCategorias({ incluirInactivas: true });
      cats.forEach(c => {
        this.categoriasMap.set(c.id, { 
          nombre: c.nombre, 
          icono: c.icono || 'receipt-outline',
          color: c.color || '#64748b',
          activa: c.activa
        });
      });
    } catch (error) {
      console.error('Error al cargar categorias:', error);
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    let c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    return {
      r: parseInt(c[0] + c[1], 16),
      g: parseInt(c[2] + c[3], 16),
      b: parseInt(c[4] + c[5], 16)
    };
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    s /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  }

  private saturateColor(hex: string): string {
    if (!hex) return '#64748b';
    const { r, g, b } = this.hexToRgb(hex);
    let { h, s, l } = this.rgbToHsl(r, g, b);
    s = Math.min(100, s + 50);
    l = Math.max(0, l - 45);
    return this.hslToHex(h, s, l);
  }

  mesAnterior(): void {
    if (!this.puedeIrAnterior()) return;
    this.mesSeleccionado--;
    if (this.mesSeleccionado < 0) { this.mesSeleccionado = 11; this.anioSeleccionado--; }
    this.aplicarFiltroMes();
    this.cerrarSelectorMes(); 
  }

  mesSiguiente(): void {
    if (!this.puedeIrSiguiente()) return;
    this.mesSeleccionado++;
    if (this.mesSeleccionado > 11) { this.mesSeleccionado = 0; this.anioSeleccionado++; }
    this.aplicarFiltroMes();
    this.cerrarSelectorMes();
  }

  puedeIrAnterior(): boolean {
    if (!this.gastos.length) return false;
    const indiceActual = this.anioSeleccionado * 12 + this.mesSeleccionado;
    const indiceMinimo = this.fechaMinima.getFullYear() * 12 + this.fechaMinima.getMonth();
    return indiceActual > indiceMinimo;
  }

  puedeIrSiguiente(): boolean {
    const hoy = new Date();
    const indiceActual = this.anioSeleccionado * 12 + this.mesSeleccionado;
    const tieneMSIFuturo = this.tienePagosMSIEnMes(this.anioSeleccionado, this.mesSeleccionado + 1);
    const indiceMaximo = hoy.getFullYear() * 12 + hoy.getMonth();
    if (tieneMSIFuturo) {
      return true;
    }
    return indiceActual < indiceMaximo;
  }

  private tienePagosMSIEnMes(anio: number, mes: number): boolean {
    const key = `${anio}-${mes}`;
    return this.todosLosMeses.has(key);
  }

  abrirSelectorMes(): void {
    this.anioSelector = this.anioSeleccionado;
    this.selectorMesAbierto = true;
  }

  cerrarSelectorMes(): void {
    this.selectorMesAbierto = false;
  }

  cambiarAnioSelector(cambio: number): void {
    const nuevoAnio = this.anioSelector + cambio;
    if (!this.hayRegistrosEnAnio(nuevoAnio)) return;
    this.anioSelector = nuevoAnio;
  }

  seleccionarMes(mes: number): void {
    if (!this.hayGastosEnMes(mes, this.anioSelector)) return;
    this.mesSeleccionado = mes;
    this.anioSeleccionado = this.anioSelector;
    this.selectorMesAbierto = false;
    this.aplicarFiltroMes();
  }

  esMesActivo(mes: number): boolean {
    return this.anioSelector === this.anioSeleccionado && mes === this.mesSeleccionado;
  }

  hayGastosEnMes(mes: number, anio: number): boolean {
    const key = `${anio}-${mes}`;
    return this.todosLosMeses.has(key);
  }

  hayRegistrosEnAnio(anio: number): boolean {
    return Array.from(this.todosLosMeses).some(key => {
      const [a] = key.split('-').map(Number);
      return a === anio;
    });
  }

  private async cargarResumenInicio(): Promise<void> {
    try {
      this.gastos = await this.gastosService.obtenerGastos();
      await this.cargarMesesConRegistros();
      this.calcularFechasLimite();

      if (!this.etiquetaMesSeleccionado) {
        const hoy = new Date();
        this.mesSeleccionado = hoy.getMonth();
        this.anioSeleccionado = hoy.getFullYear();
        this.anioSelector = hoy.getFullYear();
      }

      await this.aplicarFiltroMes();
    } catch (error) {
      console.error('No se pudieron cargar los gastos de inicio:', error);
      this.resetearDatos();
    }
  }

  private async cargarMesesConRegistros(): Promise<void> {
    this.todosLosMeses.clear();

    for (const gasto of this.gastos) {
      const fecha = new Date(gasto.fecha);
      this.todosLosMeses.add(`${fecha.getFullYear()}-${fecha.getMonth()}`);
    }

    try {
      const pagosMSI = await this.msiService.obtenerPagosMensuales(
        new Date(2000, 0, 1),
        new Date(2100, 11, 31)
      );
      for (const pago of pagosMSI) {
        const fecha = new Date(pago.fecha);
        this.todosLosMeses.add(`${fecha.getFullYear()}-${fecha.getMonth()}`);
      }
    } catch (error) {
      console.error('Error al cargar meses MSI:', error);
    }
  }

  private calcularFechasLimite(): void {
    if (this.todosLosMeses.size === 0) { 
      this.fechaMinima = new Date(); 
      return; 
    }
    
    let minAnio = 9999, minMes = 11;
    for (const key of this.todosLosMeses) {
      const [anio, mes] = key.split('-').map(Number);
      if (anio < minAnio || (anio === minAnio && mes < minMes)) {
        minAnio = anio;
        minMes = mes;
      }
    }
    this.fechaMinima = new Date(minAnio, minMes, 1);
  }

  private async aplicarFiltroMes(): Promise<void> {
    const fechaSeleccionada = new Date(this.anioSeleccionado, this.mesSeleccionado, 1);
    const fechaMesAnterior = new Date(this.anioSeleccionado, this.mesSeleccionado - 1, 1);

    const hoy = new Date();
    const esMesActual = this.anioSeleccionado === hoy.getFullYear() && this.mesSeleccionado === hoy.getMonth();
    const esMesFuturo = this.anioSeleccionado > hoy.getFullYear() || 
                        (this.anioSeleccionado === hoy.getFullYear() && this.mesSeleccionado > hoy.getMonth());

    let gastosMesSeleccionado: Gasto[] = [];
    if (!esMesFuturo) {
      gastosMesSeleccionado = this.gastos.filter((gasto) =>
        this.esMismoMes(gasto.fecha, fechaSeleccionada)
      );
    }

    // ✅ Obtener pagos MSI del mes (para mostrar en gastos recientes, NO en la card)
    this.pagosMSIMes = await this.msiService.obtenerPagosMensuales(
      fechaSeleccionada,
      new Date(this.anioSeleccionado, this.mesSeleccionado + 1, 0)
    );
    this.totalMSIMes = this.pagosMSIMes.reduce((sum, p) => sum + p.monto, 0);

    // ✅ Total del mes SOLO con gastos normales (MSI NO va en la card principal)
    this.totalMes = this.sumarMontos(gastosMesSeleccionado);

    this.totalTransacciones = gastosMesSeleccionado.length + this.pagosMSIMes.length;

    const gastosMesAnterior = this.gastos.filter((gasto) =>
      this.esMismoMes(gasto.fecha, fechaMesAnterior)
    );
    const totalMesAnterior = this.sumarMontos(gastosMesAnterior);
    this.hayDatosMesAnterior = gastosMesAnterior.length > 0;

    this.etiquetaDia = esMesActual ? 'Hoy' : (esMesFuturo ? 'Futuro' : 'Mes');
    this.etiquetaMesSeleccionado = this.formatearMes(fechaSeleccionada);

    if (esMesActual) {
      this.totalHoy = this.sumarMontos(
        gastosMesSeleccionado.filter((gasto) => this.esMismoDiaClasico(new Date(gasto.fecha), hoy))
      );
    } else {
      this.totalHoy = this.totalMes;
    }

    if (!this.hayDatosMesAnterior && this.totalMes === 0) {
      this.mensajeTendencia = 'Sin datos';
      this.tendenciaPositiva = true;
      this.variacionAbsoluta = 0;
    } else if (!this.hayDatosMesAnterior) {
      this.mensajeTendencia = 'Primer mes con datos';
      this.tendenciaPositiva = true;
      this.variacionAbsoluta = 0;
    } else {
      this.variacionMesAnterior = this.calcularVariacion(this.totalMes, totalMesAnterior);
      this.tendenciaPositiva = this.variacionMesAnterior >= 0;
      this.variacionAbsoluta = Math.abs(this.variacionMesAnterior);

      if (this.variacionMesAnterior === 0) {
        this.mensajeTendencia = 'Gastos iguales al mes anterior';
      } else if (this.variacionMesAnterior < 0) { 
        this.mensajeTendencia = `Menos gastos que el mes anterior (${this.variacionAbsoluta}%)`;
      } else {
        this.mensajeTendencia = `Más gastos que el mes anterior (${this.variacionAbsoluta}%)`;
      }
    }

    this.categoriaTop = this.obtenerCategoriaTop(gastosMesSeleccionado);
    this.iconoTop = this.obtenerCategoriaTopIcono(gastosMesSeleccionado);

    // ✅ Construir gastos recientes (normales + MSI)
    if (!esMesFuturo) {
      const gastosNormales = gastosMesSeleccionado.slice(0, 3).map((gasto) => {
        const catData = this.categoriasMap.get(gasto.categoria_id ?? 0);
        const colorCat = catData?.color || '#64748b';
        const activa = catData?.activa ?? true;
        const esInactiva = !activa;
        
        return {
          ...gasto,
          fechaRelativa: this.formatearFechaReciente(gasto.fecha),
          icono: this.obtenerIconoCategoriaPorId(gasto.categoria_id),
          bgColor: esInactiva ? '#9CA3AF' : colorCat,
          iconColor: esInactiva ? '#6B7280' : this.saturateColor(colorCat),
          esMSI: false
        };
      });

      const filasMSI = this.pagosMSIMes.map((pago) => ({
        id: pago.compra_id,
        categoria_id: null,
        categoria: null,
        concepto: `💳 MSI: ${pago.concepto} (${pago.mes_numero}° pago)`,
        monto: pago.monto,
        fecha: pago.fecha,
        metodo_pago: 'Tarjeta',
        notas: null,
        fechaRelativa: this.formatearFechaReciente(pago.fecha),
        icono: 'cash-outline',
        bgColor: '#0456C5',
        iconColor: '#FFFFFF',
        esMSI: true
      }));

      const todos = [...gastosNormales, ...filasMSI];
      todos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      this.gastosRecientes = todos.slice(0, 5);
    } else {
      const filasMSI = this.pagosMSIMes.map((pago) => ({
        id: pago.compra_id,
        categoria_id: null,
        categoria: null,
        concepto: `💳 MSI: ${pago.concepto} (${pago.mes_numero}° pago)`,
        monto: pago.monto,
        fecha: pago.fecha,
        metodo_pago: 'Tarjeta',
        notas: null,
        fechaRelativa: this.formatearFechaReciente(pago.fecha),
        icono: 'cash-outline',
        bgColor: '#0456C5',
        iconColor: '#FFFFFF',
        esMSI: true
      }));

      this.gastosRecientes = filasMSI.slice(0, 5);
    }
  }

  private resetearDatos(): void {
    const hoy = new Date();
    this.totalMes = 0; this.totalHoy = 0; this.totalTransacciones = 0; this.variacionMesAnterior = 0;
    this.variacionAbsoluta = 0; this.tendenciaPositiva = true; this.categoriaTop = 'Sin datos';
    this.iconoTop = 'restaurant-outline'; this.gastosRecientes = []; this.gastos = [];
    this.pagosMSIMes = []; this.totalMSIMes = 0;
    this.mesSeleccionado = hoy.getMonth(); this.anioSeleccionado = hoy.getFullYear();
    this.anioSelector = hoy.getFullYear(); this.etiquetaDia = 'Hoy';
    this.etiquetaMesSeleccionado = this.formatearMes(hoy); this.fechaMinima = hoy;
    this.mensajeTendencia = 'Sin comparación'; this.hayDatosMesAnterior = false;
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
    const topId = Number(Object.entries(totales).sort(([, a], [, b]) => b - a)[0][0]);
    return this.obtenerNombreCategoriaPorId(topId);
  }

  private obtenerCategoriaTopIcono(gastos: Gasto[]): string {
    if (!gastos.length) return 'restaurant-outline';
    const totales = this.agruparTotales(gastos);
    const topId = Number(Object.entries(totales).sort(([, a], [, b]) => b - a)[0][0]);
    return this.obtenerIconoCategoriaPorId(topId);
  }

  private agruparTotales(gastos: Gasto[]): Record<string, number> {
    return gastos.reduce<Record<string, number>>((acc, gasto) => {
      const key = String(gasto.categoria_id || 0);
      acc[key] = (acc[key] ?? 0) + gasto.monto;
      return acc;
    }, {});
  }

  private obtenerNombreCategoriaPorId(id: number | null): string {
    if (!id) return 'Sin categoría';
    return this.categoriasMap.get(id)?.nombre || 'Sin categoría';
  }

  private obtenerIconoCategoriaPorId(id: number | null): string {
    if (!id) return 'receipt-outline';
    return this.categoriasMap.get(id)?.icono || 'receipt-outline';
  }

  private esMismoDiaClasico(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }

  private esMismoMes(fecha: string, referencia: Date): boolean {
    const d = new Date(fecha);
    return d.getFullYear() === referencia.getFullYear() && d.getMonth() === referencia.getMonth();
  }

  private formatearMes(fecha: Date): string {
    const mes = fecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    return mes.charAt(0).toUpperCase() + mes.slice(1);
  }

  private formatearFechaReciente(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);

    const opcionesHora: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const horaStr = fecha.toLocaleTimeString('es-MX', opcionesHora).toUpperCase();

    if (this.esMismoDiaClasico(fecha, hoy)) return `Hoy, ${horaStr}`;
    if (this.esMismoDiaClasico(fecha, ayer)) return `Ayer, ${horaStr}`;

    const opcionesFecha: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const fechaFormat = fecha.toLocaleDateString('es-MX', opcionesFecha);
    return `${fechaFormat}, ${horaStr}`;
  }
}