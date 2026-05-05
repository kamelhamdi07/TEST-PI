import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>([]);
  readonly items$ = this.itemsSubject.asObservable();

  addCourse(id: string, title: string, price: number): void {
    const items = [...this.itemsSubject.value];
    const existing = items.find((item) => item.id === id);

    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ id, title, price, quantity: 1 });
    }

    this.itemsSubject.next(items);
  }

  removeCourse(id: string): void {
    const items = this.itemsSubject.value.filter((item) => item.id !== id);
    this.itemsSubject.next(items);
  }

  getItems(): CartItem[] {
    return this.itemsSubject.value;
  }

  getTotalAmount(): number {
    return this.itemsSubject.value.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  getTotalCourses(): number {
    return this.itemsSubject.value.reduce((total, item) => total + item.quantity, 0);
  }

  clear(): void {
    this.itemsSubject.next([]);
  }
}
