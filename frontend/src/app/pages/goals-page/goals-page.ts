import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import {
  ContributionPayload,
  Goal,
  GoalContribution,
  GoalPayload,
  GoalService,
  Subgoal,
  SubgoalPayload,
} from '../../services/goal.service';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-goals-page',
  imports: [ReactiveFormsModule, BottomNavComponent],
  templateUrl: './goals-page.html',
  styleUrl: './goals-page.scss',
})
export class GoalsPage implements OnInit {
  private readonly builder = inject(FormBuilder);
  private readonly api = inject(GoalService);

  readonly goals = signal<Goal[]>([]);
  readonly selected = signal<Goal | null>(null);
  readonly loading = signal(true);

  readonly toast = signal<Toast | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly goalEditor = signal(false);
  readonly subgoalEditor = signal(false);
  readonly contributionEditor = signal(false);

  readonly editingGoal = signal<string | null>(null);
  readonly editingSubgoal = signal<string | null>(null);
  readonly editingContribution = signal<string | null>(null);

  readonly goalForm = this.builder.nonNullable.group({
  name: [
    '',
    [Validators.required, Validators.maxLength(100)],
  ],
  targetAmount: [
    '',
    [
      Validators.required,
      Validators.pattern(/^\d+(\.\d{1,2})?$/),
    ],
  ],
  description: [
    '',
    Validators.maxLength(500),
  ],
  startDate: [''],
  targetDate: [''],

  priority: new FormControl<GoalPayload['priority']>('MEDIUM', {
    nonNullable: true,
  }),

  status: new FormControl<GoalPayload['status']>('ACTIVE', {
    nonNullable: true,
  }),

  icon: [''],
  color: [''],
});

  readonly subgoalForm = this.builder.nonNullable.group({
    name: [
      '',
      [Validators.required, Validators.maxLength(100)],
    ],
    targetAmount: [
      '',
      [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
      ],
    ],

    priority: new FormControl<SubgoalPayload['priority']>('MEDIUM', {
      nonNullable: true,
    }),

    referenceUrl: [''],
    icon: [''],
    color: [''],
  });

  readonly contributionForm = this.builder.nonNullable.group({
    amount: [
      '',
      [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
      ],
    ],
    date: [
      '',
      Validators.required,
    ],
    description: [
      '',
      Validators.maxLength(500),
    ],
    subgoalId: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  load(selectedId?: string): void {
    this.loading.set(true);

    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (goals) => {
          this.goals.set(goals);

          const id = selectedId ?? this.selected()?.id;

          if (id) {
            this.open(id);
          }
        },
        error: (error) => this.fail(error),
      });
  }

  open(id: string): void {
    this.api.get(id).subscribe({
      next: (goal) => {
        this.selected.set(goal);
      },
      error: (error) => this.fail(error),
    });
  }

  openGoal(goal?: Goal): void {
    this.editingGoal.set(goal?.id ?? null);

    this.goalForm.reset({
      name: goal?.name ?? '',
      targetAmount: goal?.targetAmount ?? '',
      description: goal?.description ?? '',
      startDate: goal?.startDate ?? '',
      targetDate: goal?.targetDate ?? '',
      priority: goal?.priority ?? 'MEDIUM',
      status: goal?.status ?? 'ACTIVE',
      icon: goal?.icon ?? '',
      color: goal?.color ?? '',
    });

    this.goalEditor.set(true);
  }

  saveGoal(): void {
    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      return;
    }

    const value = this.goalForm.getRawValue();

    const payload: GoalPayload = {
      ...value,
      description: this.text(value.description),
      startDate: value.startDate || null,
      targetDate: value.targetDate || null,
      icon: this.text(value.icon),
      color: this.text(value.color),
    };

    const id = this.editingGoal();

    const request = id
      ? this.api.update(id, payload)
      : this.api.create(payload);

