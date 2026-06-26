// components/categoria-icon/categoria-icon.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { CategoriaColorPipe } from '../../pipes/categoria-color.pipe';

@Component({
  selector: 'app-categoria-icon',
  standalone: true,
  imports: [CommonModule, IonIcon, CategoriaColorPipe],
  template: `
    <div 
      class="categoria-icon-wrapper"
      [style.background]="color | categoriaColor:'bg'"
      [style.color]="color | categoriaColor:'icon'"
    >
      <ion-icon [name]="icono || 'pricetag-outline'" aria-hidden="true"></ion-icon>
    </div>
  `,
  styles: [`
    .categoria-icon-wrapper {
      align-items: center;
      border-radius: 14px;
      display: flex;
      flex: 0 0 52px;
      height: 52px;
      justify-content: center;
      width: 52px;
    }
    .categoria-icon-wrapper ion-icon {
      font-size: 1.8rem;
    }
    .categoria-icon-wrapper.small {
      flex: 0 0 40px;
      height: 40px;
      width: 40px;
      border-radius: 12px;
    }
    .categoria-icon-wrapper.small ion-icon {
      font-size: 1.4rem;
    }
    .categoria-icon-wrapper.tiny {
      flex: 0 0 32px;
      height: 32px;
      width: 32px;
      border-radius: 10px;
    }
    .categoria-icon-wrapper.tiny ion-icon {
      font-size: 1.1rem;
    }
  `]
})
export class CategoriaIconComponent {
  @Input() color: string | null = '#E6E8EA';
  @Input() icono: string | null = 'pricetag-outline';
  @Input() size: 'normal' | 'small' | 'tiny' = 'normal';

  get sizeClass(): string {
    if (this.size === 'small') return 'small';
    if (this.size === 'tiny') return 'tiny';
    return '';
  }
}