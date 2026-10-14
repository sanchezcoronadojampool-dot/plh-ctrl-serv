package com.condominio.api.config;

import com.condominio.api.model.Staff;
import com.condominio.api.repository.StaffRepository;
import com.condominio.api.service.JwtService;
import com.condominio.api.util.Roles;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final StaffRepository staffRepository;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            var claims = jwtService.parseToken(header.substring(7));
            String username = claims.getSubject();
            Staff staff = staffRepository.findByUsernameIgnoreCase(username).orElse(null);
            Object versionClaim = claims.get("pv");
            if (versionClaim != null && !(versionClaim instanceof Number)) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token de acceso inválido o vencido.");
                return;
            }
            int tokenPasswordVersion = versionClaim == null ? 0 : ((Number) versionClaim).intValue();
            if (staff == null || !staff.isActivo()
                || tokenPasswordVersion != staff.getPasswordVersion()) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "La cuenta no está activa.");
                return;
            }
            var authentication = new UsernamePasswordAuthenticationToken(
                staff.getUsername(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + Roles.normalize(staff.getRolSistema())))
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (JwtException | IllegalArgumentException exception) {
            SecurityContextHolder.clearContext();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token de acceso inválido o vencido.");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
