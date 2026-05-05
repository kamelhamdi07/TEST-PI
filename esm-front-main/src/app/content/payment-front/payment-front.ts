import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../services/payment';
import { CartItem, CartService } from '../../services/cart';

@Component({
  selector: 'app-payment-front',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-front.html',
  styleUrl: './payment-front.css'
})
export class PaymentFront {
  cartItems: CartItem[] = [];

  payment = {
    amount: 0,
    method: '',
    date: ''
  };
  notification: { message: string; type: 'success' | 'error' } | null = null;
  private notificationTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService,
    private route: ActivatedRoute
  ) {
    this.syncFromCart();
    this.route.queryParamMap.subscribe((params) => {
      const amountParam = Number(params.get('amount'));
      if (!Number.isNaN(amountParam) && amountParam >= 0) {
        this.payment.amount = amountParam;
      } else {
        this.payment.amount = this.cartService.getTotalAmount();
      }
      this.cartItems = this.cartService.getItems();
    });
  }

  private syncFromCart(): void {
    this.cartItems = this.cartService.getItems();
    this.payment.amount = this.cartService.getTotalAmount();
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
    this.notification = { message, type };
    this.cdr.detectChanges();
    this.notificationTimeout = setTimeout(() => {
      this.notification = null;
      this.notificationTimeout = null;
      this.cdr.detectChanges();
    }, 4000);
  }

  closeNotification(): void {
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
    this.notification = null;
    this.notificationTimeout = null;
    this.cdr.detectChanges();
  }

  submit(form: NgForm): void {
    if (form?.valid !== true) return;

    const payload = {
      ...this.payment,
      date: this.payment.date ? this.payment.date + 'T00:00:00' : null
    };

    this.paymentService.addPayment(payload).subscribe({
      next: (res) => {
        console.log('Saved', res);
        this.showNotification('Paiement enregistré avec succès.', 'success');
        this.cartService.clear();
        this.cartItems = [];
        this.payment = {
          amount: 0,
          method: '',
          date: ''
        };
        form.resetForm(this.payment);
      },
      error: (err) => {
        console.error(err);
        this.showNotification('Erreur lors de l\'enregistrement du paiement.', 'error');
      }
    });
  }

}
