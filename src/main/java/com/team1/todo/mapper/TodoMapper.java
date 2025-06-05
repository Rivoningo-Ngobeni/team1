package com.team1.todo.mapper;

import com.team1.todo.dto.TodoDto;
import com.team1.todo.entity.Todo;

public class TodoMapper {
    public static TodoDto toDto(Todo todo) {
        TodoDto dto = new TodoDto();
        dto.setId(todo.getId());
        dto.setTitle(todo.getTitle());
        dto.setDescription(todo.getDescription());
        dto.setDueDate(todo.getDueDate());
        dto.setCreatedAt(todo.getCreatedAt());
        dto.setUpdatedAt(todo.getUpdatedAt());

        if (todo.getCreatedBy() != null) {
            dto.setCreatedBy(new TodoDto.SimpleUserDto(todo.getCreatedBy().getId(), todo.getCreatedBy().getUsername()));
        }

        if (todo.getAssignedTo() != null) {
            dto.setAssignedTo(new TodoDto.SimpleUserDto(todo.getAssignedTo().getId(), todo.getAssignedTo().getUsername()));
        }

        if (todo.getTeam() != null) {
            dto.setTeam(new TodoDto.SimpleTeamDto(todo.getTeam().getId(), todo.getTeam().getName()));
        }

        if (todo.getStatus() != null) {
            dto.setStatus(new TodoDto.SimpleStatusDto(todo.getStatus().getId(), todo.getStatus().getName()));
        }

        return dto;
    }
}
