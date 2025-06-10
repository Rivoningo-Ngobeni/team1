package com.team1.todo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.team1.todo.entity.TodoStatus;

@Repository
public interface TodoStatusRepository extends JpaRepository<TodoStatus, Long> {
    // Any custom methods can be added here
}