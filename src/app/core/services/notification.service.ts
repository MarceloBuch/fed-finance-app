import { Injectable, signal } from '@angular/core';

export interface ToastNotification {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  readonly toasts = signal<ToastNotification[]>([]);

  showSuccess(message: string): void {
    this.addToast('SUCCESS', message);
  }

  showError(message: string): void {
    this.addToast('ERROR', message);
  }

  showInfo(message: string): void {
    this.addToast('INFO', message);
  }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(item => item.id !== id));
  }

  private addToast(type: ToastNotification['type'], message: string): void {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.toasts.update(list => [...list, { id, type, message }]);
    setTimeout(() => {
      this.dismiss(id);
    }, 5000);
  }
}
