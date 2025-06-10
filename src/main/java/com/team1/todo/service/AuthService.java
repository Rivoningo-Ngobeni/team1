package com.team1.todo.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.team1.todo.entity.PublicUser;
import com.team1.todo.entity.User;
import com.team1.todo.repository.UserRepository;
import com.team1.todo.security.JwtUtil;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TotpService totpService;

    @Autowired
    private UserService userService;

    private static final SecureRandom secureRandom = new SecureRandom();

    // Rate limiting
    private final ConcurrentHashMap<String, AttemptCounter> loginAttempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AttemptCounter> twoFaAttempts = new ConcurrentHashMap<>();

    private static final int MAX_LOGIN_ATTEMPTS = 3;
    private static final int MAX_2FA_ATTEMPTS = 3;
    private static final int LOCKOUT_DURATION_MINUTES = 10;
    private static final int SECURITY_DELAY_MS = 1000; // Constant time delay

    // Input validation patterns
    private static final Pattern TOTP_PATTERN = Pattern.compile("^[0-9]{6}$");
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9._-]{3,50}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$");

    @Transactional
    public User registerUser(String username, String password, String roleName) {
        if (!isValidUsername(username)) {
            throw new SecurityException("Invalid username format");
        }

        if (!isValidPassword(password)) {
            throw new SecurityException("Password does not meet security requirements");
        }

        username = username.toLowerCase().trim();

        if (userRepository.findByUsername(username).isPresent()) {
            throw new SecurityException("Registration failed");
        }

        try {

            String salt = generateSalt();
            String totpSecret = totpService.generateSecret();

            User user = new User();
            user.setUsername(username);
            user.setPasswordSalt(salt);
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setTwoFaSecret(totpSecret);

            return userService.createUserWithDefaultSystemRole(user);

        } catch (Exception e) {
            throw new SecurityException("Registration failed");
        }
    }

    public AuthenticationResponse authenticate(String username, String password, String totpCode) {
        long startTime = System.currentTimeMillis();

        try {
            return performAuthentication(username, password, totpCode);
        } finally {

            long elapsedTime = System.currentTimeMillis() - startTime;
            if (elapsedTime < SECURITY_DELAY_MS) {
                try {
                    Thread.sleep(SECURITY_DELAY_MS - elapsedTime);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }
    }

    public AuthenticationResponse performAuthentication(String username, String password, String totpCode) {
        if (!isValidInput(username, password, totpCode)) {
            incrementLoginAttempts(username);
            throw new SecurityException("Authentication failed");
        }
        username = username.toLowerCase().trim();

        if (isRateLimited(username)) {
            throw new SecurityException("Authentication failed - too many attempts");
        }
        Optional<User> userOpt = userRepository.findByUsername(username);
        boolean userExists = userOpt.isPresent();
        boolean passwordValid = false;
        boolean totpValid = false;

        if (userExists) {
            User user = userOpt.get();

            try {
                passwordValid = passwordEncoder.matches(password, user.getPasswordHash());
            } catch (Exception e) {
                passwordValid = false;
            }

            if (passwordValid) {
                if (user.getTwoFaSecret() != null && !user.getTwoFaSecret().isEmpty()) {
                    if (isValidTotpCode(totpCode) && !is2FARateLimited(username)) {
                        if (totpService.verifyCode(user.getTwoFaSecret(), totpCode)) {
                            totpValid = true;
                        } else {
                            increment2FAAttempts(username);
                        }
                    } else if (is2FARateLimited(username)) {
                        throw new SecurityException("Authentication failed - too many 2FA attempts");
                    }
                }
            }
        } else {
            passwordEncoder.matches("dummy", "$2a$12$dummy.hash.to.prevent.timing.attacks");
        }

        if (userExists && passwordValid && totpValid) {
            User user = userOpt.get();
            String token = jwtUtil.generateToken(user, user.getId());
            loginAttempts.remove(username);
            twoFaAttempts.remove(username);

            return new AuthenticationResponse(token, true, true, user.getPrimaryRole(), user);
        } else {
            incrementLoginAttempts(username);
            throw new SecurityException("Authentication failed");
        }
    }

    // Rate limiting methods
    private boolean isRateLimited(String username) {
        AttemptCounter counter = loginAttempts.get(username);
        if (counter == null) {
            return false;
        }
        if (counter.isExpired()) {
            loginAttempts.remove(username);
            return false;
        }
        return counter.getAttempts() >= MAX_LOGIN_ATTEMPTS;
    }

    private boolean is2FARateLimited(String username) {
        AttemptCounter counter = twoFaAttempts.get(username);
        if (counter == null) {
            return false;
        }
        if (counter.isExpired()) {
            twoFaAttempts.remove(username);
            return false;
        }
        return counter.getAttempts() >= MAX_2FA_ATTEMPTS;
    }

    // Validation methods
    private boolean isValidUsername(String username) {
        return username != null && USERNAME_PATTERN.matcher(username).matches();
    }

    private boolean isValidPassword(String password) {
        return password != null && PASSWORD_PATTERN.matcher(password).matches();
    }

    private boolean isValidTotpCode(String totpCode) {
        return totpCode != null && TOTP_PATTERN.matcher(totpCode).matches();
    }

    private boolean isValidInput(String username, String password, String totpCode) {
        return isValidUsername(username) &&
                isValidPassword(password) &&
                isValidTotpCode(totpCode);
    }

    private void incrementLoginAttempts(String username) {
        loginAttempts.compute(username, (key, counter) -> {
            if (counter == null || counter.isExpired()) {
                return new AttemptCounter();
            } else {
                counter.increment();
                return counter;
            }
        });
    }

    private void increment2FAAttempts(String username) {
        twoFaAttempts.compute(username, (key, counter) -> {
            if (counter == null || counter.isExpired()) {
                return new AttemptCounter();
            } else {
                counter.increment();
                return counter;
            }
        });
    }

    public String setup2FA(String username) {
        if (!isValidUsername(username)) {
            throw new SecurityException("Invalid username format");
        }
        username = username.toLowerCase().trim();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new SecurityException("User not found"));

        try {
            return totpService.generateQrCodeUrl(user.getTwoFaSecret(), username);
        } catch (Exception e) {
            throw new SecurityException("2FA setup failed: " + e.getMessage());
        }

    }

    public boolean verify2FA(String username, String totpCode) {
        if (!isValidUsername(username) || !isValidTotpCode(totpCode)) {
            return false;
        }

        username = username.toLowerCase().trim();

        if (is2FARateLimited(username)) {
            return false;
        }

        try {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new SecurityException("Verification failed"));

            boolean isValid = totpService.verifyCode(user.getTwoFaSecret(), totpCode);

            if (!isValid) {
                increment2FAAttempts(username);
            }

            return isValid;

        } catch (Exception e) {
            increment2FAAttempts(username);
            return false;
        }
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

    // Rate limiting helper class
    private static class AttemptCounter {
        private final AtomicInteger attempts = new AtomicInteger(1);
        private final LocalDateTime timestamp = LocalDateTime.now();

        public void increment() {
            attempts.incrementAndGet();
        }

        public int getAttempts() {
            return attempts.get();
        }

        public boolean isExpired() {
            return timestamp.isBefore(LocalDateTime.now().minusMinutes(LOCKOUT_DURATION_MINUTES));
        }
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
