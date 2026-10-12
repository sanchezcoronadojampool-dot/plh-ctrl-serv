import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";

@Component({
    selector: "app-login",
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="login-page">
      <div class="background-waves"></div>
      <div class="login-card">
        <div class="login-header">
          <img class="login-brand" src="assets/logo-plh.png" alt="Condominio Playa La Honda">
          <h1 class="brand-name">Portal de Gestión</h1>
          <p class="brand-tagline">Control de servicios residenciales</p>
        </div>
        <form (ngSubmit)="onLogin()" #loginForm="ngForm" class="login-form">
          <div class="input-group">
            <label for="login-username">Usuario</label>
            <input id="login-username" type="text" name="username" [(ngModel)]="credentials.username" placeholder="Nombre de usuario" autocomplete="username" required #userModel="ngModel">
            <span class="error-msg" *ngIf="userModel.invalid && userModel.touched">El usuario es requerido</span>
          </div>
          <div class="input-group">
            <label for="login-password">Contraseña</label>
            <input id="login-password" type="password" name="password" [(ngModel)]="credentials.password" placeholder="Contraseña" autocomplete="current-password" required #passModel="ngModel">
            <span class="error-msg" *ngIf="passModel.invalid && passModel.touched">La contraseña es requerida</span>
          </div>
          <p class="error-msg" *ngIf="loginError" role="alert">{{ loginError }}</p>
          <button type="submit" [disabled]="loginForm.invalid || isSubmitting" class="btn-primary">{{ isSubmitting ? 'Validando...' : 'Acceder al Portal' }}</button>
        </form>
        <p class="registration-link"><a routerLink="/login/recuperar">¿Olvidaste tu contraseña?</a></p>
        <p class="registration-link">¿Eres propietario? <a routerLink="/login/registro-propietario">Solicita una cuenta</a></p>
        <div class="login-footer">
          <p>MAR / NATURALEZA / BIENESTAR</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .login-page { min-height: 100vh; min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: max(24px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); background: var(--surface-subtle); overflow-y: auto; position: relative; }
    .background-waves { position: absolute; inset: 0 0 auto; height: 5px; background: linear-gradient(90deg, var(--brand), var(--accent) 68%, var(--sun)); opacity: .9; }
    .login-card { background: var(--surface); padding: 40px 36px; border-radius: 16px; box-shadow: var(--shadow-card); width: 100%; max-width: 420px; text-align: center; z-index: 1; border: 1px solid var(--border); }
    .login-header { margin-bottom: 32px; }
    .login-brand { display: block; width: min(100%, 180px); height: auto; object-fit: contain; margin: 0 auto 18px; }
    .brand-name { font-weight: 700; font-size: 22px; color: var(--text-primary); margin: 0; letter-spacing: -.03em; }
    .brand-tagline { color: var(--text-secondary); font-size: 13px; font-weight: 500; margin-top: 8px; }
    .login-form { display: flex; flex-direction: column; gap: 18px; }
    .input-group { text-align: left; display: flex; flex-direction: column; gap: 8px; }
    .input-group label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .input-group input { min-height: 42px; padding: 10px 12px; background: white; border: 1px solid var(--border-strong); border-radius: 8px; font-size: 14px; }
    .input-group input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,127,141,.14); }
    .error-msg { color: var(--danger); font-size: 12px; margin-top: 4px; font-weight: 500; }
    .btn-primary { min-height: 42px; padding: 10px 14px; background: linear-gradient(135deg, var(--accent), var(--brand)); color: white; border: 1px solid var(--brand); border-radius: 8px; font-weight: 650; font-size: 14px; margin-top: 4px; }
    .btn-primary:hover { background: var(--brand-strong); transform: translateY(-1px); box-shadow: var(--shadow-card); }
    .btn-primary:disabled { background: var(--text-muted); border-color: var(--text-muted); cursor: not-allowed; }
    .login-footer { margin-top: 28px; font-size: 10px; color: var(--text-secondary); font-weight: 600; letter-spacing: 1px; }
    .registration-link { margin: 18px 0 0; color: var(--text-secondary); font-size: 13px; }
    .registration-link a { color: var(--brand); font-weight: 650; }
    @media (max-width: 480px) { .login-card { padding: 30px 22px; } .login-brand { max-width: 250px; } .btn-primary { min-height:44px; } }
  `]
})
export class LoginComponent {
  credentials = { username: "", password: "" };
  loginError = "";
  isSubmitting = false;

  constructor(private auth: AuthService, private router: Router) {}

  onLogin() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.loginError = "";
    this.auth.login(this.credentials).subscribe({
      next: (response) => {
        this.auth.saveSession(response);
        this.isSubmitting = false;
        const destination = response.role === "ADMIN" ? "/admin"
          : response.role === "OWNER" ? "/owner" : "/staff";
        void this.router.navigate([destination]);
      },
      error: (error: unknown) => {
        const message = error instanceof HttpErrorResponse
          && typeof error.error?.message === "string"
          ? error.error.message
          : "No se pudo iniciar sesión. Verifica tus datos y la conexión con el servidor.";
        this.loginError = message;
        this.isSubmitting = false;
      }
    });
  }
}
