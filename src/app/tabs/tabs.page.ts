import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChart,
  home,
  logOutOutline,
  notificationsOutline,
  personCircleOutline,
  qrCode,
  wallet,
} from 'ionicons/icons';
import { filter } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonButtons,
    IonHeader,
    IonIcon,
    IonLabel,
    IonTabBar,
    IonTabButton,
    IonTabs,
    IonToolbar,
  ],
})
export class TabsPage implements OnInit {
  public environmentInjector = inject(EnvironmentInjector);

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  ocultarHeaderGlobal = false;

  mostrarPerfil = false;
  nombreUsuario = '';
  correoUsuario = '';

  constructor() {
    addIcons({
      barChart,
      home,
      logOutOutline,
      notificationsOutline,
      personCircleOutline,
      qrCode,
      wallet,
    });

    this.actualizarVisibilidadHeader(this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.actualizarVisibilidadHeader(event.urlAfterRedirects);
        this.mostrarPerfil = false;
      });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarPerfilUsuario();
  }

  alternarPerfil(): void {
    this.mostrarPerfil = !this.mostrarPerfil;
  }

  async confirmarCerrarSesion(): Promise<void> {
    this.mostrarPerfil = false;

    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: '¿Seguro que quieres cerrar tu sesión?',
      cssClass: 'logout-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: () => {
            void this.cerrarSesion();
          },
        },
      ],
    });

    await alert.present();
  }

  private async cargarPerfilUsuario(): Promise<void> {
    try {
      const usuario = await this.authService.obtenerUsuario();

      this.correoUsuario = usuario?.email ?? '';

      this.nombreUsuario =
        usuario?.user_metadata?.['nombre'] ||
        usuario?.user_metadata?.['name'] ||
        usuario?.email?.split('@')[0] ||
        'Usuario';
    } catch (error) {
      console.error('No se pudo cargar el perfil:', error);

      this.nombreUsuario = 'Usuario';
      this.correoUsuario = '';
    }
  }

  private async cerrarSesion(): Promise<void> {
    try {
      this.mostrarPerfil = false;

      await this.authService.cerrarSesion();

      const toast = await this.toastController.create({
        message: 'Sesión cerrada correctamente.',
        duration: 1800,
        position: 'top',
        color: 'success',
      });

      await toast.present();
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);

      const toast = await this.toastController.create({
        message: 'No se pudo cerrar sesión. Intenta de nuevo.',
        duration: 2200,
        position: 'top',
        color: 'danger',
      });

      await toast.present();
    }
  }

  private actualizarVisibilidadHeader(url: string): void {
    this.ocultarHeaderGlobal = url.includes('/nuevo-gasto');

    if (this.ocultarHeaderGlobal) {
      this.mostrarPerfil = false;
    }
  }
}