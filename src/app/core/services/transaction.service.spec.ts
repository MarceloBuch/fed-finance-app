import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TransactionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list transactions with filters via GET /api/v1/transactions', () => {
    service.listTransactions({
      userId: 'u-1',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      status: 'PENDING'
    }).subscribe(txs => {
      expect(txs.length).toBe(1);
      expect(txs[0].status).toBe('PENDING');
    });

    const req = httpMock.expectOne(
      'http://localhost:8080/api/v1/transactions?userId=u-1&startDate=2026-11-01&endDate=2026-11-30&status=PENDING'
    );
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 'tx-1',
        userId: 'u-1',
        type: 'EXPENSE',
        amount: 150,
        description: 'Luz',
        dueDate: '2026-11-10',
        status: 'PENDING',
        customized: false,
        active: true
      }
    ]);
  });

  it('should create, update with mode, pay, unpay, and delete a transaction', () => {
    service.createTransaction({
      userId: 'u-1',
      type: 'EXPENSE',
      amount: 120,
      description: 'Internet',
      dueDate: '2026-11-15',
      status: 'PENDING'
    }).subscribe();

    const postReq = httpMock.expectOne('http://localhost:8080/api/v1/transactions');
    expect(postReq.request.method).toBe('POST');
    postReq.flush({ id: 'tx-2' });

    service.updateTransaction('tx-2', {
      type: 'EXPENSE',
      amount: 135,
      description: 'Internet Fibra',
      dueDate: '2026-11-15'
    }, 'THIS_AND_FOLLOWING').subscribe();

    const putReq = httpMock.expectOne('http://localhost:8080/api/v1/transactions/tx-2?mode=THIS_AND_FOLLOWING');
    expect(putReq.request.method).toBe('PUT');
    putReq.flush({ id: 'tx-2' });

    service.payTransaction('tx-2', { accountId: 'acc-1', paidDate: '2026-11-15' }).subscribe();
    const payReq = httpMock.expectOne('http://localhost:8080/api/v1/transactions/tx-2/pay');
    expect(payReq.request.method).toBe('PATCH');
    payReq.flush({ id: 'tx-2', status: 'PAID' });

    service.unpayTransaction('tx-2').subscribe();
    const unpayReq = httpMock.expectOne('http://localhost:8080/api/v1/transactions/tx-2/unpay');
    expect(unpayReq.request.method).toBe('PATCH');
    unpayReq.flush({ id: 'tx-2', status: 'PENDING' });

    service.deleteTransaction('tx-2').subscribe();
    const delReq = httpMock.expectOne('http://localhost:8080/api/v1/transactions/tx-2');
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush(null);
  });
});
