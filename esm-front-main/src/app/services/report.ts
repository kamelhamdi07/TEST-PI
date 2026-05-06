import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

export type ReclamationStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
export type ReclamationPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ReclamationCategory = 'PAYMENT' | 'COURSE' | 'TECHNICAL' | 'OTHER';

export interface Reclamation {
  id: number;
  subject: string;
  message: string;
  studentEmail: string;
  category: ReclamationCategory;
  priority: ReclamationPriority;
  status: ReclamationStatus;
  createdDate: string;
  updatedDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private apiUrl = '/api/reports';
  private readonly storageKey = 'reclamation-cache-v1';
  private cachedReclamations: Reclamation[] = [];

  constructor(private http: HttpClient) {
    this.cachedReclamations = this.readCacheFromStorage();
  }

  getAll(): Observable<Reclamation[]> {
    return this.http.get<Reclamation[]>(this.apiUrl).pipe(
      tap((data) => {
        this.cachedReclamations = data ?? [];
        this.writeCacheToStorage(this.cachedReclamations);
      })
    );
  }

  getCached(): Reclamation[] {
    return [...this.cachedReclamations];
  }

  addReport(report: Partial<Reclamation>): Observable<Reclamation> {
    return this.http.post<Reclamation>(this.apiUrl, report);
  }

  update(id: number, report: Partial<Reclamation>): Observable<Reclamation> {
    return this.http.put<Reclamation>(`${this.apiUrl}/${id}`, report);
  }

  updateStatus(id: number, status: ReclamationStatus): Observable<Reclamation> {
    return this.http.patch<Reclamation>(`${this.apiUrl}/${id}/status`, { status });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private readCacheFromStorage(): Reclamation[] {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as Reclamation[];
    } catch {
      return [];
    }
  }

  private writeCacheToStorage(items: Reclamation[]): void {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(items ?? []));
    } catch {
      // Ignore storage write errors.
    }
  }
}
