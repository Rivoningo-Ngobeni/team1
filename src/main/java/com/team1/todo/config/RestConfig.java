package com.team1.todo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.rest.core.config.RepositoryRestConfiguration;
import org.springframework.data.rest.webmvc.config.RepositoryRestConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

import com.team1.todo.entity.Team;
import com.team1.todo.entity.Todo;
import com.team1.todo.entity.TodoStatus;
import com.team1.todo.entity.User;

@Configuration
public class RestConfig implements RepositoryRestConfigurer {

    @Override
    public void configureRepositoryRestConfiguration(RepositoryRestConfiguration config, CorsRegistry cors) {
        config.exposeIdsFor(Todo.class, User.class, Team.class, TodoStatus.class);
        config.setReturnBodyForPutAndPost(true);
    }
}