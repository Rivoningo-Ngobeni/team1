package com.team1.todo.repository;

import com.team1.todo.entity.Team;
import com.team1.todo.entity.TeamMember;
import com.team1.todo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByUserId(Long userId);
    List<TeamMember> findByTeamId(Long teamId);
    boolean existsByUserAndTeam(User user, Team team);
    Optional<TeamMember> findByUserAndTeam(User user, Team team);
    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);
}