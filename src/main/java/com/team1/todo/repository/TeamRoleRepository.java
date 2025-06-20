package com.team1.todo.repository;

import com.team1.todo.entity.TeamRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.Optional;

@RepositoryRestResource
public interface TeamRoleRepository extends JpaRepository<TeamRole, Long> {
    Optional<TeamRole> findByName(String name);
}