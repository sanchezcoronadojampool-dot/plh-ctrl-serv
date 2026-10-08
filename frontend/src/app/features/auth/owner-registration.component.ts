import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { AuthService, OwnerRegistration } from "../../core/services/auth.service";

@Component({
    selector: "app-owner-registration",
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <main class="registration-page">
      <section class="registration-card">
        <a routerLink="/login" class="back-link">← Volver al inicio de sesión</a>
        <h1>Solicitud de cuenta de propietario</h1>
        <p class="intro">Completa tus datos y el código o número de tu inmueble. Un administrador verificará la solicitud antes de activar la cuenta.</p>
        <form *ngIf="!submitted" (ngSubmit)="submit()" #registrationForm="ngForm">
          <div class="form-grid">
            <label>Nombre
              <input name="nombre" [(ngModel)]="form.nombre" required maxlength="100" autocomplete="given-name">
            </label>
            <label>Apellido paterno
              <input name="apellidoPaterno" [(ngModel)]="form.apellidoPaterno" required maxlength="100" autocomplete="family-name">
            </label>
            <label>Apellido materno
              <input name="apellidoMaterno" [(ngModel)]="form.apellidoMaterno" maxlength="100">
            </label>
            <label>Documento de identidad
              <input name="documentoIdentidad" [(ngModel)]="form.documentoIdentidad" required maxlength="50" autocomplete="off">
            </label>
            <label>Teléfono
              <input name="telefono" [(ngModel)]="form.telefono" required maxlength="20" autocomplete="tel">
            </label>
            <label>Correo electrónico
              <input name="correoElectronico" [(ngModel)]="form.correoElectronico" type="email" maxlength="255" autocomplete="email">
            </label>
            <label>Usuario
              <input name="username" [(ngModel)]="form.username" required minlength="3" maxlength="50" autocomplete="username">
            </label>
            <label>Contraseña
              <input name="password" [(ngModel)]="form.password" type="password" required minlength="12" maxlength="72" autocomplete="new-password">
              <small>Al menos 12 caracteres.</small>
            </label>
            <label class="full-width">Código o número de inmueble
              <input name="inmueble" [(ngModel)]="form.inmueble" required maxlength="50" autocomplete="off">
            </label>
          </div>
          <p class="error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
          <button type="submit" [disabled]="registrationForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Enviando solicitud...' : 'Enviar solicitud' }}
          </button>
        </form>
        <div *ngIf="submitted" class="success-message" role="status">
          <h2>Solicitud enviada</h2>
          <p>Quedará pendiente hasta que un administrador verifique el inmueble y la apruebe. Podrás iniciar sesión cuando la cuenta esté aprobada.</p>
          <a routerLink="/login">Ir a iniciar sesión</a>
        </div>
      </section>
    </main>
  `,
    styles: [`
    .registration-page { min-height: 100vh; min-height: 100dvh; padding: max(32px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(32px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); display: grid; place-items: center; background: var(--surface-subtle); }
    .registration-card { width: min(100%, 760px); padding: 36px; border: 1px solid var(--border); border-radius: 16px; background: white; box-shadow: var(--shadow-card); }
    h1 { margin: 24px 0 8px; color: var(--text-primary); font-size: 24px; letter-spacing: -.03em; }
    .intro { margin: 0 0 24px; color: var(--text-secondary); line-height: 1.6; }
    .back-link, .success-message a { color: var(--brand); font-weight: 650; }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
    label { display: flex; flex-direction: column; gap: 7px; color: var(--text-primary); font-size: 13px; font-weight: 600; }
    input { min-width: 0; min-height: 40px; padding: 9px 11px; border: 1px solid var(--border-strong); border-radius: 8px; font: inherit; }
    input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,127,141,.14); }
    small { color: var(--text-secondary); font-weight: 400; }
    .full-width { grid-column: 1 / -1; }
    button { margin-top: 24px; width: 100%; min-height: 42px; padding: 10px 14px; border: 1px solid var(--brand); border-radius: 8px; background: var(--brand); color: white; font: inherit; font-weight: 650; cursor: pointer; }
    button:disabled { background: var(--text-muted); border-color: var(--text-muted); cursor: not-allowed; }
    .error { color: var(--danger); }
    .success-message { padding: 20px 0 0; line-height: 1.6; }
    .success-message h2 { color: var(--success); }
    @media (max-width: 600px) { .registration-card { padding: 24px; } .form-grid { grid-template-columns: 1fr; } .full-width { grid-column: auto; } button { min-height:44px; } }
  `]
})
export class OwnerRegistrationComponent {
  form: OwnerRegistration = {
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    documentoIdentidad: "",
    telefono: "",
    correoElectronico: "",
    username: "",
    password: "",
    inmueble: ""
  };
  errorMessage = "";
  isSubmitting = false;
  submitted = false;

  constructor(private auth: AuthService) {}

  submit() {
    if (this.isSubmitting || this.submitted) return;
    this.isSubmitting = true;
    this.errorMessage = "";
    const request: OwnerRegistration = {
      ...this.form,
      nombre: this.form.nombre.trim(),
      apellidoPaterno: this.form.apellidoPaterno.trim(),
      apellidoMaterno: this.form.apellidoMaterno?.trim() || undefined,
      documentoIdentidad: this.form.documentoIdentidad.trim(),
      telefono: this.form.telefono.trim(),
      correoElectronico: this.form.correoElectronico?.trim() || undefined,
      username: this.form.username.trim(),
      inmueble: this.form.inmueble.trim()
    };
    this.auth.registerOwner(request).subscribe({
      next: () => {
        this.submitted = true;
        this.isSubmitting = false;
      },
      error: (error: unknown) => {
        this.errorMessage = error instanceof HttpErrorResponse
          && typeof error.error?.message === "string"
          ? error.error.message
          : "No se pudo enviar la solicitud. Verifica los datos y vuelve a intentar.";
        this.isSubmitting = false;
      }
    });
  }
}
