import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService, Medidor, Propiedad, Tarifa } from '../../../core/services/admin-api.service';
import { apiErrorMessage } from '../../../core/services/api-error';
import { forkJoin } from 'rxjs';

type Tab = 'meters' | 'tariffs';

@Component({
    selector: 'app-meters-tariffs-page',
    imports: [CommonModule, FormsModule],
    template: `
    <section class="asset-page">
      <header class="page-heading">
        <div>
          <p class="eyebrow">CONFIGURACIÓN DE SERVICIOS</p>
          <h1>Medidores y tarifas</h1>
          <p class="subtitle">Administra los equipos de consumo y las tarifas vigentes del condominio.</p>
        </div>
        <button class="primary-button" type="button" (click)="openCreate()">
          <i class="fa-solid fa-plus" aria-hidden="true"></i>
          {{ tab === 'meters' ? 'Agregar medidor' : 'Crear tarifa' }}
        </button>
      </header>

      <div class="tabs" role="tablist" aria-label="Administración de servicios">
        <button role="tab" [attr.aria-selected]="tab === 'meters'" [class.selected]="tab === 'meters'"
          type="button" (click)="selectTab('meters')">Medidores <span>{{ meters.length }}</span></button>
        <button role="tab" [attr.aria-selected]="tab === 'tariffs'" [class.selected]="tab === 'tariffs'"
          type="button" (click)="selectTab('tariffs')">Tarifas <span>{{ tariffs.length }}</span></button>
      </div>

      <p class="feedback error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
      <p class="feedback success" *ngIf="successMessage" role="status">{{ successMessage }}</p>
      <div class="loading" *ngIf="loading" role="status">Cargando información...</div>

      <section class="panel" *ngIf="tab === 'meters' && !loading">
        <div class="panel-toolbar">
          <div>
            <h2>Inventario de medidores</h2>
            <p>Equipos asociados a cada inmueble.</p>
          </div>
          <label class="search-field">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <span class="visually-hidden">Buscar medidores</span>
            <input type="search" [(ngModel)]="meterSearch" (ngModelChange)="meterPage = 0" placeholder="Buscar serie, casa o servicio">
          </label>
        </div>

        <form class="edit-form" *ngIf="showForm" (ngSubmit)="saveMeter()" #meterForm="ngForm">
          <div class="form-heading">
            <h3>{{ editingId ? 'Editar medidor' : 'Nuevo medidor' }}</h3>
            <button class="icon-button" type="button" (click)="closeForm()" aria-label="Cerrar formulario">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
          <div class="form-grid">
            <label>Inmueble
              <select name="property" [(ngModel)]="meterDraft.idPropiedad" required>
                <option value="" disabled>Selecciona una propiedad</option>
                <option *ngFor="let property of properties" [value]="property.id">{{ property.numeroCasa }}</option>
              </select>
            </label>
            <label>Servicio
              <select name="service" [(ngModel)]="meterDraft.tipoServicio" required (ngModelChange)="meterDraft.idTarifa = null">
                <option value="agua">Agua</option><option value="luz">Luz</option>
              </select>
            </label>
            <label>Número de serie
              <input name="serial" [(ngModel)]="meterDraft.numeroSerie" maxlength="100" required>
            </label>
            <label>Marca / modelo
              <input name="model" [(ngModel)]="meterDraft.marcaModelo" maxlength="100">
            </label>
            <label>Lectura inicial
              <input name="initialReading" type="number" min="0" step="0.01" [(ngModel)]="meterDraft.lecturaInicial" required>
            </label>
            <label>Tarifa asociada <span class="optional">(opcional)</span>
              <select name="tariff" [(ngModel)]="meterDraft.idTarifa">
                <option [ngValue]="null">Sin asignar</option>
                <option *ngFor="let tariff of tariffsForMeter" [ngValue]="tariff.id">
                  {{ tariff.descripcion || tariff.tipoServicio }} · {{ tariff.precioUnidad | number:'1.2-4' }} por unidad
                </option>
              </select>
            </label>
          </div>
          <div class="form-actions">
            <button class="secondary-button" type="button" (click)="closeForm()">Cancelar</button>
            <button class="primary-button" type="submit" [disabled]="!meterForm.valid || saving">
              {{ saving ? 'Guardando...' : 'Guardar medidor' }}
            </button>
          </div>
        </form>

        <div class="table-wrap" role="region" tabindex="0" aria-label="Medidores; desliza horizontalmente para ver todas las columnas" *ngIf="filteredMeters.length; else meterEmpty">
          <table>
            <thead><tr><th>Inmueble</th><th>Serie</th><th>Servicio</th><th>Lectura inicial</th><th>Tarifa</th><th><span class="visually-hidden">Acciones</span></th></tr></thead>
            <tbody>
              <tr *ngFor="let meter of pagedMeters">
                <td><strong>{{ meter.casa }}</strong></td>
                <td>{{ meter.numeroSerie }}<small>{{ meter.marcaModelo || 'Sin marca / modelo' }}</small></td>
                <td><span class="service-badge" [class.water]="meter.tipoServicio === 'agua'">{{ meter.tipoServicio === 'agua' ? 'Agua' : 'Luz' }}</span></td>
                <td>{{ meter.lecturaInicial | number:'1.0-2' }}</td>
                <td>{{ meter.tarifa || 'Sin asignar' }}</td>
                <td class="row-actions">
                  <button class="icon-button" type="button" (click)="editMeter(meter)" [attr.aria-label]="'Editar medidor ' + meter.numeroSerie"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>
                  <button class="icon-button danger-icon" type="button" (click)="deleteMeter(meter)" [attr.aria-label]="'Eliminar medidor ' + meter.numeroSerie"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #meterEmpty>
          <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-gauge-high" aria-hidden="true"></i></div>
            <h3>{{ meterSearch ? 'No encontramos medidores' : 'No hay medidores registrados' }}</h3>
            <p>{{ meterSearch ? 'Prueba con otro término de búsqueda.' : 'Registra los equipos para habilitar la captura de lecturas y la facturación.' }}</p>
            <button class="primary-button" type="button" *ngIf="!meterSearch" (click)="openCreate()">Agregar primer medidor</button>
          </div>
        </ng-template>
        <footer class="table-footer" *ngIf="filteredMeters.length">
          <span>{{ pageStart + 1 }}–{{ pageEnd }} de {{ filteredMeters.length }} medidores</span>
          <div><button class="secondary-button" type="button" (click)="meterPage = meterPage - 1" [disabled]="meterPage === 0">Anterior</button>
          <button class="secondary-button" type="button" (click)="meterPage = meterPage + 1" [disabled]="pageEnd >= filteredMeters.length">Siguiente</button></div>
        </footer>
      </section>

      <section class="panel" *ngIf="tab === 'tariffs' && !loading">
        <div class="panel-toolbar">
          <div><h2>Tarifas de servicios</h2><p>Vigencias sin solapamientos para agua y luz.</p></div>
          <label class="search-field"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><span class="visually-hidden">Buscar tarifas</span><input type="search" [(ngModel)]="tariffSearch" (ngModelChange)="tariffPage = 0" placeholder="Buscar servicio o descripción"></label>
        </div>
        <form class="edit-form" *ngIf="showForm" (ngSubmit)="saveTariff()" #tariffForm="ngForm">
          <div class="form-heading"><h3>{{ editingId ? 'Editar tarifa' : 'Nueva tarifa' }}</h3><button class="icon-button" type="button" (click)="closeForm()" aria-label="Cerrar formulario"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>
          <div class="form-grid">
            <label>Servicio<select name="service" [(ngModel)]="tariffDraft.tipoServicio" required><option value="agua">Agua</option><option value="luz">Luz</option></select></label>
            <label>Precio por unidad<input name="price" type="number" min="0" step="0.0001" [(ngModel)]="tariffDraft.precioUnidad" required></label>
            <label>Cargo fijo<input name="fixedCharge" type="number" min="0" step="0.01" [(ngModel)]="tariffDraft.cargoFijo" required></label>
            <label>Vigente desde<input name="startDate" type="date" [(ngModel)]="tariffDraft.vigenciaDesde" required></label>
            <label>Vigente hasta <span class="optional">(opcional)</span><input name="endDate" type="date" [(ngModel)]="tariffDraft.vigenciaHasta"></label>
            <label>Descripción<input name="description" [(ngModel)]="tariffDraft.descripcion" maxlength="500"></label>
          </div>
          <p class="form-hint">No se permiten periodos que se solapen para el mismo servicio.</p>
          <div class="form-actions"><button class="secondary-button" type="button" (click)="closeForm()">Cancelar</button><button class="primary-button" type="submit" [disabled]="!tariffForm.valid || saving">{{ saving ? 'Guardando...' : 'Guardar tarifa' }}</button></div>
        </form>
        <div class="table-wrap" role="region" tabindex="0" aria-label="Tarifas; desliza horizontalmente para ver todas las columnas" *ngIf="filteredTariffs.length; else tariffEmpty">
          <table><thead><tr><th>Servicio</th><th>Descripción</th><th>Precio / unidad</th><th>Cargo fijo</th><th>Vigencia</th><th><span class="visually-hidden">Acciones</span></th></tr></thead>
            <tbody><tr *ngFor="let tariff of pagedTariffs">
              <td><span class="service-badge" [class.water]="tariff.tipoServicio === 'agua'">{{ tariff.tipoServicio === 'agua' ? 'Agua' : 'Luz' }}</span></td>
              <td>{{ tariff.descripcion || '—' }}</td><td>{{ tariff.precioUnidad | number:'1.2-4' }}</td><td>{{ tariff.cargoFijo | number:'1.2-2' }}</td>
              <td>{{ tariff.vigenciaDesde | date:'mediumDate' }}<small>{{ tariff.vigenciaHasta ? ('Hasta ' + (tariff.vigenciaHasta | date:'mediumDate')) : 'Sin fecha de término' }}</small></td>
              <td class="row-actions"><button class="icon-button" type="button" (click)="editTariff(tariff)" [attr.aria-label]="'Editar tarifa ' + tariff.tipoServicio"><i class="fa-solid fa-pen" aria-hidden="true"></i></button><button class="icon-button danger-icon" type="button" (click)="deleteTariff(tariff)" [attr.aria-label]="'Eliminar tarifa ' + tariff.tipoServicio"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button></td>
            </tr></tbody>
          </table>
        </div>
        <ng-template #tariffEmpty><div class="empty-state"><div class="empty-icon"><i class="fa-solid fa-tags" aria-hidden="true"></i></div><h3>{{ tariffSearch ? 'No encontramos tarifas' : 'No hay tarifas registradas' }}</h3><p>{{ tariffSearch ? 'Prueba con otro término de búsqueda.' : 'Define la tarifa y su vigencia antes de generar facturas.' }}</p><button class="primary-button" type="button" *ngIf="!tariffSearch" (click)="openCreate()">Crear primera tarifa</button></div></ng-template>
        <footer class="table-footer" *ngIf="filteredTariffs.length"><span>{{ pageStart + 1 }}–{{ pageEnd }} de {{ filteredTariffs.length }} tarifas</span><div><button class="secondary-button" type="button" (click)="tariffPage = tariffPage - 1" [disabled]="tariffPage === 0">Anterior</button><button class="secondary-button" type="button" (click)="tariffPage = tariffPage + 1" [disabled]="pageEnd >= filteredTariffs.length">Siguiente</button></div></footer>
      </section>
    </section>
  `,
    styles: [`
    :host { display:block; color:#18181b; }
    .asset-page { max-width:1440px; margin:0 auto; padding:28px 32px 48px; }
    .page-heading,.panel-toolbar,.form-heading,.form-actions,.table-footer { display:flex; align-items:center; justify-content:space-between; gap:16px; }
    .page-heading { margin-bottom:24px; }
    h1 { margin:0; font-size:28px; line-height:1.25; letter-spacing:-.035em; font-weight:700; }
    h2 { margin:0; font-size:16px; font-weight:650; } h3 { margin:0; font-size:15px; }
    p { margin:5px 0 0; color:#52525b; font-size:13px; }
    .eyebrow { margin:0 0 7px; color:#52525b; font-size:10px; font-weight:700; letter-spacing:.1em; }
    .subtitle { margin-top:7px; }
    .tabs { display:flex; border-bottom:1px solid #e4e4e7; margin-bottom:18px; gap:22px; }
    .tabs button { display:flex; align-items:center; gap:8px; background:none; border:0; border-bottom:2px solid transparent; color:#52525b; padding:12px 1px; font-family:inherit; font-size:13px; font-weight:600; cursor:pointer; }
    .tabs button.selected { color:#18181b; border-color:var(--accent); }
    .tabs span { color:#52525b; background:#f4f4f5; border-radius:10px; padding:2px 7px; font-size:11px; }
    .panel { background:#fff; border:1px solid #e4e4e7; border-radius:12px; box-shadow:0 1px 2px #18181b08,0 8px 24px #18181b05; }
    .panel-toolbar { padding:20px 22px; }
    .search-field { display:flex; align-items:center; gap:9px; width:min(350px,45%); height:38px; padding:0 12px; border:1px solid #d4d4d8; border-radius:7px; color:#52525b; }
    .search-field input { width:100%; border:0; outline:0; color:#18181b; font:inherit; font-size:13px; background:transparent; }
    .primary-button,.secondary-button,.icon-button { border-radius:7px; cursor:pointer; transition:background .18s cubic-bezier(.16,1,.3,1),border-color .18s,transform .18s; }
    .primary-button { display:inline-flex; justify-content:center; align-items:center; gap:8px; padding:10px 14px; border:1px solid var(--brand); background:linear-gradient(135deg,var(--accent),var(--brand)); color:white; font-family:inherit; font-size:13px; font-weight:600; }
    .primary-button:hover:not(:disabled) { background:var(--brand-strong); transform:translateY(-1px); }
    .primary-button:disabled,.secondary-button:disabled { opacity:.55; cursor:not-allowed; }
    .secondary-button { padding:8px 11px; border:1px solid #d4d4d8; background:#fff; color:#27272a; font-family:inherit; font-size:12px; font-weight:600; }
    .secondary-button:hover:not(:disabled) { background:#f4f4f5; }
    .edit-form { margin:0 22px 20px; padding:18px; background:#fafafa; border:1px solid #e4e4e7; border-radius:9px; }
    .form-heading { margin-bottom:16px; }
    .form-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
    label { display:flex; flex-direction:column; gap:6px; color:#3f3f46; font-size:12px; font-weight:600; }
    input,select { min-width:0; height:38px; padding:0 10px; border:1px solid #d4d4d8; border-radius:6px; background:#fff; color:#18181b; font-family:inherit; font-size:13px; }
    input:focus,select:focus,.search-field:focus-within { outline:2px solid var(--accent); outline-offset:1px; border-color:var(--accent); }
    .optional { color:#52525b; font-weight:400; }
    .form-hint { margin:12px 0 0; }
    .form-actions { justify-content:flex-end; margin-top:16px; }
    .table-wrap { width:100%; max-width:100%; overflow-x:auto; overscroll-behavior-x:contain; }
    table { width:100%; border-collapse:collapse; text-align:left; white-space:nowrap; }
    th { padding:11px 16px; border-top:1px solid #e4e4e7; border-bottom:1px solid #e4e4e7; background:#fafafa; color:#3f3f46; font-size:11px; font-weight:650; }
    td { padding:13px 16px; border-bottom:1px solid #f0f0f1; color:#3f3f46; font-size:13px; }
    td strong { color:#18181b; } td small { display:block; margin-top:4px; color:#52525b; font-size:11px; }
    tr:last-child td { border-bottom:0; }
    .service-badge { display:inline-flex; padding:4px 8px; border:1px solid var(--border); border-radius:999px; background:var(--brand-soft); color:var(--brand); font-size:11px; font-weight:600; }
    .service-badge.water { border-color:#a5f3fc; background:#ecfeff; color:#155e75; }
    .row-actions { text-align:right; }
    .icon-button { width:32px; height:32px; margin-left:4px; border:1px solid transparent; background:transparent; color:#52525b; }
    .icon-button:hover { border-color:#e4e4e7; background:#f4f4f5; color:#18181b; }
    .danger-icon:hover { color:#b91c1c; background:#fef2f2; }
    .table-footer { padding:13px 18px; border-top:1px solid #e4e4e7; color:#52525b; font-size:12px; }
    .table-footer div { display:flex; gap:7px; }
    .empty-state { display:flex; align-items:center; flex-direction:column; padding:38px 20px 42px; text-align:center; }
    .empty-icon { display:grid; width:46px; height:46px; place-items:center; border-radius:12px; background:var(--brand-soft); color:var(--brand); font-size:19px; }
    .empty-state h3 { margin-top:14px; }
    .empty-state p { max-width:380px; line-height:1.55; margin:6px 0 16px; }
    .feedback { padding:10px 12px; margin:0 0 14px; border-radius:7px; }
    .error { color:#991b1b; border:1px solid #fecaca; background:#fef2f2; }
    .success { color:#166534; border:1px solid #bbf7d0; background:#f0fdf4; }
    .loading { padding:35px; text-align:center; color:#52525b; }
    .visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
    @media(max-width:800px) { .asset-page { padding:22px 20px 48px; } .form-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .panel-toolbar { align-items:flex-start; flex-direction:column; } .search-field { width:100%; } }
    @media(max-width:540px) { .asset-page { padding:18px 14px 48px; } .page-heading { align-items:flex-start; flex-direction:column; } .page-heading>.primary-button { width:100%; min-height:44px; } .form-grid { grid-template-columns:1fr; } .edit-form { margin:0 12px 14px; padding:14px; } .panel-toolbar { padding:16px; } .icon-button { width:44px; height:44px; } .table-footer { align-items:flex-start; flex-direction:column; } .table-footer .secondary-button { min-height:44px; } }
  `]
})
export class MetersTariffsPage implements OnInit {
  tab: Tab = 'meters';
  meters: Medidor[] = [];
  tariffs: Tarifa[] = [];
  properties: Propiedad[] = [];
  loading = true;
  saving = false;
  showForm = false;
  editingId: string | null = null;
  errorMessage = '';
  successMessage = '';
  meterSearch = '';
  tariffSearch = '';
  meterPage = 0;
  tariffPage = 0;
  readonly pageSize = 10;
  meterDraft: Medidor = this.newMeter();
  tariffDraft: Tarifa = this.newTariff();

