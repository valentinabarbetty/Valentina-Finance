import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';
import { AuthPage } from './pages/auth-page/auth-page';
import { CategoriesPage } from './pages/categories-page/categories-page';
import { ExpensesPage } from './pages/expenses-page/expenses-page';
import { HomePage } from './pages/home-page/home-page';
import { IncomesPage } from './pages/incomes-page/incomes-page';
import { GoalsPage } from './pages/goals-page/goals-page';
import { TransactionTypesPage } from './pages/transaction-types-page/transaction-types-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  { path: 'login', component: AuthPage, canActivate: [guestGuard], data: { mode: 'login' } },
  { path: 'register', component: AuthPage, canActivate: [guestGuard], data: { mode: 'register' } },
  { path: 'app', component: HomePage, canActivate: [authGuard] },
  { path: 'app/categories', component: CategoriesPage, canActivate: [authGuard] },
  { path: 'app/expenses', component: ExpensesPage, canActivate: [authGuard] },
  { path: 'app/incomes', component: IncomesPage, canActivate: [authGuard] },
  { path: 'app/goals', component: GoalsPage, canActivate: [authGuard] },
  { path: 'app/transaction-types', component: TransactionTypesPage, canActivate: [authGuard] },
  { path: '**', redirectTo: 'app' },
];
