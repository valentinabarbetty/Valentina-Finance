import { Component, computed, inject, signal } from "@angular/core";
import { ReactiveFormsModule, Validators, FormBuilder } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/auth.service";

@Component({
  selector: "app-auth-page",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./auth-page.html",
  styleUrl: "./auth-page.scss",
})
export class AuthPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly mode = this.route.snapshot.data["mode"] as "login" | "register";
  readonly isRegister = computed(() => this.mode === "register");
  readonly loading = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    try {
      const { email, password } = this.form.getRawValue();
      const result = this.isRegister()
        ? await this.auth.register(email, password)
        : await this.auth.login(email, password);

      if (result.session) {
        await this.router.navigateByUrl(this.returnUrl());
      } else {
        this.message.set("Revisa tu correo para confirmar la cuenta antes de iniciar sesión.");
      }
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : "No fue posible completar la operación.");
    } finally {
      this.loading.set(false);
    }
  }

  private returnUrl(): string {
    return this.route.snapshot.queryParamMap.get("returnUrl") ?? "/app";
  }
}