package com.team1.todo.entity;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User implements UserDetails {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String passwordHash;
    private String passwordSalt;
    private String twoFaSecret;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserSystemRole> systemRoles = new HashSet<>();

    @JsonManagedReference("user-teams")
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TeamMember> teamMemberships = new HashSet<>();

    public User() {}

    public User(String username, String passwordHash, String passwordSalt) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.passwordSalt = passwordSalt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return systemRoles.stream()
                .map(usr -> new SimpleGrantedAuthority("ROLE_" + usr.getRole().getName().toUpperCase()))
                .collect(Collectors.toSet());
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getPasswordSalt() {
        return passwordSalt;
    }

    public void setPasswordSalt(String passwordSalt) {
        this.passwordSalt = passwordSalt;
    }

    public String getTwoFaSecret() {
        return twoFaSecret;
    }

    public void setTwoFaSecret(String twoFaSecret) {
        this.twoFaSecret = twoFaSecret;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Set<UserSystemRole> getSystemRoles() {
        return systemRoles;
    }
    
    public List<String> getSystemRoleNames() {
        return systemRoles.stream()
                .map(usr -> usr.getRole().getName())
                .collect(Collectors.toList());
    }

    public void setSystemRoles(Set<UserSystemRole> systemRoles) {
        this.systemRoles = systemRoles;
    }

    public Set<TeamMember> getTeamMemberships() {
        return teamMemberships;
    }

    public void setTeamMemberships(Set<TeamMember> teamMemberships) {
        this.teamMemberships = teamMemberships;
    }

    // Helper methods
    public boolean hasRole(String roleName) {
        return systemRoles.stream()
                .anyMatch(usr -> usr.getRole().getName().equalsIgnoreCase(roleName));
    }

    public String getPrimaryRole() {
        return systemRoles.stream()
                .findFirst()
                .map(usr -> usr.getRole().getName())
                .orElse("todo_member");
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", passwordHash='" + passwordHash + '\'' +
                ", passwordSalt='" + passwordSalt + '\'' +
                ", twoFaSecret='" + twoFaSecret + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}