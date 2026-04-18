import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChairmanDashboardComponent } from './chairman-dashboard.component';

describe('ChairmanDashboardComponent', () => {
  let component: ChairmanDashboardComponent;
  let fixture: ComponentFixture<ChairmanDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChairmanDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChairmanDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
