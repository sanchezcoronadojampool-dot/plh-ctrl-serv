package com.condominio.api.service;

import com.condominio.api.dto.*;
import com.condominio.api.exception.ResourceNotFoundException;
import com.condominio.api.model.*;
import com.condominio.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LecturaService {
    private final LecturaRepository lecturaRepository;
    private final MedidorRepository medidorRepository;
    private final PropiedadRepository propiedadRepository;
    private final PropiedadPersonasRepository propiedadPersonasRepository;
    private final StaffRepository staffRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<ReadingHistoryResponse> historial(
        Pageable pageable,
        String service,
        UUID propertyId,
        LocalDate from,
        LocalDate to,
        String query
    ) {
        if (from != null && to != null && to.isBefore(from)) {
            throw new IllegalArgumentException("La fecha hasta no puede ser anterior a la fecha desde.");
        }
        if (LocalDate.MAX.equals(to)) {
            throw new IllegalArgumentException("La fecha hasta no es válida.");
        }
        if (query != null && query.length() > 120) {
            throw new IllegalArgumentException("La búsqueda no puede superar 120 caracteres.");
        }
        if (service != null && !service.isBlank()
            && !service.trim().equalsIgnoreCase("agua") && !service.trim().equalsIgnoreCase("luz")) {
            throw new IllegalArgumentException("El servicio debe ser agua o luz.");
        }
        String normalizedService = service == null || service.isBlank()
            ? ""
            : service.trim().toLowerCase(Locale.ROOT);
        String search = query == null || query.isBlank()
            ? ""
            : "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
        LocalDateTime defaultDate = LocalDate.of(2000, 1, 1).atStartOfDay();
        return lecturaRepository.findHistory(
            normalizedService,
            propertyId != null,
            propertyId == null ? new UUID(0, 0) : propertyId,
            from != null,
            from == null ? defaultDate : from.atStartOfDay(),
            to != null,
            to == null ? defaultDate : to.plusDays(1).atStartOfDay(),
            search,
            pageable
        ).map(lectura -> new ReadingHistoryResponse(
            lectura.getIdLectura(),
            lectura.getMedidor().getPropiedad().getNumeroCasa(),
            lectura.getMedidor().getTipoServicio(),
            lectura.getMedidor().getNumeroSerie(),
            lectura.getValorLectura(),
            lectura.getFechaLectura(),
            lectura.getStaff().getNombre() == null || lectura.getStaff().getNombre().isBlank()
                ? lectura.getStaff().getUsername()
                : lectura.getStaff().getNombre(),
            lectura.getFotoEvidenciaUrl(),
            lectura.getCoordenadasCaptura(),
            lectura.getObservaciones()
        ));
    }

    @Transactional(readOnly = true)
    public MedidorInfoResponse obtenerInformacionMedidor(UUID idMedidor) {
        Medidor medidor = medidorRepository.findById(idMedidor)
            .orElseThrow(() -> new ResourceNotFoundException("Medidor no encontrado."));
        return toMedidorInfo(medidor);
    }

    /**
     * Permite al personal localizar un medidor tecleando su número de serie,
     * útil cuando el QR está dañado o ilegible.
     */
    @Transactional(readOnly = true)
    public MedidorInfoResponse obtenerInformacionMedidorPorSerie(String numeroSerie) {
        String serie = numeroSerie == null ? "" : numeroSerie.trim();
        if (serie.isEmpty()) {
            throw new IllegalArgumentException("El número de serie es requerido.");
        }
        Medidor medidor = medidorRepository.findByNumeroSerieIgnoreCase(serie)
            .orElseThrow(() -> new ResourceNotFoundException("No existe un medidor con ese número de serie."));
        return toMedidorInfo(medidor);
    }

    private MedidorInfoResponse toMedidorInfo(Medidor medidor) {
        var ultimaLectura = lecturaRepository
            .findFirstByMedidor_IdMedidorOrderByFechaLecturaDesc(medidor.getIdMedidor());
        BigDecimal valor = ultimaLectura.isPresent() ? ultimaLectura.get().getValorLectura() : BigDecimal.ZERO;

        String propietario = propiedadPersonasRepository
            .findFirstByPropiedad_IdPropiedadAndEsResponsablePagoTrue(medidor.getPropiedad().getIdPropiedad())
            .map(PropiedadPersona::getPersona)
            .map(persona -> (persona.getNombre() + " " + persona.getApellidoPaterno()).trim())
            .orElse("Sin asignar");

        return new MedidorInfoResponse(
            medidor.getIdMedidor(),
            medidor.getPropiedad().getNumeroCasa(),
            medidor.getTipoServicio(),
            valor,
            propietario
        );
    }

    @Transactional(readOnly = true)
    public PropiedadMedidoresResponse obtenerMedidoresDePropiedad(UUID idPropiedad) {
        Propiedad propiedad = propiedadRepository.findById(idPropiedad)
            .orElseThrow(() -> new ResourceNotFoundException("Propiedad no encontrada."));
        var medidores = medidorRepository
            .findAllByPropiedad_IdPropiedadOrderByTipoServicioAscNumeroSerieAsc(idPropiedad)
            .stream()
            .map(medidor -> new PropiedadMedidoresResponse.MedidorOpcion(
                medidor.getIdMedidor(),
                medidor.getTipoServicio(),
                medidor.getNumeroSerie()
            ))
            .toList();
        return new PropiedadMedidoresResponse(
            propiedad.getIdPropiedad(),
            propiedad.getCodigoInterno(),
            propiedad.getNumeroCasa(),
            medidores
        );
    }

    @Transactional
    public Lectura registrarLectura(LecturaRequest request, String username) {
        validateEvidence(request.fotoUrl());
        validateCoordinates(request.gps());
        Medidor medidor = medidorRepository.findById(request.idMedidor())
            .orElseThrow(() -> new ResourceNotFoundException("Medidor no encontrado."));
        Staff staff = staffRepository.findByUsernameIgnoreCase(username)
            .filter(Staff::isActivo)
            .orElseThrow(() -> new ResourceNotFoundException("La cuenta de personal no está activa."));

        var ultimaLecturaOpt = lecturaRepository
            .findFirstByMedidor_IdMedidorOrderByFechaLecturaDesc(medidor.getIdMedidor());
        if (ultimaLecturaOpt.isPresent()) {
            BigDecimal ultima = ultimaLecturaOpt.get().getValorLectura();
            if (request.valorLectura().compareTo(ultima) < 0) {
                throw new IllegalArgumentException("La lectura actual (" + request.valorLectura() + ") no puede ser menor a la anterior (" + ultima + ")");
            }
        }

        Lectura nuevaLectura = Lectura.builder()
            .medidor(medidor)
            .staff(staff)
            .valorLectura(request.valorLectura())
            .fotoEvidenciaUrl(blankToNull(request.fotoUrl()))
            .coordenadasCaptura(blankToNull(request.gps()))
            .observaciones(blankToNull(request.observaciones()))
            .build();

        Lectura saved = lecturaRepository.save(nuevaLectura);
        notificationService.create(
            "READING_REGISTERED",
            "Nueva lectura registrada",
            "Se registró una lectura para la casa " + medidor.getPropiedad().getNumeroCasa()
                + " (" + medidor.getTipoServicio() + ").",
            "/admin"
        );
        return saved;
    }

    private static void validateEvidence(String evidenceUrl) {
        if (evidenceUrl == null || evidenceUrl.isBlank()) return;
        try {
            URI uri = URI.create(evidenceUrl.trim());
            if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                || uri.getHost() == null) {
                throw new IllegalArgumentException();
            }
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("La evidencia debe ser una dirección web HTTP o HTTPS válida.");
        }
    }

    private static void validateCoordinates(String coordinates) {
        if (coordinates == null || coordinates.isBlank()) return;
        String[] values = coordinates.split(",", -1);
        try {
            if (values.length != 2) throw new NumberFormatException();
            double latitude = Double.parseDouble(values[0].trim());
            double longitude = Double.parseDouble(values[1].trim());
            if (!Double.isFinite(latitude) || !Double.isFinite(longitude)
                || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                throw new NumberFormatException();
            }
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Las coordenadas GPS deben tener el formato latitud,longitud válido.");
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
