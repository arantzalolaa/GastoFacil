export type CategoriaClave = 'comida' | 'transporte' | 'salud' | 'servicios' | 'ocio' | 'estudios' | 'otros';

export interface CategoriaVisual {
  clave: CategoriaClave;
  etiqueta: string;
  icono: string;
}

const categoriasVisuales: Record<CategoriaClave, CategoriaVisual> = {
  comida: {
    clave: 'comida',
    etiqueta: 'Comida',
    icono: 'restaurant-outline',
  },
  transporte: {
    clave: 'transporte',
    etiqueta: 'Transporte',
    icono: 'car-outline',
  },
  salud: {
    clave: 'salud',
    etiqueta: 'Salud',
    icono: 'medkit-outline',
  },
  servicios: {
    clave: 'servicios',
    etiqueta: 'Servicios',
    icono: 'flash-outline',
  },
  ocio: {
    clave: 'ocio',
    etiqueta: 'Ocio',
    icono: 'game-controller-outline',
  },
  estudios: {
    clave: 'estudios',
    etiqueta: 'Estudios',
    icono: 'school-outline',
  },
  otros: {
    clave: 'otros',
    etiqueta: 'Otros',
    icono: 'wallet-outline',
  },
};

export const categoriasPrincipales = ['comida', 'transporte', 'salud', 'servicios', 'ocio', 'estudios'] as const;

export function normalizarCategoria(categoria: string): CategoriaClave {
  const clave = categoria.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return clave in categoriasVisuales ? (clave as CategoriaClave) : 'otros';
}

export function obtenerCategoriaVisual(categoria: string): CategoriaVisual {
  return categoriasVisuales[normalizarCategoria(categoria)];
}

export function capitalizarCategoria(categoria: string): string {
  const categoriaLimpia = categoria.trim();

  if (!categoriaLimpia) {
    return 'Otros';
  }

  return categoriaLimpia.charAt(0).toUpperCase() + categoriaLimpia.slice(1).toLowerCase();
}

export function obtenerCategoriasVisuales(): CategoriaVisual[] {
  return categoriasPrincipales.map((categoria) => categoriasVisuales[categoria]);
}
