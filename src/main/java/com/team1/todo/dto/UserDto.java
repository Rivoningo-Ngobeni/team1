package com.team1.todo.dto;

import java.time.LocalDateTime;
import java.util.List;

public class UserDto {
    private Long id;
    private String username;
    private LocalDateTime createdAt;
    private List<String> systemRoles;
    private List<TeamMembershipDto> teamMemberships;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<String> getSystemRoles() {
        return systemRoles;
    }

    public void setSystemRoles(List<String> systemRoles) {
        this.systemRoles = systemRoles;
    }

    public List<TeamMembershipDto> getTeamMemberships() {
        return teamMemberships;
    }

    public void setTeamMemberships(List<TeamMembershipDto> teamMemberships) {
        this.teamMemberships = teamMemberships;
    }

    // Getters and Setters
}
