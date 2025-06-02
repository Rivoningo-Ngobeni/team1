package com.team1.todo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "user_system_roles")
public class UserSystemRole {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    private SystemRole role;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public SystemRole getRole() {
        return role;
    }

    public void setRole(SystemRole role) {
        this.role = role;
    }

    @Override
    public String toString() {
        return "UserSystemRole{" +
                "id=" + id +
                ", user=" + user +
                ", role=" + role +
                '}';
    }
}