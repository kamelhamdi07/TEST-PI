import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportFront } from './report-front';

describe('ReportFront', () => {
  let component: ReportFront;
  let fixture: ComponentFixture<ReportFront>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportFront]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportFront);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
