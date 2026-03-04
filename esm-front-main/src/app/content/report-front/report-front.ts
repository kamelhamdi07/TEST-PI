import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReportService, Report } from '../../services/report';

@Component({
  selector: 'app-report-front',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-front.html',
  styleUrl: './report-front.css'
})
export class ReportFront {

 report: Report = {
  id: 0,
  title: '',
  description: '',
  totalRevenue: 0,
  createdDate: new Date().toISOString()
};


  constructor(private reportService: ReportService) {}

 submit() {

  const payload = {
    ...this.report,
    createdDate: new Date().toISOString()
  };

  this.reportService.addReport(payload)
    .subscribe({
      next: (res) => {
        console.log('Report saved', res);
        alert('Report saved successfully ✅');
      },
      error: (err) => {
        console.error(err);
        alert('Error saving report ❌');
      }
    });
}

}
