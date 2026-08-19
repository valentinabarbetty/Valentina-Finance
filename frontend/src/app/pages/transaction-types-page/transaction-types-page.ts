import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({ selector: 'app-transaction-types-page', template: '' })
export class TransactionTypesPage implements OnInit {
  private readonly router = inject(Router);
  ngOnInit(): void { this.router.navigateByUrl('/app/categories'); }
}
