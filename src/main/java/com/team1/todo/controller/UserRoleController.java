package com.team1.todo.controller;

import com.team1.todo.entity.SystemRole;
import com.team1.todo.entity.User;
import com.team1.todo.entity.UserSystemRole;
import com.team1.todo.repository.SystemRoleRepository;
import com.team1.todo.repository.UserRepository;
import com.team1.todo.repository.UserSystemRoleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user-roles")
public class UserRoleController {

    private final UserRepository userRepository;
    private final SystemRoleRepository systemRoleRepository;

    public UserRoleController(UserRepository userRepository, SystemRoleRepository systemRoleRepository) {
        this.userRepository = userRepository;
        this.systemRoleRepository = systemRoleRepository;
    }


    @PatchMapping("/{userId}")
    public ResponseEntity<?> updateSystemRoles(
            @PathVariable Long userId,
            @RequestBody List<String> roleNames) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Set<SystemRole> roles = roleNames.stream()
                .map(name -> systemRoleRepository.findByName(name)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + name)))
                .collect(Collectors.toSet());

        user.getSystemRoles().clear();
        for (SystemRole role : roles) {
            UserSystemRole usr = new UserSystemRole();
            usr.setUser(user);
            usr.setRole(role);
            user.getSystemRoles().add(usr);
        }

        userRepository.save(user);

        return ResponseEntity.ok().build();
    }
}