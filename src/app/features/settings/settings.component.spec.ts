import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SettingsComponent } from './settings.component';
import { UserContextService } from '../../core/services/user-context.service';

describe('SettingsComponent', () => {
  let httpMock: HttpTestingController;
  let userContext: UserContextService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
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

  it('should load active user profile and update name and email on submit', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp.name).toBe('Marcelo');
    expect(comp.email).toBe('marcelo@test.com');

    comp.name = 'Marcelo Silva';
    comp.email = 'marcelo.silva@test.com';
    comp.onSubmit();

    const putReq = httpMock.expectOne('http://localhost:8080/api/v1/users/u-1');
    expect(putReq.request.method).toBe('PUT');
    putReq.flush({
      id: 'u-1',
      name: 'Marcelo Silva',
      email: 'marcelo.silva@test.com',
      active: true
    });

    expect(userContext.currentUser()?.name).toBe('Marcelo Silva');
  });
});
