import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InvoiceService } from './invoice.service';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InvoiceService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(InvoiceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list card invoices and get invoice by referenceMonth', () => {
    service.listByCard('card-1').subscribe(list => {
      expect(list.length).toBe(1);
      expect(list[0].referenceMonth).toBe('2026-12');
    });

    const reqList = httpMock.expectOne('http://localhost:8080/api/v1/credit-cards/card-1/invoices');
    expect(reqList.request.method).toBe('GET');
    reqList.flush([
      {
        id: 'inv-1',
        creditCardAccountId: 'card-1',
        referenceMonth: '2026-12',
        periodStart: '2026-11-04',
        closingDate: '2026-12-03',
        dueDate: '2026-12-10',
        status: 'OPEN',
        totalAmount: 250,
        transactions: []
      }
    ]);

    service.getByCardAndMonth('card-1', '2026-12').subscribe(inv => {
      expect(inv.id).toBe('inv-1');
    });

    const reqMonth = httpMock.expectOne('http://localhost:8080/api/v1/credit-cards/card-1/invoices/2026-12');
    expect(reqMonth.request.method).toBe('GET');
    reqMonth.flush({
      id: 'inv-1',
      creditCardAccountId: 'card-1',
      referenceMonth: '2026-12',
      periodStart: '2026-11-04',
      closingDate: '2026-12-03',
      dueDate: '2026-12-10',
      status: 'OPEN',
      totalAmount: 250,
      transactions: []
    });
  });

  it('should pay and unpay an invoice and predict invoice reference month', () => {
    service.payInvoice('inv-1', { accountId: 'acc-1', paidDate: '2026-12-10' }).subscribe(inv => {
      expect(inv.status).toBe('PAID');
    });

    const payReq = httpMock.expectOne('http://localhost:8080/api/v1/invoices/inv-1/pay');
    expect(payReq.request.method).toBe('POST');
    payReq.flush({ id: 'inv-1', status: 'PAID' });

    service.unpayInvoice('inv-1').subscribe(inv => {
      expect(inv.status).toBe('CLOSED');
    });

    const unpayReq = httpMock.expectOne('http://localhost:8080/api/v1/invoices/inv-1/unpay');
    expect(unpayReq.request.method).toBe('POST');
    unpayReq.flush({ id: 'inv-1', status: 'CLOSED' });

    expect(service.predictInvoiceMonth('2026-11-02', 3, 10)).toBe('2026-11');
    expect(service.predictInvoiceMonth('2026-11-04', 3, 10)).toBe('2026-12');
  });
});
