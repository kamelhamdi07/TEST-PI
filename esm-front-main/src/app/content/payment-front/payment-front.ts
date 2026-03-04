import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../services/payment';

@Component({
  selector: 'app-payment-front',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-front.html',
  styleUrl: './payment-front.css'
})
export class PaymentFront {

  payment = {
    amount: 0,
    method: '',
    date: ''
  };

  constructor(private paymentService: PaymentService) {}

  submit() {

  const payload = {
    ...this.payment,
    date: this.payment.date ? this.payment.date + "T00:00:00" : null
  };

  this.paymentService.addPayment(payload)
    .subscribe({
      next: (res) => {
        console.log('Saved', res);
        alert('Payment saved successfully ✅');
      },
      error: (err) => {
        console.error(err);
        alert('Error saving payment ❌');
      }
    });
}

}
