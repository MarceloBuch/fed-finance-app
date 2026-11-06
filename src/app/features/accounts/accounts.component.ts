import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserContextService } from '../../core/services/user-context.service';
import { AccountService } from '../../core/services/account.service';
import { TransactionService } from '../../core/services/transaction.service';
import { NotificationService } from '../../core/services/notification.service';
import { Account, AccountType, TransactionStatus } from '../../core/models/finance.models';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './accounts.component.html'
})
export class AccountsComponent {
  private readonly userContext = inject(UserContextService);
  private readonly accountService = inject(AccountService);
  private readonly transactionService = inject(TransactionService);
  private readonly notificationService = inject(NotificationService);

  readonly accounts = signal<Account[]>([]);
  readonly totalCurrentBalance = computed(() =>
    this.accounts()
      .filter(acc => acc.accountType !== 'CREDIT_CARD')
      .reduce((sum, acc) => sum + (acc.currentBalance ?? 0), 0)
  );
  readonly nonCardAccounts = computed(() =>
    this.accounts().filter(acc => acc.accountType !== 'CREDIT_CARD')
  );

  showModal = false;
  editingAccountId: string | null = null;

  name = '';
  bankCode = '';
  accountType: AccountType = 'CHECKING';
  initialBalance = 0;
  currency = 'BRL';
  color = '#00E5FF';

  creditLimit = 0;
  closingDay = 3;
  dueDay = 10;
  paymentAccountId = '';
  initialUsedAmount = 0;

  // Transfer Modal State
  showTransferModal = false;
  transferFromAccountId = '';
  transferToAccountId = '';
  transferAmount = 0;
  transferDescription = 'Transferência para Poupança / Investimento';
  transferDate = new Date().toISOString().slice(0, 10);
  transferStatus: TransactionStatus = 'PAID';

  constructor() {
    effect(() => {
      const userId = this.userContext.currentUserId();
      if (userId) {
        this.loadAccounts(userId);
      }
    });
  }

  loadAccounts(userId: string): void {
    this.accountService.getAccountsByUser(userId).subscribe({
      next: accounts => this.accounts.set(accounts)
    });
  }

  openCreateModal(): void {
    this.editingAccountId = null;
    this.resetForm();
    this.showModal = true;
  }

  openEditModal(account: Account): void {
    this.editingAccountId = account.id;
    this.name = account.name;
    this.bankCode = account.bankCode || '';
    this.accountType = account.accountType;
    this.initialBalance = account.initialBalance;
    this.currency = account.currency;
    this.color = account.color || '#00E5FF';
    this.creditLimit = account.creditLimit ?? 0;
    this.closingDay = account.closingDay ?? 3;
    this.dueDay = account.dueDay ?? 10;
    this.paymentAccountId = account.paymentAccountId || (this.nonCardAccounts()[0]?.id ?? '');
    this.initialUsedAmount = 0;
    this.showModal = true;
  }

  onSubmit(): void {
    const userId = this.userContext.currentUserId();
    if (!userId || !this.name.trim()) {
      return;
    }

    const isCard = this.accountType === 'CREDIT_CARD';

    if (this.editingAccountId) {
      const id = this.editingAccountId;
      this.accountService.updateAccount(id, {
        name: this.name.trim(),
        bankCode: this.bankCode.trim() || null,
        accountType: this.accountType,
        initialBalance: isCard ? 0 : this.initialBalance,
        currency: this.currency,
        color: this.color,
        creditLimit: isCard ? this.creditLimit : null,
        closingDay: isCard ? this.closingDay : null,
        dueDay: isCard ? this.dueDay : null,
        paymentAccountId: isCard ? (this.paymentAccountId || null) : null
      }).subscribe({
        next: updated => {
          this.accounts.update(list => list.map(a => (a.id === id ? updated : a)));
          this.notificationService.showSuccess('Conta atualizada com sucesso!');
          this.showModal = false;
          this.resetForm();
        }
      });
    } else {
      this.accountService.createAccount({
        userId,
        name: this.name.trim(),
        bankCode: this.bankCode.trim() || null,
        accountType: this.accountType,
        initialBalance: isCard ? 0 : this.initialBalance,
        currency: this.currency,
        color: this.color,
        creditLimit: isCard ? this.creditLimit : null,
        closingDay: isCard ? this.closingDay : null,
        dueDay: isCard ? this.dueDay : null,
        paymentAccountId: isCard ? (this.paymentAccountId || null) : null,
        initialUsedAmount: isCard && this.initialUsedAmount > 0 ? this.initialUsedAmount : null
      }).subscribe({
        next: created => {
          this.accounts.update(list => [...list, created]);
          this.notificationService.showSuccess('Conta criada com sucesso!');
          this.showModal = false;
          this.resetForm();
        }
      });
    }
  }

