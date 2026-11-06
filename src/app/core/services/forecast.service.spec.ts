import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ForecastService } from './forecast.service';

describe('ForecastService', () => {
  let service: ForecastService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ForecastService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch 12-month forecast via GET /api/v1/forecast/annual?userId=...&startMonth=yyyy-MM', () => {
    service.getAnnualForecast('u-1', '2026-11', 'acc-1').subscribe(items => {
      expect(items.length).toBe(1);
      expect(items[0].projectedBalance).toBe(4500);
    });

    const req = httpMock.expectOne(
      'http://localhost:8080/api/v1/forecast/annual?userId=u-1&startMonth=2026-11&accountId=acc-1'
    );
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        month: '2026-11',
        openingBalance: 3000,
        expectedIncome: 2500,
        expectedExpense: 1000,
        projectedBalance: 4500
      }
    ]);
  });
});
