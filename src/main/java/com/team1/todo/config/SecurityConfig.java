package com.team1.todo.config;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.team1.todo.security.JwtAuthFilter;
import com.team1.todo.service.UserDetailService;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Autowired
    private UserDetailService userDetailsService;

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

//     @Value("#{'${app.cors.allowedOrigins}'.split(',')}")
    private List<String> allowedOrigins = Arrays.asList("http://localhost:8080", "https://garlic-phone.com", "http://garlic-phone.com", "ec2-13-245-89-176.af-south-1.compute.amazonaws.com:8080");

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/setup-2fa",
                                "/api/auth/verify-2fa").permitAll()
                        .requestMatchers("/api/auth/reset-2fa").authenticated()
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/app.js",
                                "/styles.css",
                                "/static/**",
                                "/components/**",
                                "/pages/**",
                                "/utils/**",
                                "/utils/config",
                                "/favicon.ico"
                        ).permitAll()
                        // .requestMatchers(  "/**/*.woff2", "/**/*.woff", "/**/*.ttf", "/**/*.eot").permitAll()
                        .requestMatchers("/api/config/public", "/api/config/public/**").permitAll()
                        .requestMatchers("/api/config", "/api/config/**").authenticated()
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider());
                http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                //         .headers(headers -> headers
                //         .contentSecurityPolicy(csp -> csp
                //                 .policyDirectives("default-src 'self'; " +
                //                         "script-src 'self'; " +
                //                         "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; " +
                //                         "font-src 'self' https://fonts.gstatic.com; " +
                //                         "img-src 'self' https://cdn.example.com data:; " +
                //                         "connect-src 'self'; " +
                //                         "object-src 'none'; " +
                //                         "base-uri 'self'; " +
                //                         "frame-ancestors 'none'")
                //         )
                // )
                ;



        return http.build();
    }

    // to update later
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "X-XSRF-TOKEN"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
