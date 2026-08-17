import { Component } from '@angular/core';
import { SettingsManagerComponent } from '../../components/settings-manager/settings-manager';

@Component({ selector: 'app-transaction-types-page', imports: [SettingsManagerComponent], template: '<app-settings-manager manager="transaction-types" />' })
export class TransactionTypesPage {}
