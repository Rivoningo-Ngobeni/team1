package com.team1.todo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.team1.todo.dto.TodoRequestDto;
import com.team1.todo.entity.Team;
import com.team1.todo.entity.Todo;
import com.team1.todo.entity.TodoStatus;
import com.team1.todo.entity.User;
import com.team1.todo.repository.TeamMemberRepository;
import com.team1.todo.repository.TeamRepository;
import com.team1.todo.repository.TodoRepository;
import com.team1.todo.repository.TodoStatusRepository;
import com.team1.todo.repository.UserRepository;

@Service
public class TodoService {

    private final TodoRepository todoRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final TodoStatusRepository todoStatusRepository;

    @Autowired
    public TodoService(TodoRepository todoRepository, TeamMemberRepository teamMemberRepository,
                      TeamRepository teamRepository, UserRepository userRepository,
                      TodoStatusRepository todoStatusRepository) {
        this.todoRepository = todoRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.todoStatusRepository = todoStatusRepository;
    }

    public Todo createFromDto(TodoRequestDto dto) {
        Todo todo = new Todo();
        
        // Set basic fields
        todo.setTitle(dto.getTitle());
        todo.setDescription(dto.getDescription());
        todo.setDueDate(dto.getDueDate());
        
        // Set team
        if (dto.getTeamId() != null) {
            Team team = teamRepository.findById(dto.getTeamId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Team not found with id: " + dto.getTeamId()));
            todo.setTeam(team);
        }
        
        // Set assigned user
        if (dto.getAssignedToId() != null) {
            User assignedUser = userRepository.findById(dto.getAssignedToId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "User not found with id: " + dto.getAssignedToId()));
            todo.setAssignedTo(assignedUser);
        }

        if (dto.getCreatedById() != null) {
            User createdByUser = userRepository.findById(dto.getCreatedById())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "User not found with id: " + dto.getCreatedById()));
            todo.setCreatedBy(createdByUser);
        }
        
        if (dto.getStatusId() != null) {
            TodoStatus status = todoStatusRepository.findById(dto.getStatusId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Status not found with id: " + dto.getStatusId()));
            todo.setStatus(status);
        } else {
            TodoStatus defaultStatus = todoStatusRepository.findById(1L)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Default status not found"));
            todo.setStatus(defaultStatus);
        }
        
        validateTodoAssignment(todo);
        return todoRepository.save(todo);
    }

    public Todo updateFromDto(Long id, TodoRequestDto dto) {
        Todo existingTodo = todoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Todo not found with id: " + id));
        
        // Update basic fields
        existingTodo.setTitle(dto.getTitle());
        existingTodo.setDescription(dto.getDescription());
        existingTodo.setDueDate(dto.getDueDate());
        
        // Update team
        if (dto.getTeamId() != null) {
            Team team = teamRepository.findById(dto.getTeamId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Team not found with id: " + dto.getTeamId()));
            existingTodo.setTeam(team);
        }
        
        // Update assigned user
        if (dto.getAssignedToId() != null) {
            User assignedUser = userRepository.findById(dto.getAssignedToId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "User not found with id: " + dto.getAssignedToId()));
            existingTodo.setAssignedTo(assignedUser);
        }
        
        if (dto.getStatusId() != null) {
            TodoStatus status = todoStatusRepository.findById(dto.getStatusId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Status not found with id: " + dto.getStatusId()));
            existingTodo.setStatus(status);
        }
        
        existingTodo.setUpdatedAt(java.time.LocalDateTime.now());
        
        validateTodoAssignment(existingTodo);
        return todoRepository.save(existingTodo);
    }

    public Todo saveTodo(Todo todo) {
        validateTodoAssignment(todo);
        return todoRepository.save(todo);
    }

    public Todo updateTodo(Long id, Todo updatedTodo) {
        Todo existingTodo = todoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Todo not found with id: " + id));
        
        // Update fields
        existingTodo.setTitle(updatedTodo.getTitle());
        existingTodo.setDescription(updatedTodo.getDescription());
        existingTodo.setDueDate(updatedTodo.getDueDate());
        existingTodo.setStatus(updatedTodo.getStatus());
        existingTodo.setTeam(updatedTodo.getTeam());
        existingTodo.setAssignedTo(updatedTodo.getAssignedTo());
        
        validateTodoAssignment(existingTodo);
        return todoRepository.save(existingTodo);
    }

    private void validateTodoAssignment(Todo todo) {
        User assignedUser = todo.getAssignedTo();
        Team team = todo.getTeam();
        
        // Skip validation if either is null
        if (assignedUser == null || team == null) {
            return;
        }
        
        // Check if the assigned user is a member of the team
        boolean isMember = teamMemberRepository.findByUserAndTeam(assignedUser, team).isPresent();
        
        if (!isMember) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, 
                "User " + assignedUser.getUsername() + " is not a member of team " + team.getName()
            );
        }
    }

    public boolean isUserTeamMember(Long userId, Long teamId) {
        return teamMemberRepository.findByTeamIdAndUserId(teamId, userId).isPresent();
    }

    public boolean isUserAuthorizedToUpdateTodo(Todo todo, Long userId) {
        if (todo == null || userId == null) {
            return false;
        }
        
        if (todo.getCreatedBy() != null && todo.getCreatedBy().getId().equals(userId)) {
            return true;
        }
        
        if (todo.getTeam() != null) {
            return isUserTeamMember(userId, todo.getTeam().getId());
        }
        
        return false;
    }

    public List<Todo> findAll() {
        return todoRepository.findAll();
    }

    public Optional<Todo> findById(Long id) {
        return todoRepository.findById(id);
    }

    public void deleteById(Long id) {
        todoRepository.deleteById(id);
    }
} 