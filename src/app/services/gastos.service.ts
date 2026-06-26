// src/app/services/gastos.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface CategoriaGasto {
  nombre: string;
  icono: string | null;
  color: string | null;
  activa: boolean;
}

export interface Gasto {
  id: number;
  categoria_id: number | null;
  categoria?: CategoriaGasto | null;
  concepto: string;
  monto: number;
  fecha: string;
  metodo_pago: string;
  notas: string | null;
}

export type NuevoGasto = Omit<Gasto, 'id' | 'categoria'>;
export type ActualizarGasto = Partial<NuevoGasto>;

interface GastoRow {
  id: number;
  categoria_id: number | null;
  concepto: string;
  monto: number | string;
  fecha: string;
  metodo_pago: string;
  notas: string | null;
  categorias: CategoriaGasto | CategoriaGasto[] | null;
}

@Injectable({ providedIn: 'root' })
export class GastosService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // ==========================================
  // OBTENER USER ID (NUEVO)
  // ==========================================
  private async obtenerUserId(): Promise<string> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error || !data.user) {
      throw new Error('No hay usuario activo.');
    }
    return data.user.id;
  }

  // ==========================================
  // OBTENER TODOS LOS GASTOS
  // ==========================================
  async obtenerGastos(): Promise<Gasto[]> {
    const { data, error } = await this.supabase
      .schema('GastoFacil')
      .from('gastos')
      .select(`
        id,
        categoria_id,
        concepto,
        monto,
        fecha,
        metodo_pago,
        notas,
        categorias (
          nombre,
          icono,
          color,
          activa
        )
      `)
      .order('fecha', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((gasto) => this.mapearGasto(gasto as unknown as GastoRow));
  }

  // ==========================================
  // OBTENER GASTOS POR MES (NUEVO PARA MSI)
  // ==========================================
  async obtenerGastosPorMes(anio: number, mes: number): Promise<Gasto[]> {
    const userId = await this.obtenerUserId();
    const fechaInicio = new Date(anio, mes, 1);
    const fechaFin = new Date(anio, mes + 1, 0);

    const { data, error } = await this.supabase
      .schema('GastoFacil')
      .from('gastos')
      .select(`
        id,
        categoria_id,
        concepto,
        monto,
        fecha,
        metodo_pago,
        notas,
        categorias (
          nombre,
          icono,
          color,
          activa
        )
      `)
      .eq('user_id', userId)
      .gte('fecha', fechaInicio.toISOString())
      .lte('fecha', fechaFin.toISOString())
      .order('fecha', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((gasto) => this.mapearGasto(gasto as unknown as GastoRow));
  }

  // ==========================================
  // OBTENER MESES CON GASTOS (NUEVO PARA MSI)
  // ==========================================
  async obtenerMesesConGastos(): Promise<{ anio: number; mes: number }[]> {
    const userId = await this.obtenerUserId();
    const hoy = new Date();
    
    const { data: gastosData, error: gastosError } = await this.supabase
      .schema('GastoFacil')
      .from('gastos')
      .select('fecha')
      .eq('user_id', userId)
      .lte('fecha', hoy.toISOString());

    if (gastosError) throw gastosError;

    const mesesSet = new Set<string>();

    for (const gasto of gastosData || []) {
      const fecha = new Date(gasto.fecha);
      mesesSet.add(`${fecha.getFullYear()}-${fecha.getMonth()}`);
    }

    return Array.from(mesesSet).map((key) => {
      const [anio, mes] = key.split('-').map(Number);
      return { anio, mes };
    }).sort((a, b) => a.anio - b.anio || a.mes - b.mes);
  }

  // ==========================================
  // CREAR GASTO
  // ==========================================
  async crearGasto(gasto: {
    concepto: string;
    monto: number;
    fecha: string;
    categoria_id: number | null;
    metodo_pago: string;
    notas: string | null;
  }): Promise<Gasto> {
    const {
      data: { user },
      error: userError,
    } = await this.supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('No hay usuario autenticado.');
    }

    const { data, error } = await this.supabase
      .schema('GastoFacil')
      .from('gastos')
      .insert({
        ...gasto,
        user_id: user.id,
      })
      .select(`
        id,
        categoria_id,
        concepto,
        monto,
        fecha,
        metodo_pago,
        notas,
        categorias (
          nombre,
          icono,
          color,
          activa
        )
      `)
      .single();

    if (error) throw error;

    return this.mapearGasto(data as unknown as GastoRow);
  }

  // ==========================================
  // ACTUALIZAR GASTO
  // ==========================================
  async actualizarGasto(id: number, cambios: ActualizarGasto): Promise<Gasto> {
    const { data, error } = await this.supabase
      .schema('GastoFacil')
      .from('gastos')
      .update(cambios)
      .eq('id', id)
      .select(`
        id,
        categoria_id,
        concepto,
        monto,
        fecha,
        metodo_pago,
        notas,
        categorias (
          nombre,
          icono,
          color,
          activa
        )
      `)
      .single();

    if (error) throw error;

    return this.mapearGasto(data as unknown as GastoRow);
  }

  // ==========================================
  // ELIMINAR GASTO
  // ==========================================
  async eliminarGasto(id: number): Promise<void> {
    const { error } = await this.supabase
      .schema('GastoFacil')
      .from('gastos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==========================================
  // MAPEAR GASTO (PRIVADO)
  // ==========================================
  private mapearGasto(gasto: GastoRow): Gasto {
    const categoria = Array.isArray(gasto.categorias)
      ? gasto.categorias[0] ?? null
      : gasto.categorias;

    return {
      id: gasto.id,
      categoria_id: gasto.categoria_id,
      categoria,
      concepto: gasto.concepto,
      monto: Number(gasto.monto),
      fecha: gasto.fecha,
      metodo_pago: gasto.metodo_pago,
      notas: gasto.notas,
    };
  }
}