package com.team1.todo.repository;

import com.team1.todo.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource
public interface TeamRepository extends JpaRepository<Team, Long> {}