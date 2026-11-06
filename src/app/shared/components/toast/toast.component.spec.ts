import { TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { NotificationService } from '../../../core/services/notification.service';

describe('ToastComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
    }).compileComponents();
  });

  it('should render active toasts and dismiss when button is clicked', () => {
    const notificationService = TestBed.inject(NotificationService);
    notificationService.showError('Falha ao salvar lançamento');

    const fixture = TestBed.createComponent(ToastComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Falha ao salvar lançamento');

    const closeBtn = el.querySelector('button[data-testid="toast-dismiss"]') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.click();
    fixture.detectChanges();

    expect(notificationService.toasts().length).toBe(0);
  });
});
