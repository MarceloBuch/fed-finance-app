import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserContextService } from '../../core/services/user-context.service';
import { RecurrenceService } from '../../core/services/recurrence.service';
import { AccountService } from '../../core/services/account.service';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  Account,
  Category,
  Recurrence,
  RecurrenceFrequency,
  RecurrenceKind
} from '../../core/models/finance.models';

export type AmountInputMode = 'INSTALLMENT_VALUE' | 'TOTAL_VALUE';

@Component({
  selector: 'app-recurrences',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './recurrences.component.html'
})
export class RecurrencesComponent {
  private readonly userContext = inject(UserContextService);
  private readonly recurrenceService = inject(RecurrenceService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);

  readonly activeTab = signal<RecurrenceKind>('FIXED');
  readonly recurrences = signal<Recurrence[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly nonCardAccounts = computed(() =>
    this.accounts().filter(a => a.accountType !== 'CREDIT_CARD')
  );
  readonly categories = signal<Category[]>([]);

  readonly recurringList = computed(() =>
    this.recurrences().filter(r => r.kind === 'FIXED')
  );

  readonly installmentList = computed(() =>
    this.recurrences().filter(r => r.kind === 'INSTALLMENT')
  );

  readonly totalMonthlyFixedExpense = computed(() =>
    this.recurringList()
      .filter(r => r.type === 'EXPENSE' && r.active)
      .reduce((acc, r) => acc + r.amount, 0)
  );

  readonly totalMonthlyInstallmentCommitment = computed(() =>
    this.installmentList()
      .filter(r => r.type === 'EXPENSE' && r.active)
      .reduce((acc, r) => acc + r.amount, 0)
  );

  showModal = false;
  kind: RecurrenceKind = 'FIXED';
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE';
  description = '';
  amount = 0;
  amountInputMode: AmountInputMode = 'INSTALLMENT_VALUE';
  totalPurchaseValue = 0;
  totalInstallments = 2;
  frequency: RecurrenceFrequency = 'MONTHLY';
  startDate = new Date().toISOString().slice(0, 10);
  accountId = '';
  destinationAccountId = '';
  categoryId = '';

  constructor() {
    effect(() => {
      const userId = this.userContext.currentUserId();
      if (userId) {
        this.loadData(userId);
      }
    });
  }

  loadData(userId: string): void {
    this.accountService.getAccountsByUser(userId).subscribe({
      next: accs => this.accounts.set(accs)
    });
    this.categoryService.getCategoriesByUser(userId).subscribe({
      next: cats => this.categories.set(cats)
    });
    this.recurrenceService.listRecurrences(userId).subscribe({
      next: list => this.recurrences.set(list)
    });
  }

  openCreateModal(): void {
    this.kind = this.activeTab();
    this.type = 'EXPENSE';
    this.description = '';
    this.amount = 0;
    this.amountInputMode = 'INSTALLMENT_VALUE';
    this.totalPurchaseValue = 0;
    this.totalInstallments = 2;
    this.frequency = 'MONTHLY';
    this.startDate = new Date().toISOString().slice(0, 10);
    this.accountId = '';
    this.destinationAccountId = '';
    this.categoryId = '';
    this.showModal = true;
  }

  onTypeChange(): void {
    if (this.type === 'TRANSFER') {
      const checking =
        this.nonCardAccounts().find(a => a.accountType === 'CHECKING') ?? this.nonCardAccounts()[0];
      if (!this.accountId) {
        this.accountId = checking?.id ?? '';
      }
      if (!this.destinationAccountId || this.destinationAccountId === this.accountId) {
        const dest =
          this.nonCardAccounts().find(
            a => a.id !== this.accountId && (a.accountType === 'SAVINGS' || a.accountType === 'INVESTMENT')
          ) ?? this.nonCardAccounts().find(a => a.id !== this.accountId);
        this.destinationAccountId = dest?.id ?? '';
      }
      this.categoryId = '';
    }
  }

  onSubmit(): void {
    const userId = this.userContext.currentUserId();
    if (!userId || !this.description.trim() || !this.startDate) {
      return;
    }

    const useTotalValue = this.kind === 'INSTALLMENT' && this.amountInputMode === 'TOTAL_VALUE';
    if (useTotalValue && (this.totalPurchaseValue <= 0 || this.totalInstallments < 2)) {
      return;
    }
    if (!useTotalValue && this.amount <= 0) {
      return;
    }
    if (this.type === 'TRANSFER' && (!this.accountId || !this.destinationAccountId || this.accountId === this.destinationAccountId)) {
      this.notificationService.showError('Selecione contas de origem e destino diferentes.');
      return;
    }

    const dayOfMonth = Number(this.startDate.split('-')[2]) || 1;

    this.recurrenceService.createRecurrence({
      userId,
      accountId: this.accountId || null,
      destinationAccountId: this.type === 'TRANSFER' ? (this.destinationAccountId || null) : null,
      categoryId: this.type === 'TRANSFER' ? null : (this.categoryId || null),
      kind: this.kind,
      type: this.type,
      amount: useTotalValue ? null : this.amount,
      totalAmount: useTotalValue ? this.totalPurchaseValue : null,
      description: this.description.trim(),
      frequency: this.kind === 'FIXED' ? this.frequency : 'MONTHLY',
      intervalStep: 1,
      dayOfMonth,
      startDate: this.startDate,
      totalInstallments: this.kind === 'INSTALLMENT' ? this.totalInstallments : null
    }).subscribe({
      next: created => {
        this.recurrences.update(list => [...list, created]);
        this.notificationService.showSuccess(
          this.kind === 'FIXED'
            ? 'Conta fixa cadastrada com sucesso!'
            : 'Parcelamento cadastrado com sucesso!'
        );
        this.showModal = false;
      }
    });
  }

  deleteRecurrence(id: string): void {
    this.recurrenceService.deleteRecurrence(id).subscribe({
      next: () => {
        this.recurrences.update(list => list.filter(r => r.id !== id));
        this.notificationService.showSuccess('Série encerrada e parcelas pendentes removidas!');
      }
    });
  }

  getAccountName(accountId?: string | null): string {
    if (!accountId) return 'A definir na baixa';
    return this.accounts().find(a => a.id === accountId)?.name ?? 'Conta';
  }

  getCategoryName(categoryId?: string | null): string {
    if (!categoryId) return 'Sem Categoria';
    return this.categories().find(c => c.id === categoryId)?.name ?? 'Categoria';
  }

  getFrequencyLabel(freq: RecurrenceFrequency): string {
    switch (freq) {
      case 'MONTHLY':
        return 'Mensal';
      case 'YEARLY':
        return 'Anual';
    }
  }
}
