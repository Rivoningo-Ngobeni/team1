package com.team1.todo.security;

import com.team1.todo.service.DatabaseSessionManager;
import com.team1.todo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleBeforeDelete;
import org.springframework.data.rest.core.annotation.HandleBeforeSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.stereotype.Component;

@RepositoryEventHandler
@Component
public class AuditRepositoryEventHandler {

    @Autowired
    private DatabaseSessionManager sessionManager;

    @Autowired
    private UserService userService;

    @HandleBeforeDelete
    @HandleBeforeSave
    public void handleBeforeAnyOperation(Object entity) {
        try {
            Long currentUserId = userService.getCurrentUserId();
            if (currentUserId != null) {
                sessionManager.setCurrentUserId(currentUserId);
            }
        } catch (Exception e) {
        }
    }
}