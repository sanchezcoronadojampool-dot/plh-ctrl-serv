import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Propiedad {
  id?: string;
  idPersonaResponsable?: string | null;
  codigoInterno: string;
  numeroCasa: string;
  propietario: string;
  estatus: 'Ocupada' | 'Vacía' | 'En mantenimiento';
  manzana?: string;
  sector?: string;
}

export interface PersonaOption {
  id: string;
  nombre: string;
}

export interface Staff {
  id?: string;
  username: string;
  nombre: string;
  rol: string;
  lecturas: number;
  estado: 'Activo' | 'Inactivo';
  password?: string;
}

export interface PendingOwnerRegistration {
  id: string;
  nombre: string;
  documentoIdentidad: string;
  telefono: string;
  correoElectronico: string | null;
  username: string;
  inmueble: string;
  fechaSolicitud: string;
  idPropiedadSeleccionada?: string;
}

export interface Factura {
  id?: string;
  numeroFactura: string;
  casa: string;
  total: number;
  fecha: string;
  estado: 'Pagado' | 'Pendiente';
}

export interface DashboardSummary {
  totalPropiedades: number;
  propiedadesOcupadas: number;
  lecturasMes: number;
  facturasPendientes: number;
  saldoPendiente: number;
}

export interface Medidor {
  id?: string;
  idPropiedad: string;
  casa?: string;
  idTarifa?: string | null;
  tarifa?: string | null;
  tipoServicio: 'agua' | 'luz';
  numeroSerie: string;
  marcaModelo?: string | null;
  lecturaInicial: number;
}

export interface Tarifa {
  id?: string;
  tipoServicio: 'agua' | 'luz';
  precioUnidad: number;
  cargoFijo: number;
  vigenciaDesde: string;
  vigenciaHasta?: string | null;
  descripcion?: string | null;
}

export interface ReadingHistory {
  id: string;
  casa: string;
  servicio: 'agua' | 'luz';
  numeroSerie: string;
  valor: number;
  fecha: string;
  staff: string;
  evidenciaUrl?: string | null;
  coordenadas?: string | null;
  observaciones?: string | null;
}

