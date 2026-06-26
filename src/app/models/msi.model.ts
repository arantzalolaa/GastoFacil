// src/app/models/msi.model.ts

export interface CompraMSI {
  id: number;
  user_id: string;
  concepto: string;
  monto_total: number;
  meses_total: number;
  meses_restantes: number;
  pago_mensual: number;
  fecha_compra: string;
  categoria_id: number | null;
  metodo_pago: string;
  notas: string | null;
  liquidada: boolean;
  fecha_liquidacion: string | null;
  created_at: string;
  updated_at: string;
  // ✅ Cambiar de undefined a null para que coincida con el mapeo
  categoria?: {
    nombre: string;
    icono: string | null;
    color: string | null;
    activa: boolean;
  } | null;
}

export interface CrearCompraMSI {
  concepto: string;
  monto_total: number;
  meses_total: number;
  fecha_compra: string;
  categoria_id: number | null;
  metodo_pago?: string;
  notas?: string | null;
}

export interface ActualizarCompraMSI {
  concepto?: string;
  monto_total?: number;
  meses_total?: number;
  meses_restantes?: number;
  pago_mensual?: number;
  categoria_id?: number | null;
  metodo_pago?: string;
  notas?: string | null;
  liquidada?: boolean;
  fecha_liquidacion?: string | null;
}

export interface PagoMSIMensual {
  fecha: string;
  monto: number;
  compra_id: number;
  concepto: string;
  mes_numero: number;
}