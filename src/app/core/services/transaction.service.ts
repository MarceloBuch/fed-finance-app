import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateTransactionRequest,
  PayTransactionRequest,
  RecurrenceEditMode,
  Transaction,
  TransactionFilter,
  UpdateTransactionRequest
} from '../models/finance.models';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/transactions`;

  listTransactions(filter: TransactionFilter): Observable<Transaction[]> {
    let params = new HttpParams().set('userId', filter.userId);
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate);
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate);
    }
    if (filter.accountId) {
      params = params.set('accountId', filter.accountId);
    }
    if (filter.categoryId) {
      params = params.set('categoryId', filter.categoryId);
    }
    if (filter.type) {
      params = params.set('type', filter.type);
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    return this.http.get<Transaction[]>(this.apiUrl, { params });
  }

  getTransactionById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }

  createTransaction(request: CreateTransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, request);
  }

  updateTransaction(
    id: string,
    request: UpdateTransactionRequest,
    mode: RecurrenceEditMode = 'THIS'
  ): Observable<Transaction> {
    const params = new HttpParams().set('mode', mode);
    return this.http.put<Transaction>(`${this.apiUrl}/${id}`, request, { params });
  }

  payTransaction(id: string, request?: PayTransactionRequest): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/${id}/pay`, request ?? {});
  }

  unpayTransaction(id: string): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/${id}/unpay`, {});
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
