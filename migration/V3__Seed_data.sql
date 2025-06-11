-- 1. system_roles
INSERT INTO system_roles (name) VALUES 
  ('system_admin'), 
  ('todo_user');
 
-- 2. team_roles
INSERT INTO team_roles (name) VALUES 
  ('team_lead'), 
  ('team_member');
 
-- 3. todo_status
INSERT INTO todo_status (name) VALUES 
  ('Open'), 
  ('In Progress'), 
  ('Completed');
 
-- 4. audit_log_action_types
INSERT INTO audit_log_action_types (name) VALUES 
  ('CREATE'), 
  ('UPDATE'), 
  ('DELETE');
 
-- 5. users
INSERT INTO users (username, password_hash, password_salt, two_fa_secret) VALUES 
  ('alice', 'hash_alice', 'salt_alice', '2fa_alice'),
  ('bob', 'hash_bob', 'salt_bob', '2fa_bob'),
  ('charlie', 'hash_charlie', 'salt_charlie', '2fa_charlie');
 
-- 6. user_system_roles
INSERT INTO user_system_roles (user_id, role_id) VALUES 
  (1, 1), -- alice -> system_admin
  (2, 2), -- bob -> todo_user
  (3, 2); -- charlie -> todo_user
 
-- 7. teams
INSERT INTO teams (name) VALUES 
  ('Alpha Team'), 
  ('Beta Team');
 
-- 8. team_members
INSERT INTO team_members (team_id, user_id, team_role_id) VALUES 
  (1, 1, 1), -- alice -> team_lead in Alpha
  (1, 2, 2), -- bob -> team_member in Alpha
  (2, 3, 1); -- charlie -> team_lead in Beta
 
-- 9. todos
INSERT INTO todos (title, description, due_date, status_id, assigned_to_id, created_by, team_id) VALUES 
  ('Set up project structure', 'Create the initial project skeleton for backend and frontend.', '2025-06-01 12:00:00', 1, 2, 1, 1),
  ('Design database schema', 'Model the schema for user, role, and todo entities.', '2025-06-03 09:00:00', 2, 3, 1, 1),
  ('Implement 2FA', 'Add TOTP-based 2FA to login flow.', '2025-06-05 17:30:00', 1, 1, 3, 2);
 