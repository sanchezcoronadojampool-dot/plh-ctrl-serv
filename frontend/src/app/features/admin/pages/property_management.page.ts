import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AdminApiService, Medidor, PersonaOption, Propiedad } from "../../../core/services/admin-api.service";
import { apiErrorMessage } from "../../../core/services/api-error";

@Component({
    selector: "app-property-management-page",
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-header">
      <div class="title-group">
        <h1 class="page-title"><i class="fa-solid fa-house-chimney"></i> Gestión de Propiedades</h1>
        <p class="page-subtitle">Administración de unidades residenciales y propietarios</p>
      </div>
      <div class="header-actions">
        <button type="button" (click)="openModal()" class="btn-primary-action"><i class="fa-solid fa-plus"></i> Agregar Propiedad</button>
      </div>
    </div>

    <div class="main-grid">
      <section class="data-table-card">
        <div class="table-header">
          <div class="header-title-group">
            <h2 class="table-title"><i class="fa-solid fa-list" aria-hidden="true"></i> Inventario de unidades</h2>
            <span class="table-badge">Total: {{ properties.length }}</span>
          </div>
          <div class="table-controls">
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
              <input type="search" aria-label="Buscar casa, código o propietario" [value]="searchQuery" (input)="filterProperties($event)" placeholder="Buscar casa o propietario...">
            </div>
            <select class="status-filter" aria-label="Filtrar por estado" [value]="statusFilter" (change)="filterStatus($event)">
              <option value="">Todos los estados</option>
              <option value="Ocupada">Ocupada</option>
              <option value="Vacía">Vacía</option>
              <option value="En mantenimiento">En mantenimiento</option>
            </select>
          </div>
        </div>
        <p class="page-error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
        <p class="page-error" *ngIf="metersErrorMessage" role="alert">{{ metersErrorMessage }}</p>
        <div class="table-wrapper" role="region" tabindex="0" aria-label="Inventario de unidades; desliza horizontalmente para ver todas las columnas">
          <table>
            <thead>
              <tr>
                <th>Código Interno</th>
                <th>Unidad</th>
                <th>Propietario</th>
                <th>Medidores</th>
                <th>Estado</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of pagedProperties">
                <td><span class="unit-id">{{ p.codigoInterno }}</span></td>
                <td><span class="unit-main">Casa {{ p.numeroCasa }}</span></td>
                <td>{{ p.propietario || 'Sin asignar' }}</td>
                <td>
                  <ng-container *ngIf="!isLoadingMeters; else loadingMeters">
                    <ng-container *ngIf="!metersErrorMessage; else unavailableMeters">
                      <span class="meter-chip" *ngFor="let meter of getMetersForProperty(p.id)"
                        [title]="meter.numeroSerie">
                        <i class="fa-solid" [class.fa-droplet]="meter.tipoServicio === 'agua'"
                          [class.fa-bolt]="meter.tipoServicio === 'luz'" aria-hidden="true"></i>
                        {{ meter.tipoServicio === 'agua' ? 'Agua' : 'Luz' }} · {{ meter.numeroSerie }}
                      </span>
                      <span class="muted" *ngIf="getMetersForProperty(p.id).length === 0">Sin medidores</span>
                    </ng-container>
                  </ng-container>
                  <ng-template #loadingMeters><span class="muted">Cargando...</span></ng-template>
                  <ng-template #unavailableMeters><span class="muted" [title]="metersErrorMessage">No disponibles</span></ng-template>
                </td>
                <td><span class="status-pill" [ngClass]="p.estatus === 'Ocupada' ? 'success' : 'warning'">{{ p.estatus }}</span></td>
                <td class="text-right">
                  <div class="action-group">
                    <button type="button" (click)="editProperty(p)" [disabled]="!p.id" class="btn-table-action secondary" [attr.aria-label]="'Editar propiedad ' + p.codigoInterno"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button type="button" (click)="viewReadingHistory(p)" [disabled]="!p.id" class="btn-table-action secondary" [attr.aria-label]="'Ver historial de lecturas de casa ' + p.numeroCasa"><i class="fa-solid fa-clipboard-list"></i></button>
                    <button type="button" (click)="deleteProperty(p)" [disabled]="!p.id || deletingId === p.id" class="btn-table-action danger" [attr.aria-label]="'Eliminar propiedad ' + p.codigoInterno"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="isLoading">
                <td colspan="6">Cargando propiedades...</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="empty-state" *ngIf="!isLoading && properties.length === 0 && !errorMessage">
          <span class="empty-icon" aria-hidden="true"><i class="fa-solid fa-house-chimney"></i></span>
          <h3>No hay propiedades registradas</h3>
          <p>Registra el primer inmueble para iniciar el inventario del condominio.</p>
          <button type="button" class="empty-action" (click)="openModal()">Agregar propiedad</button>
        </div>
        <div class="empty-state compact" *ngIf="!isLoading && properties.length > 0 && filteredProperties.length === 0">
          <h3>Sin resultados</h3>
          <p>No hay propiedades que coincidan con los criterios seleccionados.</p>
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

      <aside class="side-panel">
        <div class="panel-card info-card">
          <h4 class="panel-title"><i class="fa-solid fa-circle-info"></i> Resumen de Estado</h4>
          <div class="stats-list">
            <div class="stat-item">
              <span class="stat-label">Ocupación</span>
              <span class="stat-value">{{ getOccupancyRate() }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Unidades Vacías</span>
              <span class="stat-value">{{ getVacantCount() }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <div class="modal-overlay" *ngIf="selectedProperty">
      <form class="modal-content" role="dialog" aria-modal="true" aria-labelledby="property-dialog-title" #propertyForm="ngForm" (ngSubmit)="saveProperty()">
        <h3 id="property-dialog-title">{{ selectedProperty.id ? 'Editar' : 'Nueva' }} Propiedad</h3>
        <p class="page-error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
        <div class="form-group">
          <label>Código Interno</label>
          <input name="codigoInterno" [(ngModel)]="selectedProperty.codigoInterno" placeholder="Ej: CASA-001" required maxlength="50">
        </div>
        <div class="form-group">
          <label>Número de Casa</label>
          <input name="numeroCasa" [(ngModel)]="selectedProperty.numeroCasa" placeholder="Ej: 12" required maxlength="20">
        </div>
        <div class="form-group">
          <label>Propietario responsable</label>
          <select name="idPersonaResponsable" [(ngModel)]="selectedProperty.idPersonaResponsable">
            <option [ngValue]="null">Sin asignar</option>
            <option *ngFor="let person of owners" [ngValue]="person.id">{{ person.nombre }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select name="estatus" [(ngModel)]="selectedProperty.estatus" required>
            <option value="Ocupada">Ocupada</option>
            <option value="Vacía">Vacía</option>
            <option value="En mantenimiento">En mantenimiento</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" (click)="closeModal()" class="btn-cancel" [disabled]="isSaving">Cancelar</button>
          <button type="submit" class="btn-save" [disabled]="propertyForm.invalid || isSaving">{{ isSaving ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; gap: 18px; margin-bottom: 24px; }
    .title-group { display: flex; flex-direction: column; gap: 4px; }
    .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: -0.035em; display: flex; align-items: center; gap: 9px; }
    .page-title i { font-size: 18px; color: var(--text-secondary); }
    .page-subtitle { font-size: 13px; color: var(--text-secondary); margin: 4px 0 0; }
    .btn-primary-action { display: inline-flex; min-height: 38px; align-items: center; gap: 8px; background: var(--brand); color: white; border: 1px solid var(--brand); padding: 8px 13px; border-radius: 8px; font-size: 12px; font-weight: 650; cursor: pointer; transition: transform 180ms var(--ease-out), background 180ms var(--ease-out); }
    .btn-primary-action:hover { background: #002e5a; transform: translateY(-1px); }
    
    .main-grid { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 18px; }
    .data-table-card { background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; box-shadow: var(--shadow-card); }
    .table-header { padding: 16px 18px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .header-title-group { display: flex; align-items: center; gap: 12px; }
    .table-title { font-size: 15px; font-weight: 650; margin: 0; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
    .table-badge { background: white; color: var(--text-secondary); font-size: 10px; padding: 4px 8px; border: 1px solid var(--border); border-radius: 100px; font-weight: 600; }
    .table-controls { display: flex; align-items: center; gap: 8px; }
    .search-box { position: relative; display: flex; align-items: center; }
    .search-box i { position: absolute; left: 10px; color: var(--text-secondary); font-size: 12px; }
    .search-box input { padding: 8px 10px 8px 30px; border-radius: 7px; border: 1px solid var(--border-strong); font-size: 11px; width: 180px; }
    .status-filter { min-height: 34px; padding: 6px 8px; border: 1px solid var(--border-strong); border-radius: 7px; background: white; font-size: 11px; }
    
    .table-wrapper { max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 11px 16px; background: #F9FAFB; color: #374151; font-size: 10px; font-weight: 650; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
    td { padding: 13px 16px; border-bottom: 1px solid #F3F4F6; font-size: 12px; color: #1F2937; }
    .text-right { text-align: right; }
    .unit-id { font-weight: 650; color: var(--brand); }
    .unit-main { font-weight: 600; color: var(--text-primary); }
    .meter-chip { display: inline-flex; align-items: center; gap: 5px; margin: 2px 4px 2px 0; padding: 4px 7px; border: 1px solid var(--border); border-radius: 6px; background: var(--brand-soft); color: var(--brand); font-size: 10px; font-weight: 600; white-space: nowrap; }
    .meter-chip i { color: var(--brand); }
    .muted { color: #52525b; font-size: 11px; }
    
    .status-pill { padding: 3px 8px; border-radius: 100px; font-size: 10px; font-weight: 650; }
    .status-pill.success { background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }
    .status-pill.warning { background: #FFFBEB; color: #92400E; border: 1px solid #FDE68A; }
    
    .action-group { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-table-action { border: none; padding: 8px 12px; border-radius: 8px; font-size: 13px; cursor: pointer; transition: all 0.2s; }
    .btn-table-action.secondary { background: var(--surface-muted); color: var(--text-secondary); }
    .btn-table-action.danger { background: var(--danger-soft); color: var(--danger); }
    .btn-table-action:hover { opacity: 0.8; transform: translateY(-1px); }

    .side-panel { display: flex; flex-direction: column; gap: 14px; }
    .panel-card { background: white; border-radius: 12px; border: 1px solid var(--border); padding: 17px; box-shadow: var(--shadow-card); }
    .panel-title { font-size: 13px; font-weight: 650; margin: 0 0 14px; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
    .stats-list { display: flex; flex-direction: column; gap: 16px; }
    .stat-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
    .stat-label { font-size: 12px; color: var(--text-secondary); }
    .stat-value { font-weight: 700; color: var(--text-primary); }
    .modal-overlay { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; padding: 24px 16px; background: rgba(15,23,42,.5); scrollbar-width: none; }
    .modal-overlay::-webkit-scrollbar { display: none; }
    .modal-content { width: min(100%, 450px); margin: auto 0; padding: 28px; border: 1px solid var(--border); border-radius: 14px; background: white; box-shadow: 0 16px 40px rgba(15,23,42,.16); animation: surface-reveal 180ms var(--ease-out) both; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .form-group label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .form-group input, .form-group select { min-height: 40px; padding: 9px 11px; border-radius: 8px; border: 1px solid var(--border-strong); font-size: 14px; }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,127,141,.14); }
    .modal-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 10px; margin-top: 28px; padding-top: 16px; border-top: 1px solid var(--border); }
    .modal-actions button { min-height: 38px; padding: 8px 14px; font-size: 13px; }
    .btn-cancel { background: white; color: var(--text-secondary); border: 1px solid var(--border-strong); padding: 9px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-save { background: var(--brand); color: white; border: 1px solid var(--brand); padding: 9px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .empty-state { display: grid; justify-items: center; padding: 30px 18px; text-align: center; }
    .empty-icon { display: grid; width: 42px; height: 42px; place-items: center; border: 1px solid var(--border); border-radius: 12px; background: var(--surface-subtle); color: var(--brand); }
    .empty-state h3 { margin: 12px 0 4px; color: var(--text-primary); font-size: 14px; }
    .empty-state p { margin: 0 0 14px; color: var(--text-secondary); font-size: 12px; }
    .empty-state.compact { padding: 22px; }
    .empty-action { display: inline-flex; min-height: 34px; align-items: center; padding: 7px 11px; border: 1px solid var(--brand); border-radius: 7px; background: var(--brand); color: white; font-size: 11px; font-weight: 650; }
    .table-pagination { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--border); color: var(--text-secondary); font-size: 11px; }
    .pagination-actions, .pagination-actions label { display: flex; align-items: center; gap: 8px; }
    .pagination-actions label { gap: 5px; }
    .pagination-actions select, .pagination-actions button { min-height: 28px; padding: 4px 7px; border: 1px solid var(--border-strong); border-radius: 6px; background: white; font-size: 11px; }
    .pagination-actions button { display: grid; width: 28px; place-items: center; }
    @media (max-width: 980px) { .main-grid { grid-template-columns: 1fr; } .side-panel { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px) { .page-header { align-items: flex-start; flex-direction: column; } .main-grid { grid-template-columns: 1fr; } .table-header { align-items: flex-start; flex-direction: column; } .table-controls { width: 100%; flex-wrap: wrap; } .search-box { min-width:0; flex: 1; } .search-box input { width: 100%; min-width:0; } .side-panel { grid-template-columns: 1fr; } .table-pagination { align-items: flex-start; flex-direction: column; } .btn-table-action { min-width:44px; min-height:44px; } .pagination-actions button { width:44px; min-height:44px; } }
    @media (max-width: 480px) { .modal-overlay { padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)); } .modal-content { padding: 20px; } .modal-actions { margin-top: 20px; } .modal-actions button { min-height:44px; } }
  `]
})
export class PropertyManagementPage implements OnInit {
  properties: Propiedad[] = [];
  metersByProperty: Record<string, Medidor[]> = {};
  owners: PersonaOption[] = [];
  filteredProperties: Propiedad[] = [];
  searchQuery = "";
  statusFilter = "";
  pageIndex = 0;
  pageSize = 10;
  selectedProperty: Propiedad | null = null;
  isLoading = false;
  isLoadingMeters = false;
  isSaving = false;
  deletingId: string | null = null;
  errorMessage = "";
  metersErrorMessage = "";

  constructor(private adminApi: AdminApiService, private router: Router) {}

  viewReadingHistory(property: Propiedad) {
    if (!property.id) return;
    void this.router.navigate(["/admin/readings"], { queryParams: { propiedad: property.id } });
  }

  ngOnInit() {
    this.loadProperties();
    this.loadOwners();
  }

  loadOwners() {
    this.adminApi.getPersonas().subscribe({
      next: (owners) => this.owners = owners,
      error: (err: unknown) => {
        console.error("Error cargando personas responsables", err);
        this.errorMessage = apiErrorMessage(err, "No se pudieron cargar los propietarios disponibles.");
      }
    });
  }

  loadProperties() {
    this.isLoading = true;
    this.errorMessage = "";
    this.adminApi.getPropiedades().subscribe({
      next: (data) => {
        this.properties = data;
        this.applyFilters();
        this.pageIndex = Math.min(this.pageIndex, this.pageCount - 1);
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Error cargando propiedades', err);
        this.errorMessage = apiErrorMessage(err, "No se pudieron cargar las propiedades.");
        this.isLoading = false;
      }
    });
    this.loadMeters();
  }

  loadMeters() {
    this.isLoadingMeters = true;
    this.metersErrorMessage = "";
    this.adminApi.getMedidores().subscribe({
      next: meters => {
        const grouped: Record<string, Medidor[]> = {};
        for (const meter of meters) {
          (grouped[meter.idPropiedad] ??= []).push(meter);
        }
        this.metersByProperty = grouped;
        this.isLoadingMeters = false;
      },
      error: (err: unknown) => {
        console.error("Error cargando medidores asociados a propiedades", err);
        this.metersErrorMessage = apiErrorMessage(err, "No se pudieron cargar los medidores.");
        this.isLoadingMeters = false;
      }
    });
  }

  getMetersForProperty(propertyId?: string): Medidor[] {
    return propertyId ? this.metersByProperty[propertyId] ?? [] : [];
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
        || property.propietario.toLowerCase().includes(this.searchQuery)
        || property.numeroCasa.toLowerCase().includes(this.searchQuery))
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

  openModal() {
    this.errorMessage = "";
    this.selectedProperty = { codigoInterno: '', numeroCasa: '', propietario: '', estatus: 'Ocupada', idPersonaResponsable: null };
  }

  editProperty(p: Propiedad) {
    this.errorMessage = "";
    this.selectedProperty = { ...p };
  }

  closeModal() {
    if (!this.isSaving) {
      this.selectedProperty = null;
      this.errorMessage = "";
    }
  }

  saveProperty() {
    if (!this.selectedProperty) return;
    this.isSaving = true;
    this.errorMessage = "";
    const property = {
      ...this.selectedProperty,
      codigoInterno: this.selectedProperty.codigoInterno.trim(),
      numeroCasa: this.selectedProperty.numeroCasa.trim(),
      propietario: this.selectedProperty.propietario.trim()
    };
    if (this.selectedProperty.id) {
      this.adminApi.updatePropiedad(this.selectedProperty.id, property).subscribe({
        next: () => {
          this.isSaving = false;
          this.selectedProperty = null;
          this.loadProperties();
        },
        error: (err: unknown) => {
          console.error('Error actualizando propiedad', err);
          this.errorMessage = apiErrorMessage(err, "No se pudo actualizar la propiedad.");
          this.isSaving = false;
        }
      });
    } else {
      this.adminApi.createPropiedad(property).subscribe({
        next: () => {
          this.isSaving = false;
          this.selectedProperty = null;
          this.loadProperties();
        },
        error: (err: unknown) => {
          console.error('Error creando propiedad', err);
          this.errorMessage = apiErrorMessage(err, "No se pudo crear la propiedad.");
          this.isSaving = false;
        }
      });
    }
  }

  deleteProperty(property: Propiedad) {
    if (property.id && !this.deletingId && confirm(`¿Estás seguro de eliminar la propiedad ${property.codigoInterno}?`)) {
      this.deletingId = property.id;
      this.errorMessage = "";
      this.adminApi.deletePropiedad(property.id).subscribe({
        next: () => {
          this.deletingId = null;
          this.loadProperties();
        },
        error: (err: unknown) => {
          console.error('Error eliminando propiedad', err);
          this.errorMessage = apiErrorMessage(err, "No se pudo eliminar la propiedad.");
          this.deletingId = null;
        }
      });
    }
  }

  getOccupancyRate() {
    if (this.properties.length === 0) return 0;
    const occupied = this.properties.filter(p => p.estatus === 'Ocupada').length;
    return Math.round((occupied / this.properties.length) * 100);
  }

  getVacantCount() {
    return this.properties.filter(p => p.estatus === 'Vacía').length;
  }
}
