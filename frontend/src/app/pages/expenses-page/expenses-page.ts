import { Component } from '@angular/core'; import { TransactionsManagerComponent } from '../../components/transactions-manager/transactions-manager';
@Component({ selector:'app-expenses-page', imports:[TransactionsManagerComponent], template:'<app-transactions-manager kind="expenses" />' }) export class ExpensesPage {}
