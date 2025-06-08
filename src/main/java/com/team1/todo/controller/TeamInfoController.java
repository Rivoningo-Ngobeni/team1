package com.team1.todo.controller;

import com.team1.todo.entity.TeamMember;
import com.team1.todo.entity.TeamRole;
import com.team1.todo.entity.User;
import com.team1.todo.entity.Team;
import com.team1.todo.repository.TeamMemberRepository;
import com.team1.todo.repository.TeamRepository;
import com.team1.todo.repository.TeamRoleRepository;
import com.team1.todo.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teaminfo")
public class TeamInfoController {

    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final TeamRoleRepository teamRoleRepository;
    private final UserRepository userRepository;

    public TeamInfoController(TeamMemberRepository teamMemberRepository, TeamRepository teamRepository, TeamRoleRepository teamRoleRepository, UserRepository userRepository) {
        this.teamMemberRepository = teamMemberRepository;
        this.teamRepository = teamRepository;
        this.teamRoleRepository = teamRoleRepository;
        this.userRepository = userRepository;
    }

    // 1. Get user with their team role id and name
    @GetMapping("/user/{userId}/role")
    public ResponseEntity<?> getUserTeamRoles(@PathVariable Long userId) {
        List<TeamMember> memberships = teamMemberRepository.findByUserId(userId);

        if (memberships.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<Object> result = memberships.stream().map(tm -> {
            return new Object() {
                public final Long teamId = tm.getTeam().getId();
                public final String teamName = tm.getTeam().getName();
                public final Long roleId = tm.getTeamRole().getId();
                public final String roleName = tm.getTeamRole().getName();
            };
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // 2. Get all members of a team with their info
    @GetMapping("/{teamId}/members")
    public ResponseEntity<?> getTeamMembers(@PathVariable Long teamId) {
        List<TeamMember> members = teamMemberRepository.findByTeamId(teamId);

        List<Object> result = members.stream().map(tm -> {
            User user = tm.getUser();
            return new Object() {
                public final Long userId = user.getId();
                public final String username = user.getUsername();
                public final Long roleId = tm.getTeamRole().getId();
                public final String roleName = tm.getTeamRole().getName();
            };
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/all")
    public List<Map<String, Object>> getAllTeamsWithMembers() {
        return teamRepository.findAll().stream().map(team -> {
            Map<String, Object> teamMap = new HashMap<>();
            teamMap.put("teamId", team.getId());
            teamMap.put("teamName", team.getName());
            List<Map<String, Object>> members = team.getMembers().stream().map(member -> {
                Map<String, Object> memberMap = new HashMap<>();
                User user = member.getUser();
                TeamRole role = member.getTeamRole();
                memberMap.put("userId", user.getId());
                memberMap.put("username", user.getUsername());
                memberMap.put("roleId", role.getId());
                memberMap.put("roleName", role.getName());
                return memberMap;
            }).collect(Collectors.toList());
            teamMap.put("members", members);
            return teamMap;
        }).collect(Collectors.toList());
    }

    @PostMapping("/{teamId}/add-member")
    public ResponseEntity<String> addUserToTeamByUsername(
            @PathVariable Long teamId,
            @RequestBody Map<String, String> request
    ) {
        String username = request.get("username");
        String roleName = request.get("roleName");

        if (username == null || roleName == null) {
            return ResponseEntity.badRequest().body("Missing username or roleName");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        TeamRole teamRole = teamRoleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        boolean exists = teamMemberRepository.findByUserAndTeam(user, team).isPresent();
        if (exists) {
            return ResponseEntity.badRequest().body("User already a member of the team");
        }

        TeamMember newMember = new TeamMember();
        newMember.setUser(user);
        newMember.setTeam(team);
        newMember.setTeamRole(teamRole);

        teamMemberRepository.save(newMember);

        return ResponseEntity.ok("User added to team successfully.");
    }

    @PutMapping("/{teamId}/update-role")
    public ResponseEntity<String> updateUserRoleInTeam(
            @PathVariable Long teamId,
            @RequestBody Map<String, String> request
    ) {
        Long userId;
        try {
            userId = Long.parseLong(request.get("userId"));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Invalid userId");
        }

        String newRoleName = request.get("roleName");
        if (newRoleName == null) {
            return ResponseEntity.badRequest().body("Missing roleName");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        TeamMember membership = teamMemberRepository.findByUserAndTeam(user, team)
                .orElseThrow(() -> new RuntimeException("User is not a member of the team"));

        TeamRole newRole = teamRoleRepository.findByName(newRoleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        membership.setTeamRole(newRole);
        teamMemberRepository.save(membership);

        return ResponseEntity.ok("User's role updated successfully.");
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<?> removeUserFromTeam(@PathVariable Long teamId, @PathVariable Long userId) {
        // Find the team
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        // Find the team member entry
        Optional<TeamMember> teamMemberOptional = teamMemberRepository.findByTeamIdAndUserId(teamId, userId);

        if (teamMemberOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User is not a member of the team");
        }

        // Remove the user from the team
        teamMemberRepository.delete(teamMemberOptional.get());

        return ResponseEntity.ok("User removed from the team");
    }


}
