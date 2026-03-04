import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-backoffice',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './backoffice.html',
  styleUrl: './backoffice.css'
})
export class Backoffice {
  sidebarOpen = true; // toggle sidebar

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
