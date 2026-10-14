package com.condominio.api.service;

import com.condominio.api.dto.StaffRequest;
import com.condominio.api.dto.StaffResponse;
import com.condominio.api.exception.ConflictException;
import com.condominio.api.exception.ResourceNotFoundException;
import com.condominio.api.model.Staff;
import com.condominio.api.repository.LecturaRepository;
import com.condominio.api.repository.StaffRepository;
import com.condominio.api.util.PasswordPolicy;
import com.condominio.api.util.Roles;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StaffAdminService {
    private final StaffRepository staffRepository;
    private final LecturaRepository lecturaRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<StaffResponse> listar() {
        return staffRepository.findAll().stream()
            .filter(staff -> !Roles.isOwner(staff.getRolSistema()))
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public StaffResponse crear(StaffRequest request) {
        if (staffRepository.existsByUsernameIgnoreCase(request.username().trim())) {
            throw new ConflictException("Ya existe una cuenta con ese usuario.");
        }
        validarPassword(request.password());
        Staff staff = new Staff();
        aplicarCambios(staff, request);
        staff.setPasswordHash(passwordEncoder.encode(request.password()));
        staff.setPasswordVersion(staff.getPasswordVersion() + 1);
        return toResponse(staffRepository.save(staff));
    }

    /**
     * Permite a cualquier cuenta autenticada cambiar su propia contraseña.
     * Al subir passwordVersion se invalidan los demás JWT emitidos para esa cuenta.
     */
    @Transactional
    public void cambiarPasswordPropia(String username, String currentPassword, String newPassword) {
        Staff staff = staffRepository.findByUsernameIgnoreCase(username)
            .filter(Staff::isActivo)
            .orElseThrow(() -> new ResourceNotFoundException("La cuenta no está activa."));
        if (staff.getPasswordHash() == null || !staff.getPasswordHash().startsWith("$2")
            || !passwordEncoder.matches(currentPassword, staff.getPasswordHash())) {
            throw new IllegalArgumentException("La contraseña actual no es correcta.");
        }
        PasswordPolicy.validate(newPassword);
        if (passwordEncoder.matches(newPassword, staff.getPasswordHash())) {
            throw new IllegalArgumentException("La nueva contraseña debe ser distinta de la actual.");
        }
        staff.setPasswordHash(passwordEncoder.encode(newPassword));
        staff.setPasswordVersion(staff.getPasswordVersion() + 1);
        staffRepository.save(staff);
    }

    @Transactional
    public StaffResponse actualizar(UUID id, StaffRequest request, String actorUsername) {
        Staff staff = staffRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("La cuenta de personal no existe."));
        if (staffRepository.existsByUsernameIgnoreCaseAndIdStaffNot(request.username().trim(), id)) {
            throw new ConflictException("Ya existe una cuenta con ese usuario.");
        }
        boolean wasAdmin = Roles.isAdmin(staff.getRolSistema()) && staff.isActivo();
        boolean willBeAdmin = Roles.isAdmin(request.rol())
            && request.estado().equalsIgnoreCase("activo");
        if (staff.getUsername().equalsIgnoreCase(actorUsername)
            && (!request.username().equalsIgnoreCase(actorUsername) || !willBeAdmin)) {
            throw new ConflictException("No puedes cambiar o desactivar la cuenta de administrador con la que iniciaste sesión.");
        }
        if (wasAdmin && !willBeAdmin && staffRepository.countActiveAdministrators() <= 1) {
            throw new ConflictException("Debe permanecer al menos un administrador activo.");
        }
        aplicarCambios(staff, request);
        if (request.password() != null && !request.password().isBlank()) {
            validarPassword(request.password());
            staff.setPasswordHash(passwordEncoder.encode(request.password()));
            staff.setPasswordVersion(staff.getPasswordVersion() + 1);
        }
        return toResponse(staffRepository.save(staff));
    }

    @Transactional
    public void eliminar(UUID id, String actorUsername) {
        Staff staff = staffRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("La cuenta de personal no existe."));
        if (staff.getUsername().equalsIgnoreCase(actorUsername)) {
            throw new ConflictException("No puedes eliminar la cuenta con la que iniciaste sesión.");
        }
        if (Roles.isAdmin(staff.getRolSistema()) && staff.isActivo()
            && staffRepository.countActiveAdministrators() <= 1) {
            throw new ConflictException("Debe permanecer al menos un administrador activo.");
        }
        if (lecturaRepository.existsByStaff_IdStaff(id)) {
            throw new ConflictException(
                "Esta cuenta tiene lecturas registradas y no se puede eliminar. Desactívala en su lugar."
            );
        }
        staffRepository.delete(staff);
    }

    private void aplicarCambios(Staff staff, StaffRequest request) {
        staff.setUsername(request.username().trim());
        staff.setNombre(request.nombre().trim());
        staff.setRolSistema(Roles.isAdmin(request.rol()) ? "admin" : "operador");
        staff.setActivo(request.estado().equalsIgnoreCase("activo"));
    }

    private StaffResponse toResponse(Staff staff) {
        long readingsToday = lecturaRepository.countByStaff_IdStaffAndFechaLecturaGreaterThanEqual(
            staff.getIdStaff(),
            LocalDate.now().atStartOfDay()
        );
        String name = staff.getNombre();
        if ((name == null || name.isBlank()) && staff.getPersona() != null) {
            name = (staff.getPersona().getNombre() + " " + staff.getPersona().getApellidoPaterno()).trim();
        }
        return new StaffResponse(
            staff.getIdStaff(),
            staff.getUsername(),
            name == null || name.isBlank() ? staff.getUsername() : name,
            Roles.isAdmin(staff.getRolSistema()) ? "admin" : "operador",
            readingsToday,
            staff.isActivo() ? "Activo" : "Inactivo"
        );
    }

    private static void validarPassword(String password) {
        PasswordPolicy.validate(password);
    }
}
