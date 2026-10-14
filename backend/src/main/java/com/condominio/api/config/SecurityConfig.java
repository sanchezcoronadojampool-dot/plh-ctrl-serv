package com.condominio.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.HttpServletResponse;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);
    private final JwtAuthenticationFilter jwtFilter;
    private final String frontendOrigin;

    public SecurityConfig(
        JwtAuthenticationFilter jwtFilter,
        @Value("${app.frontend-origin:http://localhost:4200}") String frontendOrigin
    ) {
        this.jwtFilter = jwtFilter;
        this.frontendOrigin = frontendOrigin;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/register-owner").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/password-reset/**").permitAll()
                // Cambio de contraseña propio: cualquier rol autenticado (incluye OWNER).
                .requestMatchers(HttpMethod.PUT, "/api/staff/me/password").authenticated()
                .requestMatchers("/api/owner-registrations/**").hasRole("ADMIN")
                .requestMatchers("/api/notifications/**").hasRole("ADMIN")
                .requestMatchers("/api/owner/**").hasRole("OWNER")
                .requestMatchers(HttpMethod.GET, "/api/lecturas/info-medidor/**")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_STAFF")
                .requestMatchers(HttpMethod.GET, "/api/lecturas/info-serie")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_STAFF")
                .requestMatchers(HttpMethod.GET, "/api/lecturas/info-propiedad/**")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_STAFF")
                .requestMatchers(HttpMethod.POST, "/api/lecturas/registrar")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_STAFF")
                .requestMatchers(HttpMethod.GET, "/api/lecturas", "/api/lecturas/").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/lecturas/**").hasRole("ADMIN")
                .requestMatchers("/api/lecturas/**").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers("/api/medidores", "/api/medidores/**").hasRole("ADMIN")
                .requestMatchers("/api/tarifas", "/api/tarifas/**").hasRole("ADMIN")
                .requestMatchers(
                    "/api/propiedades", "/api/propiedades/**",
                    "/api/personas/**",
                    "/api/dashboard/**",
                    "/api/staff", "/api/staff/**",
                    "/api/facturas", "/api/facturas/**"
                )
                    .hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(exceptions -> exceptions.accessDeniedHandler(accessDeniedHandler()))
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, exception) -> {
            String safePath = request.getRequestURI()
                .replaceAll("(?i)/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=/|$)", "/{id}");
            var authentication = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication();
            var authorities = authentication == null
                ? List.<String>of()
                : authentication.getAuthorities().stream().map(Object::toString).toList();
            logger.warn("Acceso denegado: {} {}. Autoridades: {}",
                request.getMethod(), safePath, authorities.isEmpty() ? "ninguna" : authorities);
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterServletRegistration(
        JwtAuthenticationFilter filter
    ) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendOrigin));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
