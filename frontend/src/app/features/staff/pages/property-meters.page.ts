import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { PropiedadMedidoresResponse } from "../../../core/models/service-models";
import { apiErrorMessage } from "../../../core/services/api-error";
import { ServicioApi } from "../../../core/services/servicio-api.service";

@Component({
  selector: "app-property-meters-page",
  template: `
    <main class="property-page">
      <a class="back-link" routerLink="/staff"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Volver al escáner</a>
      <section class="property-card">
        <p class="eyebrow">LECTURAS DE SERVICIOS</p>
        <h1 *ngIf="property">Casa {{ property.numeroCasa }}</h1>
        <h1 *ngIf="!property">Propiedad</h1>
        <p class="property-code" *ngIf="property">Código {{ property.codigoInterno }}</p>
        <p class="loading" *ngIf="isLoading" role="status">Cargando propiedad y medidores...</p>
        <p class="error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>

        <ng-container *ngIf="property && !isLoading">
          <div class="meter-heading">
            <h2>Selecciona el medidor</h2>
            <span>{{ property.medidores.length }} {{ property.medidores.length === 1 ? 'equipo' : 'equipos' }}</span>
          </div>
          <div class="meter-list" *ngIf="property.medidores.length; else noMeters">
            <button class="meter-option" type="button" *ngFor="let meter of property.medidores" (click)="openMeter(meter.idMedidor)">
              <span class="service-icon" [class.water]="meter.tipoServicio.toLowerCase() === 'agua'" [class.power]="meter.tipoServicio.toLowerCase() === 'luz'">
                <i class="fa-solid" [class.fa-droplet]="meter.tipoServicio.toLowerCase() === 'agua'" [class.fa-bolt]="meter.tipoServicio.toLowerCase() === 'luz'" aria-hidden="true"></i>
              </span>
              <span class="meter-copy">
                <strong>{{ meter.tipoServicio | titlecase }}</strong>
                <small>Serie {{ meter.numeroSerie }}</small>
              </span>
              <i class="fa-solid fa-chevron-right chevron" aria-hidden="true"></i>
            </button>
          </div>
          <ng-template #noMeters>
            <div class="empty-state">
              <i class="fa-solid fa-gauge-high" aria-hidden="true"></i>
              <strong>Esta propiedad aún no tiene medidores</strong>
              <span>Contacta a administración para asociar un medidor antes de registrar lecturas.</span>
            </div>
          </ng-template>
        </ng-container>
      </section>
    </main>
  `,
  styles: [`
    .property-page { width:min(100%,720px); margin:0 auto; }
    .back-link { display:inline-flex; min-height:44px; align-items:center; gap:8px; margin-bottom:12px; color:var(--brand); font-size:13px; font-weight:650; text-decoration:none; }
    .property-card { padding:24px; border:1px solid var(--border); border-radius:14px; background:#fff; box-shadow:var(--shadow-card); }
    .eyebrow { margin:0 0 5px; color:var(--text-secondary); font-size:10px; font-weight:750; letter-spacing:.1em; }
    h1 { margin:0; color:var(--text-primary); font-size:24px; letter-spacing:-.03em; }
    .property-code { margin:6px 0 0; color:var(--text-secondary); font-size:13px; }
    .meter-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:26px 0 12px; }
    .meter-heading h2 { margin:0; color:var(--text-primary); font-size:16px; }
    .meter-heading span { color:var(--text-secondary); font-size:12px; }
    .meter-list { display:grid; gap:10px; }
    .meter-option { display:flex; width:100%; min-height:72px; align-items:center; gap:13px; padding:12px; border:1px solid var(--border); border-radius:11px; background:#fff; text-align:left; }
    .meter-option:hover { border-color:var(--accent); background:var(--accent-soft); }
    .service-icon { display:grid; width:42px; height:42px; flex:none; place-items:center; border-radius:11px; font-size:17px; }
    .service-icon.water { background:var(--brand-soft); color:var(--brand); }
    .service-icon.power { background:#fffbeb; color:#b45309; }
    .meter-copy { display:grid; flex:1; gap:4px; }
    .meter-copy strong { color:var(--text-primary); font-size:14px; }
    .meter-copy small { color:var(--text-secondary); font-size:12px; }
    .chevron { color:var(--text-muted); font-size:12px; }
    .loading,.error { margin:18px 0 0; font-size:13px; }
    .loading { color:var(--text-secondary); }
    .error { color:var(--danger); }
    .empty-state { display:grid; justify-items:center; gap:8px; padding:30px 16px; border:1px dashed var(--border-strong); border-radius:10px; color:var(--text-secondary); text-align:center; }
    .empty-state i { color:var(--brand); font-size:20px; }
    .empty-state strong { color:var(--text-primary); font-size:14px; }
    .empty-state span { max-width:44ch; font-size:12px; line-height:1.5; }
    @media(max-width:600px) {
      .property-card { padding:18px; border-radius:11px; }
      h1 { font-size:21px; }
      .meter-option { min-height:76px; }
    }
  `],
  standalone: false
})
export class PropertyMetersPage implements OnInit {
  property?: PropiedadMedidoresResponse;
  isLoading = true;
  errorMessage = "";

  constructor(private route: ActivatedRoute, private router: Router, private api: ServicioApi) {}

  ngOnInit(): void {
    const idPropiedad = this.route.snapshot.paramMap.get("idPropiedad");
    if (!idPropiedad) {
      this.errorMessage = "No se especificó una propiedad válida.";
      this.isLoading = false;
      return;
    }
    this.api.getPropiedadMedidores(idPropiedad).subscribe({
      next: property => {
        this.property = property;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        console.error("Error cargando medidores de la propiedad", error);
        this.errorMessage = apiErrorMessage(error, "No se pudo cargar la propiedad y sus medidores.");
        this.isLoading = false;
      }
    });
  }

  openMeter(idMedidor: string): void {
    void this.router.navigate(["/staff/read", idMedidor]);
  }
}
