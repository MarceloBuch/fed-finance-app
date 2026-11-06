import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CreditCardsComponent } from './credit-cards.component';
import { UserContextService } from '../../core/services/user-context.service';

describe('CreditCardsComponent', () => {
  let component: CreditCardsComponent;
  let fixture: ComponentFixture<CreditCardsComponent>;
  let httpMock: HttpTestingController;
  let userContext: UserContextService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditCardsComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    userContext = TestBed.inject(UserContextService);
    httpMock = TestBed.inject(HttpTestingController);

    const usersReq = httpMock.expectOne('http://localhost:8080/api/v1/users');
    usersReq.flush([{ id: 'user-1', name: 'Marcelo', email: 'm@test.com', active: true }]);

    fixture = TestBed.createComponent(CreditCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load credit cards and active invoice for selected card', () => {
    const accountsReq = httpMock.expectOne('http://localhost:8080/api/v1/accounts/user/user-1');
    accountsReq.flush([
      {
        id: 'acc-1',
        userId: 'user-1',
        name: 'Itau Corrente',
        accountType: 'CHECKING',
        initialBalance: 5000,
        currentBalance: 5000,
        currency: 'BRL',
        active: true
      },
      {
        id: 'card-1',
        userId: 'user-1',
        name: 'Nubank',
        accountType: 'CREDIT_CARD',
        initialBalance: 0,
        currentBalance: -1500,
        creditLimit: 8000,
        usedLimit: 1500,
        availableLimit: 6500,
        closingDay: 3,
        dueDay: 10,
        paymentAccountId: 'acc-1',
        currency: 'BRL',
        active: true
      }
    ]);

    const currentYm = component.referenceMonth();
    const invoiceReq = httpMock.expectOne(
      `http://localhost:8080/api/v1/credit-cards/card-1/invoices/${currentYm}`
    );
    invoiceReq.flush({
      id: 'inv-1',
      creditCardAccountId: 'card-1',
      referenceMonth: currentYm,
      periodStart: '2026-10-04',
      closingDate: '2026-11-03',
      dueDate: '2026-11-10',
      status: 'CLOSED',
      totalAmount: 1500,
      paymentAccountId: 'acc-1',
      transactions: []
    });

    expect(component.creditCards().length).toBe(1);
    expect(component.selectedCardId()).toBe('card-1');
    expect(component.currentInvoice()?.totalAmount).toBe(1500);
  });
});
