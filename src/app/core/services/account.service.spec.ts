import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list accounts by userId via GET /api/v1/accounts/user/{userId}', () => {
    service.getAccountsByUser('u-1').subscribe(accounts => {
      expect(accounts.length).toBe(1);
      expect(accounts[0].currentBalance).toBe(2500);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/accounts/user/u-1');
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 'acc-1',
        userId: 'u-1',
        name: 'Conta Principal',
        bankCode: '077',
        accountType: 'CHECKING',
        initialBalance: 1000,
        currentBalance: 2500,
        currency: 'BRL',
        active: true
      }
    ]);
  });

  it('should create, update and delete an account', () => {
    service.createAccount({
      userId: 'u-1',
      name: 'Poupança',
      bankCode: '260',
      accountType: 'SAVINGS',
      initialBalance: 500,
      currency: 'BRL'
    }).subscribe();

    const postReq = httpMock.expectOne('http://localhost:8080/api/v1/accounts');
    expect(postReq.request.method).toBe('POST');
    postReq.flush({ id: 'acc-2' });

    service.updateAccount('acc-2', {
      name: 'Poupança Editada',
      bankCode: '260',
      accountType: 'SAVINGS',
      initialBalance: 600,
      currency: 'BRL'
    }).subscribe();

    const putReq = httpMock.expectOne('http://localhost:8080/api/v1/accounts/acc-2');
    expect(putReq.request.method).toBe('PUT');
    putReq.flush({ id: 'acc-2' });

    service.deleteAccount('acc-2').subscribe();
    const delReq = httpMock.expectOne('http://localhost:8080/api/v1/accounts/acc-2');
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush(null);
  });
});
