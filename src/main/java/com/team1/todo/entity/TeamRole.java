package com.team1.todo.entity;

import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "team_roles")
public class TeamRole {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @JsonManagedReference("role-members")
    @OneToMany(mappedBy = "teamRole", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TeamMember> memberships = new HashSet<>();
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

    public Set<TeamMember> getMemberships() {
        return memberships;
    }

    public void setMemberships(Set<TeamMember> memberships) {
        this.memberships = memberships;
    }

    @Override
    public String toString() {
        return "TeamRole{" +
                "id=" + id +
                ", name='" + name + '\'' +
                '}';
    }
}
