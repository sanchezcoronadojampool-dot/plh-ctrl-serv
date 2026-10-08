package com.condominio.api.service;

import com.condominio.api.dto.PersonaOption;
import com.condominio.api.dto.PropiedadRequest;
import com.condominio.api.dto.PropiedadResponse;
import com.condominio.api.exception.ConflictException;
import com.condominio.api.exception.ResourceNotFoundException;
import com.condominio.api.model.Persona;
import com.condominio.api.model.Propiedad;
import com.condominio.api.model.PropiedadPersona;
import com.condominio.api.model.PropiedadPersonaId;
import com.condominio.api.model.RolPropiedad;
import com.condominio.api.repository.MedidorRepository;
import com.condominio.api.repository.PersonaRepository;
import com.condominio.api.repository.PropiedadPersonasRepository;
import com.condominio.api.repository.PropiedadRepository;
import com.condominio.api.repository.RolPropiedadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PropiedadAdminService {
    private final PropiedadRepository propiedadRepository;
    private final PersonaRepository personaRepository;
    private final PropiedadPersonasRepository propiedadPersonasRepository;
    private final RolPropiedadRepository rolPropiedadRepository;
    private final MedidorRepository medidorRepository;

    @Transactional(readOnly = true)
    public List<PropiedadResponse> listar() {
        return propiedadRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PersonaOption> listarPersonas() {
        return personaRepository.findAll().stream()
            .map(persona -> new PersonaOption(persona.getIdPersona(), nombrePersona(persona)))
            .sorted((first, second) -> first.nombre().compareToIgnoreCase(second.nombre()))
            .toList();
    }

    @Transactional
    public PropiedadResponse crear(PropiedadRequest request) {
        Propiedad propiedad = new Propiedad();
        aplicarCambios(propiedad, request);
        Propiedad saved = propiedadRepository.saveAndFlush(propiedad);
        actualizarResponsable(saved, request.idPersonaResponsable());
        return toResponse(saved);
    }

    @Transactional
    public PropiedadResponse actualizar(UUID id, PropiedadRequest request) {
        Propiedad propiedad = propiedadRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Propiedad no encontrada."));
        aplicarCambios(propiedad, request);
        actualizarResponsable(propiedad, request.idPersonaResponsable());
        return toResponse(propiedadRepository.save(propiedad));
    }

    @Transactional
    public void eliminar(UUID id) {
        Propiedad propiedad = propiedadRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Propiedad no encontrada."));
        if (medidorRepository.existsByPropiedad_IdPropiedad(id)) {
            throw new ConflictException("No se puede eliminar una propiedad que tiene medidores asociados.");
        }
        propiedadRepository.delete(propiedad);
    }

    private void aplicarCambios(Propiedad propiedad, PropiedadRequest request) {
        propiedad.setCodigoInterno(request.codigoInterno().trim());
        propiedad.setNumeroCasa(request.numeroCasa().trim());
        propiedad.setManzana(blankToNull(request.manzana()));
        propiedad.setSector(blankToNull(request.sector()));
        propiedad.setEstatusOcupacion(normalizarEstado(request.estatus()));
    }

    private void actualizarResponsable(Propiedad propiedad, UUID idPersonaResponsable) {
        List<PropiedadPersona> relaciones = propiedadPersonasRepository
            .findAllByPropiedad_IdPropiedad(propiedad.getIdPropiedad());
        PropiedadPersona responsableActual = null;
        for (PropiedadPersona relacion : relaciones) {
            boolean responsable = idPersonaResponsable != null
                && relacion.getPersona().getIdPersona().equals(idPersonaResponsable);
            relacion.setEsResponsablePago(responsable);
            if (responsable) {
                responsableActual = relacion;
            }
        }
        propiedadPersonasRepository.saveAll(relaciones);

        if (idPersonaResponsable == null || responsableActual != null) {
            return;
        }
        Persona persona = personaRepository.findById(idPersonaResponsable)
            .orElseThrow(() -> new ResourceNotFoundException("La persona responsable no existe."));
        RolPropiedad rol = rolPropiedadRepository.findByDescripcionIgnoreCase("propietario")
            .orElseGet(() -> rolPropiedadRepository.save(RolPropiedad.builder().descripcion("propietario").build()));
        PropiedadPersona relacion = PropiedadPersona.builder()
            .id(new PropiedadPersonaId(propiedad.getIdPropiedad(), persona.getIdPersona()))
            .propiedad(propiedad)
            .persona(persona)
            .rol(rol)
            .fechaVinculo(LocalDate.now())
            .esResponsablePago(true)
            .build();
        propiedadPersonasRepository.save(relacion);
    }

    private PropiedadResponse toResponse(Propiedad propiedad) {
        PropiedadPersona responsable = propiedadPersonasRepository
            .findFirstByPropiedad_IdPropiedadAndEsResponsablePagoTrue(propiedad.getIdPropiedad())
            .orElse(null);
        return new PropiedadResponse(
            propiedad.getIdPropiedad(),
            propiedad.getCodigoInterno(),
            propiedad.getNumeroCasa(),
            responsable == null ? null : responsable.getPersona().getIdPersona(),
            responsable == null ? "" : nombrePersona(responsable.getPersona()),
            mostrarEstado(propiedad.getEstatusOcupacion())
        );
    }

    private static String nombrePersona(Persona persona) {
        return String.join(" ", List.of(
            persona.getNombre(),
            persona.getApellidoPaterno(),
            persona.getApellidoMaterno() == null ? "" : persona.getApellidoMaterno()
        )).trim().replaceAll("\\s+", " ");
    }

    private static String normalizarEstado(String estado) {
        String normalized = estado.trim().toLowerCase();
        if (normalized.startsWith("vac")) return "vacia";
        if (normalized.startsWith("en ") || normalized.startsWith("en_")) return "en_mantenimiento";
        return "ocupada";
    }

    private static String mostrarEstado(String estado) {
        if (estado == null) return "Vacía";
        return estado.equalsIgnoreCase("ocupada") ? "Ocupada"
            : estado.equalsIgnoreCase("en_mantenimiento") ? "En mantenimiento"
            : "Vacía";
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
