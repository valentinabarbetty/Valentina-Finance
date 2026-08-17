import { Component, OnInit, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../core/auth.service";

interface AuthenticatedUser {
  id: string;
  email: string | null;
}

@Component({
  selector: "app-home-page",
  imports: [RouterLink],
  templateUrl: "./home-page.html",
  styleUrl: "./home-page.scss",
})
export class HomePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly apiUser = signal<AuthenticatedUser | null>(null);
  readonly apiError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      this.apiUser.set(await firstValueFrom(this.http.get<AuthenticatedUser>(`${environment.apiBaseUrl}/api/auth/me`)));
    } catch {
      this.apiError.set("No fue posible verificar la sesión con el backend.");
    }
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl("/login");
  }
}
