// pipes/categoria-color.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'categoriaColor',
  standalone: true
})
export class CategoriaColorPipe implements PipeTransform {
  
  /**
   * Transforma un color hexadecimal en dos versiones:
   * - color: el color original (para fondo)
   * - iconColor: el color saturado (para iconos)
   */
  transform(hexColor: string | null, tipo: 'bg' | 'icon' = 'bg'): string {
    if (!hexColor) {
      return tipo === 'bg' ? '#E6E8EA' : '#64748b';
    }

    if (tipo === 'bg') {
      return hexColor;
    }

    // Para iconColor: saturar el color
    return this.saturateColor(hexColor);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    let c = hex.substring(1).split('');

    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }

    return {
      r: parseInt(c[0] + c[1], 16),
      g: parseInt(c[2] + c[3], 16),
      b: parseInt(c[4] + c[5], 16)
    };
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    s /= 100;

    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');

    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  }

  private saturateColor(hex: string): string {
    if (!hex) return '#64748b';

    const { r, g, b } = this.hexToRgb(hex);
    let { h, s, l } = this.rgbToHsl(r, g, b);

    s = Math.min(100, s + 50);
    l = Math.max(0, l - 45);

    return this.hslToHex(h, s, l);
  }
}