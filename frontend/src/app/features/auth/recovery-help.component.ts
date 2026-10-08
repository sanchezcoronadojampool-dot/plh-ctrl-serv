import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";
import { apiErrorMessage } from "../../core/services/api-error";

@Component({
    selector: "app-recovery-help",
    imports: [CommonModule, RouterLink, FormsModule],
    template: `
    <main class="recovery-page">
      <section class="recovery-card">
        <a routerLink="/login" class="back-link">← Volver al inicio de sesión</a>
        <h1>{{ token ? 'Crear contraseña nueva' : 'Recuperar acceso' }}</h1>
        <p *ngIf="!token">Ingresa el correo electrónico asociado a tu cuenta. Si existe, te enviaremos un enlace de recuperación.</p>

        <form *ngIf="!token && !sent" (ngSubmit)="requestReset()" #requestForm="ngForm">
          <label>Correo electrónico
            <input type="email" name="email" [(ngModel)]="email" autocomplete="email" maxlength="255" required email>
          </label>
          <p class="error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
          <button class="primary-button" type="submit" [disabled]="!requestForm.valid || busy">
            {{ busy ? 'Enviando...' : 'Enviar enlace de recuperación' }}
          </button>
        </form>
        <div class="notice success" *ngIf="sent" role="status">
          <h2>Revisa tu correo</h2>
          <p>Si la dirección corresponde a una cuenta activa, recibirás un enlace para restablecer la contraseña. El enlace tiene vigencia limitada.</p>
        </div>

        <form *ngIf="token" (ngSubmit)="completeReset()" #resetForm="ngForm">
          <label>Nueva contraseña
            <input type="password" name="password" [(ngModel)]="password" autocomplete="new-password" minlength="12" maxlength="72" required>
          </label>
          <label>Confirma la contraseña
            <input type="password" name="confirmation" [(ngModel)]="confirmation" autocomplete="new-password" minlength="12" maxlength="72" required>
          </label>
          <p class="hint">Usa al menos 12 caracteres.</p>
          <p class="error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
          <p class="success-text" *ngIf="completed" role="status">Contraseña actualizada. Ya puedes iniciar sesión.</p>
          <button class="primary-button" type="submit" [disabled]="!resetForm.valid || busy || completed">
            {{ busy ? 'Actualizando...' : 'Guardar contraseña' }}
          </button>
        </form>
      </section>
    </main>
  `,
    styles: [`
    .recovery-page { min-height:100vh; min-height:100dvh; padding:max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left)); display:grid; place-items:center; background:var(--surface-subtle); }
    .recovery-card { width:min(100%,480px); padding:36px; border:1px solid var(--border); border-radius:16px; background:#fff; box-shadow:var(--shadow-card); }
    h1 { margin:24px 0 8px; color:var(--text-primary); font-size:24px; letter-spacing:-.03em; }
    p { color:var(--text-secondary); line-height:1.6; }
    .back-link { color:var(--brand); font-weight:650; }
    label { display:flex; flex-direction:column; gap:7px; margin:16px 0; color:var(--text-primary); font-size:13px; font-weight:600; }
    input { height:42px; padding:0 12px; border:1px solid var(--border); border-radius:8px; font:inherit; }
    input:focus { outline:2px solid #93c5fd; outline-offset:1px; border-color:#2563eb; }
    .primary-button { width:100%; margin-top:10px; padding:11px 14px; border:1px solid #1d4ed8; border-radius:8px; background:#2563eb; color:white; font-family:inherit; font-size:14px; font-weight:600; cursor:pointer; }
    .primary-button:disabled { opacity:.55; cursor:not-allowed; }
    .notice { margin-top:18px; padding:16px; border:1px solid #bbf7d0; border-radius:10px; background:#f0fdf4; }
    h2 { margin:0 0 7px; color:#166534; font-size:16px; }
    .notice p { margin:0; }
    .hint { margin:0; font-size:12px; }
    .error { color:#991b1b; font-size:13px; }
    .success-text { color:#166534; font-size:13px; }
    @media(max-width:480px) { .recovery-card { padding:26px 20px; } .primary-button { min-height:44px; } }
  `]
})
export class RecoveryHelpComponent {
  readonly token: string | null;
  email = "";
  password = "";
  confirmation = "";
  busy = false;
  sent = false;
  completed = false;
  errorMessage = "";

  constructor(private readonly auth: AuthService, route: ActivatedRoute) {
    this.token = route.snapshot.queryParamMap.get("token");
  }

  requestReset(): void {
    this.busy = true;
    this.errorMessage = "";
    this.auth.requestPasswordReset(this.email.trim()).subscribe({
      next: () => { this.sent = true; },
      error: error => { this.errorMessage = apiErrorMessage(error, "No se pudo enviar el enlace de recuperación."); this.busy = false; },
      complete: () => { this.busy = false; }
    });
  }

  completeReset(): void {
    if (!this.token) return;
    if (this.password !== this.confirmation) {
      this.errorMessage = "Las contraseñas no coinciden.";
      return;
    }
    this.busy = true;
    this.errorMessage = "";
    this.auth.completePasswordReset(this.token, this.password).subscribe({
      next: () => { this.completed = true; },
      error: error => { this.errorMessage = apiErrorMessage(error, "El enlace no es válido o ya venció."); this.busy = false; },
      complete: () => { this.busy = false; }
    });
  }
}
