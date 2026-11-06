import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateUserRequest, UpdateUserRequest, User } from '../models/finance.models';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  readonly currentUser = signal<User | null>(null);
  readonly currentUserId = computed(() => this.currentUser()?.id ?? null);

  constructor() {
    this.initUserContext();
  }

  initUserContext(): void {
    this.http.get<User[]>(this.apiUrl).pipe(
      catchError(() => of([] as User[]))
    ).subscribe(users => {
      if (users && users.length > 0) {
        this.currentUser.set(users[0]);
      } else {
        this.createDefaultUser();
      }
    });
  }

  updateUser(id: string, request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, request).pipe(
      tap(updated => this.currentUser.set(updated))
    );
  }

  private createDefaultUser(): void {
    const defaultUser: CreateUserRequest = {
      name: 'Usuário Padrão',
      email: 'usuario.padrao@finance.com'
    };
    this.http.post<User>(this.apiUrl, defaultUser).pipe(
      catchError(() => of(null))
    ).subscribe(user => {
      if (user) {
        this.currentUser.set(user);
      }
    });
  }
}
