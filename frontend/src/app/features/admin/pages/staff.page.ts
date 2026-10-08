import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  AdminApiService,
  PendingOwnerRegistration,
  Propiedad,
  Staff
} from "../../../core/services/admin-api.service";
import { apiErrorMessage } from "../../../core/services/api-error";

@Component({
    selector: "app-staff-page",
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-header">
      <div>
        <h1 class="page-title"><i class="fa-solid fa-users" aria-hidden="true"></i> Usuarios y propietarios</h1>
        <p class="page-subtitle">Gestiona las cuentas de staff y revisa las solicitudes de propietarios.</p>
      </div>
      <button type="button" (click)="openForm()" class="btn-primary"><i class="fa-solid fa-user-plus" aria-hidden="true"></i> Crear usuario de staff</button>
    </div>

    <section class="data-table-card requests-card">
      <div class="table-header">
        <div>
          <h2 class="table-title"><i class="fa-solid fa-user-clock" aria-hidden="true"></i> Solicitudes de propietarios</h2>
          <p class="section-description">Verifica los datos y el inmueble antes de aprobar cada cuenta.</p>
        </div>
        <input class="table-search" type="search" aria-label="Buscar solicitud" placeholder="Buscar solicitud..." [value]="requestSearch" (input)="filterRequests($event)">
      </div>
      <div class="table-wrapper" role="region" tabindex="0" aria-label="Solicitudes de propietarios; desliza horizontalmente para ver todas las columnas">
        <table>
          <thead>
            <tr><th>Solicitante</th><th>Contacto e identidad</th><th>Usuario</th><th>Inmueble indicado</th><th>Asociar a inmueble</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let request of pagedOwnerRequests">
              <td class="fw-bold">{{ request.nombre }}</td>
              <td>{{ request.documentoIdentidad }}<br>{{ request.telefono }}<br>{{ request.correoElectronico || 'Sin correo' }}</td>
              <td>{{ request.username }}</td>
              <td>{{ request.inmueble }}</td>
              <td>
                <select [(ngModel)]="request.idPropiedadSeleccionada" [name]="'property-' + request.id" aria-label="Seleccionar inmueble para aprobación">
                  <option [ngValue]="undefined">Seleccionar...</option>
                  <option *ngFor="let property of properties" [ngValue]="property.id">
                    {{ property.codigoInterno }} — Casa {{ property.numeroCasa }}{{ property.manzana ? ' / Mz. ' + property.manzana : '' }}{{ property.sector ? ' / ' + property.sector : '' }}
                  </option>
                </select>
              </td>
              <td class="request-actions">
                <button type="button" class="btn-action approve" (click)="approveOwner(request)" [disabled]="processingOwnerId === request.id || !request.idPropiedadSeleccionada">
                  {{ processingOwnerId === request.id ? 'Procesando...' : 'Aprobar' }}
                </button>
                <button type="button" class="btn-action reject" (click)="rejectOwner(request)" [disabled]="processingOwnerId === request.id">Rechazar</button>
              </td>
            </tr>
            <tr *ngIf="isLoadingRequests"><td colspan="6">Cargando solicitudes...</td></tr>
          </tbody>
        </table>
      </div>
      <div class="empty-state" *ngIf="!isLoadingRequests && ownerRequests.length === 0">
        <span class="empty-icon" aria-hidden="true"><i class="fa-solid fa-user-check"></i></span>
        <h3>No hay solicitudes pendientes</h3>
        <p>Las solicitudes de propietarios aparecerán aquí para su revisión.</p>
      </div>
      <div class="empty-state compact" *ngIf="!isLoadingRequests && ownerRequests.length > 0 && filteredOwnerRequests.length === 0">
        <h3>Sin resultados</h3><p>No encontramos solicitudes que coincidan con la búsqueda.</p>
      </div>
      <div class="table-pagination" *ngIf="!isLoadingRequests && filteredOwnerRequests.length > 0">
        <span>Mostrando {{ requestsStart }}–{{ requestsEnd }} de {{ filteredOwnerRequests.length }}</span>
        <div class="pagination-actions">
          <label>Filas <select [value]="requestPageSize" (change)="changeRequestPageSize($event)" aria-label="Filas por página"><option [value]="5">5</option><option [value]="10">10</option><option [value]="25">25</option></select></label>
          <button type="button" (click)="changeRequestPage(-1)" [disabled]="requestPage === 0" aria-label="Página anterior"><i class="fa-solid fa-chevron-left"></i></button>
          <span>Página {{ requestPage + 1 }} de {{ requestPageCount }}</span>
          <button type="button" (click)="changeRequestPage(1)" [disabled]="requestPage + 1 >= requestPageCount" aria-label="Página siguiente"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>
    </section>

    <p class="page-error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
    <div class="data-table-card">
      <div class="table-header">
        <div>
          <h2 class="table-title"><i class="fa-solid fa-users" aria-hidden="true"></i> Personal registrado</h2>
          <p class="section-description">{{ filteredStaff.length }} cuentas de staff</p>
        </div>
        <div class="table-controls">
          <input class="table-search" type="search" aria-label="Buscar usuario de staff" placeholder="Buscar usuario..." [value]="staffSearch" (input)="filterStaff($event)">
          <select class="status-filter" aria-label="Filtrar por estado" [value]="staffStatusFilter" (change)="filterStaffState($event)">
            <option value="">Todos los estados</option><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>
      <div class="table-wrapper" role="region" tabindex="0" aria-label="Personal registrado; desliza horizontalmente para ver todas las columnas">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Lecturas Hoy</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of pagedStaff">
              <td class="fw-bold">{{ s.nombre }}</td>
              <td>{{ s.rol === 'admin' ? 'Administrador' : 'Operador' }}</td>
              <td>{{ s.lecturas }}</td>
              <td><span class="status-pill" [ngClass]="s.estado === 'Activo' ? 'success' : 'warning'">{{ s.estado }}</span></td>
              <td>
                <button type="button" class="btn-action" (click)="editStaff(s)" [attr.aria-label]="'Editar ' + s.nombre"><i class="fa-solid fa-pen-to-square"></i></button>
                <button type="button" class="btn-action" (click)="deleteStaff(s)" [disabled]="!s.id || deletingId === s.id" [attr.aria-label]="'Eliminar ' + s.nombre"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>
            <tr *ngIf="isLoading"><td colspan="5">Cargando personal...</td></tr>
          </tbody>
        </table>
      </div>
      <div class="empty-state" *ngIf="!isLoading && staff.length === 0 && !errorMessage">
        <span class="empty-icon" aria-hidden="true"><i class="fa-solid fa-users"></i></span>
        <h3>No hay usuarios de staff</h3>
        <p>Crea una cuenta de operador o administrador para permitir el acceso al sistema.</p>
        <button type="button" class="btn-primary" (click)="openForm()">Crear usuario de staff</button>
      </div>
      <div class="empty-state compact" *ngIf="!isLoading && staff.length > 0 && filteredStaff.length === 0">
        <h3>Sin resultados</h3><p>Ningún usuario coincide con los filtros aplicados.</p>
        <button type="button" class="btn-secondary" (click)="clearStaffFilters()">Limpiar filtros</button>
      </div>
      <div class="table-pagination" *ngIf="!isLoading && filteredStaff.length > 0">
        <span>Mostrando {{ staffStart }}–{{ staffEnd }} de {{ filteredStaff.length }}</span>
        <div class="pagination-actions">
          <label>Filas <select [value]="staffPageSize" (change)="changeStaffPageSize($event)" aria-label="Filas por página"><option [value]="5">5</option><option [value]="10">10</option><option [value]="25">25</option></select></label>
          <button type="button" (click)="changeStaffPage(-1)" [disabled]="staffPage === 0" aria-label="Página anterior"><i class="fa-solid fa-chevron-left"></i></button>
          <span>Página {{ staffPage + 1 }} de {{ staffPageCount }}</span>
          <button type="button" (click)="changeStaffPage(1)" [disabled]="staffPage + 1 >= staffPageCount" aria-label="Página siguiente"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="selectedStaff">
      <form class="modal-content" role="dialog" aria-modal="true" aria-labelledby="staff-dialog-title" #staffForm="ngForm" (ngSubmit)="saveStaff()">
        <h3 id="staff-dialog-title">{{ selectedStaff.id ? 'Editar' : 'Agregar' }} Personal</h3>
        <p class="page-error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
        <div class="form-group">
          <label for="staff-username">Usuario</label>
          <input id="staff-username" name="username" [(ngModel)]="selectedStaff.username" required maxlength="50" autocomplete="off">
        </div>
        <div class="form-group">
          <label for="staff-name">Nombre</label>
          <input id="staff-name" name="nombre" [(ngModel)]="selectedStaff.nombre" required maxlength="200">
        </div>
        <div class="form-group">
          <label for="staff-role">Rol</label>
          <select id="staff-role" name="rol" [(ngModel)]="selectedStaff.rol" required>
            <option value="operador">Operador</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div class="form-group">
          <label for="staff-password">Contraseña {{ selectedStaff.id ? '(dejar vacía para conservarla)' : '' }}</label>
          <input id="staff-password" name="password" type="password" [(ngModel)]="selectedStaff.password" [required]="!selectedStaff.id" [minlength]="selectedStaff.id ? 0 : 12" maxlength="72" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label for="staff-state">Estado</label>
          <select id="staff-state" name="estado" [(ngModel)]="selectedStaff.estado" required>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" (click)="closeForm()" [disabled]="isSaving">Cancelar</button>
          <button type="submit" class="btn-save" [disabled]="staffForm.invalid || isSaving">{{ isSaving ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    .page-header { margin-bottom: 32px; }
    .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: -.03em; }
    .page-subtitle { font-size: 14px; color: var(--text-secondary); margin: 0; }
    .staff-actions { display: flex; gap: 16px; margin-bottom: 32px; }
    .btn-primary { background: #003B73; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.3s; }
    .btn-primary:hover { background: #002A54; transform: translateY(-2px); }
    .data-table-card { background: white; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #EEF2F6; overflow: hidden; }
    .requests-card { margin-bottom: 28px; }
    .section-description { margin: 4px 0 0; color: var(--text-secondary); font-size: 11px; }
    .table-header { padding: 16px 18px; border-bottom: 1px solid var(--border); }
    .table-title { color: var(--text-primary); font-size: 15px; font-weight: 650; margin: 0; display: flex; align-items: center; gap: 8px; }
    .table-wrapper { max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 11px 16px; background: var(--surface-subtle); color: #374151; font-size: 10px; font-weight: 650; text-transform: uppercase; letter-spacing: .05em; }
    td { padding: 13px 16px; border-bottom: 1px solid var(--border); color: var(--text-primary); font-size: 12px; }
    .fw-bold { font-weight: 600; color: #003B73; }
    .status-pill { padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .status-pill.success { background: #DCFCE7; color: #15803D; border: 1px solid #BBF7D0; }
    .status-pill.warning { background: #FFE4E6; color: #E11D48; border: 1px solid #FDA4AF; }
    .btn-action { min-height: 32px; background: white; color: var(--text-secondary); border: 1px solid var(--border); padding: 6px 10px; border-radius: 7px; cursor: pointer; transition: all 180ms var(--ease-out); }
    .btn-action:hover { background: #003B73; color: white; border-color: #003B73; }
    .request-actions { white-space: nowrap; }
    .request-actions .btn-action { margin-right: 6px; }
    .request-actions .approve { color: #15803D; border-color: #86EFAC; }
    .request-actions .reject { color: #B42318; border-color: #FDA4AF; }
    .request-actions .btn-action:disabled { opacity: .55; cursor: not-allowed; }
    td select { max-width: 260px; padding: 8px; border: 1px solid #CBD5E1; border-radius: 8px; }
    .modal-overlay { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; padding: 24px 16px; background: rgba(15,23,42,.5); scrollbar-width: none; }
    .modal-overlay::-webkit-scrollbar { display: none; }
    .modal-content { width: min(100%, 450px); margin: auto 0; padding: 28px; border: 1px solid var(--border); border-radius: 14px; background: white; box-shadow: 0 16px 40px rgba(15,23,42,.16); animation: surface-reveal 180ms var(--ease-out) both; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .form-group label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .form-group input, .form-group select { width: 100%; min-height: 40px; padding: 9px 11px; border: 1px solid var(--border-strong); border-radius: 8px; font: inherit; }
    .modal-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 10px; margin-top: 28px; padding-top: 16px; border-top: 1px solid var(--border); }
    .modal-actions button { min-height: 38px; padding: 8px 14px; border-radius: 8px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-cancel { background: white; color: var(--text-secondary); border: 1px solid var(--border-strong); }
    .btn-save { background: var(--brand); color: white; border: 1px solid var(--brand); }
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    .page-title { display: flex; align-items: center; gap: 8px; color: var(--text-primary); font-size: 24px; font-weight: 700; letter-spacing: -.035em; margin: 0; }
    .page-title i { color: var(--text-secondary); font-size: 18px; }
    .page-subtitle { margin: 4px 0 0; color: var(--text-secondary); font-size: 13px; }
    .btn-primary, .btn-secondary { display: inline-flex; min-height: 36px; align-items: center; gap: 7px; padding: 7px 11px; border-radius: 8px; font-size: 11px; font-weight: 650; cursor: pointer; }
    .btn-primary { background: var(--brand); color: white; border: 1px solid var(--brand); }
    .btn-primary:hover { background: #002e5a; }
    .btn-secondary { background: white; color: var(--text-secondary); border: 1px solid var(--border-strong); }
    .data-table-card { border-radius: 12px; border-color: var(--border); box-shadow: var(--shadow-card); }
    .requests-card { margin-bottom: 18px; }
    .table-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px; border-bottom-color: var(--border); }
    .table-title { color: var(--text-primary); font-size: 15px; font-weight: 650; }
    .table-title i { color: var(--text-secondary); font-size: 14px; }
    .section-description { margin: 4px 0 0; color: var(--text-secondary); font-size: 11px; }
    .table-controls { display: flex; align-items: center; gap: 8px; }
    .table-search, .status-filter { min-height: 34px; padding: 7px 10px; border: 1px solid var(--border-strong); border-radius: 7px; background: white; color: var(--text-primary); font-size: 11px; }
    .table-search { width: 190px; }
    th { padding: 11px 16px; background: #F9FAFB; color: #374151; font-size: 10px; font-weight: 650; letter-spacing: .05em; }
    td { padding: 13px 16px; border-bottom-color: #F3F4F6; color: #1F2937; font-size: 12px; }
    .fw-bold { color: var(--text-primary); font-weight: 650; }
    .status-pill { display: inline-flex; min-height: 22px; align-items: center; padding: 3px 8px; font-size: 10px; font-weight: 650; }
    .status-pill.success { background: #F0FDF4; color: #166534; border-color: #BBF7D0; }
    .status-pill.warning { background: #FFFBEB; color: #92400E; border-color: #FDE68A; }
    .btn-action { background: white; color: var(--text-secondary); border-color: var(--border); padding: 5px 8px; border-radius: 7px; }
    .btn-action:hover { background: var(--surface-subtle); color: var(--brand); border-color: var(--brand); }
    .request-actions .approve { color: #166534; border-color: #86EFAC; }
    .request-actions .reject { color: #991B1B; border-color: #FCA5A5; }
    .empty-state { display: grid; justify-items: center; padding: 30px 18px; text-align: center; }
    .empty-icon { display: grid; width: 42px; height: 42px; place-items: center; border: 1px solid var(--border); border-radius: 12px; background: var(--surface-subtle); color: var(--brand); }
    .empty-state h3 { margin: 12px 0 4px; color: var(--text-primary); font-size: 14px; }
    .empty-state p { margin: 0 0 14px; color: var(--text-secondary); font-size: 12px; }
    .empty-state.compact { padding: 22px; }
    .table-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--border); color: var(--text-secondary); font-size: 11px; }
    .pagination-actions, .pagination-actions label { display: flex; align-items: center; gap: 8px; }
    .pagination-actions label { gap: 5px; }
    .pagination-actions select, .pagination-actions button { min-height: 28px; padding: 4px 7px; border: 1px solid var(--border-strong); border-radius: 6px; background: white; font-size: 11px; }
    .pagination-actions button { display: grid; width: 28px; place-items: center; }
    @media (max-width: 760px) { .page-header { align-items: flex-start; flex-direction: column; } .page-header>.btn-primary { min-height:44px; } .table-header { align-items: flex-start; flex-direction: column; } .requests-card .table-header>.table-search { width:100%; } .table-controls { width: 100%; flex-wrap:wrap; } .table-search { min-width:0; flex:1 1 150px; } .table-controls .status-filter { flex:1 1 130px; } .table-pagination { align-items: flex-start; flex-direction: column; } .request-actions .btn-action,.table-wrapper td>.btn-action { min-height:44px; } .pagination-actions button { width:44px; min-height:44px; } }
    @media (max-width: 480px) { .modal-overlay { padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)); } .modal-content { padding: 20px; } .modal-actions { margin-top: 20px; } .modal-actions button { min-height:44px; } }
  `]
})
export class StaffPage implements OnInit {
  staff: Staff[] = [];
  filteredStaff: Staff[] = [];
  ownerRequests: PendingOwnerRegistration[] = [];
  filteredOwnerRequests: PendingOwnerRegistration[] = [];
  properties: Propiedad[] = [];
  selectedStaff: Staff | null = null;
  isLoading = false;
  isLoadingRequests = false;
  isSaving = false;
  processingOwnerId: string | null = null;
  deletingId: string | null = null;
  staffSearch = "";
  staffStatusFilter = "";
  staffPage = 0;
  staffPageSize = 10;
  requestSearch = "";
  requestPage = 0;
  requestPageSize = 5;
  errorMessage = "";

  constructor(private adminApi: AdminApiService) {}

  ngOnInit() {
    this.loadStaff();
    this.loadOwnerRequests();
    this.adminApi.getPropiedades().subscribe({
      next: (properties) => this.properties = properties,
      error: (err: unknown) => {
        console.error("Error cargando inmuebles para solicitudes", err);
        this.errorMessage = apiErrorMessage(err, "No se pudieron cargar los inmuebles.");
      }
    });
  }

  loadOwnerRequests() {
    this.isLoadingRequests = true;
    this.adminApi.getPendingOwnerRegistrations().subscribe({
      next: (requests) => {
        this.ownerRequests = requests;
        this.applyRequestFilter();
        this.isLoadingRequests = false;
      },
      error: (err: unknown) => {
        console.error("Error cargando solicitudes de propietarios", err);
        this.errorMessage = apiErrorMessage(err, "No se pudieron cargar las solicitudes.");
        this.isLoadingRequests = false;
      }
    });
  }

  approveOwner(request: PendingOwnerRegistration) {
    if (!request.idPropiedadSeleccionada || this.processingOwnerId) return;
    this.processingOwnerId = request.id;
    this.errorMessage = "";
    this.adminApi.approveOwnerRegistration(request.id, request.idPropiedadSeleccionada).subscribe({
      next: () => {
        this.processingOwnerId = null;
        this.loadOwnerRequests();
        this.loadStaff();
      },
      error: (err: unknown) => {
        console.error("Error aprobando solicitud de propietario", err);
        this.errorMessage = apiErrorMessage(err, "No se pudo aprobar la solicitud.");
        this.processingOwnerId = null;
      }
    });
  }

  rejectOwner(request: PendingOwnerRegistration) {
    if (this.processingOwnerId || !confirm(`¿Rechazar la solicitud de ${request.nombre}?`)) return;
    this.processingOwnerId = request.id;
    this.errorMessage = "";
    this.adminApi.rejectOwnerRegistration(request.id).subscribe({
      next: () => {
        this.processingOwnerId = null;
        this.loadOwnerRequests();
      },
      error: (err: unknown) => {
        console.error("Error rechazando solicitud de propietario", err);
        this.errorMessage = apiErrorMessage(err, "No se pudo rechazar la solicitud.");
        this.processingOwnerId = null;
      }
    });
  }

  loadStaff() {
    this.isLoading = true;
    this.errorMessage = "";
    this.adminApi.getStaff().subscribe({
      next: (staff) => {
        this.staff = staff;
        this.applyStaffFilters();
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error("Error cargando personal", err);
        this.errorMessage = apiErrorMessage(err, "No se pudo cargar el personal.");
        this.isLoading = false;
      }
    });
  }

  filterRequests(event: Event) {
    this.requestSearch = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyRequestFilter();
  }

  applyRequestFilter() {
    this.filteredOwnerRequests = this.ownerRequests.filter(request =>
      !this.requestSearch
      || request.nombre.toLowerCase().includes(this.requestSearch)
      || request.username.toLowerCase().includes(this.requestSearch)
      || request.documentoIdentidad.toLowerCase().includes(this.requestSearch)
      || request.inmueble.toLowerCase().includes(this.requestSearch)
    );
    this.requestPage = 0;
  }

  get pagedOwnerRequests() {
    const start = this.requestPage * this.requestPageSize;
    return this.filteredOwnerRequests.slice(start, start + this.requestPageSize);
  }

  get requestPageCount() {
    return Math.max(1, Math.ceil(this.filteredOwnerRequests.length / this.requestPageSize));
  }

  get requestsStart() {
    return this.filteredOwnerRequests.length === 0 ? 0 : this.requestPage * this.requestPageSize + 1;
  }

  get requestsEnd() {
    return Math.min((this.requestPage + 1) * this.requestPageSize, this.filteredOwnerRequests.length);
  }

  changeRequestPage(delta: number) {
    this.requestPage = Math.min(Math.max(0, this.requestPage + delta), this.requestPageCount - 1);
  }

  changeRequestPageSize(event: Event) {
    this.requestPageSize = Number((event.target as HTMLSelectElement).value);
    this.requestPage = 0;
  }

  filterStaff(event: Event) {
    this.staffSearch = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyStaffFilters();
  }

  filterStaffState(event: Event) {
    this.staffStatusFilter = (event.target as HTMLSelectElement).value;
    this.applyStaffFilters();
  }

  applyStaffFilters() {
    this.filteredStaff = this.staff.filter(item =>
      (!this.staffSearch
        || item.nombre.toLowerCase().includes(this.staffSearch)
        || item.username.toLowerCase().includes(this.staffSearch))
      && (!this.staffStatusFilter || item.estado === this.staffStatusFilter)
    );
    this.staffPage = 0;
  }

  clearStaffFilters() {
    this.staffSearch = "";
    this.staffStatusFilter = "";
    this.filteredStaff = [...this.staff];
    this.staffPage = 0;
  }

  get pagedStaff() {
    const start = this.staffPage * this.staffPageSize;
    return this.filteredStaff.slice(start, start + this.staffPageSize);
  }

  get staffPageCount() {
    return Math.max(1, Math.ceil(this.filteredStaff.length / this.staffPageSize));
  }

  get staffStart() {
    return this.filteredStaff.length === 0 ? 0 : this.staffPage * this.staffPageSize + 1;
  }

  get staffEnd() {
    return Math.min((this.staffPage + 1) * this.staffPageSize, this.filteredStaff.length);
  }

  changeStaffPage(delta: number) {
    this.staffPage = Math.min(Math.max(0, this.staffPage + delta), this.staffPageCount - 1);
  }

  changeStaffPageSize(event: Event) {
    this.staffPageSize = Number((event.target as HTMLSelectElement).value);
    this.staffPage = 0;
  }

  openForm() {
    this.errorMessage = "";
    this.selectedStaff = { username: "", nombre: "", rol: "operador", lecturas: 0, estado: "Activo", password: "" };
  }

  editStaff(staff: Staff) {
    this.errorMessage = "";
    this.selectedStaff = { ...staff };
  }

  closeForm() {
    if (!this.isSaving) {
      this.selectedStaff = null;
      this.errorMessage = "";
    }
  }

  saveStaff() {
    if (!this.selectedStaff) return;
    this.isSaving = true;
    this.errorMessage = "";
    const staff = {
      ...this.selectedStaff,
      nombre: this.selectedStaff.nombre.trim(),
      username: this.selectedStaff.username.trim(),
      rol: this.selectedStaff.rol.trim()
    };
    const request = staff.id
      ? this.adminApi.updateStaff(staff.id, staff)
      : this.adminApi.createStaff(staff);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.selectedStaff = null;
        this.loadStaff();
      },
      error: (err: unknown) => {
        console.error("Error guardando personal", err);
        this.errorMessage = apiErrorMessage(err, "No se pudo guardar el personal.");
        this.isSaving = false;
      }
    });
  }

  deleteStaff(staff: Staff) {
    if (!staff.id || this.deletingId || !confirm(`¿Eliminar a ${staff.nombre}?`)) return;
    this.deletingId = staff.id;
    this.errorMessage = "";
    this.adminApi.deleteStaff(staff.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.loadStaff();
      },
      error: (err: unknown) => {
        console.error("Error eliminando personal", err);
        this.errorMessage = apiErrorMessage(err, "No se pudo eliminar el registro.");
        this.deletingId = null;
      }
    });
  }
}
