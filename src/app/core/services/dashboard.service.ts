import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardOverview } from '../models/finance.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard/overview`;

  getOverview(userId: string, month: string): Observable<DashboardOverview> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('month', month);
    return this.http.get<DashboardOverview>(this.apiUrl, { params });
  }
}
