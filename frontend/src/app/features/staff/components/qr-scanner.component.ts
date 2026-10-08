import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-qr-scanner',
    template: `
    <div class="scanner-wrapper">
      <zxing-scanner
        (scanSuccess)="onScanSuccess($event)"
        (permissionResponse)="onPermissionResponse($event)"
        (camerasNotFound)="onCameraUnavailable()"
        (scanError)="onScanError($event)">
      </zxing-scanner>
      <div class="overlay">Apunta al QR de la propiedad o del medidor</div>
      <p class="camera-message" *ngIf="cameraMessage" role="status">{{ cameraMessage }}</p>
      <p class="scan-error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
    </div>
  `,
    styles: [`
    .scanner-wrapper { position: relative; width: 100%; min-height: 300px; overflow: hidden; border: 1px solid var(--border); border-radius: 12px; background: #111827; box-shadow: var(--shadow-card); }
    .overlay { position: absolute; right: 12px; bottom: 12px; left: 12px; padding: 10px; border-radius: 10px; text-align: center; color: white; background: rgba(15,23,42,0.68); }
    .camera-message { position:absolute; top:12px; right:12px; left:12px; margin:0; padding:9px 11px; border:1px solid rgba(255,255,255,.35); border-radius:8px; background:rgba(15,23,42,.82); color:white; font-size:12px; line-height:1.45; }
    .scan-error { margin: 10px 0; color: var(--danger); font-size: 13px; font-weight: 600; }
    @media(max-width:600px) { .scanner-wrapper { min-height:240px; border-radius:8px; } .overlay { right:8px; bottom:8px; left:8px; padding:9px; font-size:12px; } }
  `],
    standalone: false
})
export class QrScannerComponent {
  errorMessage = '';
  cameraMessage = '';

  constructor(private router: Router) {}

  onScanSuccess(result: string) {
    this.cameraMessage = '';
    const id = result.trim();
    try {
      const scannedUrl = new URL(id);
      const propertyPath = scannedUrl.pathname.match(/^\/staff\/property\/([0-9a-f-]{36})\/?$/i);
      if (scannedUrl.origin === window.location.origin && propertyPath && this.isUuid(propertyPath[1])) {
        this.errorMessage = '';
        void this.router.navigate(['/staff/property', propertyPath[1]]);
        return;
      }
    } catch {
      // Existing meter QR codes contain plain UUIDs rather than URLs.
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      this.errorMessage = 'El código escaneado no contiene un QR válido de propiedad o medidor.';
      return;
    }
    this.errorMessage = '';
    this.router.navigate(['/staff/read', id]);
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  onPermissionResponse(granted: boolean): void {
    this.cameraMessage = granted
      ? ''
      : 'No se concedió acceso a la cámara. Revisa los permisos del navegador o usa el ingreso manual.';
  }

  onCameraUnavailable(): void {
    this.cameraMessage = 'No se encontró una cámara disponible. Puedes ingresar el identificador manualmente.';
  }

  onScanError(error: Error): void {
    console.error('Error al iniciar el lector QR', error);
    this.cameraMessage = 'No se pudo iniciar la cámara. Verifica los permisos y que la página use HTTPS, o ingresa el identificador manualmente.';
  }
}
