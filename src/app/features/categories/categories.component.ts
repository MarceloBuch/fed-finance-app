import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserContextService } from '../../core/services/user-context.service';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { Category, CategoryType } from '../../core/models/finance.models';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html'
})
export class CategoriesComponent {
  private readonly userContext = inject(UserContextService);
  private readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);

  readonly categories = signal<Category[]>([]);

  readonly incomeCategories = computed(() =>
    this.categories().filter(c => c.type === 'INCOME')
  );

  readonly expenseCategories = computed(() =>
    this.categories().filter(c => c.type === 'EXPENSE')
  );

  showModal = false;
  editingCategoryId: string | null = null;

  name = '';
  type: CategoryType = 'EXPENSE';
  parentId = '';
  color = '#00E5FF';
  icon = 'tag';

  constructor() {
    effect(() => {
      const userId = this.userContext.currentUserId();
      if (userId) {
        this.loadCategories(userId);
      }
    });
  }

  loadCategories(userId: string): void {
    this.categoryService.getCategoriesByUser(userId).subscribe({
      next: cats => this.categories.set(cats)
    });
  }

  isGlobal(category: Category): boolean {
    return !category.userId;
  }

  openCreateModal(): void {
    this.editingCategoryId = null;
    this.name = '';
    this.type = 'EXPENSE';
    this.parentId = '';
    this.color = '#00E5FF';
    this.icon = 'tag';
    this.showModal = true;
  }

  openEditModal(category: Category): void {
    if (this.isGlobal(category)) {
      return;
    }
    this.editingCategoryId = category.id;
    this.name = category.name;
    this.type = category.type;
    this.parentId = category.parentId || '';
    this.color = category.color || '#00E5FF';
    this.icon = category.icon || 'tag';
    this.showModal = true;
  }

  onSubmit(): void {
    const userId = this.userContext.currentUserId();
    if (!userId || !this.name.trim()) {
      return;
    }

    if (this.editingCategoryId) {
      const id = this.editingCategoryId;
      this.categoryService.updateCategory(id, {
        parentId: this.parentId || null,
        name: this.name.trim(),
        color: this.color,
        icon: this.icon
      }).subscribe({
        next: updated => {
          this.categories.update(list => list.map(c => (c.id === id ? updated : c)));
          this.notificationService.showSuccess('Categoria atualizada com sucesso!');
          this.showModal = false;
        }
      });
    } else {
      this.categoryService.createCategory({
        userId,
        parentId: this.parentId || null,
        name: this.name.trim(),
        type: this.type,
        color: this.color,
        icon: this.icon
      }).subscribe({
        next: created => {
          this.categories.update(list => [...list, created]);
          this.notificationService.showSuccess('Categoria criada com sucesso!');
          this.showModal = false;
        }
      });
    }
  }

  deleteCategory(category: Category): void {
    if (this.isGlobal(category)) {
      return;
    }
    this.categoryService.deleteCategory(category.id).subscribe({
      next: () => {
        this.categories.update(list => list.filter(c => c.id !== category.id));
        this.notificationService.showSuccess('Categoria removida com sucesso!');
      }
    });
  }
}
