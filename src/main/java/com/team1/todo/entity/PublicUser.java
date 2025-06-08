package com.team1.todo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;


public class PublicUser {

    private final Long id;
    private final String username;
    private final String twoFaSecret;
    private LocalDateTime createdAt = LocalDateTime.now();
    private List<String> systemRoles = new ArrayList<>();
    private Set<TeamMember> teamMemberships = new HashSet<>();

    public PublicUser(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.twoFaSecret = user.getTwoFaSecret();
        this.createdAt = user.getCreatedAt();
        this.systemRoles = user.getSystemRoles().stream().map(userSystemRole -> {
            return userSystemRole.getRole().getName();
        }).collect(Collectors.toList());
        this.teamMemberships = user.getTeamMemberships();
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getTwoFaSecret() {
        return twoFaSecret;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<String> getSystemRoles() {
        return systemRoles;
    }

    public Set<TeamMember> getTeamMemberships() {
        return teamMemberships;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", twoFaSecret='" + twoFaSecret + '\'' +
                ", createdAt=" + createdAt +
                ", systemRoles=" + systemRoles +
                ", teamMemberships=" + teamMemberships +
                '}';
    }
}