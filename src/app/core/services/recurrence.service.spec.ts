import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RecurrenceService } from './recurrence.service';

describe('RecurrenceService', () => {
  let service: RecurrenceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(RecurrenceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list, create, and delete recurrences via /api/v1/recurrences', () => {
    service.listRecurrences('u-1').subscribe(list => {
      expect(list.length).toBe(1);
      expect(list[0].kind).toBe('FIXED');
    });

    const listReq = httpMock.expectOne('http://localhost:8080/api/v1/recurrences/user/u-1');
    expect(listReq.request.method).toBe('GET');
    listReq.flush([
      {
        id: 'rec-1',
        userId: 'u-1',
        kind: 'FIXED',
        type: 'EXPENSE',
        amount: 1500,
        description: 'Aluguel',
        frequency: 'MONTHLY',
        startDate: '2026-11-05',
        active: true
      }
    ]);

    service.createRecurrence({
      userId: 'u-1',
      kind: 'INSTALLMENT',
      type: 'EXPENSE',
      amount: 300,
      description: 'Notebook',
      frequency: 'MONTHLY',
      startDate: '2026-11-10',
      totalInstallments: 10
    }).subscribe();

    const postReq = httpMock.expectOne('http://localhost:8080/api/v1/recurrences');
    expect(postReq.request.method).toBe('POST');
    postReq.flush({ id: 'rec-2' });

    service.deleteRecurrence('rec-2').subscribe();
    const delReq = httpMock.expectOne('http://localhost:8080/api/v1/recurrences/rec-2');
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush(null);
  });
});
