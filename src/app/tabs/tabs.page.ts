import { Component, EnvironmentInjector, inject } from '@angular/core';
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

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [
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

  constructor() {
    addIcons({
      barChartOutline,
      homeOutline,
      notificationsOutline,
      personCircleOutline,
      qrCodeOutline,
      walletOutline,
    });
  }
}
