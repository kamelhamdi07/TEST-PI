import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReportService, Reclamation, ReclamationCategory, ReclamationPriority } from '../../services/report';

interface ReclamationForm {
  subject: string;
  message: string;
  studentEmail: string;
  category: ReclamationCategory;
  priority: ReclamationPriority;
}

@Component({
  selector: 'app-report-front',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-front.html',
  styleUrl: './report-front.css'
})
export class ReportFront {
  report: ReclamationForm = {
    subject: '',
    message: '',
    studentEmail: '',
    category: 'OTHER',
    priority: 'MEDIUM'
  };
  notification: { message: string; type: 'success' | 'error' } | null = null;
  private notificationTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private reportService: ReportService,
    private cdr: ChangeDetectorRef
  ) {}

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

    const payload: Partial<Reclamation> = {
      ...this.report,
      status: 'IN_PROGRESS'
    };

    this.reportService.addReport(payload).subscribe({
      next: () => {
        this.showNotification('Reclamation envoyee avec succes.', 'success');
        this.report = {
          subject: '',
          message: '',
          studentEmail: '',
          category: 'OTHER',
          priority: 'MEDIUM'
        };
        form.resetForm(this.report);
      },
      error: (err) => {
        console.error(err);
        this.showNotification('Erreur lors de l\'envoi de la reclamation.', 'error');
      }
    });
  }
}
