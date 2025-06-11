

-- Insert action types
INSERT INTO audit_log_action_types (name) VALUES
    ('INSERT'),
    ('UPDATE'),
    ('DELETE')
ON CONFLICT (name) DO NOTHING;


-- Create the audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    action_type_id INT;
    current_user_id BIGINT;
BEGIN
    -- Get the action type ID based on the trigger operation
    SELECT id INTO action_type_id
    FROM audit_log_action_types
    WHERE name = TG_OP;

    BEGIN
        current_user_id := COALESCE(
            NULLIF(current_setting('app.current_user_id', true), '')::BIGINT,
            NULL
        );
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
    END;

    -- Handle different operations
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            user_id,
            action_type,
            table_name,
            old_data,
            new_data
        ) VALUES (
            current_user_id,
            action_type_id,
            TG_TABLE_NAME,
            to_jsonb(OLD),
            '{}'::jsonb
        );
        RETURN OLD;

    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            user_id,
            action_type,
            table_name,
            old_data,
            new_data
        ) VALUES (
            current_user_id,
            action_type_id,
            TG_TABLE_NAME,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;

    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            user_id,
            action_type,
            table_name,
            old_data,
            new_data
        ) VALUES (
            current_user_id,
            action_type_id,
            TG_TABLE_NAME,
            '{}'::jsonb,
            to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;



-- Users table
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();


-- System roles table
CREATE TRIGGER audit_system_roles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON system_roles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();


-- User system roles table
CREATE TRIGGER audit_user_system_roles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_system_roles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();


-- Teams table
CREATE TRIGGER audit_teams_trigger
    AFTER INSERT OR UPDATE OR DELETE ON teams
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();


-- Team roles table
CREATE TRIGGER audit_team_roles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON team_roles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();


-- Team members table
CREATE TRIGGER audit_team_members_trigger
    AFTER INSERT OR UPDATE OR DELETE ON team_members
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();


-- Todo status table
CREATE TRIGGER audit_todo_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON todo_status
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();


-- Todos table
CREATE TRIGGER audit_todos_trigger
    AFTER INSERT OR UPDATE OR DELETE ON todos
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();


-- Audit log action types table
CREATE TRIGGER audit_audit_log_action_types_trigger
    AFTER INSERT OR UPDATE OR DELETE ON audit_log_action_types
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();


-- Helper function to set current user context
CREATE OR REPLACE FUNCTION set_current_user_id(user_id BIGINT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;


-- Helper function to clear current user context
CREATE OR REPLACE FUNCTION clear_current_user_id()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', false);
END;
$$ LANGUAGE plpgsql;
