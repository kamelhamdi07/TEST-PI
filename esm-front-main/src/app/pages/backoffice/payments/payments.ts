import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../services/payment';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';




@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],  
  templateUrl: './payments.html',
  styleUrl: './payments.css'
})
export class Payments implements OnInit {
[x: string]: any;

  payments: any[] = [];

  constructor(
  private paymentService: PaymentService,
  private router: Router
) {
  this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(() => {
      this.loadPayments();
    });
}

ngOnInit(): void {
  this.loadPayments();
}

ngOnChanges(): void {
  this.loadPayments();
}



  loadPayments() {
  this.paymentService.getAll().subscribe({
    next: (data) => {
      this.payments = [...data]; 
    },
    error: (err) => {
      console.error(err);
    }
  });
}

 deletePayment(id: number) {

  this.paymentService.delete(id).subscribe(() => {

    const index = this.payments.findIndex(p => p.paymentId === id);

    if (index !== -1) {
      this.payments.splice(index, 1);
      this.payments = [...this.payments]; 
    }

  });
}

searchTerm: string = '';
selectedStatus: string = '';
selectedMethod: string = '';
get filteredPayments() {
  return this.payments.filter(p => {

    const matchesSearch =
      p.paymentId.toString().includes(this.searchTerm) ||
      p.method.toLowerCase().includes(this.searchTerm.toLowerCase());

    const matchesStatus =
      this.selectedStatus ? p.status === this.selectedStatus : true;

    const matchesMethod =
      this.selectedMethod ? p.method === this.selectedMethod : true;

    return matchesSearch && matchesStatus && matchesMethod;
  });
}



}
