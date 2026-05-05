import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../services/payment';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.html',
  styleUrl: './payments.css'
})
export class Payments implements OnInit, OnDestroy {

  payments: any[] = [];
  searchTerm = '';
  selectedStatus = '';
  selectedMethod = '';
  readonly pageSize = 3;
  currentPage = 1;
  editingPayment: any = null;
  private destroy$ = new Subject<void>();

  constructor(
    private paymentService: PaymentService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((e) => {
        if (e.urlAfterRedirects.includes('/payments')) {
          this.loadPayments();
        }
      });
  }

  ngOnInit(): void {
    this.loadPayments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPayments(): void {
    this.paymentService.getAll().subscribe({
      next: (data) => {
        this.payments = Array.isArray(data) ? [...data] : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.payments = [];
        this.cdr.detectChanges();
      }
    });
  }

  startEditPayment(p: any): void {
    this.editingPayment = {
      paymentId: p.paymentId,
      amount: p.amount,
      method: p.method,
      status: p.status,
      date: p.date ? p.date.toString().slice(0, 10) : ''
    };
  }

  cancelEditPayment(): void {
    this.editingPayment = null;
  }

  savePayment(): void {
    if (!this.editingPayment) return;
    const id = this.editingPayment.paymentId;
    const payload = {
      ...this.editingPayment,
      date: this.editingPayment.date ? this.editingPayment.date + 'T00:00:00' : null
    };
    this.paymentService.update(id, payload).subscribe({
      next: (updated) => {
        const idx = this.payments.findIndex((x) => x.paymentId === id);
        if (idx !== -1) this.payments[idx] = { ...this.payments[idx], ...updated };
        this.editingPayment = null;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Erreur lors de la mise à jour du paiement.');
      }
    });
  }

  deletePayment(id: number): void {
    this.paymentService.delete(id).subscribe(() => {
      this.payments = this.payments.filter((p) => p.paymentId !== id);
      this.currentPage = Math.min(this.currentPage, Math.max(1, this.totalPagesPayment));
      this.cdr.detectChanges();
    });
  }

  get filteredPayments(): any[] {
    return this.payments.filter((p) => {
      const matchesSearch =
        !this.searchTerm ||
        (p.paymentId != null && p.paymentId.toString().includes(this.searchTerm)) ||
        (p.method && p.method.toLowerCase().includes(this.searchTerm.toLowerCase()));
      const matchesStatus = !this.selectedStatus || p.status === this.selectedStatus;
      const matchesMethod = !this.selectedMethod || p.method === this.selectedMethod;
      return matchesSearch && matchesStatus && matchesMethod;
    });
  }

  get totalPagesPayment(): number {
    const len = this.filteredPayments.length;
    return len === 0 ? 1 : Math.ceil(len / this.pageSize);
  }

  get paginatedPayments(): any[] {
    const list = this.filteredPayments;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  goToPagePayment(page: number): void {
    this.currentPage = Math.max(1, Math.min(page, this.totalPagesPayment));
  }

  exportPdf(): void {
    const rows = this.filteredPayments.map((p) => [
      String(p.paymentId ?? ''),
      String(p.amount ?? '') + ' TND',
      String(p.method ?? ''),
      String(p.status ?? ''),
      p.date ? new Date(p.date).toLocaleString() : ''
    ]);
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Payments Management', 14, 20);
    autoTable(doc, {
      head: [['ID', 'Amount', 'Method', 'Status', 'Date']],
      body: rows,
      startY: 28
    });
    doc.save('payments.pdf');
  }
}
