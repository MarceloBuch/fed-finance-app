import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RecurrencesComponent } from './recurrences.component';
import { UserContextService } from '../../core/services/user-context.service';

describe('RecurrencesComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecurrencesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(UserContextService);

    const userReq = httpMock.expectOne('http://localhost:8080/api/v1/users');
    userReq.flush([{ id: 'u-1', name: 'Marcelo', email: 'marcelo@test.com', active: true }]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should filter FIXED and INSTALLMENT tabs, create installment from total value, and delete recurrence', () => {
    const fixture = TestBed.createComponent(RecurrencesComponent);
    fixture.detectChanges();

    const accReq = httpMock.expectOne('http://localhost:8080/api/v1/accounts/user/u-1');
    accReq.flush([]);

    const catReq = httpMock.expectOne('http://localhost:8080/api/v1/categories/user/u-1');
    catReq.flush([]);

    const recReq = httpMock.expectOne('http://localhost:8080/api/v1/recurrences/user/u-1');
    recReq.flush([
      {
        id: 'rec-fixo',
        userId: 'u-1',
        kind: 'FIXED',
        type: 'EXPENSE',
        amount: 1500,
        description: 'Aluguel',
        frequency: 'MONTHLY',
        dayOfMonth: 5,
        startDate: '2026-11-05',
        active: true
      },
      {
        id: 'rec-parc',
        userId: 'u-1',
        kind: 'INSTALLMENT',
        type: 'EXPENSE',
        amount: 250,
        description: 'Monitor 4K',
        frequency: 'MONTHLY',
        dayOfMonth: 10,
        startDate: '2026-11-10',
        totalInstallments: 10,
        active: true
      }
    ]);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp.recurringList().length).toBe(1);
    expect(comp.installmentList().length).toBe(1);

    // Switch to INSTALLMENT tab and open modal
    comp.activeTab.set('INSTALLMENT');
    comp.openCreateModal();
    expect(comp.kind).toBe('INSTALLMENT');

    comp.description = 'Notebook';
    comp.type = 'EXPENSE';
    comp.amountInputMode = 'TOTAL_VALUE';
    comp.totalPurchaseValue = 3600;
    comp.totalInstallments = 12;
    comp.startDate = '2026-11-15';
    comp.onSubmit();

    const postReq = httpMock.expectOne('http://localhost:8080/api/v1/recurrences');
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body.kind).toBe('INSTALLMENT');
    expect(postReq.request.body.totalAmount).toBe(3600);
    expect(postReq.request.body.totalInstallments).toBe(12);
    postReq.flush({
      id: 'rec-new',
      userId: 'u-1',
      kind: 'INSTALLMENT',
      type: 'EXPENSE',
      amount: 300,
      description: 'Notebook',
      frequency: 'MONTHLY',
      dayOfMonth: 15,
      startDate: '2026-11-15',
      totalInstallments: 12,
      active: true
    });

    expect(comp.installmentList().length).toBe(2);

    // Delete recurrence
    comp.deleteRecurrence('rec-fixo');
    const delReq = httpMock.expectOne('http://localhost:8080/api/v1/recurrences/rec-fixo');
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush(null);

    expect(comp.recurringList().length).toBe(0);
  });
});
