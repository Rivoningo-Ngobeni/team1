package com.team1.todo.service;

import java.util.Optional;

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
}
