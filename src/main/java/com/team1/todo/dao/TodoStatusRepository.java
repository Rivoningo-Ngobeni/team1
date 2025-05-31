package com.team1.todo.dao;

import com.team1.todo.entity.TodoStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource
public interface TodoStatusRepository extends JpaRepository<TodoStatus, Long> {}