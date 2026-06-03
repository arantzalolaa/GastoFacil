import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, imageOutline, sparkles, trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-escanear',
  templateUrl: 'escanear.page.html',
  styleUrls: ['escanear.page.scss'],
  imports: [CommonModule, IonButton, IonContent, IonIcon],
})
export class EscanearPage {
  private readonly router = inject(Router);

  capturaReciente = true;
  nombreCaptura = 'Ticket_20231024_123.jpg';

  constructor() {
    addIcons({ cameraOutline, imageOutline, sparkles, trashOutline });
  }

  tomarFoto(): void {
    this.capturaReciente = true;
  }

  abrirGaleria(): void {
    this.capturaReciente = true;
  }

  eliminarCaptura(): void {
    this.capturaReciente = false;
  }

  analizarConIA(): void {
    if (!this.capturaReciente) {
      return;
    }

    this.router.navigate(['/confirmar-gasto']);
  }
}