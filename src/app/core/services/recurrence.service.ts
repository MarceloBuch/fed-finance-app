import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateRecurrenceRequest, Recurrence } from '../models/finance.models';

@Injectable({
  providedIn: 'root'
})
export class RecurrenceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/recurrences`;

  listRecurrences(userId: string): Observable<Recurrence[]> {
    return this.http.get<Recurrence[]>(`${this.apiUrl}/user/${userId}`);
  }

  getRecurrenceById(id: string): Observable<Recurrence> {
    return this.http.get<Recurrence>(`${this.apiUrl}/${id}`);
  }

  createRecurrence(request: CreateRecurrenceRequest): Observable<Recurrence> {
    return this.http.post<Recurrence>(this.apiUrl, request);
  }

  deleteRecurrence(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
