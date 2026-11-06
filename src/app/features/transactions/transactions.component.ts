import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserContextService } from '../../core/services/user-context.service';
import { PeriodContextService } from '../../core/services/period-context.service';
import { AccountService } from '../../core/services/account.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';
import { RecurrenceService } from '../../core/services/recurrence.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  Account,
  Category,
  RecurrenceEditMode,
  RecurrenceFrequency,
  Transaction,
  TransactionStatus,
  TransactionType
} from '../../core/models/finance.models';

export type EntryKind = 'SINGLE' | 'FIXED' | 'INSTALLMENT';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DecimalPipe],
  templateUrl: './transactions.component.html'
})
export class TransactionsComponent {
  private readonly userContext = inject(UserContextService);
  readonly periodContext = inject(PeriodContextService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);
  private readonly recurrenceService = inject(RecurrenceService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly notificationService = inject(NotificationService);

  readonly accounts = signal<Account[]>([]);
  readonly nonCardAccounts = computed(() =>
    this.accounts().filter(a => a.accountType !== 'CREDIT_CARD')
  );
  readonly categories = signal<Category[]>([]);
  readonly transactions = signal<Transaction[]>([]);

  // Filters
  filterStatus = '';
  filterType = '';
  filterAccountId = '';
  filterCategoryId = '';

  // Summary metrics
  readonly totalIncome = computed(() =>
    this.transactions()
      .filter(t => t.type === 'INCOME')
      .reduce((acc, t) => acc + t.amount, 0)
  );

  readonly totalExpense = computed(() =>
    this.transactions()
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + t.amount, 0)
  );

  readonly totalPendingExpense = computed(() =>
    this.transactions()
      .filter(t => t.type === 'EXPENSE' && t.status === 'PENDING')
      .reduce((acc, t) => acc + t.amount, 0)
  );

  readonly totalPaidExpense = computed(() =>
    this.transactions()
      .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
      .reduce((acc, t) => acc + t.amount, 0)
  );

  // Create / Edit Modal
  showFormModal = false;
  editingTransactionId: string | null = null;
  isEditingRecurring = false;
  editMode: RecurrenceEditMode = 'THIS';

  entryKind: EntryKind = 'SINGLE';
  description = '';
  notes = '';
  type: TransactionType = 'EXPENSE';
  amount = 0;
  dueDate = new Date().toISOString().slice(0, 10);
  paidDate = new Date().toISOString().slice(0, 10);
  status: TransactionStatus = 'PENDING';
  accountId = '';
  destinationAccountId = '';
  categoryId = '';

  // Recurrence / Installment fields
  frequency: RecurrenceFrequency = 'MONTHLY';
  dayOfMonth = new Date().getDate();
  totalInstallments = 2;

  // Quick Pay Modal
  showPayModal = false;
  payingTransaction: Transaction | null = null;
  payAccountId = '';
  payAmount = 0;
  payDate = new Date().toISOString().slice(0, 10);

  constructor() {
    effect(() => {
      const userId = this.userContext.currentUserId();
      if (userId) {
        this.loadReferenceData(userId);
      }
    });

    effect(() => {
      const userId = this.userContext.currentUserId();
      const startDate = this.periodContext.startDate();
      const endDate = this.periodContext.endDate();
      if (userId && startDate && endDate) {
        this.loadTransactions();
      }
    });
  }

  loadReferenceData(userId: string): void {
    this.accountService.getAccountsByUser(userId).subscribe({
      next: accs => this.accounts.set(accs)
    });
    this.categoryService.getCategoriesByUser(userId).subscribe({
      next: cats => this.categories.set(cats)
    });
  }

  loadTransactions(): void {
    const userId = this.userContext.currentUserId();
    if (!userId) return;

    this.transactionService.listTransactions({
      userId,
      startDate: this.periodContext.startDate(),
      endDate: this.periodContext.endDate(),
      accountId: this.filterAccountId || undefined,
      categoryId: this.filterCategoryId || undefined,
      type: (this.filterType as TransactionType) || undefined,
      status: (this.filterStatus as TransactionStatus) || undefined
    }).subscribe({
      next: txs => {
        this.transactions.set(txs);
      }
    });
  }

  applyFilters(): void {
    this.loadTransactions();
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterType = '';
    this.filterAccountId = '';
    this.filterCategoryId = '';
    this.loadTransactions();
  }

  isSelectedAccountCreditCard(): boolean {
    if (!this.accountId) return false;
    const acc = this.accounts().find(a => a.id === this.accountId);
    return acc?.accountType === 'CREDIT_CARD';
  }

