import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MonthlyForecastItem } from '../models/finance.models';

@Injectable({
  providedIn: 'root'
})
export class ForecastService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/forecast/annual`;

  getAnnualForecast(
    userId: string,
    startMonth: string,
    accountId?: string | null
  ): Observable<MonthlyForecastItem[]> {
    let params = new HttpParams()
      .set('userId', userId)
      .set('startMonth', startMonth);
    if (accountId) {
      params = params.set('accountId', accountId);
    }
    return this.http.get<MonthlyForecastItem[]>(this.apiUrl, { params });
  }
}
