import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AdminApiService, Factura } from "../../../core/services/admin-api.service";
import { apiErrorMessage } from "../../../core/services/api-error";
import { ReportPdfService } from "../../../core/services/report-pdf.service";

@Component({
    selector: "app-billing-page",
    imports: [CommonModule],
    template: `
    <div class="page-header">
      <div>
        <h1 class="page-title"><i class="fa-solid fa-file-invoice-dollar" aria-hidden="true"></i> Facturación</h1>
        <p class="page-subtitle">Cálculo de consumos y emisión de recibos</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn-secondary" (click)="exportInvoices()" [disabled]="filteredInvoices.length === 0"><i class="fa-solid fa-file-csv" aria-hidden="true"></i> CSV</button>
        <button type="button" class="btn-secondary pdf-export" (click)="exportInvoicesPdf()" [disabled]="filteredInvoices.length === 0 || isExportingPdf"><i class="fa-regular fa-file-pdf" aria-hidden="true"></i> {{ isExportingPdf ? 'Preparando PDF...' : 'PDF' }}</button>
        <button type="button" class="btn-primary" (click)="generateInvoices()" [disabled]="isGenerating"><i class="fa-solid fa-calculator" aria-hidden="true"></i> {{ isGenerating ? 'Generando...' : 'Generar facturas' }}</button>
      </div>
    </div>

    <p class="page-error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
    <p class="page-success" *ngIf="successMessage" role="status">{{ successMessage }}</p>
    <div class="data-table-card">
      <div class="table-header">
        <div>
          <h2 class="table-title"><i class="fa-solid fa-list" aria-hidden="true"></i> Facturas recientes</h2>
          <span class="table-count">{{ filteredInvoices.length }} registros</span>
        </div>
        <div class="table-controls">
          <input class="search-input" type="search" aria-label="Buscar factura o casa" placeholder="Buscar factura o casa..." [value]="searchQuery" (input)="filterSearch($event)">
          <select class="status-filter" aria-label="Filtrar facturas por estado" [value]="statusFilter" (change)="filterStatus($event)">
            <option value="">Todos los estados</option>
            <option value="Pagado">Pagado</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Vencido">Vencido</option>
          </select>
        </div>
      </div>
      <div class="table-wrapper" role="region" tabindex="0" aria-label="Facturas recientes; desliza horizontalmente para ver todas las columnas">
        <table>
          <thead>
            <tr>
              <th>Factura #</th>
              <th>Casa</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let invoice of pagedInvoices">
              <td>{{ invoice.numeroFactura }}</td>
              <td class="fw-bold">{{ invoice.casa }}</td>
              <td>{{ invoice.total | currency:'USD' }}</td>
              <td>{{ invoice.fecha | date:'dd/MM/yyyy' }}</td>
              <td><span class="status-pill" [ngClass]="invoice.estado === 'Pagado' ? 'success' : invoice.estado === 'Vencido' ? 'danger' : 'warning'">{{ invoice.estado }}</span></td>
              <td class="invoice-actions">
                <button type="button" class="btn-action" (click)="selectedInvoice = invoice" [attr.aria-label]="'Ver factura ' + invoice.numeroFactura"><i class="fa-solid fa-eye"></i></button>
                <button type="button" class="btn-action" (click)="toggleInvoiceStatus(invoice)" [disabled]="!invoice.id || updatingId === invoice.id" [attr.aria-label]="invoice.estado === 'Pagado' ? 'Marcar como pendiente' : 'Marcar como pagada'">
                  <i class="fa-solid" [ngClass]="invoice.estado === 'Pagado' ? 'fa-rotate-left' : 'fa-check'"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="isLoading"><td colspan="6">Cargando facturas...</td></tr>
          </tbody>
        </table>
      </div>
      <div class="empty-state" *ngIf="!isLoading && invoices.length === 0 && !errorMessage">
        <span class="empty-icon" aria-hidden="true"><i class="fa-solid fa-file-invoice-dollar"></i></span>
        <h3>No hay facturas registradas</h3>
        <p>Genera las facturas del periodo a partir de las lecturas disponibles.</p>
        <button type="button" class="btn-primary" (click)="generateInvoices()" [disabled]="isGenerating">{{ isGenerating ? 'Generando...' : 'Generar facturas del mes' }}</button>
      </div>
      <div class="empty-state compact" *ngIf="!isLoading && invoices.length > 0 && filteredInvoices.length === 0">
        <h3>Sin resultados</h3>
        <p>No hay facturas que coincidan con los filtros seleccionados.</p>
        <button type="button" class="btn-secondary" (click)="clearFilters()">Limpiar filtros</button>
      </div>
      <div class="table-pagination" *ngIf="!isLoading && filteredInvoices.length > 0">
        <span>Mostrando {{ paginationStart }}–{{ paginationEnd }} de {{ filteredInvoices.length }}</span>
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
    </div>

    <div class="modal-overlay" *ngIf="selectedInvoice">
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="invoice-dialog-title">
        <h3 id="invoice-dialog-title">Factura {{ selectedInvoice.numeroFactura }}</h3>
        <p><strong>Unidad:</strong> {{ selectedInvoice.casa }}</p>
        <p><strong>Total:</strong> {{ selectedInvoice.total | currency:'USD' }}</p>
        <p><strong>Fecha:</strong> {{ selectedInvoice.fecha | date:'dd/MM/yyyy' }}</p>
        <p><strong>Estado:</strong> {{ selectedInvoice.estado }}</p>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" (click)="selectedInvoice = null">Cerrar</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    .page-title { display: flex; align-items: center; gap: 8px; color: var(--text-primary); font-size: 24px; font-weight: 700; letter-spacing: -.035em; margin: 0; }
    .page-title i { color: var(--text-secondary); font-size: 18px; }
    .page-subtitle { font-size: 13px; color: var(--text-secondary); margin: 4px 0 0; }
    .header-actions, .table-controls { display: flex; align-items: center; gap: 8px; }
    .btn-primary, .btn-secondary { display: inline-flex; min-height: 36px; align-items: center; gap: 7px; padding: 7px 11px; border-radius: 8px; font-size: 11px; font-weight: 650; cursor: pointer; }
    .btn-primary { background: var(--brand); color: white; border: 1px solid var(--brand); }
    .btn-primary:hover { background: #002e5a; }
    .btn-secondary { background: white; color: var(--text-secondary); border: 1px solid var(--border-strong); }
    .pdf-export { color:#991b1b; }
    .pdf-export:hover:not(:disabled) { border-color:#991b1b; }
    .btn-secondary:hover { border-color: var(--brand); color: var(--brand); }
    .data-table-card { background: white; border-radius: 12px; box-shadow: var(--shadow-card); border: 1px solid var(--border); overflow: hidden; }
    .table-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px; border-bottom: 1px solid var(--border); }
    .table-title { display: flex; align-items: center; gap: 8px; color: var(--text-primary); font-size: 15px; font-weight: 650; margin: 0; }
    .table-title i { color: var(--text-secondary); font-size: 14px; }
    .table-count { display: inline-block; margin-top: 4px; color: var(--text-secondary); font-size: 11px; }
    .search-input, .status-filter { min-height: 34px; padding: 7px 10px; border: 1px solid var(--border-strong); border-radius: 7px; background: white; color: var(--text-primary); font-size: 11px; }
    .search-input { width: 190px; }
    .table-wrapper { max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 11px 16px; background: #F9FAFB; color: #374151; font-size: 10px; font-weight: 650; text-transform: uppercase; letter-spacing: .05em; }
    td { padding: 13px 16px; border-bottom: 1px solid #F3F4F6; color: #1F2937; font-size: 12px; }
    .fw-bold { font-weight: 650; color: var(--text-primary); }
    .status-pill { display: inline-flex; min-height: 22px; align-items: center; padding: 3px 8px; border: 1px solid transparent; border-radius: 100px; font-size: 10px; font-weight: 650; }
    .status-pill.success { background: #F0FDF4; color: #166534; border-color: #BBF7D0; }
    .status-pill.warning { background: #FFFBEB; color: #92400E; border-color: #FDE68A; }
    .status-pill.danger { background: #FEF2F2; color: #991B1B; border-color: #FECACA; }
    .btn-action { display: inline-flex; min-height: 30px; align-items: center; justify-content: center; background: white; color: var(--text-secondary); border: 1px solid var(--border); padding: 5px 8px; border-radius: 7px; cursor: pointer; }
    .btn-action:hover { border-color: var(--brand); color: var(--brand); }
    .invoice-actions { display: flex; gap: 8px; }
    .page-success { margin: 16px 24px; color: #15803D; font-size: 14px; }
    .modal-overlay { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; padding: 24px 16px; background: rgba(15,23,42,.5); scrollbar-width: none; }
    .modal-overlay::-webkit-scrollbar { display: none; }
    .modal-content { width: min(100%, 450px); margin: auto 0; padding: 28px; border: 1px solid var(--border); border-radius: 14px; background: white; box-shadow: 0 16px 40px rgba(15,23,42,.16); animation: surface-reveal 180ms var(--ease-out) both; }
    .modal-actions { display: flex; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border); }
    .btn-cancel { background: white; color: var(--text-secondary); border: 1px solid var(--border-strong); border-radius: 8px; padding: 9px 14px; }
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
    @media (max-width: 640px) { .page-header { align-items: flex-start; flex-direction: column; } .header-actions { width: 100%; flex-wrap:wrap; justify-content: flex-start; } .header-actions button { min-height:44px; } .table-header { align-items: flex-start; flex-direction: column; } .table-controls { width: 100%; flex-wrap:wrap; } .search-input { min-width:0; flex:1 1 150px; } .table-controls .status-filter { flex:1 1 130px; } .table-pagination { align-items: flex-start; flex-direction: column; } .invoice-actions .btn-action { min-width:44px; min-height:44px; } .pagination-actions button { width:44px; min-height:44px; } }
    @media (max-width: 480px) { .modal-overlay { padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)); } .modal-content { padding: 20px; } .modal-actions button { min-height:44px; } }
  `]
})
export class BillingPage implements OnInit {
  invoices: Factura[] = [];
  filteredInvoices: Factura[] = [];
  selectedInvoice: Factura | null = null;
  searchQuery = "";
  statusFilter = "";
  pageIndex = 0;
  pageSize = 10;
  isLoading = false;
  isGenerating = false;
  isExportingPdf = false;
  updatingId: string | null = null;
  errorMessage = "";
  successMessage = "";

