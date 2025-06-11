-- 1. system_roles
INSERT INTO system_roles (name) VALUES 
  ('system_admin'), 
  ('todo_user');
GO;
 
-- 2. team_roles
INSERT INTO team_roles (name) VALUES 
  ('team_lead'), 
  ('team_member');
GO;
 
-- 3. todo_status
INSERT INTO todo_status (name) VALUES 
  ('Open'), 
  ('In Progress'), 
  ('Completed');
GO;