// DTOs compartidos por el flujo operativo de lecturas (staff).
// Las interfaces de administración viven en admin-api.service.ts.

/** Respuesta de POST /api/lecturas/registrar. */
export interface LecturaRegistrada {
    idLectura: string;
    idMedidor: string;
    valorLectura: number;
    fechaLectura: string; // ISO Date string
}

export interface LecturaRequest {
    idMedidor: string;
    valorLectura: number;
    fotoUrl?: string;
    gps?: string;
    observaciones?: string;
}

export interface MedidorInfoResponse {
    idMedidor: string;
    numeroCasa: string;
    tipoServicio: string;
    ultimaLectura: number;
    propietario: string;
}

export interface PropiedadMedidoresResponse {
    idPropiedad: string;
    codigoInterno: string;
    numeroCasa: string;
    medidores: {
        idMedidor: string;
        tipoServicio: string;
        numeroSerie: string;
    }[];
}
