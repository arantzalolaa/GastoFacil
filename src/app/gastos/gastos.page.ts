import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSearchbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  pricetagOutline,
  add,
  calendarOutline,
  closeOutline,
  createOutline,
  search,
  trashOutline,
  ellipsisHorizontal,
  gameControllerOutline,
  medkitOutline,
  carOutline,
  restaurantOutline,
  flashOutline,
  schoolOutline,
  walletOutline,
  receiptOutline,
  closeCircleOutline,
  chevronBackOutline,
  chevronForwardOutline,
  alertCircleOutline,
  ellipsisVertical,
  cashOutline
} from 'ionicons/icons';
import { Gasto, GastosService } from '../services/gastos.service';
import { Categoria, CategoriasService } from '../services/categorias.service';
import { normalizarCategoria } from '../services/categorias.util';

export interface GastoListado extends Gasto {
  categoriaClave: string;
  categoriaFormateada: string;
  fechaCorta: string;
  icono: string;
  bgColor: string;
  iconColor: string;
  textColor: string;
  mostrarAcciones: boolean;
  esInactiva: boolean;
}

@Component({
  selector: 'app-gastos',
  templateUrl: 'gastos.page.html',
  styleUrls: ['gastos.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonSearchbar
  ],
})
export class GastosPage {
  private readonly gastosService = inject(GastosService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly toastController = inject(ToastController);
  private readonly router = inject(Router);

  terminoBusqueda = '';
  categoriaSeleccionada: string | number = 'Todos';
  gastos: GastoListado[] = [];

  categoriasOrdenadas: Categoria[] = [];
  private categoriaMap = new Map<number, { nombre: string; icono: string; color: string; activa: boolean }>();

  isDateDropdownOpen = false;
  filtroMes: number | null = null;
  filtroAnio: number | null = null;
  anioPicker: number | null = null;

  menuAbierto = false;

  mesesOpciones = [
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
    { numero: 11, nombre: 'Diciembre', corto: 'Dic' }
  ];

  gastoEditando: GastoListado | null = null;
  gastoPendienteEliminar: GastoListado | null = null;

  formEditar = {
    concepto: '',
    monto: 0,
    categoria_id: null as number | null,
    fecha: '',
    metodo_pago: '',
    notas: '',
  };

  constructor() {
    addIcons({
      pricetagOutline,
      add,
      calendarOutline,
      closeOutline,
      createOutline,
      search,
      trashOutline,
      ellipsisHorizontal,
      gameControllerOutline,
      medkitOutline,
      carOutline,
      restaurantOutline,
      flashOutline,
      schoolOutline,
      walletOutline,
      receiptOutline,
      closeCircleOutline,
      chevronBackOutline,
      chevronForwardOutline,
      alertCircleOutline,
      ellipsisVertical,
      cashOutline
    });
  }

  async ionViewWillEnter(): Promise<void> {
    this.isDateDropdownOpen = false;
    this.menuAbierto = false;
    await this.cargarCategorias();
    await this.cargarGastos();
  }

  // ==========================================
  // MENÚ DE 3 PUNTOS
  // ==========================================
  toggleMenu(event?: Event): void {
    event?.stopPropagation();
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  irACategorias(): void {
    this.cerrarMenu();
    this.router.navigate(['/categorias']);
  }

  irAMSI(): void {
    this.cerrarMenu();
    this.router.navigate(['/msi']);
  }

  // ==========================================
  // RESTO DEL CÓDIGO
  // ==========================================
  get aniosConRegistros(): number[] {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    const anios = new Set<number>();

    this.gastos.forEach((gasto) => {
      const fecha = this.crearFechaLocal(gasto.fecha);

      if (Number.isNaN(fecha.getTime())) return;

      const mes = fecha.getMonth();
      const anio = fecha.getFullYear();

      const esFuturo =
        anio > anioActual ||
        (anio === anioActual && mes > mesActual);

      if (!esFuturo) {
        anios.add(anio);
      }
    });

    return Array.from(anios).sort((a, b) => b - a);
  }

  get aniosSelector(): { anio: number; habilitado: boolean; seleccionado: boolean }[] {
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const aniosConRegistros = this.aniosConRegistros;

    if (aniosConRegistros.length === 0) {
      return [
        {
          anio: anioActual,
          habilitado: false,
          seleccionado: this.anioPickerActual === anioActual
        }
      ];
    }

    const anioMasReciente = Math.max(anioActual, ...aniosConRegistros);
    const anioMasAntiguo = Math.min(...aniosConRegistros);

    const anios: { anio: number; habilitado: boolean; seleccionado: boolean }[] = [];

    for (let anio = anioMasReciente; anio >= anioMasAntiguo; anio--) {
      const habilitado = aniosConRegistros.includes(anio);

      anios.push({
        anio,
        habilitado,
        seleccionado: this.anioPickerActual === anio
      });
    }

    return anios;
  }

  get anioPickerActual(): number {
    if (this.anioPicker !== null) return this.anioPicker;
    if (this.filtroAnio !== null) return this.filtroAnio;
    if (this.aniosConRegistros.length > 0) return this.aniosConRegistros[0];

    return new Date().getFullYear();
  }

  get anioActualHabilitado(): boolean {
    return this.anioTieneRegistrosValidos(this.anioPickerActual);
  }

  get mesesSelector(): {
    numero: number;
    nombre: string;
    corto: string;
    habilitado: boolean;
    seleccionado: boolean;
  }[] {
    const anio = this.anioPickerActual;

    return this.mesesOpciones.map((mes) => {
      const habilitado = this.mesTieneRegistrosValidos(anio, mes.numero);
      const seleccionado = this.filtroMes === mes.numero && this.filtroAnio === anio;

      return {
        ...mes,
        habilitado,
        seleccionado
      };
    });
  }

  toggleDropdownFecha(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const seVaAbrir = !this.isDateDropdownOpen;

    if (seVaAbrir) {
      this.anioPicker =
        this.filtroAnio ??
        this.aniosConRegistros[0] ??
        new Date().getFullYear();
    }

    this.isDateDropdownOpen = seVaAbrir;
  }

  cerrarDropdownFecha(): void {
    this.isDateDropdownOpen = false;
  }

  moverAnio(direccion: -1 | 1): void {
    const anios = this.aniosSelector;
    const indexActual = anios.findIndex((item) => item.anio === this.anioPickerActual);

    if (indexActual === -1) return;

    const nuevoIndex = indexActual + direccion;

    if (nuevoIndex < 0 || nuevoIndex >= anios.length) return;

    this.anioPicker = anios[nuevoIndex].anio;
  }

  puedeMoverAnio(direccion: -1 | 1): boolean {
    const anios = this.aniosSelector;
    const indexActual = anios.findIndex((item) => item.anio === this.anioPickerActual);

    if (indexActual === -1) return false;

    const nuevoIndex = indexActual + direccion;

    return nuevoIndex >= 0 && nuevoIndex < anios.length;
  }

  async seleccionarMes(mes: number): Promise<void> {
    const anio = this.anioPickerActual;

    if (!this.mesTieneRegistrosValidos(anio, mes)) {
      await this.mostrarToast('Ese mes no tiene registros disponibles.', 'warning');
      return;
    }

    this.filtroMes = mes;
    this.filtroAnio = anio;
    this.isDateDropdownOpen = false;
  }

  limpiarFiltroFecha(): void {
    this.filtroMes = null;
    this.filtroAnio = null;
    this.isDateDropdownOpen = false;
  }

  private anioTieneRegistrosValidos(anioBuscado: number): boolean {
    return this.aniosConRegistros.includes(anioBuscado);
  }

  private mesTieneRegistrosValidos(anioBuscado: number, mesBuscado: number): boolean {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    const esFuturo =
      anioBuscado > anioActual ||
      (anioBuscado === anioActual && mesBuscado > mesActual);

    if (esFuturo) return false;

    return this.gastos.some((gasto) => {
      const fecha = this.crearFechaLocal(gasto.fecha);

      if (Number.isNaN(fecha.getTime())) return false;

      return fecha.getFullYear() === anioBuscado &&
        fecha.getMonth() === mesBuscado;
    });
  }

  private async cargarCategorias(): Promise<void> {
    try {
      const cats = await this.categoriasService.obtenerCategorias({ incluirInactivas: true });
      this.categoriasOrdenadas = cats.sort((a, b) => a.nombre.localeCompare(b.nombre));

      this.categoriaMap.clear();

      cats.forEach(c => {
        const color = c.color || '#64748b';

        this.categoriaMap.set(c.id, {
          nombre: c.nombre,
          icono: c.icono || 'receipt-outline',
          color: color,
          activa: c.activa
        });
      });
    } catch (error) {
      console.error('No se pudieron cargar las categorías:', error);
      this.categoriasOrdenadas = [];
    }
  }

  get gastosFiltrados(): GastoListado[] {
    const termino = this.terminoBusqueda.trim().toLowerCase();

    const seleccionId = typeof this.categoriaSeleccionada === 'number'
      ? this.categoriaSeleccionada
      : null;

    return this.gastos.filter((gasto) => {
      const coincideCategoria =
        this.categoriaSeleccionada === 'Todos' ||
        gasto.categoria_id === seleccionId;

      const coincideBusqueda =
        !termino ||
        gasto.concepto.toLowerCase().includes(termino) ||
        gasto.categoriaFormateada.toLowerCase().includes(termino) ||
        gasto.metodo_pago.toLowerCase().includes(termino) ||
        (gasto.notas?.toLowerCase().includes(termino) ?? false);

      const coincideFecha = this.coincideFechaFiltro(gasto.fecha);

      return coincideCategoria && coincideBusqueda && coincideFecha;
    });
  }

  private coincideFechaFiltro(fechaStr: string): boolean {
    if (this.filtroMes === null || this.filtroAnio === null) return true;

    const fecha = this.crearFechaLocal(fechaStr);

    return fecha.getFullYear() === this.filtroAnio &&
      fecha.getMonth() === this.filtroMes;
  }

  seleccionarFiltro(filtro: string | number, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    this.categoriaSeleccionada = filtro;
    this.isDateDropdownOpen = false;
  }

  toggleAcciones(gasto: GastoListado): void {
    this.gastos.forEach(g => {
      if (g !== gasto) g.mostrarAcciones = false;
    });

    gasto.mostrarAcciones = !gasto.mostrarAcciones;
  }

  editarGasto(gasto: GastoListado): void {
    gasto.mostrarAcciones = false;
    this.gastoEditando = gasto;

    this.formEditar = {
      concepto: gasto.concepto,
      monto: gasto.monto,
      categoria_id: gasto.categoria_id,
      fecha: this.obtenerFechaInput(gasto.fecha),
      metodo_pago: gasto.metodo_pago,
      notas: gasto.notas ?? '',
    };
  }

  cerrarModalEditar(): void {
    this.gastoEditando = null;

    this.formEditar = {
      concepto: '',
      monto: 0,
      categoria_id: null,
      fecha: '',
      metodo_pago: '',
      notas: ''
    };
  }

  async guardarEdicionGasto(): Promise<void> {
    if (!this.gastoEditando) return;

    const concepto = this.formEditar.concepto.trim();
    const monto = Number(this.formEditar.monto);
    const categoria_id = this.formEditar.categoria_id;
    const fecha = this.formEditar.fecha.trim();
    const metodoPago = this.formEditar.metodo_pago.trim();
    const notas = this.formEditar.notas.trim();

    if (!concepto || Number.isNaN(monto) || monto <= 0) {
      await this.mostrarToast('Ingresa un concepto y un monto válido.', 'warning');
      return;
    }

    if (!categoria_id) {
      await this.mostrarToast('Selecciona una categoría.', 'warning');
      return;
    }

    if (!fecha || !metodoPago) {
      await this.mostrarToast('Completa los campos faltantes.', 'warning');
      return;
    }

    try {
      await this.gastosService.actualizarGasto(this.gastoEditando.id, {
        concepto,
        monto,
        categoria_id,
        fecha,
        metodo_pago: metodoPago,
        notas: notas || null,
      });

      await this.cargarGastos();
      this.cerrarModalEditar();

      await this.mostrarToast('Gasto actualizado correctamente.', 'success');
    } catch (error) {
      console.error('No se pudo actualizar el gasto:', error);
      await this.mostrarToast('No se pudo actualizar el gasto.', 'danger');
    }
  }

  confirmarEliminarGasto(gasto: GastoListado): void {
    gasto.mostrarAcciones = false;
    this.gastoPendienteEliminar = gasto;
  }

  cancelarEliminarGasto(): void {
    this.gastoPendienteEliminar = null;
  }

  async eliminarGastoConfirmado(): Promise<void> {
    if (!this.gastoPendienteEliminar) return;

    try {
      await this.gastosService.eliminarGasto(this.gastoPendienteEliminar.id);
      await this.cargarGastos();

      this.gastoPendienteEliminar = null;

      await this.mostrarToast('Gasto eliminado correctamente.', 'success');
    } catch (error) {
      console.error('No se pudo eliminar el gasto:', error);
      await this.mostrarToast('No se pudo eliminar el gasto.', 'danger');
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

      s = l > 0.5
        ? d / (2 - max - min)
        : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: h * 360,
      s: s * 100,
      l: l * 100
    };
  }

  private hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    s /= 100;

    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);

    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));

    const toHex = (x: number) =>
      Math.round(255 * x).toString(16).padStart(2, '0');

    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  }

  private saturateColor(hex: string): string {
    if (!hex) return '#374151';

    const { r, g, b } = this.hexToRgb(hex);
    let { h, s, l } = this.rgbToHsl(r, g, b);

    s = Math.min(100, s + 50);
    l = Math.max(0, l - 45);

    return this.hslToHex(h, s, l);
  }

  private async cargarGastos(): Promise<void> {
    try {
      const gastos = await this.gastosService.obtenerGastos();

      this.gastos = gastos.map((gasto) => {
        const catData = this.categoriaMap.get(gasto.categoria_id ?? 0);
        const nombreCat = catData?.nombre || 'Sin categoría';
        const iconoCat = catData?.icono || 'receipt-outline';
        const colorCat = catData?.color || '#64748b';
        const activa = catData?.activa ?? true;
        const claveCat = normalizarCategoria(nombreCat);
        const esInactiva = !activa;

        return {
          ...gasto,
          categoriaClave: claveCat,
          categoriaFormateada: nombreCat + (esInactiva ? ' ⚠️' : ''),
          fechaCorta: this.formatearFechaCorta(gasto.fecha),
          icono: esInactiva ? 'alert-circle-outline' : iconoCat,
          bgColor: esInactiva ? '#9CA3AF' : colorCat,
          iconColor: esInactiva ? '#6B7280' : this.saturateColor(colorCat),
          textColor: '#191C1E',
          mostrarAcciones: false,
          esInactiva
        };
      });
    } catch (error) {
      console.error('No se pudieron cargar los gastos:', error);
      this.gastos = [];
      await this.mostrarToast('No se pudieron cargar los gastos.', 'danger');
    }
  }

  private crearFechaLocal(fechaStr: string): Date {
    if (!fechaStr) return new Date('');

    const partes = fechaStr.slice(0, 10).split('-');

    if (partes.length === 3) {
      const anio = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const dia = Number(partes[2]);

      return new Date(anio, mes, dia);
    }

    return new Date(fechaStr);
  }

  private formatearFechaCorta(fechaStr: string): string {
    const fecha = this.crearFechaLocal(fechaStr);

    return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  private obtenerFechaInput(fechaStr: string): string {
    if (!fechaStr) return '';

    const fecha = this.crearFechaLocal(fechaStr);

    if (Number.isNaN(fecha.getTime())) {
      return fechaStr.slice(0, 10);
    }

    const anio = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private async mostrarToast(
    mensaje: string,
    color: 'success' | 'warning' | 'danger' = 'success'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 1800,
      position: 'bottom',
      color
    });

    await toast.present();
  }
}