import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private apiUrl = '/api/payments';

 

  constructor(private http: HttpClient) {}

  addPayment(payment: any) {
    return this.http.post(this.apiUrl, payment);
  }

  getAllPayments() {
    return this.http.get(this.apiUrl);
  }
  getAll() {
  return this.http.get<any[]>(this.apiUrl);
}

  update(id: number, payment: any) {
    return this.http.put(`${this.apiUrl}/${id}`, payment);
  }

  delete(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}
