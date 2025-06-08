package com.team1.todo.repository;

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
    @Query(value = """
    SELECT u.*
    FROM users u
    JOIN user_system_roles usr ON usr.user_id = u.id
    JOIN system_roles sr ON sr.id = usr.role_id
    WHERE u.username = :username
    """, nativeQuery = true)
    Optional<User> findByUsernameWithRoles(@Param("username") String username);



}