  onAccountChange(): void {
    if (this.isSelectedAccountCreditCard()) {
      this.type = 'EXPENSE';
      this.status = 'PAID';
    }
    if (this.type === 'TRANSFER' && this.destinationAccountId === this.accountId) {
      const other = this.nonCardAccounts().find(a => a.id !== this.accountId);
      this.destinationAccountId = other?.id ?? '';
    }
  }

  onTypeChange(): void {
    if (this.type === 'TRANSFER') {
      if (this.isSelectedAccountCreditCard() || !this.accountId) {
        const firstSource = this.nonCardAccounts()[0];
        this.accountId = firstSource?.id ?? '';
      }
      if (!this.destinationAccountId || this.destinationAccountId === this.accountId) {
        const preferredDest =
          this.nonCardAccounts().find(
            a => a.id !== this.accountId && (a.accountType === 'SAVINGS' || a.accountType === 'INVESTMENT')
          ) ?? this.nonCardAccounts().find(a => a.id !== this.accountId);
        this.destinationAccountId = preferredDest?.id ?? '';
      }
      this.categoryId = '';
    }
  }

  getPredictedInvoiceMonth(): string {
    if (!this.accountId || !this.dueDate) return '';
    const card = this.accounts().find(a => a.id === this.accountId && a.accountType === 'CREDIT_CARD');
    if (!card) return '';
    return this.invoiceService.predictInvoiceMonth(
      this.dueDate,
      card.closingDay ?? 3,
      card.dueDay ?? 10
    );
  }

  openCreateModal(): void {
    this.editingTransactionId = null;
    this.isEditingRecurring = false;
    this.editMode = 'THIS';
    this.entryKind = 'SINGLE';
    this.description = '';
    this.notes = '';
    this.type = 'EXPENSE';
    this.amount = 0;
    this.dueDate = this.periodContext.startDate();
    this.paidDate = new Date().toISOString().slice(0, 10);
    this.status = 'PENDING';
    this.accountId = '';
    this.destinationAccountId = '';
    this.categoryId = '';
    this.frequency = 'MONTHLY';
    this.dayOfMonth = 10;
    this.totalInstallments = 2;
    this.showFormModal = true;
  }

  openTransferModal(): void {
    this.openCreateModal();
    this.type = 'TRANSFER';
    this.status = 'PAID';
    this.dueDate = new Date().toISOString().slice(0, 10);
    this.paidDate = this.dueDate;
    this.description = 'Transferência entre Contas';
    const checking =
      this.nonCardAccounts().find(a => a.accountType === 'CHECKING') ?? this.nonCardAccounts()[0];
    this.accountId = checking?.id ?? '';
    const target =
      this.nonCardAccounts().find(
        a => a.id !== this.accountId && (a.accountType === 'SAVINGS' || a.accountType === 'INVESTMENT')
      ) ?? this.nonCardAccounts().find(a => a.id !== this.accountId);
    this.destinationAccountId = target?.id ?? '';
  }

  openEditModal(tx: Transaction): void {
    this.editingTransactionId = tx.id;
    this.isEditingRecurring = !!tx.recurrenceId;
    this.editMode = 'THIS';
    this.entryKind = 'SINGLE';
    this.description = tx.description;
    this.notes = tx.notes || '';
    this.type = tx.type;
    this.amount = tx.amount;
    this.dueDate = tx.dueDate;
    this.paidDate = tx.paidDate || new Date().toISOString().slice(0, 10);
    this.status = tx.status;
    this.accountId = tx.accountId || '';
    this.destinationAccountId = tx.destinationAccountId || '';
    this.categoryId = tx.categoryId || '';
    this.showFormModal = true;
  }

