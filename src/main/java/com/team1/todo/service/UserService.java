package com.team1.todo.service;

import java.util.Optional;

import com.team1.todo.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.team1.todo.entity.SystemRole;
import com.team1.todo.entity.User;
import com.team1.todo.entity.UserSystemRole;
import com.team1.todo.repository.SystemRoleRepository;
import com.team1.todo.repository.TeamRoleRepository;
import com.team1.todo.repository.UserRepository;
import com.team1.todo.repository.UserSystemRoleRepository;

import jakarta.transaction.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SystemRoleRepository systemRoleRepository;

    @Autowired
    private TeamRoleRepository teamRoleRepository;

    @Autowired
    private UserSystemRoleRepository userSystemRoleRepository;

    @Transactional
    public User createUserWithDefaultSystemRole(final User user) {
        // Save user
        User savedUser = userRepository.save(user);

        // Fetch default roles (adjust names as needed)
        Optional<SystemRole> defaultSystemRole = systemRoleRepository.findByName("todo_user");

        if (defaultSystemRole.isEmpty()) {
            throw new RuntimeException("Default roles not found");
        }

        SystemRole systemRole = defaultSystemRole.get();


        UserSystemRole userSystemRole = new UserSystemRole(savedUser, systemRole);
        userSystemRoleRepository.save(userSystemRole);

        return user;
    }

    @Autowired
    private JwtUtil jwtUtil;

    public Long getCurrentUserId() {
        try {
            HttpServletRequest request = getCurrentRequest();
            if (request != null) {
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String jwt = authHeader.substring(7);
                    return jwtUtil.extractUserId(jwt);
                }
            }
        } catch (Exception e) {
            // Fall back to null if anything goes wrong
        }
        return null;
    }

    private HttpServletRequest getCurrentRequest() {
        try {
            return ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        } catch (Exception e) {
            return null;
        }
    }
}
