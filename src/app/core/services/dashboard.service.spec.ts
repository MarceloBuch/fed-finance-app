import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch monthly dashboard overview via GET /api/v1/dashboard/overview?userId=...&month=yyyy-MM', () => {
    service.getOverview('u-1', '2026-11').subscribe(overview => {
      expect(overview.totalBalance).toBe(5000);
      expect(overview.realizedIncome).toBe(3000);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/dashboard/overview?userId=u-1&month=2026-11');
    expect(req.request.method).toBe('GET');
    req.flush({
      month: '2026-11',
      totalBalance: 5000,
      realizedIncome: 3000,
      expectedIncome: 0,
      realizedExpense: 1000,
      expectedExpense: 800,
      accounts: [],
      transactions: [],
      expensesByCategory: []
    });
  });
});
