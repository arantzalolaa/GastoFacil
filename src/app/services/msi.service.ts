// src/app/services/msi.service.ts
import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { CompraMSI, CrearCompraMSI, ActualizarCompraMSI, PagoMSIMensual } from '../models/msi.model';
import { GastosService } from './gastos.service';

@Injectable({ providedIn: 'root' })
export class MsiService {
  private readonly supabase: SupabaseClient;
  private readonly gastosService = inject(GastosService);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  private async obtenerUserId(): Promise<string> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error || !data.user) {
      throw new Error('No hay usuario activo.');
    }
    return data.user.id;
  }

  // ==========================================
  // MAPEAR CATEGORÍA (helper para tipado)
  // ==========================================
  private mapearCategoria(categorias: any): { nombre: string; icono: string | null; color: string | null; activa: boolean } | null {
    if (!categorias) return null;
    if (Array.isArray(categorias) && categorias.length > 0) {
      return {
        nombre: categorias[0].nombre,
        icono: categorias[0].icono || null,
        color: categorias[0].color || null,
        activa: categorias[0].activa
      };
    }
    if (!Array.isArray(categorias) && typeof categorias === 'object') {
      return {
        nombre: categorias.nombre,
        icono: categorias.icono || null,
        color: categorias.color || null,
        activa: categorias.activa
      };
    }
    return null;
  }

  // ==========================================
  // MAPEAR COMPRA MSI (helper para tipado)
  // ==========================================
  private mapearCompraMSI(data: any): CompraMSI {
    return {
      id: data.id,
      user_id: data.user_id,
      concepto: data.concepto,
      monto_total: Number(data.monto_total),
      meses_total: data.meses_total,
      meses_restantes: data.meses_restantes,
      pago_mensual: Number(data.pago_mensual),
      fecha_compra: data.fecha_compra,
      categoria_id: data.categoria_id,
      metodo_pago: data.metodo_pago,
      notas: data.notas,
      liquidada: data.liquidada,
      fecha_liquidacion: data.fecha_liquidacion,
      created_at: data.created_at,
      updated_at: data.updated_at,
      categoria: this.mapearCategoria(data.categorias)
    };
  }

  // ==========================================
  // OBTENER TODAS LAS COMPRAS MSI
  // ==========================================
  async obtenerComprasMSI(opciones?: { incluirLiquidadas?: boolean }): Promise<CompraMSI[]> {
    const userId = await this.obtenerUserId();

    let query = this.supabase
      .schema('GastoFacil')
      .from('compras_msi')
      .select(`
        id,
        user_id,
        concepto,
        monto_total,
        meses_total,
        meses_restantes,
        pago_mensual,
        fecha_compra,
        categoria_id,
        metodo_pago,
        notas,
        liquidada,
        fecha_liquidacion,
        created_at,
        updated_at,
        categorias!left (
          nombre,
          icono,
          color,
          activa
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!opciones?.incluirLiquidadas) {
      query = query.eq('liquidada', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data ?? []).map((item) => this.mapearCompraMSI(item));
  }

  // ==========================================
  // OBTENER COMPRA MSI POR ID
  // ==========================================
  async obtenerCompraMSI(id: number): Promise<CompraMSI> {
    const userId = await this.obtenerUserId();

    const { data, error } = await this.supabase
      .schema('GastoFacil')
      .from('compras_msi')
      .select(`
        id,
        user_id,
        concepto,
        monto_total,
        meses_total,
        meses_restantes,
        pago_mensual,
        fecha_compra,
        categoria_id,
        metodo_pago,
        notas,
        liquidada,
        fecha_liquidacion,
        created_at,
        updated_at,
        categorias!left (
          nombre,
          icono,
          color,
          activa
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Compra MSI no encontrada');

    return this.mapearCompraMSI(data);
  }

  // ==========================================
  // CREAR COMPRA MSI
  // ==========================================
  async crearCompraMSI(compra: CrearCompraMSI): Promise<CompraMSI> {
    const userId = await this.obtenerUserId();
    const pagoMensual = Number((compra.monto_total / compra.meses_total).toFixed(2));

    const { data, error } = await this.supabase
      .schema('GastoFacil')
      .from('compras_msi')
      .insert({
        user_id: userId,
        concepto: compra.concepto,
        monto_total: compra.monto_total,
        meses_total: compra.meses_total,
        meses_restantes: compra.meses_total,
        pago_mensual: pagoMensual,
        fecha_compra: compra.fecha_compra,
        categoria_id: compra.categoria_id,
        metodo_pago: compra.metodo_pago || 'Tarjeta',
        notas: compra.notas || null,
        liquidada: false,
        fecha_liquidacion: null
      })
      .select(`
        id,
        user_id,
        concepto,
        monto_total,
        meses_total,
        meses_restantes,
        pago_mensual,
        fecha_compra,
        categoria_id,
        metodo_pago,
        notas,
        liquidada,
        fecha_liquidacion,
        created_at,
        updated_at,
        categorias!left (
          nombre,
          icono,
          color,
          activa
        )
      `)
      .single();

    if (error) throw error;

    await this.crearGastoMensual(data.id, 1);

    return this.mapearCompraMSI(data);
  }

  // ==========================================
  // ACTUALIZAR COMPRA MSI
  // ==========================================
  async actualizarCompraMSI(id: number, cambios: ActualizarCompraMSI): Promise<CompraMSI> {
    const userId = await this.obtenerUserId();

    if (cambios.monto_total !== undefined || cambios.meses_total !== undefined) {
      const compraActual = await this.obtenerCompraMSI(id);
      const monto = cambios.monto_total ?? compraActual.monto_total;
      const meses = cambios.meses_total ?? compraActual.meses_total;
      cambios.pago_mensual = Number((monto / meses).toFixed(2));
      
      if (cambios.meses_total !== undefined) {
        cambios.meses_restantes = cambios.meses_total;
      }
    }

    const { data, error } = await this.supabase
      .schema('GastoFacil')
      .from('compras_msi')
      .update(cambios)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        id,
        user_id,
        concepto,
        monto_total,
        meses_total,
        meses_restantes,
        pago_mensual,
        fecha_compra,
        categoria_id,
        metodo_pago,
        notas,
        liquidada,
        fecha_liquidacion,
        created_at,
        updated_at,
        categorias!left (
          nombre,
          icono,
          color,
          activa
        )
      `)
      .single();

    if (error) throw error;

    return this.mapearCompraMSI(data);
  }

  // ==========================================
  // ELIMINAR COMPRA MSI
  // ==========================================
  async eliminarCompraMSI(id: number): Promise<void> {
    const userId = await this.obtenerUserId();
    await this.eliminarGastosMensuales(id);

    const { error } = await this.supabase
      .schema('GastoFacil')
      .from('compras_msi')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // ==========================================
  // LIQUIDAR COMPRA MSI
  // ==========================================
  async liquidarCompraMSI(id: number, fechaLiquidacion: string): Promise<CompraMSI> {
    const userId = await this.obtenerUserId();
    const compra = await this.obtenerCompraMSI(id);

    await this.gastosService.crearGasto({
      concepto: `Liquidación MSI: ${compra.concepto}`,
      monto: compra.monto_total,
      fecha: fechaLiquidacion,
      categoria_id: compra.categoria_id,
      metodo_pago: compra.metodo_pago,
      notas: `Liquidación anticipada de compra a MSI. Originalmente ${compra.meses_total} meses.`
    });

    await this.eliminarGastosMensuales(id);

    const { data, error } = await this.supabase
      .schema('GastoFacil')
      .from('compras_msi')
      .update({
        liquidada: true,
        fecha_liquidacion: fechaLiquidacion,
        meses_restantes: 0
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        id,
        user_id,
        concepto,
        monto_total,
        meses_total,
        meses_restantes,
        pago_mensual,
        fecha_compra,
        categoria_id,
        metodo_pago,
        notas,
        liquidada,
        fecha_liquidacion,
        created_at,
        updated_at,
        categorias!left (
          nombre,
          icono,
          color,
          activa
        )
      `)
      .single();

    if (error) throw error;

    return this.mapearCompraMSI(data);
  }

  // ==========================================
  // CREAR GASTO MENSUAL
  // ==========================================
  private async crearGastoMensual(compraId: number, mesNumero: number): Promise<void> {
    const compra = await this.obtenerCompraMSI(compraId);

    const fechaCompra = new Date(compra.fecha_compra);
    const fechaPago = new Date(fechaCompra);
    fechaPago.setMonth(fechaPago.getMonth() + mesNumero);

    const fechaStr = fechaPago.toISOString().split('T')[0];

    await this.gastosService.crearGasto({
      concepto: `MSI: ${compra.concepto} (${mesNumero}/${compra.meses_total})`,
      monto: compra.pago_mensual,
      fecha: fechaStr,
      categoria_id: compra.categoria_id,
      metodo_pago: compra.metodo_pago,
      notas: `Pago ${mesNumero} de ${compra.meses_total} de "${compra.concepto}"`
    });
  }

  // ==========================================
  // ELIMINAR GASTOS MENSUALES
  // ==========================================
  private async eliminarGastosMensuales(compraId: number): Promise<void> {
    const userId = await this.obtenerUserId();
    const compra = await this.obtenerCompraMSI(compraId);

    const { data, error } = await this.supabase
      .schema('GastoFacil')
      .from('gastos')
      .select('id')
      .eq('user_id', userId)
      .ilike('concepto', `MSI: ${compra.concepto}%`);

    if (error) throw error;

    for (const gasto of data || []) {
      await this.gastosService.eliminarGasto(gasto.id);
    }
  }

  // ==========================================
  // OBTENER PAGOS MENSUALES
  // ==========================================
  async obtenerPagosMensuales(fechaInicio: Date, fechaFin: Date): Promise<PagoMSIMensual[]> {
    const compras = await this.obtenerComprasMSI({ incluirLiquidadas: false });

    const pagos: PagoMSIMensual[] = [];

    for (const compra of compras) {
      const fechaCompra = new Date(compra.fecha_compra);
      
      for (let i = 1; i <= compra.meses_restantes; i++) {
        const fechaPago = new Date(fechaCompra);
        fechaPago.setMonth(fechaPago.getMonth() + i);

        if (fechaPago >= fechaInicio && fechaPago <= fechaFin) {
          pagos.push({
            fecha: fechaPago.toISOString().split('T')[0],
            monto: compra.pago_mensual,
            compra_id: compra.id,
            concepto: compra.concepto,
            mes_numero: i
          });
        }
      }
    }

    return pagos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  // ==========================================
  // CALCULAR PROMEDIO GASTOS MENSUALES
  // ==========================================
  async calcularPromedioGastosMensuales(): Promise<number> {
    const userId = await this.obtenerUserId();
    const hoy = new Date();
    const mesesMaximos = 6;

    const { data, error } = await this.supabase
      .schema('GastoFacil')
      .from('gastos')
      .select('monto, fecha')
      .eq('user_id', userId)
      .gte('fecha', new Date(hoy.getFullYear(), hoy.getMonth() - mesesMaximos, 1).toISOString())
      .order('fecha', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) return 0;

    const mesesMap = new Map<string, number>();
    
    for (const gasto of data) {
      const fecha = new Date(gasto.fecha);
      const key = `${fecha.getFullYear()}-${fecha.getMonth()}`;
      const total = mesesMap.get(key) || 0;
      mesesMap.set(key, total + gasto.monto);
    }

    const totalMeses = mesesMap.size;
    if (totalMeses === 0) return 0;

    let sumaTotal = 0;
    for (const total of mesesMap.values()) {
      sumaTotal += total;
    }

    return Number((sumaTotal / totalMeses).toFixed(2));
  }

  // ==========================================
  // CALCULAR SIMULACIÓN
  // ==========================================
  async calcularSimulacionMSI(montoTotal: number, meses: number): Promise<{
    pagoMensual: number;
    promedioGastos: number;
    totalMensual: number;
  }> {
    const pagoMensual = Number((montoTotal / meses).toFixed(2));
    const promedioGastos = await this.calcularPromedioGastosMensuales();
    const totalMensual = Number((promedioGastos + pagoMensual).toFixed(2));

    return {
      pagoMensual,
      promedioGastos,
      totalMensual
    };
  }
}