  constructor(private readonly api: AdminApiService) {}

  ngOnInit(): void { this.loadData(); }

  get tariffsForMeter(): Tarifa[] {
    const today = new Date().toISOString().slice(0, 10);
    return this.tariffs.filter(t => t.tipoServicio === this.meterDraft.tipoServicio
      && t.vigenciaDesde <= today && (!t.vigenciaHasta || t.vigenciaHasta >= today));
  }
  get filteredMeters(): Medidor[] {
    const query = this.meterSearch.trim().toLowerCase();
    return this.meters.filter(m => !query || [m.casa, m.numeroSerie, m.tipoServicio, m.marcaModelo]
      .some(value => value?.toLowerCase().includes(query)));
  }
  get filteredTariffs(): Tarifa[] {
    const query = this.tariffSearch.trim().toLowerCase();
    return this.tariffs.filter(t => !query || [t.tipoServicio, t.descripcion]
      .some(value => value?.toLowerCase().includes(query)));
  }
  get pagedMeters(): Medidor[] { return this.filteredMeters.slice(this.meterPage * this.pageSize, (this.meterPage + 1) * this.pageSize); }
  get pagedTariffs(): Tarifa[] { return this.filteredTariffs.slice(this.tariffPage * this.pageSize, (this.tariffPage + 1) * this.pageSize); }
  get pageStart(): number { return (this.tab === 'meters' ? this.meterPage : this.tariffPage) * this.pageSize; }
  get pageEnd(): number { return Math.min(this.pageStart + this.pageSize, this.tab === 'meters' ? this.filteredMeters.length : this.filteredTariffs.length); }

