package com.team1.todo.dto;

import java.time.LocalDateTime;

public class TodoDto {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private SimpleUserDto createdBy;
    private SimpleUserDto assignedTo;
    private SimpleTeamDto team;
    private SimpleStatusDto status;

    public static class SimpleUserDto {
        private Long id;
        private String username;

        public SimpleUserDto(Long id, String username) {
            this.id = id;
            this.username = username;
        }

        public Long getId() { return id; }
        public String getUsername() { return username; }
    }

    public static class SimpleTeamDto {
        private Long id;
        private String name;

        public SimpleTeamDto(Long id, String name) {
            this.id = id;
            this.name = name;
        }

        public Long getId() { return id; }
        public String getName() { return name; }
    }

    public static class SimpleStatusDto {
        private Long id;
        private String name;

        public SimpleStatusDto(Long id, String name) {
            this.id = id;
            this.name = name;
        }

        public Long getId() { return id; }
        public String getName() { return name; }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public SimpleUserDto getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(SimpleUserDto createdBy) {
        this.createdBy = createdBy;
    }

    public SimpleUserDto getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(SimpleUserDto assignedTo) {
        this.assignedTo = assignedTo;
    }

    public SimpleTeamDto getTeam() {
        return team;
    }

    public void setTeam(SimpleTeamDto team) {
        this.team = team;
    }

    public SimpleStatusDto getStatus() {
        return status;
    }

    public void setStatus(SimpleStatusDto status) {
        this.status = status;
    }
}
