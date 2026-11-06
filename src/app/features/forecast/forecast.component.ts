import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserContextService } from '../../core/services/user-context.service';
import { PeriodContextService } from '../../core/services/period-context.service';
import { ForecastService } from '../../core/services/forecast.service';
import { AccountService } from '../../core/services/account.service';
import { Account, MonthlyForecastItem } from '../../core/models/finance.models';

const SHORT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './forecast.component.html'
})
export class ForecastComponent {
  private readonly userContext = inject(UserContextService);
  readonly periodContext = inject(PeriodContextService);
  private readonly forecastService = inject(ForecastService);
  private readonly accountService = inject(AccountService);

  readonly accounts = signal<Account[]>([]);
  readonly selectedAccountId = signal<string>('');
  readonly forecastItems = signal<MonthlyForecastItem[]>([]);

  readonly total12mIncome = computed(() =>
    this.forecastItems().reduce((sum, item) => sum + (item.expectedIncome ?? 0), 0)
  );

  readonly total12mExpense = computed(() =>
    this.forecastItems().reduce((sum, item) => sum + (item.expectedExpense ?? 0), 0)
  );

  readonly final12mEndingBalance = computed(() => {
    const list = this.forecastItems();
    return list.length > 0 ? list[list.length - 1].projectedBalance : 0;
  });

  readonly maxChartValue = computed(() => {
    const max = this.forecastItems().reduce(
      (acc, item) => Math.max(acc, item.expectedIncome ?? 0, item.expectedExpense ?? 0),
      0
    );
    return max > 0 ? max : 1;
  });

  constructor() {
    effect(() => {
      const userId = this.userContext.currentUserId();
      if (userId) {
        this.accountService.getAccountsByUser(userId).subscribe({
          next: accs => this.accounts.set(accs)
        });
      }
    });

    effect(() => {
      const userId = this.userContext.currentUserId();
      const startMonth = this.periodContext.yearMonth();
      const accountId = this.selectedAccountId();
      if (userId && startMonth) {
        this.loadForecast(userId, startMonth, accountId || null);
      }
    });
  }

  loadForecast(userId: string, startMonth: string, accountId: string | null): void {
    this.forecastService.getAnnualForecast(userId, startMonth, accountId).subscribe({
      next: items => this.forecastItems.set(items)
    });
  }

  onAccountFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedAccountId.set(target.value);
  }

  getMonthLabel(item: MonthlyForecastItem): string {
    if (!item.month) return '';
    const parts = item.month.split('-');
    if (parts.length < 2) return item.month;
    const yearShort = parts[0].slice(-2);
    const monthNum = Number(parts[1]);
    const name = SHORT_MONTHS[monthNum - 1] ?? parts[1];
    return `${name}/${yearShort}`;
  }

  getNetChange(item: MonthlyForecastItem): number {
    return (item.expectedIncome ?? 0) - (item.expectedExpense ?? 0);
  }

  getBarHeightPercent(value: number): number {
    return Math.min(100, Math.round(((value ?? 0) / this.maxChartValue()) * 100));
  }
}
