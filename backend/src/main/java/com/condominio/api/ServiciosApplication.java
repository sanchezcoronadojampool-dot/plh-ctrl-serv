package com.condominio.api;

import com.condominio.api.config.DatabaseStartupValidator;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ServiciosApplication {
    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(ServiciosApplication.class);
        application.addInitializers(new DatabaseStartupValidator());
        application.run(args);
    }
}
