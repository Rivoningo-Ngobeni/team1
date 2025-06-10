package com.team1.todo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.team1.todo.dto.TeamRequestDto;
import com.team1.todo.dto.TeamResponseDto;
import com.team1.todo.entity.Team;
import com.team1.todo.entity.TeamMember;
import com.team1.todo.entity.TeamRole;
import com.team1.todo.entity.User;
import com.team1.todo.repository.TeamMemberRepository;
import com.team1.todo.repository.TeamRepository;
import com.team1.todo.repository.TeamRoleRepository;
import com.team1.todo.repository.UserRepository;

@RestController
@RequestMapping("/api/teams-updates")
public class TeamController {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final TeamRoleRepository teamRoleRepository;

    public TeamController(TeamRepository teamRepository, 
                          TeamMemberRepository teamMemberRepository,
                          UserRepository userRepository,
                          TeamRoleRepository teamRoleRepository) {
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
        this.teamRoleRepository = teamRoleRepository;
    }

    @PostMapping
    public ResponseEntity<TeamResponseDto> createTeam(@RequestBody TeamRequestDto requestDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        User currentUser = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated"));
        
        Team team = new Team();
        team.setName(requestDto.getName());
        team = teamRepository.save(team);
        
        // Get team lead role
        TeamRole teamLeadRole = teamRoleRepository.findByName("team_lead")
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Team lead role not found"));
        
        // Add user as team lead
        TeamMember teamMember = new TeamMember();
        teamMember.setTeam(team);
        teamMember.setUser(currentUser);
        teamMember.setTeamRole(teamLeadRole);
        teamMemberRepository.save(teamMember);
        
        // Create response DTO
        TeamResponseDto responseDto = new TeamResponseDto();
        responseDto.setId(team.getId());
        responseDto.setName(team.getName());
        responseDto.setCreatedAt(team.getCreatedAt());
        responseDto.setMemberCount(1);
        responseDto.setRoleName("team_lead");
        
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }
} 