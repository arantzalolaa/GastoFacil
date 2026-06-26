import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { APP_INITIALIZER } from '@angular/core';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

// Importar el servicio de iconos
import { IconosService } from './app/services/iconos.service';

// Factory function para APP_INITIALIZER
export function initializeIcons(iconosService: IconosService) {
  return (): Promise<void> => {
    iconosService.cargarIconos();
    return Promise.resolve();
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)), 
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    // Inicializador de iconos - se ejecuta antes de renderizar
    {
      provide: APP_INITIALIZER,
      useFactory: initializeIcons,
      deps: [IconosService],
      multi: true
    }
  ],
});