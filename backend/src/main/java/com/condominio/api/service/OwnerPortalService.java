package com.condominio.api.service;

import com.condominio.api.dto.OwnerMeterResponse;
import com.condominio.api.dto.OwnerPortalResponse;
import com.condominio.api.dto.OwnerPropertyResponse;
import com.condominio.api.dto.OwnerReadingResponse;
import com.condominio.api.exception.ResourceNotFoundException;
import com.condominio.api.model.Factura;
import com.condominio.api.model.Lectura;
import com.condominio.api.model.Medidor;
import com.condominio.api.model.PropiedadPersona;
import com.condominio.api.repository.FacturaRepository;
import com.condominio.api.repository.LecturaRepository;
import com.condominio.api.repository.MedidorRepository;
import com.condominio.api.repository.PropiedadPersonasRepository;
import com.condominio.api.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OwnerPortalService {
    private final StaffRepository staffRepository;
    private final PropiedadPersonasRepository propiedadPersonasRepository;
    private final MedidorRepository medidorRepository;
    private final LecturaRepository lecturaRepository;
    private final FacturaRepository facturaRepository;
    private final FacturaMapper facturaMapper;

    @Transactional(readOnly = true)
    public OwnerPortalResponse overview(String username) {
        var staff = staffRepository.findByUsernameIgnoreCase(username)
            .filter(account -> account.isActivo() && account.getPersona() != null)
            .orElseThrow(() -> new ResourceNotFoundException("La cuenta de propietario no está activa."));
        List<PropiedadPersona> relations =
            propiedadPersonasRepository.findAllByPersona_IdPersona(staff.getPersona().getIdPersona());
        List<UUID> propertyIds = relations.stream()
            .map(relation -> relation.getPropiedad().getIdPropiedad())
            .distinct()
            .toList();
        List<Medidor> meters = propertyIds.isEmpty()
            ? List.of()
            : medidorRepository.findAllByPropiedad_IdPropiedadIn(propertyIds);
        List<UUID> meterIds = meters.stream().map(Medidor::getIdMedidor).toList();
        Map<UUID, List<OwnerMeterResponse>> metersByProperty = meters.stream()
            .collect(Collectors.groupingBy(
                meter -> meter.getPropiedad().getIdPropiedad(),
                Collectors.mapping(meter -> new OwnerMeterResponse(
                    meter.getIdMedidor(),
                    meter.getTipoServicio(),
                    meter.getNumeroSerie(),
                    meter.getPropiedad().getNumeroCasa()
                ), Collectors.toList())
            ));

        List<OwnerPropertyResponse> properties = relations.stream()
            .map(PropiedadPersona::getPropiedad)
            .distinct()
            .map(property -> new OwnerPropertyResponse(
                property.getIdPropiedad(),
                property.getCodigoInterno(),
                property.getNumeroCasa(),
                property.getManzana(),
                property.getSector(),
                metersByProperty.getOrDefault(property.getIdPropiedad(), List.of())
            ))
            .toList();

        List<OwnerReadingResponse> readings = meterIds.isEmpty()
            ? List.of()
            : lecturaRepository.findAllByMedidor_IdMedidorInOrderByFechaLecturaDesc(meterIds).stream()
                .map(this::toReadingResponse)
                .toList();
        List<com.condominio.api.dto.FacturaResponse> invoices = propertyIds.isEmpty()
            ? List.of()
            : facturaRepository.findAllByPropiedad_IdPropiedadInOrderByFechaEmisionDesc(propertyIds).stream()
                .map(facturaMapper::toResponse)
                .toList();
        return new OwnerPortalResponse(properties, readings, invoices);
    }

    private OwnerReadingResponse toReadingResponse(Lectura reading) {
        return new OwnerReadingResponse(
            reading.getIdLectura(),
            reading.getMedidor().getPropiedad().getNumeroCasa(),
            reading.getMedidor().getTipoServicio(),
            reading.getValorLectura(),
            reading.getFechaLectura()
        );
    }
}
