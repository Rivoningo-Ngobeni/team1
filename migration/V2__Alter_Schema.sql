ALTER TABLE todos DROP CONSTRAINT todos_assigned_to_id_fkey;

ALTER TABLE todos
ADD CONSTRAINT todos_assigned_to_id_fkey
FOREIGN KEY (assigned_to_id)
REFERENCES users(id)
ON DELETE SET NULL;

ALTER TABLE audit_log DROP CONSTRAINT audit_log_user_id_fkey;

-- Re-add the constraint with ON DELETE SET NULL
ALTER TABLE audit_log
ADD CONSTRAINT audit_log_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE SET NULL;

ALTER TABLE audit_log ALTER COLUMN user_id DROP NOT NULL;