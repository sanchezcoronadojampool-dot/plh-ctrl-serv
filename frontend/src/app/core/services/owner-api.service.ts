import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface OwnerPortalData {
  propiedades: OwnerProperty[];
  lecturas: OwnerReading[];
  facturas: OwnerInvoice[];
}

export interface OwnerProperty {
  id: string;
  codigo: string;
  casa: string;
  manzana: string | null;
  sector: string | null;
  medidores: OwnerMeter[];
}

export interface OwnerMeter {
  id: string;
  servicio: string;
  numeroSerie: string;
  casa: string;
}

export interface OwnerReading {
  id: string;
  casa: string;
  servicio: string;
  valor: number;
  fecha: string;
}

export interface OwnerInvoice {
  id: string;
  numeroFactura: string;
  casa: string;
  total: number;
  fecha: string;
  estado: string;
}

@Injectable({ providedIn: "root" })
export class OwnerApiService {
  constructor(private http: HttpClient) {}

  getOverview(): Observable<OwnerPortalData> {
    return this.http.get<OwnerPortalData>(`${environment.apiUrl}/owner/overview`);
  }
}
