import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommitteeDashboardComponent } from './committee-dashboard.component';

describe('CommitteeDashboardComponent', () => {
  let component: CommitteeDashboardComponent;
  let fixture: ComponentFixture<CommitteeDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommitteeDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommitteeDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
