import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminApiService, ApiPage, Propiedad, ReadingHistory } from '../../../core/services/admin-api.service';
import { apiErrorMessage } from '../../../core/services/api-error';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-reading-history-page',
    imports: [CommonModule, FormsModule],
    template: `
    <main class="history-page">
      <header class="page-heading">
        <div><p class="eyebrow">OPERACIONES</p><h1>Historial de lecturas</h1><p>Consulta lecturas, quién las registró y la evidencia disponible.</p></div>
      </header>
      <div class="property-context" *ngIf="selectedProperty">
        <i class="fa-solid fa-house-chimney" aria-hidden="true"></i>
        <div><strong>Casa {{ selectedProperty.numeroCasa }}</strong><span>{{ selectedProperty.codigoInterno }}{{ selectedProperty.propietario ? ' · ' + selectedProperty.propietario : '' }}</span></div>
      </div>
      <section class="panel">
        <form class="filters" (ngSubmit)="applyFilters()">
          <label class="property-filter">Propiedad<select [(ngModel)]="propertyId" name="property" (ngModelChange)="changeProperty()" required><option value="">Selecciona una propiedad</option><option *ngFor="let property of properties" [value]="property.id">Casa {{ property.numeroCasa }} · {{ property.codigoInterno }}</option></select></label>
          <label>Buscar<input [(ngModel)]="query" name="query" placeholder="Serie o personal" [disabled]="!propertyId"></label>
          <label>Servicio<select [(ngModel)]="service" name="service" [disabled]="!propertyId"><option value="">Todos</option><option value="agua">Agua</option><option value="luz">Luz</option></select></label>
          <label>Desde<input type="date" [(ngModel)]="fromDate" name="fromDate" [disabled]="!propertyId"></label>
          <label>Hasta<input type="date" [(ngModel)]="toDate" name="toDate" [disabled]="!propertyId"></label>
          <div class="filter-actions"><button class="primary-button" type="submit" [disabled]="!propertyId">Aplicar filtros</button><button class="secondary-button" type="button" (click)="clearFilters()" [disabled]="!propertyId">Limpiar</button></div>
        </form>
        <p *ngIf="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <div class="loading" *ngIf="loading" role="status">Cargando lecturas...</div>
        <div class="table-wrap" role="region" tabindex="0" aria-label="Historial de lecturas; desliza horizontalmente para ver todas las columnas" *ngIf="!loading && readings.length">
          <table><thead><tr><th>Fecha</th><th>Servicio / medidor</th><th>Lectura</th><th>Registrada por</th><th>Evidencia / ubicación</th></tr></thead>
            <tbody><tr *ngFor="let reading of readings">
              <td>{{ reading.fecha | date:'medium' }}</td>
              <td><span class="service" [class.water]="reading.servicio === 'agua'">{{ reading.servicio === 'agua' ? 'Agua' : 'Luz' }}</span><small>{{ reading.numeroSerie }}</small></td>
              <td>{{ reading.valor | number:'1.0-2' }}</td>
              <td>{{ reading.staff }}</td>
              <td class="evidence">
                <a *ngIf="reading.evidenciaUrl" [href]="reading.evidenciaUrl" target="_blank" rel="noopener noreferrer">Ver evidencia</a>
                <span *ngIf="reading.coordenadas">GPS {{ reading.coordenadas }}</span>
                <span *ngIf="!reading.evidenciaUrl && !reading.coordenadas">Sin adjuntos</span>
                <small *ngIf="reading.observaciones">{{ reading.observaciones }}</small>
              </td>
            </tr></tbody>
          </table>
        </div>
        <div class="empty-state" *ngIf="!loading && !propertyId">
          <div class="empty-icon"><i class="fa-solid fa-house-chimney" aria-hidden="true"></i></div>
          <h2>Selecciona una propiedad</h2>
          <p>El historial se consulta por inmueble. Elige una casa para ver sus lecturas de agua y luz.</p>
        </div>
        <div class="empty-state" *ngIf="!loading && propertyId && readings.length === 0">
          <div class="empty-icon"><i class="fa-solid fa-clipboard-list" aria-hidden="true"></i></div>
          <h2>{{ hasFilters ? 'No hay lecturas que coincidan' : 'Esta propiedad aún no tiene lecturas' }}</h2>
          <p>{{ hasFilters ? 'Cambia los filtros para ampliar la búsqueda de esta propiedad.' : 'Las lecturas registradas para esta casa aparecerán aquí.' }}</p>
        </div>
        <footer class="pagination" *ngIf="page">
          <span>{{ page.totalElements }} registros · página {{ page.number + 1 }} de {{ Math.max(page.totalPages, 1) }}</span>
          <div><button class="secondary-button" type="button" (click)="changePage(-1)" [disabled]="page.first || loading">Anterior</button>
            <button class="secondary-button" type="button" (click)="changePage(1)" [disabled]="page.last || loading">Siguiente</button></div>
        </footer>
      </section>
    </main>
  `,
    styles: [`
    :host{display:block;color:#18181b}.history-page{max-width:1440px;margin:0 auto;padding:28px 32px 48px}
    .page-heading{margin-bottom:22px}h1{margin:0;font-size:28px;letter-spacing:-.035em}.eyebrow{margin:0 0 7px;color:#52525b;font-size:10px;font-weight:700;letter-spacing:.1em}
    .page-heading p:last-child{margin:7px 0 0;color:#52525b;font-size:13px}.panel{border:1px solid #e4e4e7;border-radius:12px;background:#fff;box-shadow:0 1px 2px #18181b08}
    .property-context{display:flex;align-items:center;gap:12px;margin:-6px 0 16px;padding:13px 16px;border:1px solid #bfdbfe;border-radius:9px;background:#eff6ff;color:#1e3a8a}.property-context>i{font-size:18px}.property-context div{display:grid;gap:3px}.property-context strong{font-size:13px}.property-context span{color:#374151;font-size:11px}
    .filters{display:grid;grid-template-columns:2fr 1.2fr 1fr 1fr 1fr auto;align-items:end;gap:11px;padding:18px}
    .property-filter{grid-column:auto}
    label{display:grid;gap:6px;color:#3f3f46;font-size:11px;font-weight:650}input,select{min-width:0;height:36px;padding:0 9px;border:1px solid #d4d4d8;border-radius:6px;background:white;color:#18181b;font-family:inherit;font-size:12px}
    input:disabled,select:disabled{background:#f4f4f5;color:#71717a;cursor:not-allowed}
    input:focus,select:focus{outline:2px solid #93c5fd;outline-offset:1px;border-color:#2563eb}
    .filter-actions,.pagination,.pagination div{display:flex;align-items:center;gap:7px}.primary-button,.secondary-button{height:36px;padding:0 11px;border-radius:6px;font-family:inherit;font-size:12px;font-weight:600;white-space:nowrap;cursor:pointer}
    .primary-button{border:1px solid #1d4ed8;background:#2563eb;color:white}.secondary-button{border:1px solid #d4d4d8;background:#fff;color:#27272a}.secondary-button:disabled{opacity:.5;cursor:not-allowed}
    .table-wrap{max-width:100%;overflow:auto;overscroll-behavior-x:contain}table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}th{padding:11px 14px;border-top:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7;background:#fafafa;color:#3f3f46;font-size:11px;font-weight:650}
    td{padding:12px 14px;border-bottom:1px solid #f0f0f1;color:#3f3f46;font-size:12px}td strong{color:#18181b}td small{display:block;margin-top:4px;color:#52525b;font-size:11px}
    .service{padding:4px 8px;border:1px solid #bfdbfe;border-radius:99px;background:#eff6ff;color:#1e40af;font-size:10px;font-weight:600}.service.water{border-color:#a5f3fc;background:#ecfeff;color:#155e75}
    .evidence{white-space:normal;min-width:145px}.evidence a{display:inline-block;margin-right:9px;color:#1d4ed8;font-weight:600}.evidence span{color:#52525b}
    .pagination{justify-content:space-between;padding:13px 16px;color:#52525b;font-size:12px}.loading,.empty-state{padding:40px 20px;text-align:center;color:#52525b}.empty-icon{display:grid;width:44px;height:44px;place-items:center;margin:0 auto;border-radius:12px;background:#eff6ff;color:#1d4ed8}.empty-state h2{margin:14px 0 0;color:#18181b;font-size:16px}.empty-state p{margin:6px 0 0;font-size:13px}.error{margin:0 18px 12px;color:#991b1b}
    @media(max-width:1050px){.filters{grid-template-columns:repeat(3,minmax(0,1fr))}.property-filter{grid-column:span 2}.filter-actions{grid-column:span 3}}
    @media(max-width:620px){.history-page{padding:20px 14px 48px}.filters{grid-template-columns:repeat(2,minmax(0,1fr));padding:14px}.filter-actions{grid-column:span 2;flex-wrap:wrap}.filter-actions button{min-height:44px}.pagination{align-items:flex-start;flex-direction:column}}
    @media(max-width:400px){.filters{grid-template-columns:minmax(0,1fr)}.property-filter,.filter-actions{grid-column:auto}.filter-actions>*{flex:1}.pagination div{width:100%;flex-wrap:wrap}.pagination div button{min-height:44px}}
  `]
})
export class ReadingHistoryPage implements OnInit {
  readonly Math = Math;
  properties: Propiedad[] = [];
  readings: ReadingHistory[] = [];
  page: ApiPage<ReadingHistory> | null = null;
  service = '';
  propertyId = '';
  fromDate = '';
  toDate = '';
  query = '';
  loading = false;
  errorMessage = '';
  private pageIndex = 0;
  private loadSequence = 0;

