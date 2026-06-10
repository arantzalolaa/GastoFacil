import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, image, sparkles, trash } from 'ionicons/icons';
import { AnalisisTicketService } from '../services/analisis-ticket.service';

@Component({
  selector: 'app-escanear',
  templateUrl: 'escanear.page.html',
  styleUrls: ['escanear.page.scss'],
  imports: [CommonModule, IonContent, IonIcon],
})
export class EscanearPage implements OnDestroy {
  // Referencias a los elementos HTML
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private stream: MediaStream | null = null;
  private readonly analisisService = inject(AnalisisTicketService);

  capturaReciente = false;
  nombreCaptura = '';
  imagenRuta = ''; 

  constructor() {
    addIcons({ camera, image, sparkles, trash });
  }

  // Encender la cámara al entrar a la vista
  ionViewDidEnter(): void {
    void this.iniciarCamara();
  }

  // Apagar la cámara al salir de la vista para no gastar batería
  ionViewWillLeave(): void {
    this.detenerCamara();
  }

  ngOnDestroy(): void {
    this.detenerCamara();
  }

  private async iniciarCamara(): Promise<void> {
    try {
      // Solicita acceso a la cámara (preferiblemente la trasera en móviles)
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (this.videoElement && this.videoElement.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
    }
  }

  private detenerCamara(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  tomarFoto(): void {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    
    // Ajustar el canvas a las dimensiones reales del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      // Capturar el fotograma actual
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convertirlo a imagen Base64
      this.imagenRuta = canvas.toDataURL('image/jpeg', 0.9);
      this.nombreCaptura = `Ticket_${new Date().getTime()}.jpg`;
      this.capturaReciente = true;
      
      // Opcional: Detener la cámara tras tomar la foto
      this.detenerCamara(); 
    }
  }

  abrirGaleria(): void {
    // Simula un clic en el input de tipo archivo oculto
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
        this.detenerCamara(); // Detenemos el video en vivo
      };
      
      reader.readAsDataURL(file);
    }
  }

  eliminarCaptura(): void {
    this.capturaReciente = false;
    this.imagenRuta = '';
    this.nombreCaptura = '';
    // Volver a encender el escáner
    void this.iniciarCamara();
  }

  analizarConIA(): void {
    if (!this.capturaReciente || !this.imagenRuta) return;
    
    // Guardar el Base64 en el servicio
    this.analisisService.setImagen(this.imagenRuta);
    
    this.router.navigate(['/confirmar-gasto']);
  }
}