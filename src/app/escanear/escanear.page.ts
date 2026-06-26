import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ToastController, IonHeader, IonToolbar, IonButtons, IonTitle, IonBackButton } from '@ionic/angular/standalone';
import { AnalisisTicketService } from '../services/analisis-ticket.service';

@Component({
  selector: 'app-escanear',
  templateUrl: 'escanear.page.html',
  styleUrls: ['escanear.page.scss'],
  imports: [IonButtons, IonToolbar, IonHeader, CommonModule, IonContent, IonIcon, IonTitle, IonBackButton],
})
export class EscanearPage implements OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private stream: MediaStream | null = null;
  private readonly analisisService = inject(AnalisisTicketService);

  capturaReciente = false;
  nombreCaptura = '';
  imagenRuta = '';
  analizando = false;

  constructor() {}

  ionViewDidEnter(): void {
    void this.iniciarCamara();
  }

  // 🔴 IMPORTANTE: Al salir de la vista, detener la cámara
  ionViewWillLeave(): void {
    this.detenerCamara();
  }

  // 🔴 IMPORTANTE: Al destruir el componente, detener la cámara
  ngOnDestroy(): void {
    this.detenerCamara();
  }

  private async iniciarCamara(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (this.videoElement && this.videoElement.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      await this.mostrarToast('No se pudo acceder a la cámara.', 'warning');
    }
  }

  private detenerCamara(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    // Limpiar el video element
    if (this.videoElement && this.videoElement.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }

  tomarFoto(): void {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      this.imagenRuta = canvas.toDataURL('image/jpeg', 0.9);
      this.nombreCaptura = `Ticket_${new Date().getTime()}.jpg`;
      this.capturaReciente = true;
      
      this.detenerCamara();
    }
  }

  abrirGaleria(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  cargarDesdeGaleria(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        this.imagenRuta = e.target?.result as string;
        this.nombreCaptura = file.name;
        this.capturaReciente = true;
        this.detenerCamara();
      };
      
      reader.readAsDataURL(file);
    }
  }

  eliminarCaptura(): void {
    this.capturaReciente = false;
    this.imagenRuta = '';
    this.nombreCaptura = '';
    void this.iniciarCamara();
  }

  async analizarConIA(): Promise<void> {
    if (!this.capturaReciente || !this.imagenRuta) return;
    
    this.analizando = true;
    
    try {
      this.analisisService.setImagen(this.imagenRuta);
      
      const resultado = await this.analisisService.analizarTicket();
      
      if (!resultado || !resultado.monto || resultado.monto === 0) {
        await this.mostrarToast('No se pudo analizar el ticket correctamente. Intenta con otra imagen.', 'danger');
        this.analizando = false;
        return;
      }
      
      await this.router.navigate(['/confirmar-gasto']);
    } catch (error) {
      console.error('Error al analizar con IA:', error);
      await this.mostrarToast('Error al analizar el ticket. Intenta nuevamente.', 'danger');
      this.analizando = false;
    }
  }

  private async mostrarToast(
    mensaje: string,
    color: 'success' | 'warning' | 'danger' = 'success'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
      color
    });

    await toast.present();
  }
}