  constructor(private readonly api: AdminApiService, private readonly route: ActivatedRoute, private readonly router: Router) {}
  get selectedProperty(): Propiedad | undefined { return this.properties.find(property => property.id === this.propertyId); }
  get hasFilters(): boolean { return !!(this.service || this.fromDate || this.toDate || this.query.trim()); }

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.queryParamMap.get('propiedad') ?? '';
    this.api.getPropiedades().subscribe({
      next: properties => this.properties = properties,
      error: error => this.errorMessage = apiErrorMessage(error, 'No se pudieron cargar los inmuebles.')
    });
    if (this.propertyId) this.load();
  }
  applyFilters(): void { this.pageIndex = 0; this.load(); }
  changeProperty(): void {
    this.pageIndex = 0;
    this.service = '';
    this.fromDate = '';
    this.toDate = '';
    this.query = '';
    this.readings = [];
    this.page = null;
    this.loadSequence++;
    this.loading = false;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { propiedad: this.propertyId || null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    if (this.propertyId) this.load();
    else { this.page = null; this.readings = []; }
  }
  clearFilters(): void { this.service = ''; this.fromDate = ''; this.toDate = ''; this.query = ''; this.applyFilters(); }
  changePage(delta: number): void { this.pageIndex += delta; this.load(); }
  private load(): void {
    if (!this.propertyId) return;
    const sequence = ++this.loadSequence;
    this.loading = true; this.errorMessage = '';
    this.api.getReadingHistory({
      page: this.pageIndex, size: 20, servicio: this.service, propiedad: this.propertyId,
      desde: this.fromDate, hasta: this.toDate, q: this.query.trim()
    }).pipe(finalize(() => {
      if (sequence === this.loadSequence) this.loading = false;
    })).subscribe({
      next: page => {
        if (sequence === this.loadSequence) { this.page = page; this.readings = page.content; }
      },
      error: error => {
        if (sequence === this.loadSequence) {
          this.errorMessage = apiErrorMessage(error, 'No se pudo cargar el historial de lecturas.');
          this.readings = [];
        }
      },
    });
  }
}
