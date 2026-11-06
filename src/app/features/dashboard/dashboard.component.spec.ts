import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardComponent } from './dashboard.component';
import { PeriodContextService } from '../../core/services/period-context.service';
import { UserContextService } from '../../core/services/user-context.service';

describe('DashboardComponent', () => {
  let httpMock: HttpTestingController;
  let periodContext: PeriodContextService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
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

  it('should load monthly overview from /api/v1/dashboard/overview?userId=...&month=yyyy-MM and render summary metrics', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    const overviewReq = httpMock.expectOne(
      'http://localhost:8080/api/v1/dashboard/overview?userId=u-1&month=2026-11'
    );
    expect(overviewReq.request.method).toBe('GET');
    overviewReq.flush({
      month: '2026-11',
      totalBalance: 4200,
      realizedIncome: 5000,
      expectedIncome: 1000,
      realizedExpense: 1800,
      expectedExpense: 700,
      accounts: [
        { id: 'acc-1', name: 'Inter', accountType: 'CHECKING', currentBalance: 4200 }
      ],
      expensesByCategory: [
        {
          categoryId: 'cat-1',
          categoryName: 'Moradia',
          totalAmount: 1500
        }
      ],
      transactions: [
        {
          id: 'tx-up-1',
          userId: 'u-1',
          accountId: 'acc-1',
          type: 'EXPENSE',
          amount: 700,
          description: 'Condomínio',
          dueDate: '2026-11-10',
          status: 'PENDING',
          customized: false,
          overdue: false,
          active: true
        }
      ],
      invoicesDue: [
        {
          invoiceId: 'inv-1',
          cardAccountId: 'card-1',
          cardName: 'Cartão Nubank',
          referenceMonth: '2026-11',
          dueDate: '2026-11-10',
          totalAmount: 450,
          status: 'CLOSED'
        }
      ]
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('4,200.00');
    expect(el.textContent).toContain('4,500.00');
    expect(el.textContent).toContain('Moradia');
    expect(el.textContent).toContain('Condomínio');
    expect(el.textContent).toContain('Cartão Nubank');
  });
});
