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
  homeOutline,
  notificationsOutline,
  personCircleOutline,
  qrCodeOutline,
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
  private readonly router = inject(Router);

  constructor() {
    addIcons({
      barChartOutline,
      homeOutline,
      notificationsOutline,
      personCircleOutline,
      qrCodeOutline,
      walletOutline,
    });

    this.actualizarVisibilidadHeader(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.actualizarVisibilidadHeader(event.urlAfterRedirects));
  }

  private actualizarVisibilidadHeader(url: string): void {
    this.ocultarHeaderGlobal = url.includes('/nuevo-gasto');
  }
}