package com.condominio.api.service;

import com.condominio.api.dto.OwnerApprovalRequest;
import com.condominio.api.dto.OwnerRegistrationRequest;
import com.condominio.api.dto.OwnerRegistrationResponse;
import com.condominio.api.exception.ConflictException;
import com.condominio.api.exception.ResourceNotFoundException;
import com.condominio.api.model.OwnerRegistration;
import com.condominio.api.model.Persona;
import com.condominio.api.model.Propiedad;
import com.condominio.api.model.PropiedadPersona;
import com.condominio.api.model.PropiedadPersonaId;
import com.condominio.api.model.RolPropiedad;
import com.condominio.api.model.Staff;
import com.condominio.api.repository.OwnerRegistrationRepository;
import com.condominio.api.repository.PersonaRepository;
import com.condominio.api.repository.PropiedadPersonasRepository;
import com.condominio.api.repository.PropiedadRepository;
import com.condominio.api.repository.RolPropiedadRepository;
import com.condominio.api.repository.StaffRepository;
import com.condominio.api.util.PasswordPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OwnerRegistrationService {
    private final OwnerRegistrationRepository registrationRepository;
    private final StaffRepository staffRepository;
    private final NotificationService notificationService;
    private final OwnerDecisionEmailService ownerDecisionEmailService;
    private final PersonaRepository personaRepository;
    private final PropiedadRepository propiedadRepository;
    private final PropiedadPersonasRepository propiedadPersonasRepository;
    private final RolPropiedadRepository rolPropiedadRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public OwnerRegistrationResponse register(OwnerRegistrationRequest request) {
        String username = request.username().trim();
        String document = request.documentoIdentidad().trim();
        if (username.length() < 3 || username.length() > 50) {
            throw new IllegalArgumentException("El usuario debe tener entre 3 y 50 caracteres.");
        }
        PasswordPolicy.validate(request.password());
        if (staffRepository.existsByUsernameIgnoreCase(username)
            || registrationRepository.existsByUsernameIgnoreCase(username)) {
            throw new ConflictException("Ese nombre de usuario ya está registrado.");
        }
        if (registrationRepository.existsByDocumentoIdentidadIgnoreCase(document)) {
            throw new ConflictException("Ya hay una solicitud pendiente con ese documento.");
        }

        OwnerRegistration registration = new OwnerRegistration();
        registration.setNombre(request.nombre().trim());
        registration.setApellidoPaterno(request.apellidoPaterno().trim());
        registration.setApellidoMaterno(blankToNull(request.apellidoMaterno()));
        registration.setDocumentoIdentidad(document);
        registration.setTelefono(request.telefono().trim());
        registration.setCorreoElectronico(blankToNull(request.correoElectronico()));
        registration.setUsername(username);
        registration.setPasswordHash(passwordEncoder.encode(request.password()));
        registration.setInmueble(request.inmueble().trim());
        OwnerRegistration saved = registrationRepository.save(registration);
        notificationService.create(
            "OWNER_REGISTRATION",
            "Nueva solicitud de propietario",
            saved.getNombre() + " " + saved.getApellidoPaterno() + " solicita acceso para " + saved.getInmueble() + ".",
            "/admin/staff"
        );
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OwnerRegistrationResponse> listPending() {
        return registrationRepository.findAllByOrderByFechaSolicitudAsc().stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public void approve(java.util.UUID id, OwnerApprovalRequest request) {
        OwnerRegistration registration = registrationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("La solicitud ya no está disponible."));
        Propiedad property = propiedadRepository.findById(request.idPropiedad())
            .orElseThrow(() -> new ResourceNotFoundException("El inmueble seleccionado no existe."));
        if (!registration.getInmueble().equalsIgnoreCase(property.getCodigoInterno())
            && !registration.getInmueble().equalsIgnoreCase(property.getNumeroCasa())) {
            throw new ConflictException(
                "El identificador indicado por el solicitante no coincide con el inmueble seleccionado."
            );
        }
        if (staffRepository.existsByUsernameIgnoreCase(registration.getUsername())) {
            throw new ConflictException("El nombre de usuario ya pertenece a otra cuenta.");
        }

        Persona persona = personaRepository.findByDocumentoIdentidadIgnoreCase(registration.getDocumentoIdentidad())
            .orElseGet(() -> crearPersona(registration));
        if (staffRepository.existsByPersona_IdPersona(persona.getIdPersona())) {
            throw new ConflictException("Esta persona ya tiene una cuenta asociada.");
        }
        if (registration.getCorreoElectronico() != null) {
            personaRepository.findByCorreoElectronicoIgnoreCase(registration.getCorreoElectronico())
                .filter(existing -> !existing.getIdPersona().equals(persona.getIdPersona()))
                .ifPresent(existing -> {
                    throw new ConflictException("Ese correo ya está asociado a otra persona.");
                });
        }

        if (!propiedadPersonasRepository.existsById(
            new PropiedadPersonaId(property.getIdPropiedad(), persona.getIdPersona())
        )) {
            RolPropiedad ownerRole = rolPropiedadRepository.findByDescripcionIgnoreCase("propietario")
                .orElseGet(() -> rolPropiedadRepository.save(
                    RolPropiedad.builder().descripcion("propietario").build()
                ));
            boolean isResponsibleForPayment = propiedadPersonasRepository
                .findFirstByPropiedad_IdPropiedadAndEsResponsablePagoTrue(property.getIdPropiedad())
                .isEmpty();
            propiedadPersonasRepository.save(PropiedadPersona.builder()
                .id(new PropiedadPersonaId(property.getIdPropiedad(), persona.getIdPersona()))
                .propiedad(property)
                .persona(persona)
                .rol(ownerRole)
                .fechaVinculo(LocalDate.now())
                .esResponsablePago(isResponsibleForPayment)
                .build());
        }

        Staff owner = Staff.builder()
            .persona(persona)
            .username(registration.getUsername())
            .passwordHash(registration.getPasswordHash())
            .rolSistema("propietario")
            .nombre((persona.getNombre() + " " + persona.getApellidoPaterno()).trim())
            .activo(true)
            .build();
        staffRepository.save(owner);
        ownerDecisionEmailService.approved(registration, property.getNumeroCasa());
        registrationRepository.delete(registration);
        notificationService.create(
            "OWNER_REGISTRATION_APPROVED",
            "Solicitud aprobada",
            "Se aprobó el acceso de " + registration.getNombre() + " " + registration.getApellidoPaterno()
                + " para la casa " + property.getNumeroCasa() + ".",
            "/admin/staff"
        );
    }

    @Transactional
    public void reject(java.util.UUID id) {
        OwnerRegistration registration = registrationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("La solicitud ya no está disponible."));
        ownerDecisionEmailService.rejected(registration);
        registrationRepository.delete(registration);
        notificationService.create(
            "OWNER_REGISTRATION_REJECTED",
            "Solicitud rechazada",
            "Se rechazó la solicitud de acceso de " + registration.getNombre() + " "
                + registration.getApellidoPaterno() + ".",
            "/admin/staff"
        );
    }

    private Persona crearPersona(OwnerRegistration registration) {
        Persona persona = Persona.builder()
            .nombre(registration.getNombre())
            .apellidoPaterno(registration.getApellidoPaterno())
            .apellidoMaterno(registration.getApellidoMaterno())
            .documentoIdentidad(registration.getDocumentoIdentidad())
            .telefonoPrincipal(registration.getTelefono())
            .correoElectronico(registration.getCorreoElectronico())
            .estatusCuenta("activo")
            .build();
        return personaRepository.save(persona);
    }

    private OwnerRegistrationResponse toResponse(OwnerRegistration registration) {
        return new OwnerRegistrationResponse(
            registration.getId(),
            (registration.getNombre() + " " + registration.getApellidoPaterno()
                + (registration.getApellidoMaterno() == null ? "" : " " + registration.getApellidoMaterno())).trim(),
            registration.getDocumentoIdentidad(),
            registration.getTelefono(),
            registration.getCorreoElectronico(),
            registration.getUsername(),
            registration.getInmueble(),
            registration.getFechaSolicitud()
        );
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