export interface ApiPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private readonly API_BASE = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // --- Propiedades ---
  getPropiedades(): Observable<Propiedad[]> {
    return this.http.get<Propiedad[]>(`${this.API_BASE}/propiedades`);
  }
  getPersonas(): Observable<PersonaOption[]> {
    return this.http.get<PersonaOption[]>(`${this.API_BASE}/personas/residentes`);
  }
  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.API_BASE}/dashboard/resumen`);
  }
  createPropiedad(p: Propiedad): Observable<Propiedad> {
    return this.http.post<Propiedad>(`${this.API_BASE}/propiedades`, this.toPropiedadRequest(p));
  }
  updatePropiedad(id: string, p: Propiedad): Observable<Propiedad> {
    return this.http.put<Propiedad>(`${this.API_BASE}/propiedades/${id}`, this.toPropiedadRequest(p));
  }
  deletePropiedad(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE}/propiedades/${id}`);
  }

  // --- Medidores y tarifas ---
  getMedidores(): Observable<Medidor[]> {
    return this.http.get<Medidor[]>(`${this.API_BASE}/medidores`);
  }
  createMedidor(meter: Medidor): Observable<Medidor> {
    return this.http.post<Medidor>(`${this.API_BASE}/medidores`, this.toMeterRequest(meter));
  }
  updateMedidor(id: string, meter: Medidor): Observable<Medidor> {
    return this.http.put<Medidor>(`${this.API_BASE}/medidores/${id}`, this.toMeterRequest(meter));
  }
  deleteMedidor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE}/medidores/${id}`);
  }
  getTarifas(): Observable<Tarifa[]> {
    return this.http.get<Tarifa[]>(`${this.API_BASE}/tarifas`);
  }
  createTarifa(tariff: Tarifa): Observable<Tarifa> {
    return this.http.post<Tarifa>(`${this.API_BASE}/tarifas`, this.toTariffRequest(tariff));
  }
  updateTarifa(id: string, tariff: Tarifa): Observable<Tarifa> {
    return this.http.put<Tarifa>(`${this.API_BASE}/tarifas/${id}`, this.toTariffRequest(tariff));
  }
  deleteTarifa(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE}/tarifas/${id}`);
  }
  getReadingHistory(filters: { page: number; size: number; servicio?: string; propiedad?: string; desde?: string; hasta?: string; q?: string }): Observable<ApiPage<ReadingHistory>> {
    let params = new HttpParams().set('page', filters.page).set('size', filters.size);
    for (const key of ['servicio', 'propiedad', 'desde', 'hasta', 'q'] as const) {
      const value = filters[key];
      if (value) params = params.set(key, value);
    }
    return this.http.get<ApiPage<ReadingHistory>>(`${this.API_BASE}/lecturas`, { params });
  }

  // --- Staff ---
  getStaff(): Observable<Staff[]> {
    return this.http.get<Staff[]>(`${this.API_BASE}/staff`);
  }
  createStaff(s: Staff): Observable<Staff> {
    return this.http.post<Staff>(`${this.API_BASE}/staff`, this.toStaffRequest(s));
  }
  updateStaff(id: string, s: Staff): Observable<Staff> {
    return this.http.put<Staff>(`${this.API_BASE}/staff/${id}`, this.toStaffRequest(s));
  }
  deleteStaff(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE}/staff/${id}`);
  }
  getPendingOwnerRegistrations(): Observable<PendingOwnerRegistration[]> {
    return this.http.get<PendingOwnerRegistration[]>(`${this.API_BASE}/owner-registrations`);
  }
  approveOwnerRegistration(id: string, idPropiedad: string): Observable<void> {
    return this.http.post<void>(`${this.API_BASE}/owner-registrations/${id}/approve`, { idPropiedad });
  }
  rejectOwnerRegistration(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE}/owner-registrations/${id}`);
  }

  // --- Facturación ---
  getFacturas(): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${this.API_BASE}/facturas`);
  }
  generarFacturasMes(): Observable<void> {
    return this.http.post<void>(`${this.API_BASE}/facturas/generar-mes`, {});
  }
  updateFacturaEstado(id: string, estado: 'Pagado' | 'Pendiente'): Observable<Factura> {
    return this.http.patch<Factura>(`${this.API_BASE}/facturas/${id}`, { estado });
  }

  private toPropiedadRequest(property: Propiedad) {
    return {
      codigoInterno: property.codigoInterno,
      numeroCasa: property.numeroCasa,
      manzana: property.manzana ?? null,
      sector: property.sector ?? null,
      estatus: property.estatus,
      idPersonaResponsable: property.idPersonaResponsable ?? null
    };
  }

  private toStaffRequest(staff: Staff) {
    return {
      username: staff.username,
      nombre: staff.nombre,
      rol: staff.rol,
      estado: staff.estado,
      ...(staff.password ? { password: staff.password } : {})
    };
  }

  private toMeterRequest(meter: Medidor) {
    return {
      idPropiedad: meter.idPropiedad,
      idTarifa: meter.idTarifa || null,
      tipoServicio: meter.tipoServicio,
      numeroSerie: meter.numeroSerie,
      marcaModelo: meter.marcaModelo ?? null,
      lecturaInicial: meter.lecturaInicial
    };
  }

  private toTariffRequest(tariff: Tarifa) {
    return {
      tipoServicio: tariff.tipoServicio,
      precioUnidad: tariff.precioUnidad,
      cargoFijo: tariff.cargoFijo,
      vigenciaDesde: tariff.vigenciaDesde,
      vigenciaHasta: tariff.vigenciaHasta || null,
      descripcion: tariff.descripcion ?? null
    };
  }
}
