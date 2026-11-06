import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { TransactionsComponent } from './features/transactions/transactions.component';
import { AccountsComponent } from './features/accounts/accounts.component';
import { CategoriesComponent } from './features/categories/categories.component';
import { RecurrencesComponent } from './features/recurrences/recurrences.component';
import { ForecastComponent } from './features/forecast/forecast.component';
import { SettingsComponent } from './features/settings/settings.component';
import { CreditCardsComponent } from './features/credit-cards/credit-cards.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'credit-cards', component: CreditCardsComponent },
  { path: 'recurrences', component: RecurrencesComponent },
  { path: 'forecast', component: ForecastComponent },
  { path: 'accounts', component: AccountsComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '' }
];
