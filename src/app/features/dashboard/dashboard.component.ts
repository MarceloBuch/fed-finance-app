import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserContextService } from '../../core/services/user-context.service';
import { PeriodContextService } from '../../core/services/period-context.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { TransactionService } from '../../core/services/transaction.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { NotificationService } from '../../core/services/notification.service';
import { DashboardOverview, Transaction } from '../../core/models/finance.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private readonly userContext = inject(UserContextService);
  readonly periodContext = inject(PeriodContextService);
  private readonly dashboardService = inject(DashboardService);
  private readonly transactionService = inject(TransactionService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly overview = signal<DashboardOverview | null>(null);

  readonly monthTotalIncome = computed(() => {
    const ov = this.overview();
    if (!ov) return 0;
    return (ov.realizedIncome ?? 0) + (ov.expectedIncome ?? 0);
  });

  readonly monthTotalExpense = computed(() => {
    const ov = this.overview();
    if (!ov) return 0;
    return (ov.realizedExpense ?? 0) + (ov.expectedExpense ?? 0);
  });

  readonly projectedEndOfMonthBalance = computed(() => {
    const ov = this.overview();
    if (!ov) return 0;
    return (ov.totalBalance ?? 0) + (ov.expectedIncome ?? 0) - (ov.expectedExpense ?? 0);
  });

  readonly incomeProgressPercent = computed(() => {
    const ov = this.overview();
    const total = this.monthTotalIncome();
    if (!ov || total <= 0) return 0;
    return Math.min(100, Math.round((ov.realizedIncome / total) * 100));
  });

  readonly expenseProgressPercent = computed(() => {
    const ov = this.overview();
    const total = this.monthTotalExpense();
    if (!ov || total <= 0) return 0;
    return Math.min(100, Math.round((ov.realizedExpense / total) * 100));
  });

  readonly overdueTransactions = computed(() => {
    const ov = this.overview();
    if (!ov || !ov.transactions) return [];
    return ov.transactions.filter(t => t.status === 'PENDING' && t.overdue === true);
  });

  readonly upcomingDueTransactions = computed(() => {
    const ov = this.overview();
    if (!ov || !ov.transactions) return [];
    return ov.transactions.filter(t => t.status === 'PENDING' && !t.overdue);
  });

  readonly totalCategoryExpense = computed(() => {
    const ov = this.overview();
    if (!ov || !ov.expensesByCategory) return 0;
    return ov.expensesByCategory.reduce((sum, c) => sum + (c.totalAmount ?? 0), 0);
  });

  constructor() {
    effect(() => {
      const userId = this.userContext.currentUserId();
      const yearMonth = this.periodContext.yearMonth();
      if (userId && yearMonth) {
        this.loadOverview(userId, yearMonth);
      }
    });
  }

  loadOverview(userId: string, yearMonth: string): void {
    this.dashboardService.getOverview(userId, yearMonth).subscribe({
      next: data => this.overview.set(data)
    });
  }

  getCategoryPercentage(amount: number): number {
    const total = this.totalCategoryExpense();
    if (total <= 0) return 0;
    return Math.min(100, Math.round((amount / total) * 100));
  }

  onQuickPay(tx: Transaction): void {
    const userId = this.userContext.currentUserId();
    if (!userId) return;

    if (tx.accountId) {
      const today = new Date().toISOString().slice(0, 10);
      this.transactionService.payTransaction(tx.id, {
        accountId: tx.accountId,
        amount: tx.amount,
        paidDate: today
      }).subscribe({
        next: () => {
          this.notificationService.showSuccess('Lançamento baixado com sucesso!');
          this.loadOverview(userId, this.periodContext.yearMonth());
        }
      });
    } else {
      this.router.navigate(['/transactions']);
    }
  }

  onPayInvoice(invoiceId: string): void {
    const userId = this.userContext.currentUserId();
    if (!userId) return;

    this.invoiceService.payInvoice(invoiceId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Fatura paga com sucesso!');
        this.loadOverview(userId, this.periodContext.yearMonth());
      }
    });
  }
}
