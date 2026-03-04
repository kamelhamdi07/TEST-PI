import { Component } from '@angular/core';
import {  provideIcons } from '@ng-icons/core';
import { bootstrapCheck } from '@ng-icons/bootstrap-icons';
import { RouterLink, RouterOutlet } from "@angular/router";
import { Backoffice } from "../pages/backoffice/backoffice";
import { ContentDetails } from "./content-details/content-details";

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [RouterLink, RouterOutlet, Backoffice, ContentDetails],
  providers: [provideIcons({ bootstrapCheck })],
  templateUrl: './content.html',
  styleUrl: './content.css'
})
export class Content {}
