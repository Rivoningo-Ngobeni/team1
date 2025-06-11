package com.team1.todo.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.team1.todo.dto.TodoDto;
import com.team1.todo.dto.TodoRequestDto;
import com.team1.todo.entity.Todo;
import com.team1.todo.entity.User;
import com.team1.todo.mapper.TodoMapper;
import com.team1.todo.repository.TodoRepository;
import com.team1.todo.repository.UserRepository;
import com.team1.todo.service.TodoService;

@RestController
@RequestMapping("/api/full-todos")
public class TodoController {

    private final TodoRepository todoRepository;
    private final TodoService todoService;
    private final UserRepository userRepository;

    @Autowired
    public TodoController(TodoRepository todoRepository, TodoService todoService, UserRepository userRepository) {
        this.todoRepository = todoRepository;
        this.todoService = todoService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<TodoDto> getAllTodos() {
        return todoRepository.findAll().stream()
                .map(TodoMapper::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public TodoDto getTodoById(@PathVariable Long id) {
        return todoRepository.findById(id)
                .map(TodoMapper::toDto)
                .orElseThrow(() -> new RuntimeException("Todo not found"));
    }

    @PostMapping({"/", ""})
    public ResponseEntity<TodoDto> createTodo(@RequestBody TodoRequestDto todoRequest) {
        Todo savedTodo = todoService.createFromDto(todoRequest);
        return new ResponseEntity<>(TodoMapper.toDto(savedTodo), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TodoDto> updateTodo(@PathVariable Long id, @RequestBody TodoRequestDto todoRequest) {
        // Get the todo to update
        Todo existingTodo = todoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Todo not found with id: " + id));
                        
        // Get the current authenticated user
        User currentUser = getCurrentUser();
        
        // Check if the user is authorized to update this todo
        if (!todoService.isUserAuthorizedToUpdateTodo(existingTodo, currentUser.getId())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, 
                "You are not authorized to update this todo. Only the creator or team members can update it."
            );
        }
        
        // If authorized, proceed with the update
        Todo updatedTodo = todoService.updateFromDto(id, todoRequest);
        return ResponseEntity.ok(TodoMapper.toDto(updatedTodo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Long id) {
        // Get the todo to delete
        Todo todoToDelete = todoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Todo not found with id: " + id));
                        
        // Get the current authenticated user
        User currentUser = getCurrentUser();
        
        // Check if the user is authorized to delete this todo
        if (!todoService.isUserAuthorizedToUpdateTodo(todoToDelete, currentUser.getId())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, 
                "You are not authorized to delete this todo. Only the creator or team members can delete it."
            );
        }
        
        // If authorized, proceed with the deletion
        todoService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/can-edit/{todoId}/user/{userId}")
    public ResponseEntity<Boolean> canUserEditTodo(@PathVariable Long todoId, @PathVariable Long userId) {
        // Get the todo
        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Todo not found with id: " + todoId));
        
        
        // Make sure the user requesting the check is either the user being checked or has admin rights
        User currentUser = getCurrentUser();
        if (!currentUser.getId().equals(userId) && !currentUser.getSystemRoleNames().contains("system_admin")) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You can only check permissions for yourself or as an admin"
            );
        }
        
        // Use the service method to check if the user can edit the todo
        boolean canEdit = todoService.isUserAuthorizedToUpdateTodo(todo, userId);
        return ResponseEntity.ok(canEdit);
    }
    
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
