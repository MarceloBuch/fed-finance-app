import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list categories by userId via GET /api/v1/categories/user/{userId}', () => {
    service.getCategoriesByUser('u-1').subscribe(categories => {
      expect(categories.length).toBe(1);
      expect(categories[0].userId).toBeNull();
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/categories/user/u-1');
    expect(req.request.method).toBe('GET');
    req.flush([
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
  });

  it('should create, update and delete a custom category', () => {
    service.createCategory({
      userId: 'u-1',
      name: 'Assinaturas',
      type: 'EXPENSE',
      icon: 'tv',
      color: '#8B5CF6'
    }).subscribe();

    const postReq = httpMock.expectOne('http://localhost:8080/api/v1/categories');
    expect(postReq.request.method).toBe('POST');
    postReq.flush({ id: 'cat-2' });

    service.updateCategory('cat-2', {
      name: 'Streaming',
      icon: 'tv',
      color: '#EC4899'
    }).subscribe();

    const putReq = httpMock.expectOne('http://localhost:8080/api/v1/categories/cat-2');
    expect(putReq.request.method).toBe('PUT');
    putReq.flush({ id: 'cat-2' });

    service.deleteCategory('cat-2').subscribe();
    const delReq = httpMock.expectOne('http://localhost:8080/api/v1/categories/cat-2');
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush(null);
  });
});
