// components/categoria-selector/categoria-selector.component.ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { Categoria } from '../../services/categorias.service';
import { CategoriaIconComponent } from '../categoria-icon/categoria-icon.component';

@Component({
  selector: 'app-categoria-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, IonSelect, IonSelectOption, CategoriaIconComponent],
  template: `
    <ion-select
      [value]="categoriaSeleccionada"
      (ionChange)="onCategoriaChange($event)"
      interface="popover"
      placeholder="Seleccionar"
      class="custom-select"
    >
      <ion-select-option *ngFor="let categoria of categorias" [value]="categoria.id">
        <div class="categoria-option">
          <app-categoria-icon 
            [color]="categoria.color" 
            [icono]="categoria.icono" 
            size="tiny"
          ></app-categoria-icon>
          <span>{{ categoria.nombre }}</span>
        </div>
      </ion-select-option>
    </ion-select>
  `,
  styles: [`
    .categoria-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 0;
    }
    .categoria-option span {
      font-size: 14px;
    }
    .custom-select {
      --padding-bottom: 0;
      --padding-top: 0;
      height: 52px;
    }
    .custom-select::part(icon) {
      color: #424653;
      font-size: 18px;
      opacity: 1;
    }
    .custom-select::part(placeholder) {
      color: #c3c6d6;
      opacity: 1;
    }
    .custom-select::part(text) {
      color: #191c1e;
    }
  `]
})
export class CategoriaSelectorComponent {
  @Input() categorias: Categoria[] = [];
  @Input() categoriaSeleccionada: number | null = null;
  @Output() categoriaChange = new EventEmitter<number | null>();

  onCategoriaChange(event: any): void {
    this.categoriaChange.emit(event.detail.value);
  }
}