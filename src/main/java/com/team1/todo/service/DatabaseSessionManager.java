package com.team1.todo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional
public class DatabaseSessionManager {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void setCurrentUserId(Long userId) {
        if (userId != null) {
            jdbcTemplate.execute("SELECT set_current_user_id(" + userId + ")");
        } else {
            jdbcTemplate.execute("SELECT clear_current_user_id()");
        }
    }

    public void clearCurrentUserId() {
        jdbcTemplate.execute("SELECT clear_current_user_id()");
    }
}