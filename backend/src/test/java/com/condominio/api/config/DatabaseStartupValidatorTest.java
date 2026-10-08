package com.condominio.api.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DatabaseStartupValidatorTest {
    @Test
    void acceptsConfiguredDatabasePassword() {
        MockEnvironment environment = new MockEnvironment();
        environment.setProperty("spring.datasource.password", "s3cr3t-pass");

        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.setEnvironment(environment);

        DatabaseStartupValidator validator = new DatabaseStartupValidator();

        assertDoesNotThrow(() -> validator.initialize(context));
        context.close();
    }

    @Test
    void rejectsMissingDatabasePassword() {
        MockEnvironment environment = new MockEnvironment();
        environment.setProperty("spring.datasource.password", "");

        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.setEnvironment(environment);

        DatabaseStartupValidator validator = new DatabaseStartupValidator();

        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> validator.initialize(context)
        );

        assertTrue(exception.getMessage().contains("DB_PASSWORD"));
        context.close();
    }
}
