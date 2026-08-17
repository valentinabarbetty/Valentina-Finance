import { Injectable, computed, signal } from "@angular/core";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase.client";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly sessionState = signal<Session | null>(null);
  private readonly sessionReady: Promise<void>;

  readonly session = this.sessionState.asReadonly();
  readonly user = computed(() => this.sessionState()?.user ?? null);

  constructor() {
    this.sessionReady = supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      this.sessionState.set(data.session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      this.sessionState.set(session);
    });
  }

  async register(email: string, password: string): Promise<{ user: User | null; session: Session | null }> {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (result.error) throw result.error;
    return result.data;
  }

  async login(email: string, password: string): Promise<{ user: User | null; session: Session | null }> {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    return result.data;
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  getCurrentUser(): User | null {
    return this.user();
  }

  getSession(): Session | null {
    return this.session();
  }

  isAuthenticated(): boolean {
    return Boolean(this.session());
  }

  async waitUntilReady(): Promise<void> {
    await this.sessionReady;
  }

  async getAccessToken(): Promise<string | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.access_token ?? null;
  }
}
