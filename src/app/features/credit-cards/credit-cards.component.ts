import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserContextService } from '../../core/services/user-context.service';
import { PeriodContextService } from '../../core/services/period-context.service';
import { AccountService } from '../../core/services/account.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { NotificationService } from '../../core/services/notification.service';
import { Account, Invoice } from '../../core/models/finance.models';

@Component({
  selector: 'app-credit-cards',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DecimalPipe],
  templateUrl: './credit-cards.component.html'
})
export class CreditCardsComponent {
  private readonly userContext = inject(UserContextService);
  private readonly periodContext = inject(PeriodContextService);
  private readonly accountService = inject(AccountService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly notificationService = inject(NotificationService);

  readonly accounts = signal<Account[]>([]);
  readonly selectedCardId = signal<string>('');
  readonly referenceMonth = signal<string>(this.periodContext.yearMonth());
  readonly currentInvoice = signal<Invoice | null>(null);

  readonly creditCards = computed(() =>
    this.accounts().filter(a => a.accountType === 'CREDIT_CARD')
  );

  readonly paymentAccounts = computed(() =>
    this.accounts().filter(a => a.accountType !== 'CREDIT_CARD')
  );

  readonly selectedCard = computed(() =>
    this.creditCards().find(c => c.id === this.selectedCardId()) ?? null
  );

  showPayModal = false;
  payAccountId = '';
  payDate = new Date().toISOString().slice(0, 10);

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
      next: accs => {
        this.accounts.set(accs);
        const cards = accs.filter(a => a.accountType === 'CREDIT_CARD');
        if (cards.length > 0) {
          const currentSelected = this.selectedCardId();
          const targetId = cards.some(c => c.id === currentSelected) ? currentSelected : cards[0].id;
          this.selectedCardId.set(targetId);
          this.loadInvoice(targetId, this.referenceMonth());
        } else {
          this.selectedCardId.set('');
          this.currentInvoice.set(null);
        }
      }
    });
  }

  selectCard(cardId: string): void {
    this.selectedCardId.set(cardId);
    this.loadInvoice(cardId, this.referenceMonth());
  }

  prevMonth(): void {
    const [y, m] = this.referenceMonth().split('-').map(Number);
    const nextY = m === 1 ? y - 1 : y;
    const nextM = m === 1 ? 12 : m - 1;
    const ym = `${nextY}-${String(nextM).padStart(2, '0')}`;
    this.referenceMonth.set(ym);
    if (this.selectedCardId()) {
      this.loadInvoice(this.selectedCardId(), ym);
    }
  }

  nextMonth(): void {
    const [y, m] = this.referenceMonth().split('-').map(Number);
    const nextY = m === 12 ? y + 1 : y;
    const nextM = m === 12 ? 1 : m + 1;
    const ym = `${nextY}-${String(nextM).padStart(2, '0')}`;
    this.referenceMonth.set(ym);
    if (this.selectedCardId()) {
      this.loadInvoice(this.selectedCardId(), ym);
    }
  }

  loadInvoice(cardId: string, ym: string): void {
    this.invoiceService.getByCardAndMonth(cardId, ym).subscribe({
      next: inv => this.currentInvoice.set(inv)
    });
  }

  getUsagePercent(card: Account): number {
    const limit = card.creditLimit ?? 0;
    const used = card.usedLimit ?? 0;
    if (limit <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
  }

  openPayInvoiceModal(): void {
    const inv = this.currentInvoice();
    const card = this.selectedCard();
    if (!inv || !card) return;
    this.payAccountId = inv.paymentAccountId || card.paymentAccountId || (this.paymentAccounts()[0]?.id ?? '');
    this.payDate = new Date().toISOString().slice(0, 10);
    this.showPayModal = true;
  }

  confirmPayInvoice(): void {
    const inv = this.currentInvoice();
    const userId = this.userContext.currentUserId();
    if (!inv || !userId) return;

    this.invoiceService.payInvoice(inv.id, {
      accountId: this.payAccountId || null,
      paidDate: this.payDate
    }).subscribe({
      next: updated => {
        this.currentInvoice.set(updated);
        this.showPayModal = false;
        this.notificationService.showSuccess('Fatura paga com sucesso! Limite restaurado.');
        this.loadAccounts(userId);
      }
    });
  }

  onUnpayInvoice(): void {
    const inv = this.currentInvoice();
    const userId = this.userContext.currentUserId();
    if (!inv || !userId) return;

    this.invoiceService.unpayInvoice(inv.id).subscribe({
      next: updated => {
        this.currentInvoice.set(updated);
        this.notificationService.showInfo('Pagamento da fatura estornado.');
        this.loadAccounts(userId);
      }
    });
  }

  getPaymentAccountName(accountId?: string | null): string {
    if (!accountId) return 'Não definida';
    return this.accounts().find(a => a.id === accountId)?.name ?? 'Conta';
  }
}
