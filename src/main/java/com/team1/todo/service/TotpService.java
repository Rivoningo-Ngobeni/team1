package com.team1.todo.service;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrDataFactory;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import dev.samstevens.totp.code.HashingAlgorithm;
import org.springframework.stereotype.Service;

@Service
public class TotpService {

    private final SecretGenerator secretGenerator;
    private final QrDataFactory qrDataFactory;
    private final CodeGenerator codeGenerator;
    private final CodeVerifier codeVerifier;

    public TotpService() {
        this.secretGenerator = new DefaultSecretGenerator();
        this.qrDataFactory = new QrDataFactory(
                HashingAlgorithm.SHA1,  // Default hashing algorithm
                6,                      // Default digits (6-digit codes)
                30                      // Default time period (30 seconds)
        );
        this.codeGenerator = new DefaultCodeGenerator();

        TimeProvider timeProvider = new SystemTimeProvider();
        this.codeVerifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
    }

    public String generateSecret() {
        return secretGenerator.generate();
    }

    public QrData generateQrData(String secret, String username) {
        return qrDataFactory.newBuilder()
                .label(username)
                .secret(secret)
                .issuer("TodoApp")
                .build();
    }

    public boolean verifyCode(String secret, String code) {
        return codeVerifier.isValidCode(secret, code);
    }

    public String generateQrCodeUrl(String secret, String username) {
        QrData data = generateQrData(secret, username);
        return data.getUri();
    }
}

