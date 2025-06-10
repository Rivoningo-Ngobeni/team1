package com.team1.todo.controller;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageConfig;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.team1.todo.entity.User;
import com.team1.todo.service.AuthService;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User registeredUser = authService.registerUser(
                    request.getUsername(),
                    request.getPassword()
            );
            if (registeredUser != null) {
                String username = request.getUsername();
                String qrCodeUrl = authService.setup2FA(username);
                return ResponseEntity.ok(new Setup2FAResponse(qrCodeUrl));
            } else {
                return ResponseEntity.badRequest().body(new ApiResponse("User registration failed"));
            }
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
        @Size(min = 8, max = 256)
        private String password;

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
    }

    public static class LoginRequest {
        @NotBlank
        @Size(max = 50)
        private String username;

        @NotBlank
        @Size(max = 256)
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

    public static class Setup2FAResponse extends ApiResponse {
        private String qrCodeUrl;
        private String totpSecret;
        private byte[] qrCodeImage;

        private static final int QR_CODE_WIDTH = 300;
        private static final int QR_CODE_HEIGHT = 300;


        public Setup2FAResponse(String qrCodeUrl) throws IOException, WriterException {
            super("User registered successfully and 2FA setup initiated");
            this.qrCodeUrl = qrCodeUrl;
            this.qrCodeImage = Setup2FAResponse.getQRCodeImage(qrCodeUrl, QR_CODE_WIDTH, QR_CODE_HEIGHT);
            this.totpSecret = qrCodeUrl.split("secret=")[1].split("&")[0];
        }

        public static byte[] getQRCodeImage(String text, int width, int height) throws IOException, WriterException {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height);

            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageConfig con = new MatrixToImageConfig( 0xFF000000 , 0xFFFFFFFF ) ;

            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream,con);
            byte[] pngData = pngOutputStream.toByteArray();
            return pngData;
        }

        public String getQrCodeUrl() {
            return qrCodeUrl;
        }

        public String getTotpSecret() {
            return totpSecret;
        }

        public byte[] getQrCodeImage() {
            return qrCodeImage;
        }
    }
}