import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { NotificationService } from '../services/notification.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let notificationService: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    notificationService = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should capture ProblemDetail detail message and notify via NotificationService', () => {
    let errorCaught = false;
    http.get('/api/v1/test').subscribe({
      error: () => {
        errorCaught = true;
      }
    });

    const req = httpMock.expectOne('/api/v1/test');
    req.flush(
      { detail: 'Account is required to mark a transaction as PAID.' },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(errorCaught).toBe(true);
    expect(notificationService.toasts().length).toBe(1);
    expect(notificationService.toasts()[0].type).toBe('ERROR');
    expect(notificationService.toasts()[0].message).toBe('Account is required to mark a transaction as PAID.');
  });
});
