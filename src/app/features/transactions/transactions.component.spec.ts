import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TransactionsComponent } from './transactions.component';
import { PeriodContextService } from '../../core/services/period-context.service';
import { UserContextService } from '../../core/services/user-context.service';

describe('TransactionsComponent', () => {
  let httpMock: HttpTestingController;
  let periodContext: PeriodContextService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionsComponent],
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

  function flushInitialLoads() {
    const accReq = httpMock.expectOne('http://localhost:8080/api/v1/accounts/user/u-1');
    accReq.flush([
      {
        id: 'acc-1',
        userId: 'u-1',
        name: 'Inter',
        bankCode: '077',
        accountType: 'CHECKING',
        initialBalance: 1000,
        currentBalance: 1500,
        currency: 'BRL',
        active: true
      }
    ]);

    const catReq = httpMock.expectOne('http://localhost:8080/api/v1/categories/user/u-1');
    catReq.flush([
      {
        id: 'cat-1',
        userId: null,
        name: 'Moradia',
        type: 'EXPENSE',
        icon: 'home',
        color: '#EF4444',
        active: true
      }
    ]);

    const txReq = httpMock.expectOne(
      'http://localhost:8080/api/v1/transactions?userId=u-1&startDate=2026-11-01&endDate=2026-11-30'
    );
    txReq.flush([
      {
        id: 'tx-with-acc',
        userId: 'u-1',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'EXPENSE',
        amount: 200,
        description: 'Condomínio',
        dueDate: '2026-11-10',
        status: 'PENDING',
        customized: false,
        active: true
      },
      {
        id: 'tx-no-acc',
        userId: 'u-1',
        accountId: null,
        categoryId: 'cat-1',
        recurrenceId: 'rec-1',
        type: 'EXPENSE',
        amount: 120,
        description: 'Internet',
        dueDate: '2026-11-15',
        status: 'PENDING',
        customized: false,
        active: true
      }
    ]);
  }

  it('should perform 1-click pay when accountId is set and open Pay Modal when accountId is null', () => {
    const fixture = TestBed.createComponent(TransactionsComponent);
    fixture.detectChanges();
    flushInitialLoads();
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp.transactions().length).toBe(2);

    // 1. 1-click pay on transaction that already has accountId
    comp.onQuickPay(comp.transactions()[0]);
    const payReq1 = httpMock.expectOne('http://localhost:8080/api/v1/transactions/tx-with-acc/pay');
    expect(payReq1.request.method).toBe('PATCH');
    expect(payReq1.request.body.accountId).toBe('acc-1');
    payReq1.flush({
      ...comp.transactions()[0],
      status: 'PAID',
      paidDate: '2026-11-03'
    });
    expect(comp.transactions()[0].status).toBe('PAID');

    // 2. Quick pay on transaction without accountId should open Pay Modal
    comp.onQuickPay(comp.transactions()[1]);
    expect(comp.showPayModal).toBe(true);
    expect(comp.payingTransaction?.id).toBe('tx-no-acc');

    comp.payAccountId = 'acc-1';
    comp.payDate = '2026-11-15';
    comp.confirmPayModal();

    const payReq2 = httpMock.expectOne('http://localhost:8080/api/v1/transactions/tx-no-acc/pay');
    expect(payReq2.request.method).toBe('PATCH');
    expect(payReq2.request.body).toEqual({
      accountId: 'acc-1',
      amount: 120,
      paidDate: '2026-11-15'
    });
    payReq2.flush({
      ...comp.transactions()[1],
      accountId: 'acc-1',
      status: 'PAID',
      paidDate: '2026-11-15'
    });
    expect(comp.showPayModal).toBe(false);
    expect(comp.transactions()[1].status).toBe('PAID');

    // 3. Unpay reverts to PENDING
    comp.onUnpay(comp.transactions()[0]);
    const unpayReq = httpMock.expectOne('http://localhost:8080/api/v1/transactions/tx-with-acc/unpay');
    expect(unpayReq.request.method).toBe('PATCH');
    unpayReq.flush({
      ...comp.transactions()[0],
      status: 'PENDING',
      paidDate: null
    });
    expect(comp.transactions()[0].status).toBe('PENDING');
  });

  it('should create installment recurrence from unified modal and update recurring transaction with mode', () => {
    const fixture = TestBed.createComponent(TransactionsComponent);
    fixture.detectChanges();
    flushInitialLoads();

    const comp = fixture.componentInstance;
    comp.openCreateModal();
    comp.entryKind = 'INSTALLMENT';
    comp.description = ' Geladeira ';
    comp.type = 'EXPENSE';
    comp.amount = 400;
    comp.totalInstallments = 10;
    comp.dueDate = '2026-11-20';
    comp.accountId = 'acc-1';
    comp.categoryId = 'cat-1';
    comp.onSubmitForm();

    const recReq = httpMock.expectOne('http://localhost:8080/api/v1/recurrences');
    expect(recReq.request.method).toBe('POST');
    expect(recReq.request.body.kind).toBe('INSTALLMENT');
    expect(recReq.request.body.totalInstallments).toBe(10);
    recReq.flush({ id: 'rec-new' });

    const reloadReq = httpMock.expectOne(
      'http://localhost:8080/api/v1/transactions?userId=u-1&startDate=2026-11-01&endDate=2026-11-30'
    );
    reloadReq.flush(comp.transactions());

    // Edit recurring transaction with THIS_AND_FOLLOWING
    comp.openEditModal(comp.transactions()[1]);
    expect(comp.isEditingRecurring).toBe(true);
    comp.amount = 149.9;
    comp.editMode = 'THIS_AND_FOLLOWING';
    comp.onSubmitForm();

    const putReq = httpMock.expectOne(
      'http://localhost:8080/api/v1/transactions/tx-no-acc?mode=THIS_AND_FOLLOWING'
    );
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body.amount).toBe(149.9);
    putReq.flush({ ...comp.transactions()[1], amount: 149.9 });

    const reloadAfterEdit = httpMock.expectOne(
      'http://localhost:8080/api/v1/transactions?userId=u-1&startDate=2026-11-01&endDate=2026-11-30'
    );
    reloadAfterEdit.flush(comp.transactions());
  });

  it('should predict invoice reference month when selecting a credit card account', () => {
    const fixture = TestBed.createComponent(TransactionsComponent);
    fixture.detectChanges();
    flushInitialLoads();

    const comp = fixture.componentInstance;
    comp.accounts.set([
      ...comp.accounts(),
      {
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
        currency: 'BRL',
        active: true
      }
    ]);

    comp.openCreateModal();
    comp.accountId = 'card-1';
    comp.dueDate = '2026-11-05';
    comp.onAccountChange();

    expect(comp.isSelectedAccountCreditCard()).toBe(true);
    expect(comp.type).toBe('EXPENSE');
    expect(comp.getPredictedInvoiceMonth()).toBe('2026-12');
  });

  it('should create transfer between accounts via openTransferModal', () => {
    const fixture = TestBed.createComponent(TransactionsComponent);
    fixture.detectChanges();
    flushInitialLoads();

    const comp = fixture.componentInstance;
    comp.accounts.set([
      ...comp.accounts(),
      {
        id: 'acc-savings',
        userId: 'u-1',
        name: 'Poupança Inter',
        bankCode: '077',
        accountType: 'SAVINGS',
        initialBalance: 500,
        currentBalance: 500,
        currency: 'BRL',
        active: true
      }
    ]);

    comp.openTransferModal();
    expect(comp.type).toBe('TRANSFER');
    expect(comp.accountId).toBe('acc-1');
    expect(comp.destinationAccountId).toBe('acc-savings');

    comp.amount = 300;
    comp.description = 'Aporte Poupança';
    comp.dueDate = '2026-11-06';
    comp.onSubmitForm();

    const postReq = httpMock.expectOne('http://localhost:8080/api/v1/transactions');
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body.type).toBe('TRANSFER');
    expect(postReq.request.body.accountId).toBe('acc-1');
    expect(postReq.request.body.destinationAccountId).toBe('acc-savings');
    expect(postReq.request.body.amount).toBe(300);
    postReq.flush({ id: 'tx-t1' });

    const reloadReq = httpMock.expectOne(
      'http://localhost:8080/api/v1/transactions?userId=u-1&startDate=2026-11-01&endDate=2026-11-30'
    );
    reloadReq.flush(comp.transactions());
  });
});
