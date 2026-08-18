import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  private readonly formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return this.formatter.format(0);
    const numeric = typeof value === 'string' ? Number(value) : value;
    return Number.isFinite(numeric) ? this.formatter.format(numeric) : this.formatter.format(0);
  }
}