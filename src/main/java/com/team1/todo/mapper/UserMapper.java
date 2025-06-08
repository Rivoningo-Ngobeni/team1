package com.team1.todo.mapper;

import com.team1.todo.dto.TeamMembershipDto;
import com.team1.todo.dto.UserDto;
import com.team1.todo.entity.User;

import java.util.stream.Collectors;

public class UserMapper {
    public static UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setCreatedAt(user.getCreatedAt());

        dto.setSystemRoles(
                user.getSystemRoles().stream()
                        .map(role -> role.getRole().getName())
                        .collect(Collectors.toList())
        );

        dto.setTeamMemberships(
                user.getTeamMemberships().stream()
                        .map(membership -> {
                            TeamMembershipDto tm = new TeamMembershipDto();
                            tm.setTeamId(membership.getTeam().getId());
                            tm.setTeamName(membership.getTeam().getName());
                            tm.setRoleId(membership.getTeamRole().getId());
                            tm.setRoleName(membership.getTeamRole().getName());
                            return tm;
                        })
                        .collect(Collectors.toList())
        );

        return dto;
    }
}

