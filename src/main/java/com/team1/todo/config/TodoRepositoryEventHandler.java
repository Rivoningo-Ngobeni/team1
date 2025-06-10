package com.team1.todo.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleBeforeCreate;
import org.springframework.data.rest.core.annotation.HandleBeforeDelete;
import org.springframework.data.rest.core.annotation.HandleBeforeSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.team1.todo.entity.Todo;
import com.team1.todo.entity.User;
import com.team1.todo.service.TodoService;

@Component
@RepositoryEventHandler
public class TodoRepositoryEventHandler {

    private final TodoService todoService;

    @Autowired
    public TodoRepositoryEventHandler(TodoService todoService) {
        this.todoService = todoService;
    }

    @HandleBeforeCreate
    public void handleTodoCreate(Todo todo) {
        // For creation, we set the current user as the creator if not already set
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        
        // If creator is null, set it to the current user
        if (todo.getCreatedBy() == null) {
            todo.setCreatedBy(currentUser);
        }
        
        // The rest of the validation (like team membership for assigned users) is handled by TodoService
    }

    @HandleBeforeSave
    public void handleTodoSave(Todo todo) {
        // Get the current authenticated user
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        
        // Check if the user is authorized to update this todo
        if (!todoService.isUserAuthorizedToUpdateTodo(todo, currentUser.getId())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, 
                "You are not authorized to update this todo. Only the creator or team members can update it."
            );
        }
    }
    
    @HandleBeforeDelete
    public void handleTodoDelete(Todo todo) {
        // Get the current authenticated user
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        
        // Check if the user is authorized to delete this todo 
        // For simplicity, we're using the same authorization logic as updates
        if (!todoService.isUserAuthorizedToUpdateTodo(todo, currentUser.getId())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, 
                "You are not authorized to delete this todo. Only the creator or team members can delete it."
            );
        }
    }
} 