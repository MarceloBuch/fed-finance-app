import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserContextService } from '../../../core/services/user-context.service';
import { PeriodContextService } from '../../../core/services/period-context.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './topbar.component.html'
})
export class TopbarComponent {
  readonly userContext = inject(UserContextService);
  readonly periodContext = inject(PeriodContextService);
}
