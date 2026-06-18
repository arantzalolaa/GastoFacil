import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForward,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
  walletOutline,
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, RouterLink, IonContent, IonIcon],
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  email = '';
  password = '';
  mostrarPassword = false;
  cargando = false;

  constructor() {
    addIcons({
      arrowForward,
      eyeOffOutline,
      eyeOutline,
      lockClosedOutline,
      mailOutline,
      walletOutline,
    });
  }

  async ionViewWillEnter(): Promise<void> {
    const sesion = await this.authService.obtenerSesion();

    if (sesion) {
      await this.router.navigateByUrl('/inicio', { replaceUrl: true });
    }
  }

  alternarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  async iniciarSesion(): Promise<void> {
    const emailLimpio = this.email.trim().toLowerCase();

    if (!emailLimpio || !this.password) {
      await this.mostrarToast('Completa tu correo y contraseña.', 'warning');
      return;
    }

    try {
      this.cargando = true;

      await this.authService.iniciarSesion({
        email: emailLimpio,
        password: this.password,
      });

      await this.mostrarToast('Bienvenida a GastoFácil.', 'success');
      await this.router.navigateByUrl('/inicio', { replaceUrl: true });
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      await this.mostrarToast('Correo o contraseña incorrectos.', 'danger');
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
      duration: 2200,
      position: 'top',
      color,
    });

    await toast.present();
  }
}