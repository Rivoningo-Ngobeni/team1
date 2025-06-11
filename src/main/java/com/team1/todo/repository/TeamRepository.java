package com.team1.todo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import com.team1.todo.entity.Team;

@RepositoryRestResource
public interface TeamRepository extends JpaRepository<Team, Long> {}