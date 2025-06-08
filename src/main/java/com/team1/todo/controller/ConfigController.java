package com.team1.todo.controller;

import com.team1.todo.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.cfg.Environment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Autowired
    private PrivateConfig privateConfig;

    @Autowired
    private PublicConfig publicConfig;

    @GetMapping(path = {"/public", "/public/"})
    public ResponseEntity<?> getPublicConfig() {
        try {
            return ResponseEntity.ok(publicConfig);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    @GetMapping(path = {"/", ""})
    public ResponseEntity<?> getPrivateConfig() {
        try {
            return ResponseEntity.ok(privateConfig);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    public static class ApiResponse {
        private String message;
        public ApiResponse(String message) {
            this.message = message;
        }
        public String getMessage() {
            return message;
        }
    }

}

@Component
class PublicConfig {
    @Value("${api.baseUrl}")
    public String apiBaseUrl;
}

@Component
class PrivateConfig extends PublicConfig {
}