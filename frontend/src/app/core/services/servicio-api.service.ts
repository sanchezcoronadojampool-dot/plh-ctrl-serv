import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MedidorInfoResponse, LecturaRequest, Lectura, PropiedadMedidoresResponse } from '../models/service-models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicioApi {
  private readonly API_URL = `${environment.apiUrl}/lecturas`;

  constructor(private http: HttpClient) {}

  // Obtener información al escanear el QR
  getMedidorInfo(idMedidor: string): Observable<MedidorInfoResponse> {
    return this.http.get<MedidorInfoResponse>(`${this.API_URL}/info-medidor/${idMedidor}`);
  }

  getPropiedadMedidores(idPropiedad: string): Observable<PropiedadMedidoresResponse> {
    return this.http.get<PropiedadMedidoresResponse>(`${this.API_URL}/info-propiedad/${idPropiedad}`);
  }

  // Registrar la nueva lectura
  registrarLectura(datos: LecturaRequest): Observable<Lectura> {
    return this.http.post<Lectura>(`${this.API_URL}/registrar`, datos);
  }
}
