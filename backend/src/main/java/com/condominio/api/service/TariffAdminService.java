package com.condominio.api.service;

import com.condominio.api.dto.TarifaRequest;
import com.condominio.api.dto.TarifaResponse;
import com.condominio.api.exception.ConflictException;
import com.condominio.api.exception.ResourceNotFoundException;
import com.condominio.api.model.Tarifa;
import com.condominio.api.repository.MedidorRepository;
import com.condominio.api.repository.TarifaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TariffAdminService {
    private final TarifaRepository tarifaRepository;
    private final MedidorRepository medidorRepository;

    @Transactional(readOnly = true)
    public List<TarifaResponse> list() {
        return tarifaRepository.findAllByOrderByTipoServicioAscVigenciaDesdeDesc().stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public TarifaResponse create(TarifaRequest request) {
        validate(request, null);
        Tarifa tariff = new Tarifa();
        apply(tariff, request);
        return toResponse(tarifaRepository.save(tariff));
    }

    @Transactional
    public TarifaResponse update(UUID id, TarifaRequest request) {
        Tarifa tariff = tarifaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("La tarifa no existe."));
        validate(request, id);
        apply(tariff, request);
        return toResponse(tarifaRepository.save(tariff));
    }

    @Transactional
    public void delete(UUID id) {
        Tarifa tariff = tarifaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("La tarifa no existe."));
        if (medidorRepository.existsByTarifa_IdTarifa(id)) {
            throw new ConflictException("La tarifa está asignada a medidores y no se puede eliminar.");
        }
        tarifaRepository.delete(tariff);
    }

    private void validate(TarifaRequest request, UUID excludedId) {
        String service = request.tipoServicio().trim().toLowerCase();
        if (!service.equals("agua") && !service.equals("luz")) {
            throw new IllegalArgumentException("El servicio de la tarifa debe ser agua o luz.");
        }
        if (request.vigenciaHasta() != null && request.vigenciaHasta().isBefore(request.vigenciaDesde())) {
            throw new IllegalArgumentException("La vigencia hasta no puede ser anterior a la fecha desde.");
        }
        LocalDate requestedEnd = request.vigenciaHasta() == null ? LocalDate.MAX : request.vigenciaHasta();
        boolean overlaps = tarifaRepository.findAllByTipoServicioIgnoreCase(service).stream()
            .filter(existing -> !existing.getIdTarifa().equals(excludedId))
            .anyMatch(existing -> {
                LocalDate existingEnd = existing.getVigenciaHasta() == null
                    ? LocalDate.MAX : existing.getVigenciaHasta();
                return !existingEnd.isBefore(request.vigenciaDesde())
                    && !requestedEnd.isBefore(existing.getVigenciaDesde());
            });
        if (overlaps) {
            throw new ConflictException("La vigencia se solapa con otra tarifa del mismo servicio.");
        }
    }

    private void apply(Tarifa tariff, TarifaRequest request) {
        tariff.setTipoServicio(request.tipoServicio().trim().toLowerCase());
        tariff.setPrecioUnidad(request.precioUnidad());
        tariff.setCargoFijo(request.cargoFijo());
        tariff.setVigenciaDesde(request.vigenciaDesde());
        tariff.setVigenciaHasta(request.vigenciaHasta());
        tariff.setDescripcion(request.descripcion() == null || request.descripcion().isBlank()
            ? null : request.descripcion().trim());
    }

    private TarifaResponse toResponse(Tarifa tariff) {
        return new TarifaResponse(
            tariff.getIdTarifa(),
            tariff.getTipoServicio(),
            tariff.getPrecioUnidad(),
            tariff.getCargoFijo(),
            tariff.getVigenciaDesde(),
            tariff.getVigenciaHasta(),
            tariff.getDescripcion()
        );
    }
}
