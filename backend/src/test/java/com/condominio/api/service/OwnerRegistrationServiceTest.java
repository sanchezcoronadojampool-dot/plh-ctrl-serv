package com.condominio.api.service;

import com.condominio.api.dto.OwnerApprovalRequest;
import com.condominio.api.dto.OwnerRegistrationRequest;
import com.condominio.api.exception.ConflictException;
import com.condominio.api.model.OwnerRegistration;
import com.condominio.api.model.Persona;
import com.condominio.api.model.Propiedad;
import com.condominio.api.model.RolPropiedad;
import com.condominio.api.repository.OwnerRegistrationRepository;
import com.condominio.api.repository.PersonaRepository;
import com.condominio.api.repository.PropiedadPersonasRepository;
import com.condominio.api.repository.PropiedadRepository;
import com.condominio.api.repository.RolPropiedadRepository;
import com.condominio.api.repository.StaffRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OwnerRegistrationServiceTest {
    private final OwnerRegistrationRepository registrationRepository = mock(OwnerRegistrationRepository.class);
    private final StaffRepository staffRepository = mock(StaffRepository.class);
    private final NotificationService notificationService = mock(NotificationService.class);
    private final OwnerDecisionEmailService ownerDecisionEmailService = mock(OwnerDecisionEmailService.class);
    private final PersonaRepository personaRepository = mock(PersonaRepository.class);
    private final PropiedadRepository propiedadRepository = mock(PropiedadRepository.class);
    private final PropiedadPersonasRepository propiedadPersonasRepository = mock(PropiedadPersonasRepository.class);
    private final RolPropiedadRepository rolPropiedadRepository = mock(RolPropiedadRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final OwnerRegistrationService service = new OwnerRegistrationService(
        registrationRepository,
        staffRepository,
        notificationService,
        ownerDecisionEmailService,
        personaRepository,
        propiedadRepository,
        propiedadPersonasRepository,
        rolPropiedadRepository,
        passwordEncoder
    );

    @BeforeEach
    void resetMocks() {
        org.mockito.Mockito.reset(
            registrationRepository,
            staffRepository,
            notificationService,
            ownerDecisionEmailService,
            personaRepository,
            propiedadRepository,
            propiedadPersonasRepository,
            rolPropiedadRepository,
            passwordEncoder
        );
    }

    @Test
    void storesOnlyPasswordHashForPublicRegistration() {
        when(passwordEncoder.encode("StrongPassword123")).thenReturn("$2a$hashed");
        when(registrationRepository.save(any(OwnerRegistration.class))).thenAnswer(invocation -> {
            OwnerRegistration registration = invocation.getArgument(0);
            registration.setId(UUID.randomUUID());
            return registration;
        });

        var response = service.register(new OwnerRegistrationRequest(
            " Ana ", " Pérez ", "", "DOC-10", " 555 1234 ", "", " ana ", "StrongPassword123", " A-12 "
        ));

        var captor = org.mockito.ArgumentCaptor.forClass(OwnerRegistration.class);
        verify(registrationRepository).save(captor.capture());
        assertEquals("$2a$hashed", captor.getValue().getPasswordHash());
        assertEquals("ana", response.username());
        assertEquals("A-12", response.inmueble());
        assertEquals("Ana Pérez", response.nombre());
        verify(notificationService).create(
            "OWNER_REGISTRATION",
            "Nueva solicitud de propietario",
            "Ana Pérez solicita acceso para A-12.",
            "/admin/staff"
        );
    }

    @Test
    void refusesDuplicateUsernamesWithoutSavingRequest() {
        when(staffRepository.existsByUsernameIgnoreCase("taken")).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.register(new OwnerRegistrationRequest(
            "Ana", "Pérez", null, "DOC-10", "5551234", null, "taken", "StrongPassword123", "A-12"
        )));

        verify(registrationRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void approvalCreatesOwnerAccountAndPropertyRelationship() {
        UUID requestId = UUID.randomUUID();
        UUID propertyId = UUID.randomUUID();
        UUID personId = UUID.randomUUID();
        OwnerRegistration request = new OwnerRegistration();
        request.setId(requestId);
        request.setNombre("Ana");
        request.setApellidoPaterno("Pérez");
        request.setDocumentoIdentidad("DOC-10");
        request.setUsername("ana");
        request.setPasswordHash("$2a$hashed");
        request.setInmueble("A-12");

        Propiedad property = Propiedad.builder()
            .idPropiedad(propertyId)
            .codigoInterno("A-12")
            .numeroCasa("12")
            .build();
        Persona person = Persona.builder()
            .idPersona(personId)
            .nombre("Ana")
            .apellidoPaterno("Pérez")
            .documentoIdentidad("DOC-10")
            .build();
        RolPropiedad ownerRole = RolPropiedad.builder().descripcion("propietario").build();
        when(registrationRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(propiedadRepository.findById(propertyId)).thenReturn(Optional.of(property));
        when(personaRepository.findByDocumentoIdentidadIgnoreCase("DOC-10")).thenReturn(Optional.of(person));
        when(rolPropiedadRepository.findByDescripcionIgnoreCase("propietario")).thenReturn(Optional.of(ownerRole));

        service.approve(requestId, new OwnerApprovalRequest(propertyId));

        var staffCaptor = org.mockito.ArgumentCaptor.forClass(com.condominio.api.model.Staff.class);
        verify(staffRepository).save(staffCaptor.capture());
        assertEquals("propietario", staffCaptor.getValue().getRolSistema());
        assertEquals(person, staffCaptor.getValue().getPersona());
        var relationCaptor = org.mockito.ArgumentCaptor.forClass(
            com.condominio.api.model.PropiedadPersona.class
        );
        verify(propiedadPersonasRepository).save(relationCaptor.capture());
        assertTrue(relationCaptor.getValue().isEsResponsablePago());
        verify(registrationRepository).delete(request);
        verify(ownerDecisionEmailService).approved(request, "12");
    }

    @Test
    void approvalRejectsPropertyMismatch() {
        UUID requestId = UUID.randomUUID();
        UUID propertyId = UUID.randomUUID();
        OwnerRegistration request = new OwnerRegistration();
        request.setId(requestId);
        request.setInmueble("A-12");
        Propiedad property = Propiedad.builder()
            .idPropiedad(propertyId)
            .codigoInterno("B-24")
            .numeroCasa("24")
            .build();
        when(registrationRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(propiedadRepository.findById(propertyId)).thenReturn(Optional.of(property));

        assertThrows(ConflictException.class,
            () -> service.approve(requestId, new OwnerApprovalRequest(propertyId)));

        verify(staffRepository, never()).save(any());
        verify(registrationRepository, never()).delete(any());
    }
}
