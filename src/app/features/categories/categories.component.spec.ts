import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoriesComponent } from './categories.component';
import { UserContextService } from '../../core/services/user-context.service';

describe('CategoriesComponent', () => {
  let httpMock: HttpTestingController;
  let userContext: UserContextService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriesComponent],
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

  it('should display global and custom categories and allow creating/editing custom categories', () => {
    const fixture = TestBed.createComponent(CategoriesComponent);
    fixture.detectChanges();

    const listReq = httpMock.expectOne('http://localhost:8080/api/v1/categories/user/u-1');
    listReq.flush([
      {
        id: 'cat-global',
        userId: null,
        name: 'Moradia',
        type: 'EXPENSE',
        icon: 'home',
        color: '#EF4444',
        active: true
      },
      {
        id: 'cat-custom',
        userId: 'u-1',
        name: 'Streaming',
        type: 'EXPENSE',
        icon: 'tv',
        color: '#8B5CF6',
        active: true
      }
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Moradia');
    expect(el.textContent).toContain('Sistema');
    expect(el.textContent).toContain('Streaming');

    const comp = fixture.componentInstance;
    comp.openCreateModal();
    comp.name = 'Freelance';
    comp.type = 'INCOME';
    comp.color = '#10B981';
    comp.icon = 'briefcase';
    comp.onSubmit();

    const postReq = httpMock.expectOne('http://localhost:8080/api/v1/categories');
    expect(postReq.request.method).toBe('POST');
    postReq.flush({
      id: 'cat-new',
      userId: 'u-1',
      name: 'Freelance',
      type: 'INCOME',
      icon: 'briefcase',
      color: '#10B981',
      active: true
    });

    expect(comp.categories().length).toBe(3);
  });
});
