package com.condominio.api.service;

import com.condominio.api.dto.MedidorRequest;
import com.condominio.api.dto.MedidorResponse;
import com.condominio.api.exception.ConflictException;
import com.condominio.api.exception.ResourceNotFoundException;
import com.condominio.api.model.Medidor;
import com.condominio.api.model.Propiedad;
import com.condominio.api.model.Tarifa;
import com.condominio.api.repository.LecturaRepository;
import com.condominio.api.repository.MedidorRepository;
import com.condominio.api.repository.PropiedadRepository;
import com.condominio.api.repository.TarifaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MeterAdminService {
    private final MedidorRepository medidorRepository;
    private final PropiedadRepository propiedadRepository;
    private final TarifaRepository tarifaRepository;
    private final LecturaRepository lecturaRepository;

    @Transactional(readOnly = true)
    public List<MedidorResponse> list() {
        return medidorRepository.findAllByOrderByNumeroSerieAsc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public MedidorResponse create(MedidorRequest request) {
        Medidor meter = new Medidor();
        apply(meter, request);
        return toResponse(medidorRepository.save(meter));
    }

    @Transactional
    public MedidorResponse update(UUID id, MedidorRequest request) {
        Medidor meter = medidorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("El medidor no existe."));
        if (lecturaRepository.existsByMedidor_IdMedidor(id)
            && (!meter.getTipoServicio().equalsIgnoreCase(request.tipoServicio())
                || !meter.getPropiedad().getIdPropiedad().equals(request.idPropiedad())
                || meter.getLecturaInicial().compareTo(request.lecturaInicial()) != 0)) {
            throw new ConflictException(
                "No se puede cambiar el servicio, inmueble o lectura inicial de un medidor con lecturas históricas."
            );
        }
        apply(meter, request);
        return toResponse(medidorRepository.save(meter));
    }

    @Transactional
    public void delete(UUID id) {
        Medidor meter = medidorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("El medidor no existe."));
        if (lecturaRepository.existsByMedidor_IdMedidor(id)) {
            throw new ConflictException("El medidor tiene lecturas históricas y no se puede eliminar.");
        }
        medidorRepository.delete(meter);
    }

    private void apply(Medidor meter, MedidorRequest request) {
        String service = request.tipoServicio().trim().toLowerCase();
        if (!service.equals("agua") && !service.equals("luz")) {
            throw new IllegalArgumentException("El servicio debe ser agua o luz.");
        }
        String serial = request.numeroSerie().trim();
        boolean duplicateSerial = meter.getIdMedidor() == null
            ? medidorRepository.existsByNumeroSerieIgnoreCase(serial)
            : medidorRepository.existsByNumeroSerieIgnoreCaseAndIdMedidorNot(serial, meter.getIdMedidor());
        if (duplicateSerial) {
            throw new ConflictException("Ya existe un medidor con ese número de serie.");
        }
        Propiedad property = propiedadRepository.findById(request.idPropiedad())
            .orElseThrow(() -> new ResourceNotFoundException("El inmueble seleccionado no existe."));
        Tarifa tariff = request.idTarifa() == null ? null : tarifaRepository.findById(request.idTarifa())
            .orElseThrow(() -> new ResourceNotFoundException("La tarifa seleccionada no existe."));
        if (tariff != null && !tariff.getTipoServicio().equalsIgnoreCase(service)) {
            throw new ConflictException("La tarifa seleccionada no corresponde al servicio del medidor.");
        }
        meter.setPropiedad(property);
        meter.setTarifa(tariff);
        meter.setTipoServicio(service);
        meter.setNumeroSerie(serial);
        meter.setMarcaModelo(blankToNull(request.marcaModelo()));
        meter.setLecturaInicial(request.lecturaInicial());
    }

    private MedidorResponse toResponse(Medidor meter) {
        return new MedidorResponse(
            meter.getIdMedidor(),
            meter.getPropiedad().getIdPropiedad(),
            meter.getPropiedad().getNumeroCasa(),
            meter.getTarifa() == null ? null : meter.getTarifa().getIdTarifa(),
            meter.getTarifa() == null ? null : meter.getTarifa().getDescripcion(),
            meter.getTipoServicio(),
            meter.getNumeroSerie(),
            meter.getMarcaModelo(),
            meter.getLecturaInicial()
        );
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
