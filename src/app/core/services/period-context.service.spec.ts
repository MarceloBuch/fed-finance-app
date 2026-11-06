import { TestBed } from '@angular/core/testing';
import { PeriodContextService } from './period-context.service';

describe('PeriodContextService', () => {
  let service: PeriodContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PeriodContextService);
  });

  it('should navigate next and previous months and compute startDate and endDate', () => {
    service.setPeriod(2026, 11);
    expect(service.year()).toBe(2026);
    expect(service.month()).toBe(11);
    expect(service.startDate()).toBe('2026-11-01');
    expect(service.endDate()).toBe('2026-11-30');
    expect(service.label()).toBe('Novembro 2026');

    service.nextMonth();
    expect(service.year()).toBe(2026);
    expect(service.month()).toBe(12);
    expect(service.startDate()).toBe('2026-12-01');
    expect(service.endDate()).toBe('2026-12-31');

    service.nextMonth();
    expect(service.year()).toBe(2027);
    expect(service.month()).toBe(1);
    expect(service.startDate()).toBe('2027-01-01');
    expect(service.endDate()).toBe('2027-01-31');

    service.previousMonth();
    expect(service.year()).toBe(2026);
    expect(service.month()).toBe(12);
  });
});
