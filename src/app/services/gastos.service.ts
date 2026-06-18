import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Gasto {
  id: number;
  categoria: string;
  concepto: string;
  monto: number;
  fecha: string;
  metodo_pago: string;
  notas: string | null;
}

export type NuevoGasto = Omit<Gasto, 'id'>;
export type ActualizarGasto = Partial<NuevoGasto>;

interface GastoRow {
  id: number;
  categoria: string;
  concepto: string;
  monto: number | string;
  fecha: string;
  metodo_pago: string;
  notas: string | null;
}

@Injectable({ providedIn: 'root' })
export class GastosService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async obtenerGastos(): Promise<Gasto[]> {
    const { data, error } = await this.supabase
      .schema('GastoFacil')
      .from('gastos')
      .select('id,categoria,concepto,monto,fecha,metodo_pago,notas')
      .order('fecha', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((gasto) => this.mapearGasto(gasto as GastoRow));
  }

  async crearGasto(gasto: NuevoGasto): Promise<Gasto> {
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
      .select('id,categoria,concepto,monto,fecha,metodo_pago,notas')
      .single();

    if (error) {
      throw error;
    }

    return this.mapearGasto(data as GastoRow);
  }

  async actualizarGasto(id: number, cambios: ActualizarGasto): Promise<Gasto> {
    const { data, error } = await this.supabase
      .schema('GastoFacil')
      .from('gastos')
      .update(cambios)
      .eq('id', id)
      .select('id,categoria,concepto,monto,fecha,metodo_pago,notas')
      .single();

    if (error) {
      throw error;
    }

    return this.mapearGasto(data as GastoRow);
  }

  async eliminarGasto(id: number): Promise<void> {
    const { error } = await this.supabase
      .schema('GastoFacil')
      .from('gastos')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  private mapearGasto(gasto: GastoRow): Gasto {
    return {
      ...gasto,
      monto: Number(gasto.monto),
    };
  }
}