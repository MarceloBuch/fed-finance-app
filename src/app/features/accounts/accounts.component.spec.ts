import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AccountsComponent } from './accounts.component';
import { UserContextService } from '../../core/services/user-context.service';

describe('AccountsComponent', () => {
  let httpMock: HttpTestingController;
  let userContext: UserContextService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    userContext = TestBed.inject(UserContextService);

    const initReq = httpMock.expectOne('http://localhost:8080/api/v1/users');
    initReq.flush([{ id: 'u-1', name: 'Marcelo', email: 'marcelo@test.com', active: true }]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load accounts, display currentBalance and initialBalance, and create/update an account', () => {
    const fixture = TestBed.createComponent(AccountsComponent);
    fixture.detectChanges();

    const listReq = httpMock.expectOne('http://localhost:8080/api/v1/accounts/user/u-1');
    listReq.flush([
      {
        id: 'acc-1',
        userId: 'u-1',
        name: 'Inter Principal',
        bankCode: '077',
        accountType: 'CHECKING',
        initialBalance: 1000,
        currentBalance: 2450.5,
        currency: 'BRL',
        active: true
      }
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Inter Principal');
    expect(el.textContent).toContain('2,450.50');

    const comp = fixture.componentInstance;
    comp.openCreateModal();
    comp.name = 'Reserva Poupança';
    comp.bankCode = '260';
    comp.accountType = 'SAVINGS';
    comp.initialBalance = 500;
    comp.currency = 'BRL';
    comp.onSubmit();

    const postReq = httpMock.expectOne('http://localhost:8080/api/v1/accounts');
    expect(postReq.request.method).toBe('POST');
    postReq.flush({
      id: 'acc-2',
      userId: 'u-1',
      name: 'Reserva Poupança',
      bankCode: '260',
      accountType: 'SAVINGS',
      initialBalance: 500,
      currentBalance: 500,
      currency: 'BRL',
      active: true
    });

    expect(comp.accounts().length).toBe(2);

    comp.openEditModal(comp.accounts()[0]);
    comp.name = 'Inter Editado';
    comp.onSubmit();

    const putReq = httpMock.expectOne('http://localhost:8080/api/v1/accounts/acc-1');
    expect(putReq.request.method).toBe('PUT');
    putReq.flush({
      id: 'acc-1',
      userId: 'u-1',
      name: 'Inter Editado',
      bankCode: '077',
      accountType: 'CHECKING',
      initialBalance: 1000,
      currentBalance: 2450.5,
      currency: 'BRL',
      active: true
    });

    expect(comp.accounts()[0].name).toBe('Inter Editado');

    // Create a credit card account and ensure it does not sum into totalCurrentBalance
    comp.openCreateModal();
    comp.accountType = 'CREDIT_CARD';
    comp.name = 'Cartão Nubank';
    comp.bankCode = '260';
    comp.creditLimit = 5000;
    comp.closingDay = 3;
    comp.dueDay = 10;
    comp.paymentAccountId = 'acc-1';
    comp.onSubmit();

    const cardPostReq = httpMock.expectOne('http://localhost:8080/api/v1/accounts');
    expect(cardPostReq.request.body.accountType).toBe('CREDIT_CARD');
    expect(cardPostReq.request.body.creditLimit).toBe(5000);
    expect(cardPostReq.request.body.closingDay).toBe(3);
    expect(cardPostReq.request.body.dueDay).toBe(10);
    cardPostReq.flush({
      id: 'card-1',
      userId: 'u-1',
      name: 'Cartão Nubank',
      bankCode: '260',
      accountType: 'CREDIT_CARD',
      initialBalance: 0,
      currentBalance: 0,
      creditLimit: 5000,
      closingDay: 3,
      dueDay: 10,
      paymentAccountId: 'acc-1',
      usedLimit: 500,
      availableLimit: 4500,
      currency: 'BRL',
      active: true
    });

    expect(comp.totalCurrentBalance()).toBe(2950.5);

    // Transfer from Checking (acc-1) to Savings (acc-2)
    comp.openTransferModal();
    expect(comp.showTransferModal).toBe(true);
    expect(comp.transferFromAccountId).toBe('acc-1');
    expect(comp.transferToAccountId).toBe('acc-2');
    comp.transferAmount = 400;
    comp.transferDescription = 'Guardar na Poupança';
    comp.transferDate = '2026-11-06';
    comp.onSubmitTransfer();

    const transferReq = httpMock.expectOne('http://localhost:8080/api/v1/transactions');
    expect(transferReq.request.method).toBe('POST');
    expect(transferReq.request.body.type).toBe('TRANSFER');
    expect(transferReq.request.body.accountId).toBe('acc-1');
    expect(transferReq.request.body.destinationAccountId).toBe('acc-2');
    expect(transferReq.request.body.amount).toBe(400);
    transferReq.flush({ id: 'tx-transfer-1' });

    const reloadAccountsReq = httpMock.expectOne('http://localhost:8080/api/v1/accounts/user/u-1');
    reloadAccountsReq.flush(comp.accounts());
    expect(comp.showTransferModal).toBe(false);
  });
});
