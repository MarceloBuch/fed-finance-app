import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Invoice, PayInvoiceRequest } from '../models/finance.models';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  listByCard(cardId: string): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.baseUrl}/credit-cards/${cardId}/invoices`);
  }

  getByCardAndMonth(cardId: string, referenceMonth: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.baseUrl}/credit-cards/${cardId}/invoices/${referenceMonth}`);
  }

  getInvoice(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.baseUrl}/invoices/${id}`);
  }

  payInvoice(id: string, request?: PayInvoiceRequest): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.baseUrl}/invoices/${id}/pay`, request ?? {});
  }

  unpayInvoice(id: string): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.baseUrl}/invoices/${id}/unpay`, {});
  }

  predictInvoiceMonth(chargeDateStr: string, closingDay: number, dueDay: number): string {
    if (!chargeDateStr || !closingDay || !dueDay) return '';
    const parts = chargeDateStr.split('-').map(Number);
    if (parts.length !== 3) return '';
    const [y, m, d] = parts;

    let closeYear = y;
    let closeMonth = m;
    const clampedClosingCurrent = Math.min(closingDay, this.daysInMonth(closeYear, closeMonth));
    if (d > clampedClosingCurrent) {
      if (closeMonth === 12) {
        closeYear++;
        closeMonth = 1;
      } else {
        closeMonth++;
      }
    }
    const closeDayActual = Math.min(closingDay, this.daysInMonth(closeYear, closeMonth));

    let dueYear = closeYear;
    let dueMonth = closeMonth;
    const clampedDueSameMonth = Math.min(dueDay, this.daysInMonth(dueYear, dueMonth));
    if (clampedDueSameMonth <= closeDayActual) {
      if (dueMonth === 12) {
        dueYear++;
        dueMonth = 1;
      } else {
        dueMonth++;
      }
    }

    return `${dueYear}-${String(dueMonth).padStart(2, '0')}`;
  }

  private daysInMonth(year: number, month1Based: number): number {
    return new Date(year, month1Based, 0).getDate();
  }
}
