import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  ellipsisVerticalOutline,
  homeOutline,
  notificationsOutline,
  personCircleOutline,
  qrCodeOutline,
  searchOutline,
  walletOutline,
} from 'ionicons/icons';
import { filter } from 'rxjs';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
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
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  ocultarHeaderGlobal = false;
  mostrarAccionesGastos = false;
  mostrarTextoEscanear = false;

  private readonly router = inject(Router);

  constructor() {
    addIcons({
      barChartOutline,
      ellipsisVerticalOutline,
      homeOutline,
      notificationsOutline,
      personCircleOutline,
      qrCodeOutline,
      searchOutline,
      walletOutline,
    });

    this.actualizarVisibilidadHeader(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.actualizarVisibilidadHeader(event.urlAfterRedirects));
  }

  private actualizarVisibilidadHeader(url: string): void {
    this.ocultarHeaderGlobal = url.includes('/nuevo-gasto');
    this.mostrarAccionesGastos = url.includes('/gastos');
    this.mostrarTextoEscanear = url.includes('/escanear');
  }
}