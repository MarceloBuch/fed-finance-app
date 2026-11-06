import { Injectable, computed, signal } from '@angular/core';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

@Injectable({
  providedIn: 'root'
})
export class PeriodContextService {
  private readonly now = new Date();

  readonly year = signal<number>(this.now.getFullYear());
  readonly month = signal<number>(this.now.getMonth() + 1);

  readonly yearMonth = computed(() => {
    const y = this.year();
    const m = String(this.month()).padStart(2, '0');
    return `${y}-${m}`;
  });

  readonly startDate = computed(() => `${this.yearMonth()}-01`);

  readonly endDate = computed(() => {
    const y = this.year();
    const m = this.month();
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  readonly label = computed(() => {
    const monthName = MONTH_NAMES[this.month() - 1] ?? '';
    return `${monthName} ${this.year()}`;
  });

  setPeriod(year: number, month: number): void {
    this.year.set(year);
    this.month.set(month);
  }

  nextMonth(): void {
    const currentMonth = this.month();
    const currentYear = this.year();
    if (currentMonth === 12) {
      this.month.set(1);
      this.year.set(currentYear + 1);
    } else {
      this.month.set(currentMonth + 1);
    }
  }

  previousMonth(): void {
    const currentMonth = this.month();
    const currentYear = this.year();
    if (currentMonth === 1) {
      this.month.set(12);
      this.year.set(currentYear - 1);
    } else {
      this.month.set(currentMonth - 1);
    }
  }
}
