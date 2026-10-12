import { CommonModule } from "@angular/common";
import { Component, HostListener, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import * as QRCode from "qrcode";
import { AdminApiService, Propiedad } from "../../../core/services/admin-api.service";
import { apiErrorMessage } from "../../../core/services/api-error";

@Component({
  selector: "app-property-qr-page",
  imports: [CommonModule, FormsModule],
  template: `
    <main class="qr-page">
      <header class="page-header qr-screen">
        <div>
          <p class="eyebrow">IDENTIFICACIÓN DE INMUEBLES</p>
          <h1><i class="fa-solid fa-qrcode" aria-hidden="true"></i> QR de propiedades</h1>
          <p class="subtitle">Genera e imprime códigos para abrir la selección de medidores del staff.</p>
        </div>
      </header>

      <section class="workspace qr-screen">
        <div class="selector-card">
          <label for="property-select">Propiedad</label>
          <select id="property-select" [ngModel]="selectedPropertyId" (ngModelChange)="selectProperty($event)" [disabled]="isLoading || properties.length === 0">
            <option value="" disabled>Selecciona una propiedad</option>
            <option *ngFor="let property of properties" [value]="property.id" [disabled]="!property.id">
              Casa {{ property.numeroCasa }} · {{ property.codigoInterno }}
            </option>
          </select>
          <p class="helper">El QR dirige al personal autenticado a los medidores registrados en esta unidad. No contiene información personal del propietario. Para usarlo desde otros dispositivos, genera la impresión desde el dominio HTTPS publicado.</p>
          <div class="selection-heading">
            <strong>QR seleccionados <span>{{ selectedPropertyIds.length }}</span></strong>
            <div>
              <button type="button" class="text-button" (click)="selectAll()" [disabled]="isPreparingPrint || properties.length === 0">Seleccionar todas</button>
              <button type="button" class="text-button" (click)="clearSelection()" [disabled]="isPreparingPrint || selectedPropertyIds.length === 0">Limpiar</button>
            </div>
          </div>
          <div class="property-checklist" role="group" aria-label="Propiedades que se incluirán en la impresión">
            <label class="property-option" *ngFor="let item of properties">
              <input type="checkbox" [checked]="isSelected(item.id)" [disabled]="!item.id || isPreparingPrint" (change)="toggleProperty(item.id, $event)">
              <span><strong>Casa {{ item.numeroCasa }}</strong><small>{{ item.codigoInterno }}</small></span>
            </label>
          </div>
          <p class="page-error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
          <p class="loading" *ngIf="isLoading" role="status">Cargando propiedades...</p>
          <p class="empty" *ngIf="!isLoading && properties.length === 0 && !errorMessage">No hay propiedades disponibles para generar códigos QR.</p>
          <p class="print-hint" *ngIf="selectedPropertyIds.length">Se acomodan hasta 6 códigos por hoja A4; si seleccionas más, se agregan hojas.</p>
        </div>

        <section class="preview-card" *ngIf="selectedProperty as property">
          <div class="preview-header">
            <div>
              <span class="eyebrow">VISTA PREVIA</span>
              <h2>Casa {{ property.numeroCasa }}</h2>
              <p>{{ property.codigoInterno }}<span *ngIf="property.manzana"> · Manzana {{ property.manzana }}</span></p>
            </div>
            <button type="button" class="print-button" (click)="printQr()" [disabled]="selectedPropertyIds.length === 0 || isPreparingPrint || isGenerating">
              <i class="fa-solid fa-print" aria-hidden="true"></i> {{ isPreparingPrint ? 'Preparando...' : 'Imprimir ' + selectedPropertyIds.length + ' QR' }}
            </button>
          </div>
          <div class="qr-preview" *ngIf="qrDataUrl; else qrLoading">
            <img [src]="qrDataUrl" [alt]="'Código QR para casa ' + property.numeroCasa">
          </div>
          <ng-template #qrLoading><div class="qr-loading" role="status">{{ isGenerating ? 'Generando código QR...' : 'Elige una propiedad para generar su código.' }}</div></ng-template>
          <p class="scan-note">Al escanearlo desde el módulo del staff, se abrirá esta propiedad para elegir el medidor de agua o luz.</p>
        </section>
      </section>

      <div class="print-sheets" aria-hidden="true">
        <section class="print-sheet" *ngFor="let sheet of printSheets">
          <article class="print-card" *ngFor="let item of sheet">
            <header class="print-brand">
              <img src="assets/logo-plh.png" alt="">
              <div><span>CONDOMINIO</span><strong>Playa La Honda</strong></div>
            </header>
            <p class="print-eyebrow">IDENTIFICACIÓN DE PROPIEDAD</p>
            <h2>Casa {{ item.property.numeroCasa }}</h2>
            <p class="print-code">{{ item.property.codigoInterno }}</p>
            <img class="print-qr" [src]="item.qrDataUrl" [alt]="'Código QR para casa ' + item.property.numeroCasa">
            <p class="print-footer">Escanea para seleccionar un medidor</p>
          </article>
        </section>
      </div>
    </main>
  `,
  styles: [`
    :host { display:block; }
    .qr-page { display:grid; gap:20px; }
    .page-header { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; }
    .eyebrow { margin:0 0 5px; color:var(--text-secondary); font-size:10px; font-weight:750; letter-spacing:.1em; }
    h1 { display:flex; align-items:center; gap:10px; margin:0; color:var(--text-primary); font-size:24px; letter-spacing:-.035em; }
    h1 i { color:var(--brand); font-size:20px; }
    .subtitle { margin:6px 0 0; color:var(--text-secondary); font-size:13px; }
    .workspace { display:grid; grid-template-columns:minmax(250px, 340px) minmax(0, 1fr); align-items:start; gap:18px; }
    .selector-card,.preview-card { min-width:0; padding:20px; border:1px solid var(--border); border-radius:12px; background:#fff; box-shadow:var(--shadow-card); }
    .selector-card label { display:block; margin-bottom:8px; color:var(--text-primary); font-size:13px; font-weight:650; }
    .selector-card select { width:100%; min-height:44px; padding:9px 11px; border:1px solid var(--border-strong); border-radius:8px; background:white; color:var(--text-primary); font-size:14px; }
    .helper,.scan-note { color:var(--text-secondary); font-size:12px; line-height:1.55; }
    .helper { margin:12px 0 0; }
    .selection-heading { display:flex; align-items:center; justify-content:space-between; gap:8px; margin:18px 0 8px; }
    .selection-heading strong { color:var(--text-primary); font-size:12px; }
    .selection-heading strong span { display:inline-grid; min-width:21px; height:21px; place-items:center; margin-left:4px; padding:0 5px; border-radius:99px; background:var(--brand-soft); color:var(--brand); }
    .selection-heading div { display:flex; gap:8px; }
    .text-button { min-height:32px; padding:4px 6px; border:0; background:transparent; color:var(--brand); font-size:11px; font-weight:650; }
    .property-checklist { display:grid; max-height:280px; gap:4px; overflow-y:auto; padding:4px; border:1px solid var(--border); border-radius:8px; }
    .property-option { display:flex; min-height:44px; align-items:center; gap:9px; padding:6px 8px; border-radius:6px; cursor:pointer; }
    .property-option:hover { background:var(--surface-subtle); }
    .property-option input { width:17px; height:17px; accent-color:var(--brand); }
    .property-option span { display:grid; min-width:0; gap:2px; }
    .property-option strong { overflow:hidden; color:var(--text-primary); font-size:12px; text-overflow:ellipsis; white-space:nowrap; }
    .property-option small { overflow:hidden; color:var(--text-secondary); font-size:10px; text-overflow:ellipsis; white-space:nowrap; }
    .print-hint { margin:10px 0 0; color:var(--text-secondary); font-size:11px; line-height:1.45; }
    .page-error { margin:12px 0 0; color:var(--danger); font-size:13px; }
    .loading,.empty { margin:14px 0 0; color:var(--text-secondary); font-size:13px; line-height:1.5; }
    .preview-header { display:flex; align-items:center; justify-content:space-between; gap:14px; }
    .preview-header h2 { margin:0; color:var(--text-primary); font-size:19px; }
    .preview-header p { margin:4px 0 0; color:var(--text-secondary); font-size:12px; }
    .print-button { display:inline-flex; min-height:42px; align-items:center; justify-content:center; gap:8px; padding:9px 13px; border:1px solid var(--brand); border-radius:8px; background:var(--brand); color:#fff; font-size:13px; font-weight:650; white-space:nowrap; }
    .qr-preview { display:grid; width: min(100%, 340px); aspect-ratio:1; place-items:center; margin:22px auto 10px; border:1px solid var(--border); border-radius:12px; background:#fff; }
    .qr-preview img { display:block; width:90%; height:90%; object-fit:contain; image-rendering:pixelated; }
    .qr-loading { display:grid; min-height:220px; place-items:center; color:var(--text-secondary); font-size:13px; }
    .scan-note { margin:8px 0 0; text-align:center; }
    .print-sheets { display:none; }
    .print-sheet { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); grid-template-rows:repeat(3,minmax(0,1fr)); gap:4mm; }
    .print-card { display:flex; min-width:0; flex-direction:column; align-items:center; justify-content:center; padding:4mm; border:1px solid #d1d5db; border-radius:3mm; text-align:center; }
    .print-brand { display:flex; align-items:center; gap:2mm; margin-bottom:2mm; }
    .print-brand img { width:12mm; height:12mm; object-fit:contain; }
    .print-brand div { display:grid; gap:1px; text-align:left; }
    .print-brand span { color:#4b5563; font-size:6pt; font-weight:750; letter-spacing:.1em; }
    .print-brand strong { color:#003b73; font-size:9pt; }
    .print-eyebrow { margin:0 0 1mm; color:#4b5563; font-size:6pt; font-weight:750; letter-spacing:.08em; }
    .print-card h2 { margin:0; color:#111827; font-size:14pt; }
    .print-code { margin:1mm 0 2mm; color:#374151; font-size:8pt; }
    .print-qr { display:block; width:42mm; height:42mm; object-fit:contain; image-rendering:pixelated; }
    .print-footer { margin:2mm 0 0; color:#6b7280; font-size:6pt; }
    @media(max-width:760px) {
      .workspace { grid-template-columns:1fr; }
      .page-header { align-items:flex-start; }
      h1 { font-size:21px; }
    }
    @media(max-width:480px) {
      .selector-card,.preview-card { padding:16px; }
      .preview-header { align-items:flex-start; flex-direction:column; }
      .print-button { width:100%; min-height:46px; }
    }
  `],
  standalone: true
})
export class PropertyQrPage implements OnInit {
  properties: Propiedad[] = [];
  selectedPropertyIds: string[] = [];
  selectedPropertyId = "";
  qrDataUrl = "";
  errorMessage = "";
  isLoading = true;
  isGenerating = false;
  isPreparingPrint = false;
  printSheets: { property: Propiedad; qrDataUrl: string }[][] = [];
  private readonly qrCache = new Map<string, string>();
  private generation = 0;

  constructor(private adminApi: AdminApiService) {}

  get selectedProperty(): Propiedad | undefined {
    return this.properties.find(property => property.id === this.selectedPropertyId);
  }

  ngOnInit(): void {
    this.adminApi.getPropiedades().subscribe({
      next: properties => {
        this.properties = properties;
        this.isLoading = false;
        const firstProperty = properties.find(property => property.id);
        if (firstProperty?.id) {
          this.selectedPropertyId = firstProperty.id;
          this.selectedPropertyIds = [firstProperty.id];
          void this.generateQr();
        }
      },
      error: (error: unknown) => {
        console.error("Error cargando propiedades para generar códigos QR", error);
        this.errorMessage = apiErrorMessage(error, "No se pudieron cargar las propiedades.");
        this.isLoading = false;
      }
    });
  }

  selectProperty(id: string): void {
    this.selectedPropertyId = id;
    void this.generateQr();
  }

  isSelected(id?: string): boolean {
    return !!id && this.selectedPropertyIds.includes(id);
  }

  toggleProperty(id: string | undefined, event: Event): void {
    if (!id) return;
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedPropertyIds = checked
      ? [...this.selectedPropertyIds, id]
      : this.selectedPropertyIds.filter(selectedId => selectedId !== id);
  }

  selectAll(): void {
    this.selectedPropertyIds = this.properties.flatMap(property => property.id ? [property.id] : []);
  }

  clearSelection(): void {
    this.selectedPropertyIds = [];
  }

  async generateQr(): Promise<void> {
    const generation = ++this.generation;
    const property = this.selectedProperty;
    this.qrDataUrl = "";
    this.errorMessage = "";
    if (!property?.id) return;

    this.isGenerating = true;
    try {
      const dataUrl = await this.generateQrData(property.id);
      if (generation === this.generation) {
        this.qrDataUrl = dataUrl;
        this.qrCache.set(property.id, dataUrl);
      }
    } catch (error) {
      console.error("Error generando el código QR de la propiedad", error);
      if (generation === this.generation) this.errorMessage = "No se pudo generar el código QR. Vuelve a seleccionar la propiedad.";
    } finally {
      if (generation === this.generation) this.isGenerating = false;
    }
  }

  async printQr(): Promise<void> {
    if (this.selectedPropertyIds.length === 0 || this.isPreparingPrint) return;
    this.isPreparingPrint = true;
    this.errorMessage = "";
    try {
      const selected = this.properties.filter((property): property is Propiedad & { id: string } =>
        !!property.id && this.selectedPropertyIds.includes(property.id)
      );
      const printItems = await Promise.all(selected.map(async property => {
        const qrDataUrl = this.qrCache.get(property.id) ?? await this.generateQrData(property.id);
        return { property, qrDataUrl };
      }));
      printItems.forEach(item => this.qrCache.set(item.property.id, item.qrDataUrl));
      this.printSheets = [];
      for (let index = 0; index < printItems.length; index += 6) {
        this.printSheets.push(printItems.slice(index, index + 6));
      }
    } catch (error) {
      console.error("Error preparando los códigos QR para impresión", error);
      this.errorMessage = "No se pudieron preparar todos los códigos QR. Inténtalo de nuevo.";
      this.isPreparingPrint = false;
      return;
    }
    document.body.classList.add("printing-property-qr");
    window.setTimeout(() => {
      window.print();
      this.isPreparingPrint = false;
    }, 100);
  }

  @HostListener("window:afterprint")
  onAfterPrint(): void {
    document.body.classList.remove("printing-property-qr");
  }

  private generateQrData(propertyId: string): Promise<string> {
    const target = new URL(`/staff/property/${encodeURIComponent(propertyId)}`, window.location.origin).toString();
    return QRCode.toDataURL(target, {
      errorCorrectionLevel: "Q",
      margin: 4,
      width: 360,
      color: { dark: "#003b73", light: "#ffffff" }
    });
  }
}