  onSubmitForm(): void {
    const userId = this.userContext.currentUserId();
    if (!userId || !this.description.trim() || this.amount <= 0 || !this.dueDate) {
      return;
    }

    const isCard = this.isSelectedAccountCreditCard();
    const effectiveType: TransactionType = isCard ? 'EXPENSE' : this.type;
    const effectiveStatus: TransactionStatus = isCard ? 'PAID' : this.status;

    if (effectiveType === 'TRANSFER') {
      if (!this.accountId || !this.destinationAccountId) {
        this.notificationService.showError('Selecione a conta de origem e a conta de destino.');
        return;
      }
      if (this.accountId === this.destinationAccountId) {
        this.notificationService.showError('A conta de origem e de destino devem ser diferentes.');
        return;
      }
    }

    if (this.editingTransactionId) {
      const id = this.editingTransactionId;
      this.transactionService.updateTransaction(
        id,
        {
          accountId: this.accountId || null,
          destinationAccountId: effectiveType === 'TRANSFER' ? (this.destinationAccountId || null) : null,
          categoryId: this.categoryId || null,
          type: effectiveType,
          amount: this.amount,
          description: this.description.trim(),
          notes: this.notes.trim() || null,
          dueDate: this.dueDate
        },
        this.isEditingRecurring ? this.editMode : 'THIS'
      ).subscribe({
        next: updated => {
          if (updated?.warning) {
            this.notificationService.showInfo(updated.warning);
          } else {
            this.notificationService.showSuccess('Lançamento atualizado com sucesso!');
          }
          this.showFormModal = false;
          this.loadTransactions();
        }
      });
      return;
    }

    if (this.entryKind === 'SINGLE') {
      this.transactionService.createTransaction({
        userId,
        accountId: this.accountId || null,
        destinationAccountId: effectiveType === 'TRANSFER' ? (this.destinationAccountId || null) : null,
        categoryId: this.categoryId || null,
        type: effectiveType,
        amount: this.amount,
        description: this.description.trim(),
        notes: this.notes.trim() || null,
        dueDate: this.dueDate,
        paidDate: effectiveStatus === 'PAID' ? (isCard ? this.dueDate : this.paidDate) : null,
        status: effectiveStatus
      }).subscribe({
        next: created => {
          if (created?.warning) {
            this.notificationService.showInfo(created.warning);
          } else {
            this.notificationService.showSuccess('Lançamento registrado com sucesso!');
          }
          this.showFormModal = false;
          this.loadTransactions();
        }
      });
    } else {
      this.recurrenceService.createRecurrence({
        userId,
        accountId: this.accountId || null,
        destinationAccountId: effectiveType === 'TRANSFER' ? (this.destinationAccountId || null) : null,
        categoryId: effectiveType === 'TRANSFER' ? null : (this.categoryId || null),
        kind: this.entryKind === 'FIXED' ? 'FIXED' : 'INSTALLMENT',
        type: effectiveType,
        amount: this.amount,
        description: this.description.trim(),
        frequency: this.entryKind === 'FIXED' ? this.frequency : 'MONTHLY',
        intervalStep: 1,
        dayOfMonth: Number(this.dueDate.split('-')[2]) || this.dayOfMonth,
        startDate: this.dueDate,
        totalInstallments: this.entryKind === 'INSTALLMENT' ? this.totalInstallments : null
      }).subscribe({
        next: () => {
          this.notificationService.showSuccess(
            this.entryKind === 'FIXED'
              ? 'Conta fixa criada com sucesso!'
              : 'Parcelamento criado com sucesso!'
          );
          this.showFormModal = false;
          this.loadTransactions();
        }
      });
    }
  }

  onQuickPay(tx: Transaction): void {
    if (tx.accountId) {
      const today = new Date().toISOString().slice(0, 10);
      this.transactionService.payTransaction(tx.id, {
        accountId: tx.accountId,
        amount: tx.amount,
        paidDate: today
      }).subscribe({
        next: updated => {
          this.transactions.update(list => list.map(t => (t.id === tx.id ? updated : t)));
          this.notificationService.showSuccess('Lançamento baixado como pago!');
        }
      });
    } else {
      this.openPayModal(tx);
    }
  }

  openPayModal(tx: Transaction): void {
    const nonCardAccounts = this.accounts().filter(a => a.accountType !== 'CREDIT_CARD');
    this.payingTransaction = tx;
    this.payAccountId = tx.accountId || (nonCardAccounts[0]?.id ?? '');
    this.payAmount = tx.amount;
    this.payDate = new Date().toISOString().slice(0, 10);
    this.showPayModal = true;
  }

  confirmPayModal(): void {
    if (!this.payingTransaction || !this.payAccountId) {
      return;
    }
    const txId = this.payingTransaction.id;
    this.transactionService.payTransaction(txId, {
      accountId: this.payAccountId,
      amount: this.payAmount,
      paidDate: this.payDate
    }).subscribe({
      next: updated => {
        this.transactions.update(list => list.map(t => (t.id === txId ? updated : t)));
        this.showPayModal = false;
        this.payingTransaction = null;
        this.notificationService.showSuccess('Lançamento baixado como pago!');
      }
    });
  }

  onUnpay(tx: Transaction): void {
    this.transactionService.unpayTransaction(tx.id).subscribe({
      next: updated => {
        this.transactions.update(list => list.map(t => (t.id === tx.id ? updated : t)));
        this.notificationService.showInfo('Lançamento estornado para pendente.');
      }
    });
  }

  deleteTransaction(tx: Transaction): void {
    this.transactionService.deleteTransaction(tx.id).subscribe({
      next: () => {
        this.transactions.update(list => list.filter(t => t.id !== tx.id));
        this.notificationService.showSuccess('Lançamento removido com sucesso!');
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
}
