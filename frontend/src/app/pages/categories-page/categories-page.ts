import { Component } from '@angular/core';
import { SettingsManagerComponent } from '../../components/settings-manager/settings-manager';

@Component({ selector: 'app-categories-page', imports: [SettingsManagerComponent], template: '<app-settings-manager manager="categories" />' })
export class CategoriesPage {}