    request.subscribe({
      next: (goal) => {
        this.goalEditor.set(false);
        this.showToast(id ? 'Meta actualizada.' : 'Meta creada.', 'success');
        this.load(goal.id);
      },
      error: (error) => this.fail(error),
    });
  }

  deleteGoal(goal: Goal): void {
    if (
      !window.confirm(
        `¿Eliminar la meta “${goal.name}”?`,
      )
    ) {
      return;
    }

    this.api.remove(goal.id).subscribe({
      next: () => {
        this.selected.set(null);
        this.showToast('Meta eliminada.', 'success');
        this.load();
      },
      error: (error) => this.fail(error),
    });
  }

  openSubgoal(subgoal?: Subgoal): void {
    this.editingSubgoal.set(subgoal?.id ?? null);

    this.subgoalForm.reset({
      name: subgoal?.name ?? '',
      targetAmount: subgoal?.targetAmount ?? '',
      priority: subgoal?.priority ?? 'MEDIUM',
      referenceUrl: subgoal?.referenceUrl ?? '',
      icon: subgoal?.icon ?? '',
      color: subgoal?.color ?? '',
    });

    this.subgoalEditor.set(true);
  }

  saveSubgoal(): void {
    const goal = this.selected();

    if (!goal || this.subgoalForm.invalid) {
      this.subgoalForm.markAllAsTouched();
      return;
    }

    const value = this.subgoalForm.getRawValue();

    const payload: SubgoalPayload = {
      ...value,
      referenceUrl: this.text(value.referenceUrl),
      icon: this.text(value.icon),
      color: this.text(value.color),
    };

    const id = this.editingSubgoal();

    const request = id
      ? this.api.updateSubgoal(goal.id, id, payload)
      : this.api.createSubgoal(goal.id, payload);

    request.subscribe({
      next: () => {
        this.subgoalEditor.set(false);
        this.showToast('Submeta guardada.', 'success');
        this.refresh(goal.id);
      },
      error: (error) => this.fail(error),
    });
  }

  deleteSubgoal(subgoal: Subgoal): void {
    const goal = this.selected();

    if (
      !goal ||
      !window.confirm(
        `¿Eliminar “${subgoal.name}”?`,
      )
    ) {
      return;
    }

    this.api
      .removeSubgoal(goal.id, subgoal.id)
      .subscribe({
        next: () => {
          this.showToast('Submeta eliminada.', 'success');
          this.refresh(goal.id);
        },
        error: (error) => this.fail(error),
      });
  }

  openContribution(
    contribution?: GoalContribution,
  ): void {
    this.editingContribution.set(
      contribution?.id ?? null,
    );

    this.contributionForm.reset({
      amount: contribution?.amount ?? '',
      date:
        contribution?.date ??
        new Date().toISOString().slice(0, 10),
      description:
        contribution?.description ?? '',
      subgoalId:
        contribution?.subgoalId ?? '',
    });

    this.contributionEditor.set(true);
  }

  saveContribution(): void {
    const goal = this.selected();

    if (
      !goal ||
      this.contributionForm.invalid
    ) {
      this.contributionForm.markAllAsTouched();
      return;
    }

    const value =
      this.contributionForm.getRawValue();

    const payload: ContributionPayload = {
      amount: value.amount,
      date: value.date,
      description: this.text(value.description),
      subgoalId: value.subgoalId || null,
    };

    const id = this.editingContribution();

    const request = id
      ? this.api.updateContribution(
          goal.id,
          id,
          payload,
        )
      : this.api.createContribution(
          goal.id,
          payload,
        );

    request.subscribe({
      next: () => {
        this.contributionEditor.set(false);
        this.showToast('Aporte guardado.', 'success');
        this.refresh(goal.id);
      },
      error: (error) => this.fail(error),
    });
  }

  deleteContribution(
    contribution: GoalContribution,
  ): void {
    const goal = this.selected();

    if (
      !goal ||
      !window.confirm(
        '¿Eliminar este aporte?',
      )
    ) {
      return;
    }

    this.api
      .removeContribution(
        goal.id,
        contribution.id,
      )
      .subscribe({
        next: () => {
          this.showToast('Aporte eliminado.', 'success');
          this.refresh(goal.id);
        },
        error: (error) => this.fail(error),
      });
  }

  refresh(id: string): void {
    this.open(id);

    this.api.list().subscribe({
      next: (goals) => {
        this.goals.set(goals);
      },
      error: (error) => this.fail(error),
    });
  }

  amount(value: string): string {
    return new Intl.NumberFormat(
      'es-CO',
      {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 2,
      },
    ).format(Number(value));
  }

  subgoalPercentage(
    subgoal: Subgoal,
  ): number {
    const targetAmount = Number(
      subgoal.targetAmount,
    );

    if (
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0
    ) {
      return 0;
    }

    const percentage =
      (Number(subgoal.currentAmount) /
        targetAmount) *
      100;

    return Number.isFinite(percentage)
      ? Math.min(
          Math.max(percentage, 0),
          100,
        )
      : 0;
  }

  label(priority: string): string {
    return (
      {
        LOW: 'Baja',
        MEDIUM: 'Media',
        HIGH: 'Alta',
        ACTIVE: 'Activa',
        COMPLETED: 'Completada',
        PAUSED: 'Pausada',
        CANCELLED: 'Cancelada',
      } as Record<string, string>
    )[priority] ?? priority;
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast.set({ message, type });
    this.toastTimer = setTimeout(() => this.toast.set(null), 3200);
  }

  private text(
    value: string,
  ): string | null {
    return value.trim() || null;
  }

  private fail(
    error: {
      error?: {
        error?: string;
      };
    },
  ): void {
    this.showToast(
      error.error?.error ??
        'No fue posible completar la operación.',
      'error',
    );
  }
}