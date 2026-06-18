import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  arrowForward,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
  personAddOutline,
  personOutline,
  walletOutline,
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonIcon],
})
export class RegistroPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  nombre = '';
  email = '';
  password = '';
  confirmarPassword = '';
  mostrarPassword = false;
  mostrarConfirmarPassword = false;
  cargando = false;

  constructor() {
    addIcons({
      arrowBackOutline,
      arrowForward,
      eyeOffOutline,
      eyeOutline,
      lockClosedOutline,
      mailOutline,
      personAddOutline,
      personOutline,
      walletOutline,
    });
  }

  alternarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  alternarConfirmarPassword(): void {
    this.mostrarConfirmarPassword = !this.mostrarConfirmarPassword;
  }

  regresarLogin(): void {
  this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  async registrarUsuario(): Promise<void> {
    const nombreLimpio = this.nombre.trim();
    const emailLimpio = this.email.trim().toLowerCase();

    if (!nombreLimpio || !emailLimpio || !this.password || !this.confirmarPassword) {
      await this.mostrarToast('Completa todos los campos.', 'warning');
      return;
    }

    if (this.password.length < 6) {
      await this.mostrarToast('La contraseña debe tener mínimo 6 caracteres.', 'warning');
      return;
    }

    if (this.password !== this.confirmarPassword) {
      await this.mostrarToast('Las contraseñas no coinciden.', 'warning');
      return;
    }

    try {
      this.cargando = true;

      const sesion = await this.authService.registrarUsuario({
        nombre: nombreLimpio,
        email: emailLimpio,
        password: this.password,
      });

      if (sesion) {
        await this.mostrarToast('Cuenta creada correctamente.', 'success');
        await this.router.navigateByUrl('/inicio', { replaceUrl: true });
        return;
      }

      await this.mostrarToast('Cuenta creada. Revisa tu correo para confirmar.', 'success');
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      await this.mostrarToast('No se pudo crear la cuenta. Intenta con otro correo.', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  private async mostrarToast(
    mensaje: string,
    color: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2400,
      position: 'top',
      color,
    });

    await toast.present();
  }
}