import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, Report } from '../../../services/report';


@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})

export class Reports implements OnInit {

  reports: Report[] = [];

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports() {
    this.reportService.getAll().subscribe((data: Report[]) => {
      this.reports = [...data];
    });
  }

  deleteReport(id: number) {
    this.reportService.delete(id).subscribe(() => {
      this.reports = this.reports.filter(r => r.id !== id);
    });
  }
  searchTerm: string = '';
minRevenue?: number;
maxRevenue?: number;

filteredReports(): Report[] {
  return this.reports.filter(r => {
    const matchesTitle = r.title.toLowerCase().includes(this.searchTerm.toLowerCase());
    const matchesMin = this.minRevenue ? r.totalRevenue >= this.minRevenue : true;
    const matchesMax = this.maxRevenue ? r.totalRevenue <= this.maxRevenue : true;
    return matchesTitle && matchesMin && matchesMax;
  });
}
}
