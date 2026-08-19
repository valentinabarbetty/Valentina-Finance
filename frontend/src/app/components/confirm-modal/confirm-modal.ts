import { Component, HostListener, inject } from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  imports: [],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.scss',
})
export class ConfirmModalComponent {
  readonly confirmService = inject(ConfirmService);

  /** Cierra con Escape */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmService.state()) {
      this.confirmService.cancel();
    }
  }

  /** Confirma con Enter cuando el modal está abierto */
  @HostListener('document:keydown.enter', ['$event'])
  onEnter(event: Event): void {
    if (!this.confirmService.state()) return;
    const ke = event as KeyboardEvent;
    // Solo si el foco no está en el botón cancelar
    const target = ke.target as HTMLElement;
    if (target?.dataset?.['action'] === 'cancel') return;
    ke.preventDefault();
    this.confirmService.confirm();
  }
}
