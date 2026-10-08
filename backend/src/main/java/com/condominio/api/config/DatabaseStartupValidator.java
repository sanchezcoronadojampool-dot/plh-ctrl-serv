package com.condominio.api.config;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

public class DatabaseStartupValidator implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override
    public void initialize(ConfigurableApplicationContext context) {
        String password = context.getEnvironment().getProperty("spring.datasource.password");

        if (password == null || password.isBlank()) {
            throw new IllegalStateException(
                "DB_PASSWORD no está configurado o está vacío. "
                    + "Define DB_PASSWORD en el entorno del proceso que inicia el backend."
            );
        }
    }
}
