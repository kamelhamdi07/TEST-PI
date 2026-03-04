import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentFront } from './payment-front';

describe('PaymentFront', () => {
  let component: PaymentFront;
  let fixture: ComponentFixture<PaymentFront>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentFront]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentFront);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
