package com.team1.todo.dao;

import com.team1.todo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.Optional;

@RepositoryRestResource
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    @Query("""
        SELECT u FROM User u
        LEFT JOIN FETCH u.systemRoles usr
        LEFT JOIN FETCH usr.role
        WHERE u.username = :username
    """)
    Optional<User> findByUsernameWithRoles(@Param("username") String username);



}
