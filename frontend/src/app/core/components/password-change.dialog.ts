import { Component, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { apiErrorMessage } from "../services/api-error";

/**
 * Diálogo reutilizable para que cualquier cuenta autenticada
 * (admin, operador o propietario) cambie su propia contraseña.
 */
@Component({
  selector: "app-password-change-dialog",
  imports: [CommonModule, FormsModule],
  template: `
    <button type="button" class="trigger" (click)="open()">
      <i class="fa-solid fa-key" aria-hidden="true"></i>
      <span>Cambiar contraseña</span>
    </button>

    <div class="modal-overlay" *ngIf="isOpen" (click)="close()">
      <form class="modal-content" role="dialog" aria-modal="true" aria-labelledby="pw-dialog-title"
        #pwForm="ngForm" (ngSubmit)="submit()" (click)="$event.stopPropagation()">
        <h3 id="pw-dialog-title">Cambiar contraseña</h3>
        <p class="modal-hint">Al guardar, se cierran las demás sesiones abiertas con tu cuenta.</p>

        <label class="field">
          Contraseña actual
          <input type="password" name="currentPassword" [(ngModel)]="currentPassword"
            autocomplete="current-password" required>
        </label>
        <label class="field">
          Nueva contraseña
          <input type="password" name="newPassword" [(ngModel)]="newPassword"
            autocomplete="new-password" minlength="12" maxlength="72" required>
        </label>
        <label class="field">
          Confirmar nueva contraseña
          <input type="password" name="confirmPassword" [(ngModel)]="confirmPassword"
            autocomplete="new-password" minlength="12" maxlength="72" required>
        </label>
        <p class="hint">Usa al menos 12 caracteres.</p>

        <p class="error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
        <p class="success" *ngIf="successMessage" role="status">{{ successMessage }}</p>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" (click)="close()" [disabled]="isSubmitting">Cancelar</button>
          <button type="submit" class="btn-save" [disabled]="pwForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Guardando...' : 'Guardar contraseña' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .trigger { display:inline-flex; min-height:36px; align-items:center; gap:8px; padding:8px 12px; border:1px solid var(--border); border-radius:9px; background:white; color:var(--text-secondary); font:inherit; font-size:12px; font-weight:600; cursor:pointer; }
    .trigger:hover { border-color:var(--brand); color:var(--brand); }
    .trigger:focus-visible { outline:3px solid var(--accent); outline-offset:2px; }
    .modal-overlay { position:fixed; inset:0; z-index:2000; display:flex; align-items:flex-start; justify-content:center; overflow-y:auto; padding:24px 16px; background:rgba(15,23,42,.5); }
    .modal-content { width:min(100%,420px); margin:auto 0; padding:26px; border:1px solid var(--border); border-radius:14px; background:white; box-shadow:0 16px 40px rgba(15,23,42,.16); }
    .modal-content h3 { margin:0; color:var(--text-primary); font-size:18px; }
    .modal-hint { margin:8px 0 0; color:var(--text-secondary); font-size:12px; line-height:1.5; }
    .field { display:flex; flex-direction:column; gap:6px; margin-top:16px; color:var(--text-primary); font-size:13px; font-weight:600; }
    .field input { min-height:40px; padding:9px 11px; border:1px solid var(--border-strong); border-radius:8px; font:inherit; }
    .field input:focus { outline:none; border-color:var(--accent); box-shadow:0 0 0 3px rgba(0,127,141,.14); }
    .hint { margin:8px 0 0; color:var(--text-secondary); font-size:11px; }
    .error { margin:12px 0 0; color:var(--danger); font-size:13px; font-weight:600; }
    .success { margin:12px 0 0; color:var(--success); font-size:13px; font-weight:600; }
    .modal-actions { display:flex; justify-content:flex-end; flex-wrap:wrap; gap:10px; margin-top:22px; padding-top:16px; border-top:1px solid var(--border); }
    .modal-actions button { min-height:38px; padding:8px 14px; border-radius:8px; font:inherit; font-size:13px; font-weight:600; cursor:pointer; }
    .btn-cancel { background:white; color:var(--text-secondary); border:1px solid var(--border-strong); }
    .btn-save { background:var(--brand); color:white; border:1px solid var(--brand); }
    .modal-actions button:disabled { opacity:.55; cursor:not-allowed; }
    @media (max-width:480px) { .modal-content { padding:20px; } .modal-actions button { min-height:44px; } }
  `]
})
export class PasswordChangeDialog implements OnDestroy {
  isOpen = false;
  currentPassword = "";
  newPassword = "";
  confirmPassword = "";
  isSubmitting = false;
  errorMessage = "";
  successMessage = "";

  constructor(private auth: AuthService, private router: Router) {}

  ngOnDestroy(): void {
    document.body.classList.remove("modal-open");
  }

  open(): void {
    this.isOpen = true;
    this.reset();
    document.body.classList.add("modal-open");
  }

  close(): void {
    if (this.isSubmitting) return;
    this.isOpen = false;
    document.body.classList.remove("modal-open");
  }

  submit(): void {
    if (this.isSubmitting) return;
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = "Las contraseñas nuevas no coinciden.";
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = "";
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = "Contraseña actualizada. Vuelve a iniciar sesión.";
        // La subida de passwordVersion invalida el token actual: cerramos sesión.
        setTimeout(() => {
          this.auth.clearSession();
          void this.router.navigate(["/login"]);
        }, 1200);
      },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, "No se pudo cambiar la contraseña.");
        this.isSubmitting = false;
      }
    });
  }

  private reset(): void {
    this.currentPassword = "";
    this.newPassword = "";
    this.confirmPassword = "";
    this.errorMessage = "";
    this.successMessage = "";
  }
}
