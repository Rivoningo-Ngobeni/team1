-- 1. users
CREATE TABLE
    users (
        id SERIAL PRIMARY KEY NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(256) NOT NULL,
        password_salt VARCHAR(256) NOT NULL,
        two_fa_secret VARCHAR(256) NOT NULL,
        created_at TIMESTAMP DEFAULT now () NOT NULL
    );

-- 2. system_roles
CREATE TABLE
    system_roles (
        id SERIAL PRIMARY KEY NOT NULL,
        name VARCHAR(50) UNIQUE NOT NULL
    );

-- 3. user_system_roles
CREATE TABLE
    user_system_roles (
        id SERIAL PRIMARY KEY NOT NULL,
        user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        role_id INT NOT NULL REFERENCES system_roles (id) ON DELETE CASCADE
    );

-- 4. teams
CREATE TABLE
    teams (
        id SERIAL PRIMARY KEY NOT NULL,
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT now () NOT NULL
    );

-- 5. team_roles
CREATE TABLE
    team_roles (
        id SERIAL PRIMARY KEY NOT NULL,
        name VARCHAR(20) UNIQUE NOT NULL
    );

-- 6. team_members
CREATE TABLE
    team_members (
        id SERIAL PRIMARY KEY NOT NULL,
        team_id INT NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
        user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        team_role_id INT NOT NULL REFERENCES team_roles (id)
    );

-- 7. todo_status
CREATE TABLE
    todo_status (
        id SERIAL PRIMARY KEY NOT NULL,
        name VARCHAR(20) UNIQUE NOT NULL DEFAULT 'open'
    );

-- 8. todos
CREATE TABLE
    todos (
        id SERIAL PRIMARY KEY NOT NULL,
        title VARCHAR(128) NOT NULL,
        description VARCHAR(512) NOT NULL,
        due_date TIMESTAMP,
        status_id INT NOT NULL REFERENCES todo_status (id),
        assigned_to_id INT REFERENCES users (id),
        created_at TIMESTAMP DEFAULT now () NOT NULL,
        updated_at TIMESTAMP DEFAULT now () NOT NULL,
        created_by INT NOT NULL REFERENCES users (id),
        team_id INT NOT NULL REFERENCES teams (id)
    );

-- 9. audit_log_action_types
CREATE TABLE
    audit_log_action_types (
        id SERIAL PRIMARY KEY NOT NULL,
        name VARCHAR(20) UNIQUE NOT NULL
    );

-- 10. audit_log
CREATE TABLE
    audit_log (
        id SERIAL PRIMARY KEY NOT NULL,
        user_id INT NOT NULL REFERENCES users (id),
        action_type INT NOT NULL REFERENCES audit_log_action_types (id),
        table_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT now () NOT NULL,
        old_data JSONB DEFAULT '{}' NOT NULL,
        new_data JSONB NOT NULL
    );