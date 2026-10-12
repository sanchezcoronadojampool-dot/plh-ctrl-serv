import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { AdminApiService, DashboardSummary, Propiedad } from "../../../core/services/admin-api.service";
import { apiErrorMessage } from "../../../core/services/api-error";
import { ReportPdfService } from "../../../core/services/report-pdf.service";

@Component({
    selector: "app-dashboard-page",
    imports: [CommonModule, RouterModule],
    template: `
    <div class="dashboard-content">
      <div class="header-content">
        <div class="title-group">
          <h1 class="page-title">Panel de administración</h1>
          <p class="page-subtitle">Resumen operativo del Condominio Playa La Honda</p>
        </div>
        <div class="header-actions">
          <span class="date-display"><i class="fa-regular fa-calendar" aria-hidden="true"></i> {{ currentDate }}</span>
          <button type="button" class="btn-primary-action" routerLink="/staff"><i class="fa-solid fa-plus" aria-hidden="true"></i> Nueva lectura</button>
        </div>
      </div>
      
      <p class="page-error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
      <section class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Propiedades registradas</span>
            <div class="metric-icon properties-icon"><i class="fa-solid fa-house-chimney" aria-hidden="true"></i></div>
          </div>
          <div class="metric-body">
            <div class="metric-value">{{ summary?.totalPropiedades ?? '—' }}</div>
            <div class="metric-trend success"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> {{ getOccupancyRate() }}% <span class="trend-label">de ocupación</span></div>
          </div>
          <div class="metric-footer">
            <div>{{ summary?.propiedadesOcupadas ?? 0 }} unidades ocupadas</div>
            <div class="progress-bar" role="progressbar" [attr.aria-valuenow]="getOccupancyRate()" aria-valuemin="0" aria-valuemax="100" aria-label="Porcentaje de ocupación"><div class="progress-fill" [style.width.%]="getOccupancyRate()"></div></div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Lecturas este mes</span>
            <div class="metric-icon readings-icon"><i class="fa-solid fa-gauge-high" aria-hidden="true"></i></div>
          </div>
          <div class="metric-body">
            <div class="metric-value">{{ summary?.lecturasMes ?? '—' }}</div>
            <div class="metric-trend"><i class="fa-solid fa-calendar-check" aria-hidden="true"></i> <span class="trend-label">registradas en el periodo</span></div>
          </div>
          <div class="metric-footer">
            <span>Lecturas guardadas en el sistema</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Facturas pendientes</span>
            <div class="metric-icon invoices-icon"><i class="fa-solid fa-file-invoice-dollar" aria-hidden="true"></i></div>
          </div>
          <div class="metric-body">
            <div class="metric-value">{{ summary?.facturasPendientes ?? '—' }}</div>
            <div class="metric-trend"><i class="fa-solid fa-wallet" aria-hidden="true"></i> <span class="trend-label">por cobrar</span></div>
          </div>
          <div class="metric-footer">
            <span>Saldo: {{ summary?.saldoPendiente ?? 0 | currency:'USD' }}</span>
          </div>
        </div>
      </section>

      <div class="dashboard-main-grid">
        <section class="data-table-card" aria-labelledby="inventory-title">
          <div class="table-header">
            <div class="header-title-group">
              <h2 id="inventory-title" class="table-title"><i class="fa-solid fa-house-chimney" aria-hidden="true"></i> Inventario de propiedades</h2>
              <span class="table-badge">{{ properties.length }} unidades</span>
            </div>
            <div class="table-controls">
              <div class="search-box">
                <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                <input type="search" aria-label="Buscar unidad o propietario" placeholder="Buscar unidad o propietario..." [value]="searchQuery" (input)="filterProperties($event)">
              </div>
              <select class="status-filter" aria-label="Filtrar por estado" [value]="statusFilter" (change)="filterStatus($event)">
                <option value="">Todos los estados</option>
                <option value="Ocupada">Ocupada</option>
                <option value="Vacía">Vacía</option>
                <option value="En mantenimiento">En mantenimiento</option>
              </select>
              <button type="button" class="btn-export" (click)="exportProperties()" [disabled]="filteredProperties.length === 0"><i class="fa-solid fa-file-csv" aria-hidden="true"></i> CSV</button>
              <button type="button" class="btn-export pdf-export" (click)="exportPropertiesPdf()" [disabled]="filteredProperties.length === 0 || isExportingPdf"><i class="fa-regular fa-file-pdf" aria-hidden="true"></i> {{ isExportingPdf ? 'Preparando PDF...' : 'PDF' }}</button>
            </div>
          </div>
          <div class="table-wrapper" role="region" tabindex="0" aria-label="Inventario de propiedades; desliza horizontalmente para ver todas las columnas">
            <table>
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Propietario responsable</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let property of pagedProperties">
                  <td>
                    <div class="cell-unit">
                      <span class="unit-id">{{ property.codigoInterno }}</span>
                      <span class="unit-zone">Casa {{ property.numeroCasa }}</span>
                    </div>
                  </td>
                  <td>{{ property.propietario || 'Sin asignar' }}</td>
                  <td><span class="status-pill" [ngClass]="property.estatus === 'Ocupada' ? 'success' : 'warning'">{{ property.estatus }}</span></td>
                  <td class="text-right">
                    <button type="button" class="btn-table-action primary" routerLink="/admin/properties" [attr.aria-label]="'Abrir propiedades para editar ' + property.codigoInterno"><i class="fa-solid fa-arrow-up-right-from-square"></i><span>Administrar</span></button>
                  </td>
                </tr>
                <tr *ngIf="isLoading"><td colspan="4">Cargando propiedades...</td></tr>
              </tbody>
            </table>
          </div>
          <div class="empty-state" *ngIf="!isLoading && properties.length === 0 && !errorMessage">
            <span class="empty-icon" aria-hidden="true"><i class="fa-solid fa-house-chimney"></i></span>
            <h3>No hay propiedades registradas</h3>
            <p>Cuando registres propiedades, aparecerán aquí para consultar su estado y propietario.</p>
            <a routerLink="/admin/properties" class="empty-action">Ir a propiedades</a>
          </div>
          <div class="empty-state compact" *ngIf="!isLoading && properties.length > 0 && filteredProperties.length === 0">
            <h3>Sin resultados</h3>
            <p>No hay propiedades que coincidan con los filtros aplicados.</p>
            <button type="button" class="empty-action" (click)="clearFilters()">Limpiar filtros</button>
          </div>
          <div class="table-pagination" *ngIf="!isLoading && filteredProperties.length > 0">
            <span>Mostrando {{ paginationStart }}–{{ paginationEnd }} de {{ filteredProperties.length }}</span>
            <div class="pagination-actions">
              <label>Filas
                <select [value]="pageSize" (change)="changePageSize($event)" aria-label="Filas por página">
                  <option [value]="5">5</option><option [value]="10">10</option><option [value]="25">25</option>
                </select>
              </label>
              <button type="button" (click)="changePage(-1)" [disabled]="pageIndex === 0" aria-label="Página anterior"><i class="fa-solid fa-chevron-left"></i></button>
              <span>Página {{ pageIndex + 1 }} de {{ pageCount }}</span>
              <button type="button" (click)="changePage(1)" [disabled]="pageIndex + 1 >= pageCount" aria-label="Página siguiente"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
          </div>
        </section>

        <section class="side-panel">
          <div class="panel-card quick-links">
            <h4 class="panel-title"><i class="fa-solid fa-bolt"></i> Accesos rápidos</h4>
            <a routerLink="/admin/properties" class="quick-link"><span class="quick-icon"><i class="fa-solid fa-house-chimney"></i></span><span>Propiedades</span><i class="fa-solid fa-chevron-right"></i></a>
            <a routerLink="/admin/staff" class="quick-link"><span class="quick-icon"><i class="fa-solid fa-users"></i></span><span>Personal</span><i class="fa-solid fa-chevron-right"></i></a>
            <a routerLink="/admin/billing" class="quick-link"><span class="quick-icon"><i class="fa-solid fa-file-invoice-dollar"></i></span><span>Facturación</span><i class="fa-solid fa-chevron-right"></i></a>
          </div>
        </section>
      </div>
    </div>
  `,
    styles: [`
    .header-content { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
    .title-group { display: grid; gap: 5px; }
    .header-actions { display: flex; align-items: center; gap: 14px; }
    .date-display { display: inline-flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 12px; white-space: nowrap; }
    .date-display i { color: var(--text-secondary); }
    .page-title { margin: 0; color: var(--text-primary); font-size: 24px; font-weight: 700; letter-spacing: -.035em; line-height: 1.25; }
    .page-subtitle { margin: 0; color: var(--text-secondary); font-size: 13px; }
    .btn-primary-action { display: inline-flex; min-height: 38px; align-items: center; gap: 8px; padding: 8px 13px; border: 1px solid var(--brand); border-radius: 8px; background: var(--brand); color: white; font-size: 12px; font-weight: 650; }
    .btn-primary-action:hover { transform: translateY(-1px); background: #002e5a; box-shadow: 0 4px 10px rgba(0,59,115,.14); }
    .metrics-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px; margin-bottom: 22px; }
    .metric-card { position: relative; grid-column: span 4; min-width: 0; padding: 20px; border: 1px solid var(--border); border-radius: 12px; background: white; box-shadow: var(--shadow-card); transition: transform 180ms var(--ease-out), box-shadow 180ms var(--ease-out), border-color 180ms var(--ease-out); }
    .metric-card:hover { transform: translateY(-2px); border-color: var(--border-strong); box-shadow: 0 8px 24px rgba(15,23,42,.07); }
    .metric-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .metric-label { color: var(--text-secondary); font-size: 12px; font-weight: 600; }
    .metric-icon { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 9px; background: var(--surface-subtle); font-size: 15px; }
    .properties-icon { color: var(--brand); background: var(--brand-soft); }
    .readings-icon { color: #9a3412; background: #fff7ed; }
    .invoices-icon { color: #166534; background: #f0fdf4; }
    .metric-body { margin-top: 12px; }
    .metric-value { color: var(--text-primary); font-size: 30px; font-weight: 700; letter-spacing: -.04em; line-height: 1.1; }
    .metric-trend { display: flex; align-items: center; gap: 6px; margin-top: 8px; color: var(--text-secondary); font-size: 11px; }
    .metric-trend.success { color: var(--success); }
    .metric-trend .trend-label { color: var(--text-secondary); }
    .metric-footer { margin-top: 18px; color: var(--text-secondary); font-size: 11px; }
    .progress-bar { height: 5px; margin-top: 8px; overflow: hidden; border-radius: 10px; background: #e5e7eb; }
    .progress-fill { height: 100%; border-radius: inherit; background: var(--brand); transition: width 250ms var(--ease-out); }
    .dashboard-main-grid { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 18px; align-items: start; }
    .data-table-card, .panel-card { border: 1px solid var(--border); border-radius: 12px; background: white; box-shadow: var(--shadow-card); }
    .data-table-card { overflow: hidden; }
    .table-header { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 16px 18px; border-bottom: 1px solid var(--border); }
    .header-title-group { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; }
    .table-title { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--text-primary); font-size: 15px; font-weight: 650; }
    .table-title i { color: var(--text-secondary); font-size: 14px; }
    .table-badge { padding: 4px 8px; border: 1px solid var(--border); border-radius: 99px; background: #fff; color: var(--text-secondary); font-size: 10px; font-weight: 600; }
    .table-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .search-box { position: relative; display: flex; align-items: center; }
    .search-box i { position: absolute; left: 10px; color: var(--text-secondary); font-size: 12px; pointer-events: none; }
    .search-box input, .status-filter { min-height: 34px; padding: 7px 10px; border: 1px solid var(--border-strong); border-radius: 7px; background: white; color: var(--text-primary); font-size: 11px; }
    .search-box input { width: 190px; padding-left: 30px; }
    .search-box input::placeholder { color: var(--text-secondary); }
    .btn-export { display: inline-flex; min-height: 34px; align-items: center; gap: 6px; padding: 7px 10px; border: 1px solid var(--border-strong); border-radius: 7px; background: white; color: var(--text-secondary); font-size: 11px; font-weight: 600; }
    .btn-export:hover { border-color: var(--brand); color: var(--brand); }
    .btn-export.pdf-export { color: #991b1b; }
    .btn-export.pdf-export:hover { border-color: #991b1b; }
    .table-wrapper { max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 11px 16px; border-bottom: 1px solid var(--border); background: #f9fafb; color: #374151; font-size: 10px; font-weight: 650; letter-spacing: .055em; text-transform: uppercase; white-space: nowrap; }
    td { padding: 13px 16px; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-size: 12px; }
    tbody tr:last-child td { border-bottom: 0; }
    tbody tr:hover { background: #fafafa; }
    .fw-bold { color: var(--text-primary); font-weight: 650; }
    .cell-unit { display: grid; gap: 3px; }
    .unit-id { color: var(--brand); font-weight: 650; }
    .unit-zone { color: var(--text-secondary); font-size: 11px; }
    .text-right { text-align: right; }
    .status-pill { display: inline-flex; min-height: 22px; align-items: center; padding: 3px 8px; border: 1px solid transparent; border-radius: 99px; font-size: 10px; font-weight: 650; }
    .status-pill.success { border-color: #bbf7d0; background: var(--success-soft); color: var(--success); }
    .status-pill.warning { border-color: #fde68a; background: var(--warning-soft); color: var(--warning); }
    .btn-table-action { display: inline-flex; min-height: 30px; align-items: center; gap: 6px; padding: 5px 8px; border: 1px solid var(--border); border-radius: 7px; background: white; color: var(--text-secondary); font-size: 10px; font-weight: 600; }
    .btn-table-action:hover { border-color: var(--brand); color: var(--brand); }
    .side-panel { display: grid; gap: 14px; }
    .panel-card { padding: 17px; }
    .panel-title { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; color: var(--text-primary); font-size: 13px; font-weight: 650; }
    .panel-title i { color: var(--brand); font-size: 14px; }
    .quick-links { display: grid; }
    .quick-link { display: flex; min-height: 42px; align-items: center; gap: 10px; padding: 6px 0; border-top: 1px solid #f3f4f6; color: var(--text-secondary); font-size: 12px; font-weight: 600; text-decoration: none; }
    .quick-link > span:nth-child(2) { flex: 1; }
    .quick-link > i { color: var(--text-secondary); font-size: 10px; }
    .quick-link:hover { color: var(--brand); }
    .quick-icon { display: grid; width: 28px; height: 28px; place-items: center; border: 1px solid var(--border); border-radius: 7px; background: #f9fafb; color: var(--brand); }
    .empty-state { display: grid; justify-items: center; padding: 32px 20px; text-align: center; }
    .empty-icon { display: grid; width: 42px; height: 42px; place-items: center; border: 1px solid var(--border); border-radius: 12px; background: var(--surface-subtle); color: var(--brand); font-size: 17px; }
    .empty-state h3 { margin: 12px 0 4px; color: var(--text-primary); font-size: 14px; font-weight: 650; }
    .empty-state p { max-width: 390px; margin: 0 0 14px; color: var(--text-secondary); font-size: 12px; line-height: 1.55; }
    .empty-state.compact { padding: 24px; }
    .empty-state.compact h3 { margin-top: 0; }
    .empty-action { display: inline-flex; min-height: 34px; align-items: center; justify-content: center; padding: 7px 11px; border: 1px solid var(--brand); border-radius: 7px; background: var(--brand); color: white; font-size: 11px; font-weight: 650; text-decoration: none; }
    .empty-action:hover { background: #002e5a; }
    .table-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--border); color: var(--text-secondary); font-size: 11px; }
    .pagination-actions, .pagination-actions label { display: flex; align-items: center; gap: 8px; }
    .pagination-actions label { gap: 5px; }
    .pagination-actions select, .pagination-actions button { min-height: 28px; padding: 4px 7px; border: 1px solid var(--border-strong); border-radius: 6px; background: white; color: var(--text-primary); font-size: 11px; }
    .pagination-actions button { display: grid; width: 28px; place-items: center; }
    .pagination-actions button:disabled { opacity: .45; }
    @media (max-width: 1120px) { .dashboard-main-grid { grid-template-columns: minmax(0, 1fr) 220px; } }
    @media (max-width: 860px) { .dashboard-main-grid { grid-template-columns: 1fr; } .side-panel { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px) {
      .header-content { align-items: flex-start; flex-direction: column; }
      .header-actions { width: 100%; justify-content: space-between; }
      .metrics-grid { gap: 10px; }
      .metric-card { grid-column: span 6; padding: 15px; }
      .table-header { align-items: flex-start; flex-direction: column; }
      .table-controls { width: 100%; }
      .search-box { min-width:0; flex: 1; }
      .search-box input { width: 100%; min-width:0; }
      .side-panel { grid-template-columns: 1fr; }
      .table-pagination { align-items: flex-start; flex-direction: column; }
      .pagination-actions button { width: 44px; min-height: 44px; }
      .btn-export { min-height: 44px; }
      .btn-table-action { min-height:44px; }
    }
    @media (max-width: 420px) { .metric-card { grid-column: span 12; } .header-actions { align-items: flex-start; flex-direction: column; } }
  `]
})
export class DashboardPage implements OnInit {
  summary: DashboardSummary | null = null;
  properties: Propiedad[] = [];
  filteredProperties: Propiedad[] = [];
  searchQuery = "";
  statusFilter = "";
  pageIndex = 0;
  pageSize = 5;
  isLoading = false;
  isExportingPdf = false;
  errorMessage = "";
  readonly currentDate = new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  constructor(private adminApi: AdminApiService, private reportPdf: ReportPdfService) {}

