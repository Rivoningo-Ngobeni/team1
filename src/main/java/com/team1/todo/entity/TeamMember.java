package com.team1.todo.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "team_members")
public class TeamMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonBackReference("team-members")
    @ManyToOne(fetch = FetchType.LAZY)
    private Team team;

    @JsonBackReference("user-teams")
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @JsonBackReference("role-members")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_role_id")
    private TeamRole teamRole;

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

    public TeamRole getTeamRole() {
        return teamRole;
    }

    public void setTeamRole(TeamRole teamRole) {
        this.teamRole = teamRole;
    }

    public Team getTeam() {
        return team;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    @Override
    public String toString() {
        return "TeamMember{" +
                "id=" + id +
                ", teamId=" + (team != null ? team.getId() : null) +
                ", userId=" + (user != null ? user.getId() : null) +
                ", teamRoleId=" + (teamRole != null ? teamRole.getId() : null) +
                '}';
    }
}
