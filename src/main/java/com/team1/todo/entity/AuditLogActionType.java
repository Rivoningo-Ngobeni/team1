package com.team1.todo.entity;

import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "audit_log_action_types")
public class AuditLogActionType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "actionType", cascade = CascadeType.ALL)
    private Set<AuditLog> logs = new HashSet<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<AuditLog> getLogs() {
        return logs;
    }

    public void setLogs(Set<AuditLog> logs) {
        this.logs = logs;
    }

    @Override
    public String toString() {
        return "AuditLogActionType{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", logs=" + logs +
                '}';
    }
}