  selectTab(tab: Tab): void { this.tab = tab; this.closeForm(); this.clearMessages(); }
  openCreate(): void {
    this.clearMessages();
    this.editingId = null;
    this.meterDraft = this.newMeter();
    this.tariffDraft = this.newTariff();
    this.showForm = true;
  }
  closeForm(): void { this.showForm = false; this.editingId = null; }
  editMeter(meter: Medidor): void { this.clearMessages(); this.editingId = meter.id ?? null; this.meterDraft = { ...meter }; this.showForm = true; }
  editTariff(tariff: Tarifa): void { this.clearMessages(); this.editingId = tariff.id ?? null; this.tariffDraft = { ...tariff }; this.showForm = true; }

  saveMeter(): void {
    this.saving = true; this.clearMessages();
    const request = this.editingId ? this.api.updateMedidor(this.editingId, this.meterDraft) : this.api.createMedidor(this.meterDraft);
    request.subscribe({
      next: () => { this.successMessage = this.editingId ? 'Medidor actualizado.' : 'Medidor creado.'; this.closeForm(); this.loadData(false); },
      error: error => { this.errorMessage = apiErrorMessage(error, 'No se pudo guardar el medidor.'); this.saving = false; },
      complete: () => { this.saving = false; }
    });
  }
  saveTariff(): void {
    this.saving = true; this.clearMessages();
    const request = this.editingId ? this.api.updateTarifa(this.editingId, this.tariffDraft) : this.api.createTarifa(this.tariffDraft);
    request.subscribe({
      next: () => { this.successMessage = this.editingId ? 'Tarifa actualizada.' : 'Tarifa creada.'; this.closeForm(); this.loadData(false); },
      error: error => { this.errorMessage = apiErrorMessage(error, 'No se pudo guardar la tarifa.'); this.saving = false; },
      complete: () => { this.saving = false; }
    });
  }
  deleteMeter(meter: Medidor): void {
    if (!meter.id || !window.confirm(`¿Eliminar el medidor ${meter.numeroSerie}?`)) return;
    this.api.deleteMedidor(meter.id).subscribe({
      next: () => { this.successMessage = 'Medidor eliminado.'; this.loadData(false); },
      error: error => { this.errorMessage = apiErrorMessage(error, 'No se pudo eliminar el medidor.'); }
    });
  }
  deleteTariff(tariff: Tarifa): void {
    if (!tariff.id || !window.confirm(`¿Eliminar la tarifa de ${tariff.tipoServicio}?`)) return;
    this.api.deleteTarifa(tariff.id).subscribe({
      next: () => { this.successMessage = 'Tarifa eliminada.'; this.loadData(false); },
      error: error => { this.errorMessage = apiErrorMessage(error, 'No se pudo eliminar la tarifa.'); }
    });
  }

