import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    loadComponent: () => import('./registro/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      // Todas las rutas que deben tener header/footer van dentro de tabs
      {
        path: '',
        loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
      },
      // Estas rutas también deben estar dentro de tabs para tener header/footer
      {
        path: 'inicio',
        loadComponent: () => import('./inicio/inicio.page').then((m) => m.InicioPage),
      },
      {
        path: 'gastos',
        loadComponent: () => import('./gastos/gastos.page').then((m) => m.GastosPage),
      },
      {
        path: 'nuevo-gasto',
        loadComponent: () => import('./nuevo-gasto/nuevo-gasto.page').then((m) => m.NuevoGastoPage),
      },
      {
        path: 'resumen',
        loadComponent: () => import('./resumen/resumen.page').then((m) => m.ResumenPage),
      },
      {
        path: 'categorias',
        loadComponent: () => import('./categorias/categorias.page').then((m) => m.CategoriasPage),
      },
      {
        path: 'escanear',
        loadComponent: () => import('./escanear/escanear.page').then((m) => m.EscanearPage),
      },
      {
        path: 'confirmar-gasto',
        loadComponent: () => import('./confirmar-gasto/confirmar-gasto.page').then((m) => m.ConfirmarGastoPage),
      },
      {
        path: 'msi',
        loadComponent: () => import('./msi/msi.page').then((m) => m.MsiPage),
      },
      {
        path: 'historial-msi',
        loadComponent: () => import('./historial-msi/historial-msi.page').then((m) => m.HistorialMsiPage),
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];