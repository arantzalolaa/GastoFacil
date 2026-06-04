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
    const { data, error } = await this.supabase
      .schema('GastoFacil')
      .from('gastos')
      .insert(gasto)
      .select('id,categoria,concepto,monto,fecha,metodo_pago,notas')
      .single();

    if (error) {
      throw error;
    }

    return this.mapearGasto(data as GastoRow);
  }

  private mapearGasto(gasto: GastoRow): Gasto {
    return {
      ...gasto,
      monto: Number(gasto.monto),
    };
  }
}