  private loadData(initial = true): void {
    if (initial) this.loading = true;
    forkJoin({
      meters: this.api.getMedidores(),
      tariffs: this.api.getTarifas(),
      properties: this.api.getPropiedades()
    }).subscribe({
      next: ({ meters, tariffs, properties }) => {
        this.meters = meters;
        this.tariffs = tariffs;
        this.properties = properties;
        this.meterPage = Math.min(this.meterPage, Math.max(0, Math.ceil(this.filteredMeters.length / this.pageSize) - 1));
        this.tariffPage = Math.min(this.tariffPage, Math.max(0, Math.ceil(this.filteredTariffs.length / this.pageSize) - 1));
        this.loading = false;
        this.saving = false;
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'No se pudo cargar la configuración de servicios.');
        this.loading = false;
        this.saving = false;
      }
    });
  }
  private clearMessages(): void { this.errorMessage = ''; this.successMessage = ''; }
  private newMeter(): Medidor { return { idPropiedad: '', tipoServicio: 'agua', numeroSerie: '', marcaModelo: '', lecturaInicial: 0, idTarifa: null }; }
  private newTariff(): Tarifa { return { tipoServicio: 'agua', precioUnidad: 0, cargoFijo: 0, vigenciaDesde: new Date().toISOString().slice(0, 10), vigenciaHasta: null, descripcion: '' }; }
}