  ngOnInit() {
    this.loadSummary();
    this.loadProperties();
  }

  loadSummary() {
    this.adminApi.getDashboardSummary().subscribe({
      next: summary => this.summary = summary,
      error: (err: unknown) => {
        console.error("Error cargando el resumen del dashboard", err);
        this.errorMessage = apiErrorMessage(err, "No se pudo cargar el resumen.");
      }
    });
  }

  loadProperties() {
    this.isLoading = true;
    this.adminApi.getPropiedades().subscribe({
      next: properties => {
        this.properties = properties;
        this.filteredProperties = properties;
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error("Error cargando propiedades del dashboard", err);
        this.errorMessage = apiErrorMessage(err, "No se pudieron cargar las propiedades.");
        this.isLoading = false;
      }
    });
  }

  getOccupancyRate() {
    if (!this.summary || this.summary.totalPropiedades === 0) return 0;
    return Math.round((this.summary.propiedadesOcupadas / this.summary.totalPropiedades) * 100);
  }

  filterProperties(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyFilters();
  }

  filterStatus(event: Event) {
    this.statusFilter = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredProperties = this.properties.filter(property =>
      (!this.searchQuery
        || property.codigoInterno.toLowerCase().includes(this.searchQuery)
        || property.numeroCasa.toLowerCase().includes(this.searchQuery)
        || property.propietario.toLowerCase().includes(this.searchQuery))
      && (!this.statusFilter || property.estatus === this.statusFilter)
    );
    this.pageIndex = 0;
  }

