import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { PasswordChangeDialog } from "../../../core/components/password-change.dialog";
import { AdminNotification, NotificationApiService } from "../../../core/services/notification-api.service";
import { apiErrorMessage } from "../../../core/services/api-error";
import { EMPTY, Subject, catchError, merge, switchMap, takeUntil, timer } from "rxjs";

@Component({
    selector: "app-admin-layout",
    imports: [CommonModule, RouterModule, PasswordChangeDialog],
    template: `
    <div class="admin-shell">
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand-container">
            <div class="logo-mark">
              <img src="assets/logo-plh.png" alt="" class="brand-isotype">
            </div>
            <div class="brand-copy">
              <span>Condominio</span>
              <strong>Playa La Honda</strong>
            </div>
          </div>
        </div>
        
        <nav class="nav-group">
          <div class="nav-label">GESTIÓN PRINCIPAL</div>
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <div class="nav-icon-wrapper"><i class="fa-solid fa-chart-pie"></i></div>
            <span class="nav-text">Dashboard</span>
          </a>
          <a routerLink="/admin/properties" routerLinkActive="active" class="nav-item">
            <div class="nav-icon-wrapper"><i class="fa-solid fa-house-chimney"></i></div>
            <span class="nav-text">Propiedades</span>
          </a>
          <a routerLink="/admin/property-qrs" routerLinkActive="active" class="nav-item">
            <div class="nav-icon-wrapper"><i class="fa-solid fa-qrcode"></i></div>
            <span class="nav-text">QR de propiedades</span>
          </a>
          <a routerLink="/admin/billing" routerLinkActive="active" class="nav-item">
            <div class="nav-icon-wrapper"><i class="fa-solid fa-file-invoice-dollar"></i></div>
            <span class="nav-text">Facturación</span>
          </a>
          <a routerLink="/admin/services" routerLinkActive="active" class="nav-item">
            <div class="nav-icon-wrapper"><i class="fa-solid fa-gauge-high"></i></div>
            <span class="nav-text">Medidores y tarifas</span>
          </a>
          <a routerLink="/admin/readings" routerLinkActive="active" class="nav-item">
            <div class="nav-icon-wrapper"><i class="fa-solid fa-clipboard-list"></i></div>
            <span class="nav-text">Lecturas</span>
          </a>
          <a routerLink="/admin/staff" routerLinkActive="active" class="nav-item">
            <div class="nav-icon-wrapper"><i class="fa-solid fa-users-gear"></i></div>
            <span class="nav-text">Staff</span>
          </a>
        </nav>
      </aside>

      <main class="main-container">
        <header class="top-bar" aria-label="Navegación de usuario">
          <div class="bar-right">
            <div class="notification-container">
              <button type="button" class="notification-trigger" (click)="toggleNotifications()" [attr.aria-expanded]="showNotifDropdown" aria-controls="notification-menu" [attr.aria-label]="'Notificaciones: ' + unreadCount + ' sin leer'">
                <i class="fa-regular fa-bell"></i>
                <span class="notif-count" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
              </button>
              
              <div id="notification-menu" class="notif-dropdown" [class.show]="showNotifDropdown" *ngIf="showNotifDropdown" role="region" aria-label="Notificaciones recientes">
                <div class="notif-header">
                  <span>Notificaciones</span>
                  <button type="button" (click)="markAllAsRead()" class="mark-all-btn" [disabled]="unreadCount === 0 || isUpdatingNotifications">Marcar todo como leído</button>
                </div>
                <p class="notification-error" *ngIf="notificationError" role="alert">{{ notificationError }}</p>
                <div class="notif-list">
                  <div *ngIf="notifications.length === 0" class="notif-empty">
                    {{ isLoadingNotifications ? 'Cargando notificaciones...' : 'No hay notificaciones' }}
                  </div>
                  <div *ngFor="let n of notifications" class="notif-item" [class.unread]="!n.read">
                    <div class="notif-content">
                      <strong class="notif-title">{{ n.title }}</strong>
                      <p class="notif-msg">{{ n.message }}</p>
                      <time class="notif-date" [attr.datetime]="n.createdAt">{{ n.createdAt | date:'medium' }}</time>
                    </div>
                    <button type="button" *ngIf="!n.read" (click)="openNotification(n)" [disabled]="isUpdatingNotifications" class="read-btn" [attr.aria-label]="'Marcar como leída y abrir: ' + n.title"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></button>
                  </div>
                </div>
              </div>
            </div>

            <div class="profile-pill">
              <div class="profile-info">
                <span class="profile-name">{{ currentUser.name }}</span>
                <span class="profile-role">{{ currentUser.role }}</span>
              </div>
              <div class="profile-avatar">{{ currentUser.initials }}</div>
            </div>
            <app-password-change-dialog />
            <button type="button" (click)="logout()" class="btn-logout">
              <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>

        <div class="content-viewport">
          <div class="content-inner">
            <router-outlet></router-outlet>
          </div>
        </div>

        <footer class="app-footer">
          <div class="footer-content">
            <span>© 2026 Condominio Playa la Honda</span>
            <span class="footer-divider">|</span>
            <span class="footer-brand">MAR / NATURALEZA / BIENESTAR</span>
          </div>
        </footer>
      </main>
    </div>
  `,
    styles: [`
    :host { display: block; min-height: 100vh; color: var(--text-primary); }
    .admin-shell { display: flex; width: 100%; height: 100vh; height: 100dvh; min-height: 0; overflow: hidden; background: var(--surface-subtle); }
    .sidebar { width: 248px; flex: 0 0 248px; display: flex; flex-direction: column; overflow-y: auto; padding: 24px 16px; background: #fff; border-right: 1px solid var(--border); }
    .sidebar-header { margin: 0 0 32px; }
    .brand-container { display: flex; align-items: center; gap: 12px; padding: 0 8px; }
    .logo-mark { display: grid; width: 76px; height: 76px; flex:none; place-items: center; overflow:hidden; border: 1px solid var(--border); border-radius: 8px; background: #fff; }
    .brand-isotype { width: 100%; height: 100%; object-fit: contain; }
    .brand-copy { display: grid; gap: 2px; line-height: 1.2; }
    .brand-copy span { color: var(--text-muted); font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    .brand-copy strong { color: var(--text-primary); font-size: 14px; font-weight: 700; }
    .nav-group { display: flex; flex: 1; flex-direction: column; gap: 4px; }
    .nav-label { margin: 0 8px 8px; color: var(--text-muted); font-size: 10px; font-weight: 700; letter-spacing: .1em; }
    .nav-item { display: flex; min-height: 44px; align-items: center; gap: 12px; padding: 8px 10px; border-radius: 8px; color: var(--text-secondary); font-size: 13px; font-weight: 550; text-decoration: none; transition: background 180ms var(--ease-out), color 180ms var(--ease-out); }
    .nav-item:hover { background: var(--surface-muted); color: var(--text-primary); }
    .nav-item.active { background: var(--brand-soft); color: var(--brand); font-weight: 650; }
    .nav-icon-wrapper { display: grid; width: 20px; height: 20px; place-items: center; color: inherit; }
    .nav-icon-wrapper i { font-size: 15px; }
    .main-container { display: flex; min-width: 0; flex: 1; flex-direction: column; overflow: hidden; }
    .top-bar { z-index: 5; display: flex; min-height: 64px; flex: 0 0 64px; align-items: center; justify-content: flex-end; padding: 0 32px; border-bottom: 1px solid var(--border); background: rgba(255,255,255,.94); }
    .bar-right { display: flex; align-items: center; gap: 12px; }
    .notification-container { position: relative; }
    .notification-trigger { position: relative; display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid var(--border); border-radius: 9px; background: #fff; color: var(--text-secondary); }
    .notification-trigger:hover { border-color: var(--border-strong); background: var(--surface-subtle); }
    .notif-count { position: absolute; top: -5px; right: -5px; display: grid; min-width: 17px; height: 17px; place-items: center; padding: 0 4px; border: 2px solid white; border-radius: 99px; background: #b42318; color: white; font-size: 9px; font-weight: 700; }
    .notif-dropdown { position: absolute; top: 46px; right: 0; z-index: 20; display: none; width: min(340px, calc(100vw - 24px)); flex-direction: column; overflow: hidden; border: 1px solid var(--border); border-radius: 12px; background: white; box-shadow: 0 16px 36px rgba(15,23,42,.14); }
    .notif-dropdown.show { display: flex; animation: surface-reveal 180ms var(--ease-out) both; }
    .notif-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border); color: var(--text-primary); font-size: 13px; font-weight: 650; }
    .mark-all-btn { min-height: 30px; padding: 5px 8px; border: 0; background: transparent; color: var(--brand); font-size: 11px; font-weight: 600; }
    .mark-all-btn:disabled { color: var(--text-muted); cursor: not-allowed; }
    .notification-error { margin: 0; padding: 9px 14px; background: var(--danger-soft); color: var(--danger); font-size: 11px; line-height: 1.45; }
    .notif-list { max-height: 360px; overflow-y: auto; }
    .notif-item { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
    .notif-item:hover { background: var(--surface-subtle); }
    .notif-item.unread { background: #f8fbff; }
    .notif-content { display: grid; gap: 4px; }
    .notif-title { color: var(--text-primary); font-size: 12px; font-weight: 650; }
    .notif-msg { margin: 0; color: var(--text-primary); font-size: 12px; line-height: 1.5; }
    .notif-date { color: var(--text-secondary); font-size: 11px; }
    .read-btn { width: 28px; height: 28px; min-height: 28px; padding: 0; border: 1px solid var(--border); border-radius: 7px; background: white; color: var(--text-secondary); }
    .notif-empty { padding: 24px; color: var(--text-secondary); font-size: 13px; text-align: center; }
    .profile-pill { display: flex; align-items: center; gap: 10px; padding: 3px 8px 3px 12px; border: 1px solid var(--border); border-radius: 10px; background: white; }
    .profile-info { display: grid; gap: 2px; }
    .profile-name { color: var(--text-primary); font-size: 12px; font-weight: 650; }
    .profile-role { color: var(--text-secondary); font-size: 10px; }
    .profile-avatar { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 8px; background: #eaf1f8; color: var(--brand); font-size: 11px; font-weight: 750; }
    .btn-logout { display: inline-flex; min-height: 38px; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 9px; background: white; color: var(--text-secondary); font-size: 12px; font-weight: 600; }
    .btn-logout:hover { border-color: #fca5a5; background: var(--danger-soft); color: var(--danger); }
    .content-viewport { min-height: 0; flex: 1; overflow-y: auto; padding: 28px 32px 56px; scrollbar-gutter: stable; }
    .content-inner { width: 100%; max-width: 1440px; margin: 0 auto; }
    .app-footer { flex: 0 0 auto; padding: 12px 32px; border-top: 1px solid var(--border); background: #fff; }
    .footer-content { display: flex; justify-content: center; align-items: center; gap: 12px; color: var(--text-secondary); font-size: 11px; }
    .footer-divider { color: var(--border-strong); }
    .footer-brand { color: var(--text-secondary); font-weight: 600; letter-spacing: .04em; }
    @media (max-width: 900px) {
      .admin-shell { height: auto; min-height: 100vh; overflow: visible; flex-direction: column; }
      .sidebar { width: 100%; flex: 0 0 auto; overflow: visible; padding: 14px max(18px, env(safe-area-inset-right)) 10px max(18px, env(safe-area-inset-left)); border-right: 0; border-bottom: 1px solid var(--border); }
      .sidebar-header { margin: 0 0 12px; }
      .brand-container { padding: 0; }
      .nav-group { flex-direction: row; gap: 4px; overflow-x: auto; scrollbar-width: none; }
      .nav-group::-webkit-scrollbar { display: none; }
      .nav-label { display: none; }
      .nav-item { flex: 0 0 auto; min-height: 44px; padding: 6px 10px; font-size: 12px; }
      .main-container { overflow: visible; }
      .top-bar { min-height: 60px; flex-basis: auto; padding: 8px 20px; }
      .content-viewport { overflow: visible; padding: 24px 20px 56px; }
      .app-footer { padding: 14px 20px; }
    }
    @media (max-width: 560px) {
      .top-bar { justify-content: flex-end; padding: 8px max(14px, env(safe-area-inset-right)) 8px max(14px, env(safe-area-inset-left)); }
      .bar-right { gap: 8px; }
      .notification-trigger, .btn-logout { width:44px; min-width:44px; height:44px; min-height:44px; }
      .profile-pill { padding-left: 6px; }
      .profile-name { max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .btn-logout { padding: 0; justify-content: center; }
      .btn-logout span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }
      .mark-all-btn { min-height:44px; }
      .read-btn { width:44px; min-width:44px; height:44px; min-height:44px; }
      .content-viewport { padding: 20px max(14px, env(safe-area-inset-right)) 48px max(14px, env(safe-area-inset-left)); }
      .app-footer { padding-bottom: max(12px, env(safe-area-inset-bottom)); }
      .footer-content { flex-wrap: wrap; gap: 6px; font-size: 10px; }
    }
  `]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  showNotifDropdown = false;
  notifications: AdminNotification[] = [];
  unreadCount = 0;
  notificationError = "";
  isLoadingNotifications = true;
  isUpdatingNotifications = false;
  private readonly destroy$ = new Subject<void>();
  private readonly refreshNotifications$ = new Subject<void>();

  constructor(
    private router: Router,
    private auth: AuthService,
    private notificationApi: NotificationApiService
  ) {}

  ngOnInit() {
    merge(timer(0, 30000), this.refreshNotifications$).pipe(
      switchMap(() => this.notificationApi.listRecent().pipe(
        catchError((error: unknown) => {
          console.error("Error cargando notificaciones", error);
          this.notificationError = apiErrorMessage(error, "No se pudieron cargar las notificaciones.");
          this.isLoadingNotifications = false;
          return EMPTY;
        })
      )),
      takeUntil(this.destroy$)
    ).subscribe(feed => {
      this.notifications = feed.notifications;
      this.unreadCount = feed.unreadCount;
      this.notificationError = "";
      this.isLoadingNotifications = false;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get currentUser() {
    const name = this.auth.name || "Administrador";
    const initials = name.split(/\s+/).slice(0, 2).map(part => part[0] ?? "").join("").toUpperCase();
    return {
      name,
      role: this.auth.role === "ADMIN" ? "Administrador"
        : this.auth.role === "OWNER" ? "Propietario" : "Operador",
      initials
    };
  }

  logout() {
    this.auth.clearSession();
    this.showNotifDropdown = false;
    this.router.navigate(["/login"]);
  }

  toggleNotifications() {
    this.showNotifDropdown = !this.showNotifDropdown;
    if (this.showNotifDropdown) this.refreshNotifications$.next();
  }

  markAllAsRead() {
    if (this.unreadCount === 0 || this.isUpdatingNotifications) return;
    this.isUpdatingNotifications = true;
    this.notificationError = "";
    this.notificationApi.markAllRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map(notification => ({ ...notification, read: true }));
        this.unreadCount = 0;
        this.isUpdatingNotifications = false;
      },
      error: (error: unknown) => {
        console.error("Error marcando notificaciones como leídas", error);
        this.notificationError = apiErrorMessage(error, "No se pudieron marcar las notificaciones como leídas.");
        this.isUpdatingNotifications = false;
      }
    });
  }

  openNotification(notification: AdminNotification) {
    if (this.isUpdatingNotifications) return;
    this.notificationError = "";
    if (notification.read) {
      this.showNotifDropdown = false;
      void this.router.navigateByUrl(notification.targetPath);
      return;
    }
    this.isUpdatingNotifications = true;
    this.notificationApi.markRead(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.map(item =>
          item.id === notification.id ? { ...item, read: true } : item
        );
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.isUpdatingNotifications = false;
        this.showNotifDropdown = false;
        void this.router.navigateByUrl(notification.targetPath);
      },
      error: (error: unknown) => {
        console.error("Error marcando notificación como leída", error);
        this.notificationError = apiErrorMessage(error, "No se pudo actualizar la notificación.");
        this.isUpdatingNotifications = false;
      }
    });
  }

}
