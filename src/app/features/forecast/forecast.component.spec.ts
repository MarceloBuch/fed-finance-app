import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ForecastComponent } from './forecast.component';
import { PeriodContextService } from '../../core/services/period-context.service';
import { UserContextService } from '../../core/services/user-context.service';

describe('ForecastComponent', () => {
  let httpMock: HttpTestingController;
  let periodContext: PeriodContextService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForecastComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    periodContext = TestBed.inject(PeriodContextService);
    periodContext.setPeriod(2026, 11);
    TestBed.inject(UserContextService);

    const userReq = httpMock.expectOne('http://localhost:8080/api/v1/users');
    userReq.flush([{ id: 'u-1', name: 'Marcelo', email: 'marcelo@test.com', active: true }]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load 12-month forecast and filter by specific account', () => {
    const fixture = TestBed.createComponent(ForecastComponent);
    fixture.detectChanges();

    const accReq = httpMock.expectOne('http://localhost:8080/api/v1/accounts/user/u-1');
    accReq.flush([
      {
        id: 'acc-sav',
        userId: 'u-1',
        name: 'Poupança',
        bankCode: '260',
        accountType: 'SAVINGS',
        initialBalance: 2000,
        currentBalance: 2000,
        currency: 'BRL',
        active: true
      }
    ]);

    const forecastReq = httpMock.expectOne(
      'http://localhost:8080/api/v1/forecast/annual?userId=u-1&startMonth=2026-11'
    );
    expect(forecastReq.request.method).toBe('GET');
    forecastReq.flush([
      {
        month: '2026-11',
        openingBalance: 2000,
        expectedIncome: 5000,
        expectedExpense: 2000,
        projectedBalance: 5000
      }
    ]);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp.forecastItems().length).toBe(1);
    expect(comp.total12mIncome()).toBe(5000);
    expect(comp.total12mExpense()).toBe(2000);
    expect(comp.final12mEndingBalance()).toBe(5000);

    // Filter by specific account
    comp.selectedAccountId.set('acc-sav');
    fixture.detectChanges();

    const filteredReq = httpMock.expectOne(
      'http://localhost:8080/api/v1/forecast/annual?userId=u-1&startMonth=2026-11&accountId=acc-sav'
    );
    expect(filteredReq.request.method).toBe('GET');
    filteredReq.flush([
      {
        month: '2026-11',
        openingBalance: 2000,
        expectedIncome: 500,
        expectedExpense: 0,
        projectedBalance: 2500
      }
    ]);

    expect(comp.final12mEndingBalance()).toBe(2500);
  });
});