  clearFilters() {
    this.searchQuery = "";
    this.statusFilter = "";
    this.filteredProperties = [...this.properties];
    this.pageIndex = 0;
  }

  get pagedProperties() {
    const start = this.pageIndex * this.pageSize;
    return this.filteredProperties.slice(start, start + this.pageSize);
  }

  get pageCount() {
    return Math.max(1, Math.ceil(this.filteredProperties.length / this.pageSize));
  }

  get paginationStart() {
    return this.filteredProperties.length === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }

  get paginationEnd() {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.filteredProperties.length);
  }

  changePage(delta: number) {
    this.pageIndex = Math.min(Math.max(0, this.pageIndex + delta), this.pageCount - 1);
  }

  changePageSize(event: Event) {
    this.pageSize = Number((event.target as HTMLSelectElement).value);
    this.pageIndex = 0;
  }

  exportProperties() {
    if (this.filteredProperties.length === 0) return;
    const csv = [
      ["Código", "Unidad", "Responsable", "Estado"],
      ...this.filteredProperties.map(property => [
        property.codigoInterno,
        property.numeroCasa,
        property.propietario,
        property.estatus
      ])
    ].map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reporte-propiedades.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async exportPropertiesPdf() {
    if (this.filteredProperties.length === 0 || this.isExportingPdf) return;
    this.isExportingPdf = true;
    this.errorMessage = "";
    try {
      await this.reportPdf.export({
        title: "Inventario de propiedades",
        subtitle: `Reporte filtrado · ${this.filteredProperties.length} propiedades`,
        filename: "reporte-propiedades",
        headers: ["Código", "Unidad", "Responsable", "Estado"],
        rows: this.filteredProperties.map(property => [
          property.codigoInterno,
          `Casa ${property.numeroCasa}`,
          property.propietario || "Sin asignar",
          property.estatus
        ])
      });
    } catch (error: unknown) {
      console.error("Error generando PDF de propiedades", error);
      this.errorMessage = error instanceof Error
        ? error.message
        : "No se pudo generar el PDF de propiedades.";
    } finally {
      this.isExportingPdf = false;
    }
  }
}
