import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserContextService } from '../../core/services/user-context.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  readonly userContext = inject(UserContextService);
  private readonly notificationService = inject(NotificationService);

  name = '';
  email = '';

  constructor() {
    effect(() => {
      const user = this.userContext.currentUser();
      if (user) {
        this.name = user.name;
        this.email = user.email;
      }
    });
  }

  onSubmit(): void {
    const userId = this.userContext.currentUserId();
    if (!userId || !this.name.trim() || !this.email.trim()) {
      return;
    }

    this.userContext.updateUser(userId, {
      name: this.name.trim(),
      email: this.email.trim()
    }).subscribe({
      next: () => {
        this.notificationService.showSuccess('Perfil atualizado com sucesso!');
      }
    });
  }
}
