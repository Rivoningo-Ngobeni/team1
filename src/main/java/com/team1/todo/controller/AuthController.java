package com.team1.todo.controller;

import com.team1.todo.service.AuthService;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.registerUser(
                    request.getUsername(),
                    request.getPassword(),
                    request.getRole()
            );
            return ResponseEntity.ok(new ApiResponse("User registered successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthService.AuthenticationResponse response = authService.authenticate(
                    request.getUsername(),
                    request.getPassword(),
                    request.getTotpCode()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    @PostMapping("/setup-2fa")
    public ResponseEntity<?> setup2FA(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String qrCodeUrl = authService.setup2FA(username);
            return ResponseEntity.ok(new Setup2FAResponse(qrCodeUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<?> verify2FA(@Valid @RequestBody Verify2FARequest request) {
        try {
            boolean isValid = authService.verify2FA(request.getUsername(), request.getCode());
            if (isValid) {
                return ResponseEntity.ok(new ApiResponse("2FA verification successful"));
            } else {
                return ResponseEntity.badRequest().body(new ApiResponse("Invalid 2FA code"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    @PostMapping("/reset-2fa")
    public ResponseEntity<?> reset2FA(Authentication authentication) {
        try {
            authService.resetTwoFaSecret(authentication.getName());
            return ResponseEntity.ok(new ApiResponse("2FA reset successfully. Please setup again."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    // Request/Response DTOs
    public static class RegisterRequest {
        @NotBlank
        @Size(max = 50)
        private String username;

        @NotBlank
        @Size(min = 8)
        private String password;

        private String role = "todo_user";

        // Getters and setters
        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }

    public static class LoginRequest {
        @NotBlank
        private String username;

        @NotBlank
        private String password;

        private String totpCode;

        // Getters and setters
        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getTotpCode() {
            return totpCode;
        }

        public void setTotpCode(String totpCode) {
            this.totpCode = totpCode;
        }
    }

    public static class Verify2FARequest {
        @NotBlank
        private String username;

        @NotBlank
        private String code;
        public String getUsername() {
            return username;
        }
        public void setUsername(String username) {
            this.username = username;
        }
        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
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

    public static class Setup2FAResponse {
        private String qrCodeUrl;
        public Setup2FAResponse(String qrCodeUrl) {
            this.qrCodeUrl = qrCodeUrl;
        }
        public String getQrCodeUrl() {
            return qrCodeUrl;
        }
    }
}