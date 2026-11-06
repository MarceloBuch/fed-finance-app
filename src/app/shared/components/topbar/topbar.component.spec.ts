import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TopbarComponent } from './topbar.component';
import { PeriodContextService } from '../../../core/services/period-context.service';
import { UserContextService } from '../../../core/services/user-context.service';

describe('TopbarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should display the period label and navigate previous/next months', () => {
    const periodService = TestBed.inject(PeriodContextService);
    periodService.setPeriod(2026, 11);

    const userContext = TestBed.inject(UserContextService);
    userContext.currentUser.set({
      id: 'u-1',
      name: 'Marcelo',
      email: 'marcelo@finance.com',
      active: true
    });

    const fixture = TestBed.createComponent(TopbarComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Novembro 2026');
    expect(el.textContent).toContain('Marcelo');

    const prevBtn = el.querySelector('button[data-testid="period-prev"]') as HTMLButtonElement;
    const nextBtn = el.querySelector('button[data-testid="period-next"]') as HTMLButtonElement;

    prevBtn.click();
    fixture.detectChanges();
    expect(periodService.month()).toBe(10);
    expect(el.textContent).toContain('Outubro 2026');

    nextBtn.click();
    nextBtn.click();
    fixture.detectChanges();
    expect(periodService.month()).toBe(12);
    expect(el.textContent).toContain('Dezembro 2026');
  });
});
