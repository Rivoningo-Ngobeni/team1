package com.team1.todo.repository;

import com.team1.todo.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {}