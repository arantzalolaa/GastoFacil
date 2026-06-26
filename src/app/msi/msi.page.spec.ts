import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsiPage } from './msi.page';

describe('MsiPage', () => {
  let component: MsiPage;
  let fixture: ComponentFixture<MsiPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MsiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
