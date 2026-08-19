import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  /** Título principal del modal, ej. "¿Eliminar meta?" */
  title: string;
  /** Descripción / detalle opcional */
  message?: string;
  /** Etiqueta del botón de confirmación (default: "Eliminar") */
  confirmLabel?: string;
  /** Etiqueta del botón cancelar (default: "Cancelar") */
  cancelLabel?: string;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  /** Estado activo del modal. null = cerrado. */
  readonly state = signal<ConfirmState | null>(null);

  /**
   * Abre el modal de confirmación.
   * Devuelve una Promise<boolean>: true si el usuario confirmó, false si canceló.
   *
   * Uso:
   *   const ok = await this.confirm.ask({ title: '¿Eliminar meta?', message: '"Corea del Sur"' });
   *   if (ok) { ... }
   */
  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.state.set({ ...options, resolve });
    });
  }

  /** Llamado por el modal al confirmar */
  confirm(): void {
    this.state()?.resolve(true);
    this.state.set(null);
  }

  /** Llamado por el modal al cancelar / cerrar */
  cancel(): void {
    this.state()?.resolve(false);
    this.state.set(null);
  }
}
