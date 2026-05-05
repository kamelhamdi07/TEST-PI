import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, Reclamation, ReclamationStatus } from '../../../services/report';
import { catchError, finalize, of, timeout } from 'rxjs';
import * as QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit, OnDestroy {
  reports: Reclamation[] = [];
  filteredReports: Reclamation[] = [];
  loading = false;
  searchTerm = '';
  selectedStatus: 'ALL' | ReclamationStatus = 'ALL';
  selectedCategory = 'ALL';
  selectedPriority = 'ALL';
  loadError = '';
  qrMap = new Map<number, string>();
  private autoRefreshId: ReturnType<typeof setInterval> | null = null;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    const cached = this.reportService.getCached();
    if (cached.length > 0) {
      this.reports = [...cached].sort(
        (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      );
      this.applyFilters();
      this.loadReports(false);
    } else {
      this.loadReports(true);
    }
    this.autoRefreshId = setInterval(() => {
      this.loadReports(false);
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.autoRefreshId) {
      clearInterval(this.autoRefreshId);
      this.autoRefreshId = null;
    }
  }

  loadReports(showLoader = true): void {
    this.loading = showLoader && this.reports.length === 0;
    this.loadError = '';
    this.reportService.getAll().pipe(
      timeout(10000),
      catchError(() => {
        this.loadError = 'Chargement trop long. Verifie que le service reporting est demarre.';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (data: Reclamation[]) => {
        if (data.length > 0) {
          this.reports = [...data].sort(
            (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
          );
        } else if (this.reports.length === 0) {
          this.reports = [];
        }
        this.applyFilters();
        this.refreshQRCodes();
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredReports = this.reports.filter((item) => {
      const subject = (item.subject ?? '').toLowerCase();
      const message = (item.message ?? '').toLowerCase();
      const studentEmail = (item.studentEmail ?? '').toLowerCase();
      const matchesSearch =
        !term ||
        subject.includes(term) ||
        message.includes(term) ||
        studentEmail.includes(term);
      const matchesStatus = this.selectedStatus === 'ALL' || item.status === this.selectedStatus;
      const matchesCategory = this.selectedCategory === 'ALL' || item.category === this.selectedCategory;
      const matchesPriority = this.selectedPriority === 'ALL' || item.priority === this.selectedPriority;
      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }

  updateStatus(id: number, status: ReclamationStatus): void {
    this.reportService.updateStatus(id, status).subscribe({
      next: (updated) => {
        const idx = this.reports.findIndex((r) => r.id === id);
        if (idx >= 0) this.reports[idx] = updated;
        this.applyFilters();
        this.refreshQRCodes();
        this.loadReports(false);
      }
    });
  }

  deleteReport(id: number): void {
    this.reportService.delete(id).subscribe(() => {
      this.reports = this.reports.filter((r) => r.id !== id);
      this.applyFilters();
      this.qrMap.delete(id);
      this.loadReports(false);
    });
  }

  private refreshQRCodes(): void {
    this.qrMap.clear();
    this.reports.forEach((r) => {
      const payload = JSON.stringify({
        subject: r.subject,
        studentEmail: r.studentEmail,
        category: r.category,
        priority: r.priority,
        status: r.status,
        createdDate: r.createdDate
      });
      QRCode.toDataURL(payload, { width: 72, margin: 1 }).then((url: string) => {
        this.qrMap.set(r.id, url);
      }).catch(() => {});
    });
  }

  getQRDataUrl(id: number): string | undefined {
    return this.qrMap.get(id);
  }

  exportPdfAll(): void {
    if (this.filteredReports.length === 0) {
      this.loadError = 'Aucune reclamation a exporter en PDF.';
      return;
    }

    const doc = new jsPDF();
    const now = new Date();

    doc.setFillColor(61, 86, 178);
    doc.rect(0, 0, 210, 16, 'F');
    doc.setFillColor(123, 104, 238);
    doc.rect(0, 16, 210, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Reclamations Report', 14, 14);
    doc.setFontSize(10);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 24);

    doc.setTextColor(33, 33, 33);
    doc.setFontSize(12);
    doc.text(`Total reclamations: ${this.filteredReports.length}`, 14, 42);

    let y = 50;
    this.filteredReports.forEach((item, index) => {
      if (y > 260) {
        doc.addPage();
        y = 18;
      }

      const isEven = index % 2 === 0;
      if (isEven) {
        doc.setFillColor(246, 248, 255);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.setDrawColor(221, 226, 245);
      doc.roundedRect(10, y - 6, 190, 34, 3, 3, 'FD');

      const statusStyle = this.getPdfStatusStyle(item.status);
      doc.setFillColor(statusStyle.bg[0], statusStyle.bg[1], statusStyle.bg[2]);
      doc.roundedRect(164, y - 2, 32, 8, 2, 2, 'F');
      doc.setTextColor(statusStyle.text[0], statusStyle.text[1], statusStyle.text[2]);
      doc.setFontSize(8);
      doc.text(item.status, 180, y + 3, { align: 'center' });

      doc.setTextColor(35, 35, 35);
      doc.setFontSize(10);
      doc.text(`${index + 1}. ${item.subject}`, 14, y);
      doc.setTextColor(75, 85, 99);
      doc.text(`Email: ${item.studentEmail}`, 14, y + 7);
      doc.text(`Category: ${item.category} | Priority: ${item.priority}`, 14, y + 14);
      doc.text(`Created: ${new Date(item.createdDate).toLocaleString()}`, 14, y + 21);
      y += 38;
    });

    doc.save(`reclamations-${Date.now()}.pdf`);
  }

  private getPdfStatusStyle(status: ReclamationStatus): { bg: [number, number, number]; text: [number, number, number] } {
    if (status === 'OPEN') return { bg: [227, 235, 255], text: [41, 65, 153] };
    if (status === 'IN_PROGRESS') return { bg: [255, 240, 214], text: [146, 81, 0] };
    if (status === 'RESOLVED') return { bg: [219, 245, 229], text: [7, 103, 58] };
    return { bg: [255, 226, 226], text: [169, 28, 28] };
  }

  getStatusClass(status: ReclamationStatus): string {
    if (status === 'OPEN') return 'status-open';
    if (status === 'IN_PROGRESS') return 'status-in-progress';
    if (status === 'RESOLVED') return 'status-resolved';
    return 'status-rejected';
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
    this.selectedCategory = 'ALL';
    this.selectedPriority = 'ALL';
    this.applyFilters();
  }

  get statusOpenCount(): number {
    return this.reports.filter((r) => r.status === 'OPEN').length;
  }

  get statusInProgressCount(): number {
    return this.reports.filter((r) => r.status === 'IN_PROGRESS').length;
  }

  get statusResolvedCount(): number {
    return this.reports.filter((r) => r.status === 'RESOLVED').length;
  }

  get statusRejectedCount(): number {
    return this.reports.filter((r) => r.status === 'REJECTED').length;
  }
}
