import { Injectable } from '@angular/core';
import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface RegistroUsuario {
  nombre: string;
  email: string;
  password: string;
}

export interface LoginUsuario {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async iniciarSesion(credenciales: LoginUsuario): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: credenciales.email,
      password: credenciales.password,
    });

    if (error) {
      throw error;
    }

    return data.session;
  }

  async registrarUsuario(usuario: RegistroUsuario): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.signUp({
      email: usuario.email,
      password: usuario.password,
      options: {
        data: {
          nombre: usuario.nombre,
        },
      },
    });

    if (error) {
      throw error;
    }

    return data.session;
  }

  async cerrarSesion(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async obtenerSesion(): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  }

  async obtenerUsuario(): Promise<User | null> {
    const { data, error } = await this.supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user;
  }

  async estaAutenticado(): Promise<boolean> {
    const sesion = await this.obtenerSesion();
    return !!sesion;
  }
}