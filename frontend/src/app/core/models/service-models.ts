export interface Persona {
    idPersona: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    documentoIdentidad: string;
    telefonoPrincipal: string;
    correoElectronico?: string;
    estatusCuenta: 'ACTIVO' | 'SUSPENDIDO' | 'MOROSO';
}

export interface Propiedad {
    idPropiedad: string;
    codigoInterno: string;
    numeroCasa: string;
    manzana?: string;
    sector?: string;
    estatusOcupacion: 'ocupada' | 'vacia' | 'en_mantenimiento';
}

export interface Medidor {
    idMedidor: string;
    idPropiedad: string;
    tipoServicio: 'agua' | 'luz';
    numeroSerie: string;
    lecturaInicial: number;
}

export interface Lectura {
    idLectura: string;
    idMedidor: string;
    idStaff: string;
    valorLectura: number;
    fechaLectura: string; // ISO Date string
    fotoEvidenciaUrl?: string;
    coordenadasCaptura?: string;
    observaciones?: string;
}

export interface Factura {
    idFactura: string;
    idLectura: string;
    idPropiedad: string;
    idPersonaCobro: string;
    consumoPeriodo: number;
    montoSubtotal: number;
    montoCargoFijo: number;
    montoTotal: number;
    fechaEmision: string;
    fechaVencimiento: string;
    estatusPago: 'pendiente' | 'pagado' | 'anulado' | 'vencido';
    metodoPago?: string;
}

// DTOs para peticiones específicas
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
