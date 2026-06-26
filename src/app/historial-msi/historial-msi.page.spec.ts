import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialMsiPage } from './historial-msi.page';

describe('HistorialMsiPage', () => {
  let component: HistorialMsiPage;
  let fixture: ComponentFixture<HistorialMsiPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorialMsiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