  constructor(private adminApi: AdminApiService, private reportPdf: ReportPdfService) {}

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    this.isLoading = true;
    this.errorMessage = "";
    this.adminApi.getFacturas().subscribe({
      next: (invoices) => {
        this.invoices = invoices;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error("Error cargando facturas", err);
        this.errorMessage = apiErrorMessage(err, "No se pudieron cargar las facturas.");
        this.isLoading = false;
      }
    });
  }

  filterSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyFilters();
  }

  filterStatus(event: Event) {
    this.statusFilter = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredInvoices = this.invoices.filter(invoice =>
      (!this.searchQuery
        || invoice.numeroFactura.toLowerCase().includes(this.searchQuery)
        || invoice.casa.toLowerCase().includes(this.searchQuery))
      && (!this.statusFilter || invoice.estado === this.statusFilter)
    );
    this.pageIndex = 0;
  }

  clearFilters() {
    this.searchQuery = "";
    this.statusFilter = "";
    this.filteredInvoices = [...this.invoices];
    this.pageIndex = 0;
  }

  get pagedInvoices() {
    const start = this.pageIndex * this.pageSize;
    return this.filteredInvoices.slice(start, start + this.pageSize);
  }

  get pageCount() {
    return Math.max(1, Math.ceil(this.filteredInvoices.length / this.pageSize));
  }

  get paginationStart() {
    return this.filteredInvoices.length === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }

  get paginationEnd() {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.filteredInvoices.length);
  }

  changePage(delta: number) {
    this.pageIndex = Math.min(Math.max(0, this.pageIndex + delta), this.pageCount - 1);
  }

  changePageSize(event: Event) {
    this.pageSize = Number((event.target as HTMLSelectElement).value);
    this.pageIndex = 0;
  }

  generateInvoices() {
    if (this.isGenerating) return;
    this.isGenerating = true;
    this.errorMessage = "";
    this.successMessage = "";
    this.adminApi.generarFacturasMes().subscribe({
      next: () => {
        this.isGenerating = false;
        this.successMessage = "Se generaron las facturas del periodo.";
        this.loadInvoices();
      },
      error: (err: unknown) => {
        console.error("Error generando facturas", err);
        this.errorMessage = apiErrorMessage(err, "No se pudieron generar las facturas.");
        this.isGenerating = false;
      }
    });
  }

  toggleInvoiceStatus(invoice: Factura) {
    if (!invoice.id || this.updatingId) return;
    const estado = invoice.estado === "Pagado" ? "Pendiente" : "Pagado";
    this.updatingId = invoice.id;
    this.errorMessage = "";
    this.successMessage = "";
    this.adminApi.updateFacturaEstado(invoice.id, estado).subscribe({
      next: (updatedInvoice) => {
        this.invoices = this.invoices.map(item => item.id === invoice.id ? updatedInvoice : item);
        this.applyFilters();
        this.successMessage = `La factura ${updatedInvoice.numeroFactura} ahora figura como ${updatedInvoice.estado.toLowerCase()}.`;
        this.updatingId = null;
      },
      error: (err: unknown) => {
        console.error("Error actualizando estado de factura", err);
        this.errorMessage = apiErrorMessage(err, "No se pudo actualizar el estado de la factura.");
        this.updatingId = null;
      }
    });
  }

  exportInvoices() {
    if (this.filteredInvoices.length === 0) return;
    const rows = [
      ["Factura", "Unidad", "Total", "Fecha", "Estado"],
      ...this.filteredInvoices.map(invoice => [
        invoice.numeroFactura,
        invoice.casa,
        invoice.total.toFixed(2),
        invoice.fecha,
        invoice.estado
      ])
    ];
    const csv = rows.map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reporte-facturas.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async exportInvoicesPdf() {
    if (this.filteredInvoices.length === 0 || this.isExportingPdf) return;
    this.isExportingPdf = true;
    this.errorMessage = "";
    try {
      await this.reportPdf.export({
        title: "Reporte de facturación",
        subtitle: `Reporte filtrado · ${this.filteredInvoices.length} facturas`,
        filename: "reporte-facturas",
        headers: ["Factura", "Unidad", "Total", "Fecha", "Estado"],
        rows: this.filteredInvoices.map(invoice => [
          invoice.numeroFactura,
          `Casa ${invoice.casa}`,
          new Intl.NumberFormat("es-PE", { style: "currency", currency: "USD" }).format(invoice.total),
          new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(new Date(`${invoice.fecha}T00:00:00`)),
          invoice.estado
        ])
      });
    } catch (error: unknown) {
      console.error("Error generando PDF de facturas", error);
      this.errorMessage = error instanceof Error
        ? error.message
        : "No se pudo generar el PDF de facturas.";
    } finally {
      this.isExportingPdf = false;
    }
  }
}
