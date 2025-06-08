package com.team1.todo.service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.team1.todo.entity.PublicUser;
import com.team1.todo.entity.User;
import com.team1.todo.repository.SystemRoleRepository;
import com.team1.todo.repository.UserRepository;
import com.team1.todo.repository.UserSystemRoleRepository;
import com.team1.todo.security.JwtUtil;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SystemRoleRepository systemRoleRepository;

    @Autowired
    private UserSystemRoleRepository userSystemRoleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TotpService totpService;

    @Autowired
    private UserService userService;

    private static final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public User registerUser(String username, String password, String roleName) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("User already exists with username: " + username);
        }

        String salt = generateSalt();

        String totpSecret = totpService.generateSecret();

        // Create user with 2FA secret (required by schema)
        User user = new User();
        user.setUsername(username);
        user.setPasswordSalt(salt);
        user.setPasswordHash(passwordEncoder.encode(password + salt));
        user.setTwoFaSecret(totpSecret);

        return userService.createUserWithDefaultSystemRole(user);
    }

    public AuthenticationResponse authenticate(String username, String password, String totpCode) {
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty()) {
            throw new RuntimeException("Invalid credentials");
        }

        User user = userOpt.get();

        // Validate password
        String hashedInputPassword = passwordEncoder.encode(password + user.getPasswordSalt());
        if (!passwordEncoder.matches(password + user.getPasswordSalt(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        // Check if user has 2FA secret
        if (user.getTwoFaSecret() == null || user.getTwoFaSecret().isEmpty()) {
            throw new RuntimeException("2FA not set up for this user");
        }

        // Validate TOTP code if provided
        if (totpCode == null || totpCode.isEmpty()) {
            throw new RuntimeException("2FA code is required");
        }

        if (!totpService.verifyCode(user.getTwoFaSecret(), totpCode)) {
            throw new RuntimeException("Invalid 2FA code");
        }

        String token = jwtUtil.generateToken(user);
        return new AuthenticationResponse(token, true, true, user.getPrimaryRole(), user);
    }

    public String setup2FA(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // User already has a secret from registration, return QR code URL
        return totpService.generateQrCodeUrl(user.getTwoFaSecret(), username);
    }

    public boolean verify2FA(String username, String totpCode) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return totpService.verifyCode(user.getTwoFaSecret(), totpCode);
    }

    @Transactional
    public void resetTwoFaSecret(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setTwoFaSecret(totpService.generateSecret());
        userRepository.save(user);
    }

    private String generateSalt() {
        byte[] salt = new byte[32]; // 256-bit salt
        secureRandom.nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }


    public static class AuthenticationResponse {
            private final String token;
            private final boolean requiresTwoFa;
            private boolean success;
            private String role;
            private final PublicUser user;

            public AuthenticationResponse(String token, boolean requiresTwoFa, boolean success, String role, User user) {
                this.token = token;
                this.requiresTwoFa = requiresTwoFa;
                this.success = success;
                this.role = role;
                this.user = new PublicUser(user);
            }

            // Getters
            public String getToken() { return token; }
            public boolean isRequiresTwoFa() { return requiresTwoFa; }
            public boolean isSuccess() { return success; }
            public String getRole() { return role; }
            public PublicUser getUser() { return user; }
        }
    }
