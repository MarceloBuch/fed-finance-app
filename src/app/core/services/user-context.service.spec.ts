import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserContextService } from './user-context.service';

describe('UserContextService', () => {
  let service: UserContextService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(UserContextService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load existing user on init from /api/v1/users', () => {
    const req = httpMock.expectOne('http://localhost:8080/api/v1/users');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'u-1', name: 'Marcelo', email: 'marcelo@test.com', active: true }]);

    expect(service.currentUser()?.id).toBe('u-1');
    expect(service.currentUserId()).toBe('u-1');
  });

  it('should create default user when /api/v1/users returns empty list', () => {
    const getReq = httpMock.expectOne('http://localhost:8080/api/v1/users');
    getReq.flush([]);

    const postReq = httpMock.expectOne('http://localhost:8080/api/v1/users');
    expect(postReq.request.method).toBe('POST');
    postReq.flush({ id: 'u-default', name: 'Usuário Padrão', email: 'usuario.padrao@finance.com', active: true });

    expect(service.currentUserId()).toBe('u-default');
  });

  it('should update user via PUT /api/v1/users/{id}', () => {
    const getReq = httpMock.expectOne('http://localhost:8080/api/v1/users');
    getReq.flush([{ id: 'u-1', name: 'Marcelo', email: 'marcelo@test.com', active: true }]);

    service.updateUser('u-1', { name: 'Marcelo Updated', email: 'novo@test.com' }).subscribe();

    const putReq = httpMock.expectOne('http://localhost:8080/api/v1/users/u-1');
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual({ name: 'Marcelo Updated', email: 'novo@test.com' });
    putReq.flush({ id: 'u-1', name: 'Marcelo Updated', email: 'novo@test.com', active: true });

    expect(service.currentUser()?.name).toBe('Marcelo Updated');
  });
});
