import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicioApi } from '../../../core/services/servicio-api.service';
import { MedidorInfoResponse, LecturaRequest } from '../../../core/models/service-models';
import { apiErrorMessage } from '../../../core/services/api-error';

@Component({
    selector: 'app-reading-page',
    template: `
    <main class="reading-page">
      <section class="reading-container">
        <header class="page-header">
          <div>
            <p class="eyebrow">REGISTRO DE SERVICIO</p>
            <h1 *ngIf="info">Casa {{ info.numeroCasa }}</h1>
            <h1 *ngIf="!info">Registrar lectura</h1>
          </div>
        </header>
        <div class="meter-details" *ngIf="info">
          <p>Servicio <strong>{{ info.tipoServicio }}</strong></p>
          <p>Propietario <strong>{{ info.propietario }}</strong></p>
          <p class="last-reading">Última lectura <strong>{{ info.ultimaLectura }}</strong></p>
        </div>

        <form *ngIf="info" (ngSubmit)="enviarLectura()" #readingForm="ngForm">
          <div class="form-group">
            <label for="new-reading">Nueva lectura</label>
            <input id="new-reading" type="number" name="valorActual" [(ngModel)]="valorActual" (ngModelChange)="validarLectura()" [min]="info.ultimaLectura" step="any" required>
          </div>
          <div class="form-group">
            <label for="reading-evidence">Enlace a evidencia <span>(opcional)</span></label>
            <input id="reading-evidence" type="url" name="evidence" [(ngModel)]="fotoUrl" maxlength="2048" placeholder="https://...">
          </div>
          <div class="form-group">
            <label for="reading-notes">Observaciones <span>(opcional)</span></label>
            <textarea id="reading-notes" name="notes" [(ngModel)]="observaciones" maxlength="2000" rows="3"></textarea>
          </div>
          <div class="gps-control">
            <div><strong>Ubicación de la lectura</strong><small>{{ gps || 'No se registró ubicación' }}</small></div>
            <button class="secondary-button" type="button" (click)="captureLocation()" [disabled]="isCapturingLocation">
              {{ isCapturingLocation ? 'Obteniendo...' : 'Usar mi ubicación' }}
            </button>
          </div>
          <p *ngIf="locationError" class="error" role="alert">{{ locationError }}</p>
          <p *ngIf="error" class="error" role="alert">{{ error }}</p>
          <p *ngIf="successMessage" class="success" role="status">{{ successMessage }}</p>
          <button type="submit" [disabled]="!isValid || isSubmitting">{{ isSubmitting ? 'Enviando...' : 'Confirmar lectura' }}</button>
        </form>
        <p *ngIf="isLoading" class="loading-message" role="status">Cargando información del medidor...</p>
        <p *ngIf="!isLoading && error && !info" class="error" role="alert">{{ error }}</p>
      </section>
    </main>
  `,
    styles: [`
    .reading-page { min-height: 100%; padding: 28px 24px 56px; background: var(--surface-subtle); }
    .reading-container { width: min(100%, 680px); margin: 0 auto; padding: 24px; border: 1px solid var(--border); border-radius: 12px; background: white; box-shadow: var(--shadow-card); }
    .page-header { padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .eyebrow { margin: 0 0 4px; color: var(--text-secondary); font-size: 10px; font-weight: 700; letter-spacing: .08em; }
    h1 { margin: 0; color: var(--text-primary); font-size: 22px; letter-spacing: -.03em; }
    .meter-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; margin: 18px 0; }
    .meter-details p { margin: 0; color: var(--text-secondary); font-size: 13px; }
    .meter-details strong { display: block; margin-top: 3px; color: var(--text-primary); font-size: 14px; }
    .meter-details .last-reading { grid-column: 1 / -1; padding: 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface-subtle); }
    .form-group { display: grid; gap: 8px; margin: 20px 0; }
    .form-group label { color: var(--text-primary); font-size: 13px; font-weight: 600; }
    .form-group input { width: 100%; min-height: 42px; padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 8px; font: inherit; }
    .form-group textarea { width:100%; resize:vertical; padding:10px 12px; border:1px solid var(--border-strong); border-radius:8px; font:inherit; }
    .form-group label span { color:var(--text-secondary); font-weight:400; }
    .reading-container button { min-height: 44px; padding: 9px 13px; border: 1px solid var(--brand); border-radius: 8px; background: var(--brand); color: white; font-weight: 650; cursor:pointer; }
    .reading-container button:disabled { opacity: .55; }
    .gps-control { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:18px 0; padding:12px; border:1px solid var(--border); border-radius:8px; background:var(--surface-subtle); }
    .gps-control strong,.gps-control small { display:block; }
    .gps-control strong { color:var(--text-primary); font-size:13px; }
    .gps-control small { margin-top:4px; color:var(--text-secondary); font-size:12px; }
    .reading-container .secondary-button { flex:none; border-color:var(--border-strong); background:white; color:var(--text-primary); }
    .reading-container .secondary-button:hover:not(:disabled) { background:#f4f4f5; }
    .error { color: var(--danger); font-weight: 600; }
    .success { color: var(--success); font-weight: 600; }
    .loading-message { color: var(--text-secondary); }
    @media (max-width: 600px) {
      .reading-page { padding:14px 0 max(56px, env(safe-area-inset-bottom)); }
      .reading-container { width:auto; margin:0 14px; padding:17px; border-radius:10px; }
      h1 { font-size:20px; }
      .meter-details { grid-template-columns:1fr; gap:10px; }
      .meter-details .last-reading { grid-column:auto; }
      .form-group { margin:16px 0; }
      .form-group input { min-height:48px; font-size:16px; }
      .form-group textarea { font-size:16px; }
      .gps-control { align-items:flex-start; flex-direction:column; }
      .gps-control .secondary-button { width:100%; min-height:44px; }
      .reading-container form>button[type="submit"] { position:sticky; bottom:calc(10px + env(safe-area-inset-bottom)); z-index:5; width:100%; min-height:50px; margin-top:8px; box-shadow:0 4px 14px rgba(15,23,42,.2); }
    }
  `],
    standalone: false
})
export class ReadingPage implements OnInit {
  info?: MedidorInfoResponse;
  valorActual: number | null = null;
  error: string = '';
  successMessage = '';
  isValid: boolean = false;
  isLoading = true;
  isSubmitting = false;
  fotoUrl = '';
  observaciones = '';
  gps = '';
  locationError = '';
  isCapturingLocation = false;

