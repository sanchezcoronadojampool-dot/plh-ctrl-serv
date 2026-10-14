import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { PasswordChangeDialog } from "../../../core/components/password-change.dialog";

@Component({
  selector: "app-staff-layout",
  template: `
    <div class="staff-shell">
      <header class="staff-topbar">
        <a class="brand" routerLink="/staff" aria-label="Volver a registro de lecturas">
          <img class="brand-logo" src="assets/logo-plh.png" alt="">
          <span class="brand-copy"><strong>Playa La Honda</strong><small>Operaciones</small></span>
        </a>
        <nav class="staff-nav" aria-label="Navegación de personal">
          <a routerLink="/staff" routerLinkActive="active">
            <i class="fa-solid fa-qrcode" aria-hidden="true"></i>
            <span>Registrar lectura</span>
          </a>
        </nav>
        <div class="staff-user">
          <div class="user-copy">
            <strong>{{ auth.name || 'Operador' }}</strong>
            <span>Personal operativo</span>
          </div>
          <app-password-change-dialog />
          <button type="button" class="logout-button" (click)="logout()" aria-label="Cerrar sesión">
            <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </header>
      <main class="staff-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; min-height:100vh; min-height:100dvh; background:var(--surface-subtle, #f9fafb); }
    .staff-shell { min-height:100vh; min-height:100dvh; }
    .staff-topbar { position:sticky; top:0; z-index:20; display:flex; min-height:68px; align-items:center; gap:28px; padding:0 32px; border-bottom:1px solid var(--border, #e5e7eb); background:rgba(255,255,255,.96); backdrop-filter:blur(12px); }
    .brand { display:flex; flex:none; align-items:center; gap:10px; color:var(--text-primary, #18181b); text-decoration:none; }
    .brand-logo { display:block; width:42px; height:42px; border-radius:6px; object-fit:contain; }
    .brand-copy,.user-copy { display:grid; gap:2px; }
    .brand-copy strong,.user-copy strong { color:#18181b; font-size:13px; font-weight:650; }
    .brand-copy small,.user-copy span { color:#52525b; font-size:11px; }
    .staff-nav { display:flex; align-self:stretch; align-items:center; }
    .staff-nav a { display:flex; height:100%; align-items:center; gap:8px; padding:0 12px; border-bottom:2px solid transparent; color:#52525b; font-size:13px; font-weight:600; text-decoration:none; }
    .staff-nav a.active { border-bottom-color:var(--accent, #007f8d); color:var(--brand, #003b73); }
    .staff-user { display:flex; align-items:center; gap:16px; margin-left:auto; }
    .user-copy { text-align:right; }
    .logout-button { display:inline-flex; min-height:36px; align-items:center; justify-content:center; gap:8px; padding:0 11px; border:1px solid #d4d4d8; border-radius:7px; background:#fff; color:#3f3f46; font:inherit; font-size:12px; font-weight:600; cursor:pointer; transition:background .18s,border-color .18s,color .18s; }
    .logout-button:hover { border-color:#fca5a5; background:#fef2f2; color:#991b1b; }
    .logout-button:focus-visible,.staff-nav a:focus-visible,.brand:focus-visible { outline:3px solid var(--accent, #007f8d); outline-offset:2px; }
    .staff-content { padding:28px 24px 56px; }
    @media(max-width:700px) {
      .staff-topbar { flex-wrap:wrap; gap:0 16px; padding:10px max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left)); }
      .brand { min-height:42px; }
      .staff-user { gap:9px; }
      .user-copy { display:none; }
      .logout-button { width:44px; height:44px; min-height:44px; padding:0; }
      .logout-button span { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; }
      .staff-nav { order:3; width:100%; min-height:42px; }
      .staff-nav a { min-height:44px; padding:0 4px; }
      .staff-content { padding:20px max(14px, env(safe-area-inset-right)) max(48px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left)); }
    }
    @media(prefers-reduced-motion:reduce) { .logout-button { transition:none; } }
  `  ],
  standalone: false
})
export class StaffLayoutComponent {
  constructor(public readonly auth: AuthService, private readonly router: Router) {}

  logout(): void {
    this.auth.clearSession();
    void this.router.navigate(["/login"]);
  }
}
