import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-fab-quick-add',
  imports: [RouterLink],
  templateUrl: './fab-quick-add.html',
  styleUrl: './fab-quick-add.scss',
})
export class FabQuickAddComponent {
  readonly open = signal(false);

  toggle(): void {
    this.open.set(!this.open());
  }

  close(): void {
    this.open.set(false);
  }
}