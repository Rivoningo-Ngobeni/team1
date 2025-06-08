package com.team1.todo.controller;

import com.team1.todo.dto.TodoDto;
import com.team1.todo.entity.Todo;
import com.team1.todo.mapper.TodoMapper;
import com.team1.todo.repository.TodoRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/full-todos")
public class TodoController {

    private final TodoRepository todoRepository;

    public TodoController(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
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
}
