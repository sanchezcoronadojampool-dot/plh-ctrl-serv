import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { OwnerApiService, OwnerPortalData } from "../../core/services/owner-api.service";
import { apiErrorMessage } from "../../core/services/api-error";

@Component({
    selector: "app-owner-portal",
    imports: [CommonModule],
    template: `
    <main class="owner-page">
      <div class="owner-content">
        <header class="owner-header">
          <div class="owner-heading">
            <p class="eyebrow">CONDOMINIO PLAYA LA HONDA</p>
            <h1>Portal de propietario</h1>
            <p>Hola, {{ firstName }}. Consulta tus inmuebles, lecturas y facturas.</p>
          </div>
          <button class="logout-button" type="button" (click)="logout()">
            <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
            <span>Cerrar sesión</span>
          </button>
        </header>

        <nav class="mobile-section-nav" aria-label="Secciones del portal">
          <a href="#properties">Inmuebles</a>
          <a href="#readings">Lecturas</a>
          <a href="#invoices">Facturas</a>
        </nav>

        <p *ngIf="isLoading" class="notice" role="status">Cargando información de tus inmuebles...</p>
        <p *ngIf="errorMessage" class="error" role="alert">{{ errorMessage }}</p>

        <ng-container *ngIf="data && !isLoading">
          <section class="section" id="properties">
          <h2>Mis inmuebles</h2>
          <div class="property-grid" *ngIf="data.propiedades.length; else noProperties">
            <article class="property-card" *ngFor="let property of data.propiedades">
              <div class="property-top">
                <div><span class="property-number">Casa {{ property.casa }}</span><h3>{{ property.codigo }}</h3></div>
                <span class="property-location">{{ property.manzana ? 'Manzana ' + property.manzana : '' }}{{ property.sector ? ' · ' + property.sector : '' }}</span>
              </div>
              <h4><i class="fa-solid fa-gauge-high" aria-hidden="true"></i> Medidores <span>{{ property.medidores.length }}</span></h4>
              <ul class="meter-list" *ngIf="property.medidores.length; else noMeters">
                <li *ngFor="let meter of property.medidores">
                  <span class="service-badge" [class.water]="meter.servicio.toLowerCase() === 'agua'">
                    <i class="fa-solid" [class.fa-droplet]="meter.servicio.toLowerCase() === 'agua'" [class.fa-bolt]="meter.servicio.toLowerCase() !== 'agua'" aria-hidden="true"></i>
                    {{ meter.servicio }}
                  </span>
                  <span class="meter-serial">Serie <strong>{{ meter.numeroSerie }}</strong></span>
                </li>
              </ul>
              <ng-template #noMeters><p class="muted">No hay medidores asociados.</p></ng-template>
            </article>
          </div>
          <ng-template #noProperties>
            <div class="empty-state">
              <span class="empty-icon" aria-hidden="true"><i class="fa-solid fa-house-chimney"></i></span>
              <h3>No hay inmuebles asociados</h3>
              <p>Contacta al administrador para verificar la asociación de tu cuenta.</p>
            </div>
          </ng-template>
          </section>

          <section class="section" id="readings">
          <h2>Lecturas registradas</h2>
          <div class="table-card" *ngIf="data.lecturas.length">
            <table>
              <thead><tr><th>Fecha</th><th>Casa</th><th>Servicio</th><th>Lectura</th></tr></thead>
              <tbody>
                <tr *ngFor="let reading of data.lecturas">
                  <td data-label="Fecha">{{ reading.fecha | date:'short' }}</td><td data-label="Casa">{{ reading.casa }}</td><td data-label="Servicio">{{ reading.servicio }}</td><td data-label="Lectura">{{ reading.valor }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="empty-state" *ngIf="!data.lecturas.length">
            <span class="empty-icon" aria-hidden="true"><i class="fa-solid fa-gauge-high"></i></span>
            <h3>Todavía no hay lecturas registradas</h3>
            <p>Las lecturas aparecerán aquí cuando el personal las registre. Si esperabas ver datos, contacta al administrador.</p>
          </div>
          </section>

          <section class="section" id="invoices">
          <h2>Facturas</h2>
          <div class="table-card" *ngIf="data.facturas.length">
            <table>
              <thead><tr><th>Número</th><th>Fecha</th><th>Casa</th><th>Total</th><th>Estado</th></tr></thead>
              <tbody>
                <tr *ngFor="let invoice of data.facturas">
                  <td data-label="Número">{{ invoice.numeroFactura }}</td><td data-label="Fecha">{{ invoice.fecha | date:'mediumDate' }}</td><td data-label="Casa">{{ invoice.casa }}</td>
                  <td data-label="Total">{{ invoice.total | currency:'PEN':'symbol':'1.2-2' }}</td><td data-label="Estado"><span class="invoice-status">{{ invoice.estado }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="empty-state" *ngIf="!data.facturas.length">
            <span class="empty-icon" aria-hidden="true"><i class="fa-solid fa-file-invoice-dollar"></i></span>
            <h3>Todavía no hay facturas emitidas</h3>
            <p>Las facturas asociadas a tus inmuebles estarán disponibles aquí.</p>
          </div>
          </section>
        </ng-container>
      </div>
    </main>
  `,
    styles: [`
    .owner-page { min-height: 100vh; min-height: 100svh; padding: max(28px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(56px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); background: var(--surface-subtle); color: var(--text-primary); scroll-behavior:smooth; }
    .owner-content { width: 100%; max-width: 1360px; margin: 0 auto; }
    .owner-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 18px; padding: 18px 20px; border: 1px solid var(--border); border-radius: 12px; background: white; box-shadow: var(--shadow-card); }
    .owner-header h1 { margin: 4px 0; color: var(--text-primary); font-size: 24px; letter-spacing: -.03em; }
    .owner-header p { margin: 0; color: #52525b; }
    .owner-header .owner-heading>p:last-child { font-size:13px; }
    .logout-button { display:inline-flex; flex:none; min-height:40px; align-items:center; justify-content:center; gap:8px; border:1px solid var(--border-strong); border-radius:8px; background:white; padding:8px 12px; color:#3f3f46; font:inherit; font-size:12px; font-weight:600; cursor:pointer; }
    .logout-button:hover { border-color:#fca5a5; background:#fef2f2; color:#991b1b; }
    .logout-button:focus-visible,.mobile-section-nav a:focus-visible { outline:3px solid var(--accent); outline-offset:2px; }
    .eyebrow { color: #52525b !important; font-size: 12px; font-weight: 700; letter-spacing: .08em; }
    .mobile-section-nav { display:none; }
    .section { margin: 24px 0; }
    .section h2 { margin: 0 0 14px; color: var(--text-primary); font-size: 18px; letter-spacing: -.02em; }
    .property-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
    .property-card, .table-card, .empty-state { overflow: hidden; border: 1px solid var(--border); border-radius: 12px; background: white; box-shadow: var(--shadow-card); }
    .property-card { padding: 18px; }
    .property-top { display: flex; justify-content: space-between; gap: 10px; }
    .property-number { color:#3f3f46; font-size:13px; font-weight:650; }
    .property-top h3 { margin: 4px 0 12px; color: var(--brand); font-size:16px; }
    .property-location, .muted { color: #52525b; font-size: 13px; }
    .property-card h4 { display:flex; align-items:center; gap:7px; margin: 12px 0 8px; color:#27272a; font-size:13px; }
    .property-card h4>i { color:var(--brand); }
    .property-card h4>span { display:grid; min-width:20px; height:20px; place-items:center; margin-left:auto; border-radius:99px; background:#f4f4f5; color:#3f3f46; font-size:11px; }
    .meter-list { display:grid; gap:7px; margin:0; padding:0; list-style:none; }
    .meter-list li { display:flex; min-width:0; align-items:center; gap:9px; padding:8px 9px; border:1px solid #e4e4e7; border-radius:8px; background:#fafafa; }
    .service-badge { display:inline-flex; flex:none; align-items:center; gap:5px; padding:4px 7px; border:1px solid var(--border); border-radius:99px; background:var(--brand-soft); color:var(--brand); font-size:11px; font-weight:650; text-transform:capitalize; }
    .service-badge.water { border-color:#a5f3fc; background:#ecfeff; color:#155e75; }
    .meter-serial { min-width:0; overflow:hidden; color:#52525b; font-size:11px; text-overflow:ellipsis; white-space:nowrap; }
    .meter-serial strong { color:#27272a; font-weight:600; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 13px 16px; border-bottom: 1px solid var(--border); font-size: 13px; }
    th { color: #374151; background: var(--surface-subtle); font-size: 11px; font-weight: 650; text-transform: uppercase; letter-spacing: .05em; }
    .table-card { overflow-x: auto; }
    .invoice-status { display:inline-flex; padding:4px 8px; border:1px solid #d4d4d8; border-radius:99px; background:#f4f4f5; color:#27272a; font-size:11px; font-weight:600; }
    .notice { padding: 14px; border: 1px solid var(--border); border-radius: 10px; background: white; color: var(--text-secondary); }
    .error { padding: 14px; border-radius: 10px; background: var(--danger-soft); color: var(--danger); }
    .empty-state { display: grid; justify-items: center; padding: 28px 18px; text-align: center; }
    .empty-icon { display: grid; width: 40px; height: 40px; place-items: center; border: 1px solid var(--border); border-radius: 10px; background: var(--surface-subtle); color: var(--brand); }
    .empty-state h3 { margin: 12px 0 4px; color: var(--text-primary); font-size: 14px; }
    .empty-state p { margin: 0; color: var(--text-secondary); font-size: 12px; }
    @media (prefers-reduced-motion: no-preference) { .property-card, .table-card, .empty-state { animation: surface-reveal 240ms var(--ease-out) both; } }
    @media(max-width:700px) {
      .owner-page { padding:max(12px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(72px, calc(env(safe-area-inset-bottom) + 48px)) max(14px, env(safe-area-inset-left)); }
      .owner-header { position:relative; gap:12px; margin-bottom:10px; padding:13px 14px; }
      .owner-heading { min-width:0; }
      .owner-header h1 { font-size:20px; }
      .owner-header .owner-heading>p:last-child { max-width:34ch; font-size:12px; line-height:1.45; }
      .eyebrow { font-size:12px; }
      .logout-button { width:44px; height:44px; min-height:44px; padding:0; }
      .logout-button span { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; }
      .mobile-section-nav { position:sticky; top:0; z-index:10; display:flex; gap:7px; overflow-x:auto; margin:0 -14px 18px; padding:9px max(14px, env(safe-area-inset-right)) 9px max(14px, env(safe-area-inset-left)); border-bottom:1px solid var(--border); background:rgba(249,250,251,.96); backdrop-filter:blur(10px); scrollbar-width:none; }
      .mobile-section-nav::-webkit-scrollbar { display:none; }
      .mobile-section-nav a { display:inline-flex; min-height:44px; flex:none; align-items:center; padding:8px 12px; border:1px solid #d4d4d8; border-radius:99px; background:#fff; color:#3f3f46; font-size:12px; font-weight:600; text-decoration:none; }
      .section { margin:20px 0; scroll-margin-top:62px; }
      .section h2 { margin-bottom:10px; font-size:16px; }
      .property-grid { grid-template-columns:1fr; gap:10px; }
      .property-card { padding:15px; }
      .property-top { align-items:flex-start; }
      .property-top>div { min-width:0; }
      .property-top h3 { overflow-wrap:anywhere; }
      .property-location { max-width:40%; text-align:right; font-size:12px; }
      .meter-list li { min-height:40px; }
      .table-card { overflow:visible; border:0; background:transparent; box-shadow:none; }
      .table-card table,.table-card tbody { display:grid; gap:9px; }
      .table-card thead { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; }
      .table-card tr { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px 12px; padding:12px; border:1px solid var(--border); border-radius:10px; background:#fff; box-shadow:var(--shadow-card); }
      .table-card td { display:grid; gap:3px; min-width:0; padding:0; border:0; overflow-wrap:anywhere; font-size:12px; }
      .table-card td::before { content:attr(data-label); color:#52525b; font-size:10px; font-weight:650; }
      .table-card td[data-label="Número"],.table-card td[data-label="Estado"] { grid-column:1 / -1; }
      .empty-state { padding:24px 16px; }
      .empty-state h3 { font-size:14px; }
      .empty-state p { max-width:38ch; font-size:13px; line-height:1.5; }
    }
    @media(prefers-reduced-motion:reduce) { .owner-page { scroll-behavior:auto; } }
  `]
})
export class OwnerPortalComponent implements OnInit {
  data: OwnerPortalData | null = null;
  isLoading = false;
  errorMessage = "";

  constructor(public auth: AuthService, private ownerApi: OwnerApiService, private router: Router) {}

  get firstName(): string {
    return this.auth.name?.trim().split(/\s+/)[0] || "propietario";
  }

  ngOnInit() {
    this.isLoading = true;
    this.ownerApi.getOverview().subscribe({
      next: (data) => {
        this.data = data;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, "No se pudo cargar la información del propietario.");
        this.isLoading = false;
      }
    });
  }

  logout() {
    this.auth.clearSession();
    void this.router.navigate(["/login"]);
  }
}
