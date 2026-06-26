import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Categoria {
  id: number;
  user_id: string | null;
  nombre: string;
  icono: string | null;
  color: string | null;
  es_default: boolean;
  activa: boolean;
  created_at: string;
}

export interface CategoriaForm {
  nombre: string;
  icono: string;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async obtenerCategorias(opciones: { incluirInactivas?: boolean } = {}): Promise<Categoria[]> {
    const userId = await this.obtenerUserId();

    let query = this.supabase
      .schema('GastoFacil')
      .from('categorias')
      .select('id,user_id,nombre,icono,color,es_default,activa,created_at')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('nombre', { ascending: true });

    if (!opciones.incluirInactivas) {
      query = query.eq('activa', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data ?? [];
  }

  async crearCategoria(categoria: CategoriaForm): Promise<void> {
    const userId = await this.obtenerUserId();
    const nombre = categoria.nombre.trim();

    if (!nombre) {
      throw new Error('Ingresa un nombre para la categoría.');
    }

    const categoriaExistente = await this.buscarCategoriaPorNombre(userId, nombre);

    if (categoriaExistente && !categoriaExistente.activa) {
      // Reactivar categoría existente
      const { error } = await this.supabase
        .schema('GastoFacil')
        .from('categorias')
        .update({
          nombre,
          icono: categoria.icono,
          color: categoria.color,
          activa: true,
        })
        .eq('id', categoriaExistente.id);

      if (error) throw error;
      return;
    }

    if (categoriaExistente?.activa) {
      throw new Error('Ya existe una categoría con ese nombre.');
    }

    const { error } = await this.supabase
      .schema('GastoFacil')
      .from('categorias')
      .insert({
        user_id: userId,
        nombre,
        icono: categoria.icono,
        color: categoria.color,
        es_default: false,
        activa: true,
      });

    if (error) throw error;
  }

  async editarCategoria(id: number, categoria: CategoriaForm): Promise<void> {
    const userId = await this.obtenerUserId();
    const nombre = categoria.nombre.trim();

    if (!nombre) {
      throw new Error('Ingresa un nombre para la categoría.');
    }

    // Buscar duplicados excluyendo la categoría actual
    const categoriaDuplicada = await this.buscarCategoriaPorNombre(userId, nombre, id);

    if (categoriaDuplicada) {
      throw new Error('Ya existe otra categoría con ese nombre.');
    }

    // IMPORTANTE: Quitar el filtro .eq('activa', true) para poder editar categorías inactivas
    const { error } = await this.supabase
      .schema('GastoFacil')
      .from('categorias')
      .update({
        nombre,
        icono: categoria.icono,
        color: categoria.color,
        // NO actualizamos activa aquí, solo nombre/icono/color
      })
      .eq('id', id);
      // ELIMINADO: .eq('activa', true)

    if (error) throw error;
  }

  // Método específico para reactivar categorías
  async reactivarCategoria(id: number, categoria: CategoriaForm): Promise<void> {
    const userId = await this.obtenerUserId();
    const nombre = categoria.nombre.trim();

    if (!nombre) {
      throw new Error('Ingresa un nombre para la categoría.');
    }

    // Verificar que no exista otra categoría activa con el mismo nombre
    const categoriaDuplicada = await this.buscarCategoriaPorNombre(userId, nombre, id);

    if (categoriaDuplicada && categoriaDuplicada.activa) {
      throw new Error('Ya existe una categoría activa con ese nombre.');
    }

    // Reactivar la categoría - actualizamos todo incluyendo activa = true
    const { error } = await this.supabase
      .schema('GastoFacil')
      .from('categorias')
      .update({
        nombre,
        icono: categoria.icono,
        color: categoria.color,
        activa: true, // <--- Esto es lo importante
      })
      .eq('id', id);

    if (error) throw error;
  }

  async eliminarCategoria(id: number): Promise<void> {
    const { error } = await this.supabase
      .schema('GastoFacil')
      .from('categorias')
      .update({
        activa: false,
      })
      .eq('id', id);

    if (error) throw error;
  }

  private async buscarCategoriaPorNombre(
    userId: string,
    nombre: string,
    excluirId?: number
  ): Promise<Categoria | null> {
    const nombreNormalizado = this.normalizarNombre(nombre);

    let query = this.supabase
      .schema('GastoFacil')
      .from('categorias')
      .select('id,user_id,nombre,icono,color,es_default,activa,created_at')
      .or(`user_id.eq.${userId},user_id.is.null`);

    if (excluirId !== undefined) {
      query = query.neq('id', excluirId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data ?? []).find((cat) => this.normalizarNombre(cat.nombre) === nombreNormalizado) ?? null;
  }

  private normalizarNombre(nombre: string): string {
    return nombre.trim().toLowerCase();
  }

  private async obtenerUserId(): Promise<string> {
    const { data, error } = await this.supabase.auth.getUser();

    if (error || !data.user) {
      throw new Error('No hay usuario activo.');
    }

    return data.user.id;
  }
}