  deleteAccount(id: string): void {
    this.accountService.deleteAccount(id).subscribe({
      next: () => {
        this.accounts.update(list => list.filter(a => a.id !== id));
        this.notificationService.showSuccess('Conta removida com sucesso!');
      }
    });
  }

  resetForm(): void {
    this.name = '';
    this.bankCode = '';
    this.accountType = 'CHECKING';
    this.initialBalance = 0;
    this.currency = 'BRL';
    this.color = '#00E5FF';
    this.creditLimit = 0;
    this.closingDay = 3;
    this.dueDay = 10;
    this.paymentAccountId = this.nonCardAccounts()[0]?.id ?? '';
    this.initialUsedAmount = 0;
  }

  openTransferModal(preselectedAccount?: Account): void {
    const validAccounts = this.nonCardAccounts();
    if (validAccounts.length < 2) {
      this.notificationService.showInfo('Cadastre pelo menos duas contas bancárias para realizar transferências.');
      return;
    }

    if (preselectedAccount && (preselectedAccount.accountType === 'SAVINGS' || preselectedAccount.accountType === 'INVESTMENT')) {
      const source = validAccounts.find(a => a.id !== preselectedAccount.id && a.accountType === 'CHECKING')
        ?? validAccounts.find(a => a.id !== preselectedAccount.id);
      this.transferFromAccountId = source?.id ?? '';
      this.transferToAccountId = preselectedAccount.id;
    } else {
      const source = preselectedAccount ?? validAccounts.find(a => a.accountType === 'CHECKING') ?? validAccounts[0];
      this.transferFromAccountId = source?.id ?? '';
      const dest = validAccounts.find(
        a => a.id !== this.transferFromAccountId && (a.accountType === 'SAVINGS' || a.accountType === 'INVESTMENT')
      ) ?? validAccounts.find(a => a.id !== this.transferFromAccountId);
      this.transferToAccountId = dest?.id ?? '';
    }

    this.transferAmount = 0;
    this.transferDescription = 'Transferência entre Contas';
    this.transferDate = new Date().toISOString().slice(0, 10);
    this.transferStatus = 'PAID';
    this.showTransferModal = true;
  }

  onTransferSourceChange(): void {
    if (this.transferToAccountId === this.transferFromAccountId) {
      const other = this.nonCardAccounts().find(a => a.id !== this.transferFromAccountId);
      this.transferToAccountId = other?.id ?? '';
    }
  }

  onSubmitTransfer(): void {
    const userId = this.userContext.currentUserId();
    if (!userId || !this.transferFromAccountId || !this.transferToAccountId || this.transferAmount <= 0 || !this.transferDate) {
      return;
    }
    if (this.transferFromAccountId === this.transferToAccountId) {
      this.notificationService.showError('As contas de origem e destino devem ser diferentes.');
      return;
    }

    this.transactionService.createTransaction({
      userId,
      accountId: this.transferFromAccountId,
      destinationAccountId: this.transferToAccountId,
      categoryId: null,
      type: 'TRANSFER',
      amount: this.transferAmount,
      description: this.transferDescription.trim() || 'Transferência entre Contas',
      notes: null,
      dueDate: this.transferDate,
      paidDate: this.transferStatus === 'PAID' ? this.transferDate : null,
      status: this.transferStatus
    }).subscribe({
      next: () => {
        this.notificationService.showSuccess('Transferência realizada com sucesso!');
        this.showTransferModal = false;
        this.loadAccounts(userId);
      }
    });
  }

  getAccountTypeDisplay(type: AccountType): string {
    switch (type) {
      case 'CHECKING':
        return 'Conta Corrente';
      case 'SAVINGS':
        return 'Conta Poupança';
      case 'INVESTMENT':
        return 'Investimentos';
      case 'CREDIT_CARD':
        return 'Cartão de Crédito';
      case 'CASH':
        return 'Carteira / Dinheiro';
    }
  }
}