  constructor(private route: ActivatedRoute, private api: ServicioApi) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('idMedidor');
    if (id) {
      this.api.getMedidorInfo(id).subscribe({
        next: (res) => {
          this.info = res;
          this.isLoading = false;
        },
        error: (err: unknown) => {
          console.error('Error cargando información del medidor', err);
          this.error = apiErrorMessage(err, 'No se pudo cargar la información del medidor.');
          this.isLoading = false;
        }
      });
    } else {
      this.error = 'No se especificó un identificador de medidor válido.';
      this.isLoading = false;
    }
  }

  validarLectura() {
    this.successMessage = '';
    if (this.valorActual === null || !Number.isFinite(this.valorActual)) {
      this.error = 'Ingresa una lectura numérica válida.';
      this.isValid = false;
    } else if (this.info && this.valorActual < this.info.ultimaLectura) {
      this.error = 'La lectura no puede ser menor a la anterior.';
      this.isValid = false;
    } else {
      this.error = '';
      this.isValid = true;
    }
  }

  enviarLectura() {
    if (!this.info || !this.isValid || this.valorActual === null || this.isSubmitting) return;
    this.isSubmitting = true;
    this.error = '';
    this.successMessage = '';
    const req: LecturaRequest = {
      idMedidor: this.info.idMedidor,
      valorLectura: this.valorActual,
      fotoUrl: this.fotoUrl.trim() || undefined,
      gps: this.gps || undefined,
      observaciones: this.observaciones.trim() || undefined,
    };
    this.api.registrarLectura(req).subscribe({
      next: () => {
        this.successMessage = 'Lectura registrada correctamente.';
        this.isSubmitting = false;
        this.isValid = false;
      },
      error: (err: unknown) => {
        console.error('Error registrando la lectura', err);
        this.error = apiErrorMessage(err, 'No se pudo registrar la lectura.');
        this.isSubmitting = false;
      }
    });
  }

  captureLocation() {
    if (!navigator.geolocation) {
      this.locationError = 'Este navegador no permite obtener la ubicación.';
      return;
    }
    this.isCapturingLocation = true;
    this.locationError = '';
    navigator.geolocation.getCurrentPosition(
      position => {
        this.gps = `${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`;
        this.isCapturingLocation = false;
      },
      error => {
        this.locationError = error.code === error.PERMISSION_DENIED
          ? 'No se concedió permiso de ubicación. Puedes registrar la lectura sin GPS.'
          : 'No se pudo obtener la ubicación. Puedes intentarlo de nuevo o continuar sin GPS.';
        this.isCapturingLocation = false;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }
}
