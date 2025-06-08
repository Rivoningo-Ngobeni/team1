package com.team1.todo.config;

import com.team1.todo.entity.Team;
import com.team1.todo.entity.Todo;
import com.team1.todo.entity.TodoStatus;
import com.team1.todo.entity.User;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.rest.core.config.RepositoryRestConfiguration;
import org.springframework.data.rest.webmvc.config.RepositoryRestConfigurer;

@Configuration
public class RestConfig implements RepositoryRestConfigurer {

    @Override
    public void configureRepositoryRestConfiguration(RepositoryRestConfiguration config, org.springframework.web.servlet.config.annotation.CorsRegistry cors) {
        config.exposeIdsFor(Todo.class, User.class, Team.class, TodoStatus.class);
    }
}