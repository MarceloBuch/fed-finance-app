import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Erro inesperado ao comunicar com o servidor.';

      if (error.error && typeof error.error === 'object') {
        if (error.error.detail) {
          message = error.error.detail;
        } else if (error.error.message) {
          message = error.error.message;
        } else if (error.error.title) {
          message = error.error.title;
        }
      } else if (typeof error.error === 'string' && error.error.trim().length > 0) {
        message = error.error;
      } else if (error.message) {
        message = error.message;
      }

      notificationService.showError(message);
      return throwError(() => error);
    })
  );
};
