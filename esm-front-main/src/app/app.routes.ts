import { Routes } from '@angular/router';
import { Content } from './content/content';
import { Signin } from './pages/signin/signin';
import { Signup } from './pages/signup/signup';
import { Backoffice } from './pages/backoffice/backoffice';
import path from 'path';
import { Component } from '@angular/core';
import { Reports } from './pages/backoffice/reports/reports';
import { Payments } from './pages/backoffice/payments/payments';

import { ContentDetails } from './content/content-details/content-details';
import { PaymentFront } from './content/payment-front/payment-front';
import { ReportFront } from './content/report-front/report-front';

export const routes: Routes = [
  { path: '', component: Content,children:[
    { path: '', component: ContentDetails },
    { path: 'payment-front', component: PaymentFront },
    { path: 'report-front', component: ReportFront },]},
  { path: 'signin', component: Signin },
  { path: 'signup', component: Signup },
  { path: 'forgot-password', component: Signin }, // temporary
  { path: 'support', component: Signin },         // temporary
  { path: 'backoffice', component: Backoffice,children:[
    {path: 'reports', component: Reports},{path: 'payments', component: Payments}] },
    

  { path: '**', redirectTo: '' }
];
