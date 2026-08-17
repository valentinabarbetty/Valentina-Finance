import { Component } from '@angular/core'; import { TransactionsManagerComponent } from '../../components/transactions-manager/transactions-manager';
@Component({ selector:'app-incomes-page', imports:[TransactionsManagerComponent], template:'<app-transactions-manager kind="incomes" />' }) export class IncomesPage {}
