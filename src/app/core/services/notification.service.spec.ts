import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should add and remove toast notifications', () => {
    service.showSuccess('Operação realizada com sucesso!');
    service.showError('Erro de validação');

    expect(service.toasts().length).toBe(2);
    expect(service.toasts()[0].type).toBe('SUCCESS');
    expect(service.toasts()[0].message).toBe('Operação realizada com sucesso!');
    expect(service.toasts()[1].type).toBe('ERROR');
    expect(service.toasts()[1].message).toBe('Erro de validação');

    const firstId = service.toasts()[0].id;
    service.dismiss(firstId);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('ERROR');
  });
});
