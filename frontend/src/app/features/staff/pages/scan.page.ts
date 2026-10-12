import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-scan-page',
    template: `
    <main class="scan-page">
      <div class="scan-container">
        <header class="page-header">
          <div><h1>Registrar lectura</h1><p>Escanea el QR de una propiedad para elegir el medidor, o el QR de un medidor para abrir su lectura directamente.</p></div>
        </header>
        <section class="scanner-section" aria-label="Escanear código de propiedad o medidor">
          <div class="section-heading"><span class="step">1</span><div><h2>Escanear código QR</h2><p>Centra el QR de la propiedad o del medidor dentro del área de la cámara.</p></div></div>
          <app-qr-scanner></app-qr-scanner>
        </section>
        <section class="manual-entry">
          <div class="section-heading"><span class="step">2</span><div><h2>Ingreso manual</h2><p>Usa esta alternativa si no puedes escanear el código.</p></div></div>
          <form (ngSubmit)="openMeter()" #meterForm="ngForm">
            <label for="meter-id">Identificador UUID del medidor</label>
            <input id="meter-id" name="meterId" [(ngModel)]="meterId" required placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
            <p class="error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
            <button type="submit" [disabled]="meterForm.invalid">Continuar</button>
          </form>
        </section>
      </div>
    </main>
  `,
    styles: [`
    .scan-page { min-height: 100%; padding: 28px 24px 56px; background: var(--surface-subtle); }
    .scan-container { width: min(100%, 760px); margin: 0 auto; display: grid; gap: 16px; }
    .page-header { padding: 0 0 4px; }
    h1 { margin: 0; color: var(--text-primary); font-size: 24px; letter-spacing: -.03em; }
    .page-header p { margin: 6px 0 0; color: var(--text-secondary); font-size: 13px; }
    app-qr-scanner { width: 100%; }
    .scanner-section,.manual-entry { width: 100%; padding: 20px; border: 1px solid var(--border); border-radius: 12px; background: white; box-shadow: var(--shadow-card); }
    .section-heading { display:flex; align-items:center; gap:11px; margin-bottom:14px; }
    .section-heading h2 { margin:0; color:var(--text-primary); font-size:15px; }
    .section-heading p { margin:3px 0 0; color:#52525b; font-size:12px; line-height:1.45; }
    .step { display:grid; flex:none; width:30px; height:30px; place-items:center; border:1px solid var(--border); border-radius:9px; background:var(--brand-soft); color:var(--brand); font-size:13px; font-weight:700; }
    .manual-entry form { display: grid; gap: 12px; }
    .manual-entry label { color: var(--text-primary); font-size: 13px; font-weight: 600; }
    .manual-entry input { width: 100%; min-height: 40px; padding: 9px 11px; border: 1px solid var(--border-strong); border-radius: 8px; font: inherit; }
    .manual-entry button { min-height: 44px; padding: 10px 14px; border: 1px solid var(--brand); border-radius: 8px; background: var(--brand); color: white; font-size:14px; font-weight: 650; cursor:pointer; }
    .manual-entry button:disabled { opacity: .55; }
    .error { margin: 0; color: var(--danger); }
    @media (max-width: 600px) {
      .scan-page { padding: 14px 0 max(56px, env(safe-area-inset-bottom)); }
      .scan-container { gap:11px; }
      .page-header,.scanner-section,.manual-entry { margin-inline:14px; width:auto; }
      .page-header { padding:0 2px 2px; }
      h1 { font-size:21px; }
      .page-header p { max-width:42ch; font-size:13px; line-height:1.5; }
      .scanner-section,.manual-entry { padding:15px; border-radius:10px; }
      .manual-entry input { min-height:46px; font-size:16px; }
      .manual-entry button { min-height:48px; width:100%; }
      .scanner-section app-qr-scanner { display:block; min-height:240px; }
    }
    @media(prefers-reduced-motion:reduce) { * { scroll-behavior:auto !important; } }
  `],
    standalone: false
})
export class ScanPage {
  meterId = '';
  errorMessage = '';

  constructor(private router: Router) {}

  openMeter() {
    const id = this.meterId.trim();
    if (!this.isUuid(id)) {
      this.errorMessage = "El identificador debe ser un UUID válido.";
      return;
    }
    this.errorMessage = "";
    this.router.navigate(['/staff/read', id]);
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
