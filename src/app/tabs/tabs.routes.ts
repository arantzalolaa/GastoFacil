import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'inicio',
        loadComponent: () =>
          import('../inicio/inicio.page').then((m) => m.InicioPage),
      },
      {
        path: 'gastos',
        loadComponent: () =>
          import('../gastos/gastos.page').then((m) => m.GastosPage),
      },
      {
        path: 'escanear',
        loadComponent: () =>
          import('../escanear/escanear.page').then((m) => m.EscanearPage),
      },
      {
        path: 'confirmar-gasto',
        loadComponent: () =>
          import('../confirmar-gasto/confirmar-gasto.page').then((m) => m.ConfirmarGastoPage),
      },
      {
        path: 'nuevo-gasto',
        loadComponent: () =>
          import('../nuevo-gasto/nuevo-gasto.page').then((m) => m.NuevoGastoPage),
      },
      {
        path: 'resumen',
        loadComponent: () =>
          import('../resumen/resumen.page').then((m) => m.ResumenPage),
      },
      {
        path: '',
        redirectTo: '/inicio',
        pathMatch: 'full',
      },
    ],
  },
];