package com.team1.todo.dao;

import com.team1.todo.entity.TeamRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource
public interface TeamRoleRepository extends JpaRepository<TeamRole, Long> {}