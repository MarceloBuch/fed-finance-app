import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render all 8 navigation links', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const links = Array.from(el.querySelectorAll('a')).map(a => a.getAttribute('href'));

    expect(links).toEqual([
      '/',
      '/transactions',
      '/credit-cards',
      '/recurrences',
      '/forecast',
      '/accounts',
      '/categories',
      '/settings',
    ]);
  });
});
