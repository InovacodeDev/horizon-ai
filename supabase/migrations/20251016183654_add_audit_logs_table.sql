-- Create audit_logs table for security auditing
CREATE TYPE audit_event_type AS ENUM (
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'LOGOUT',
  'REGISTER',
  'UNAUTHORIZED_ACCESS',
  'TOKEN_REFRESH',
  'PASSWORD_CHANGE',
  'CONNECTION_CREATED',
  'CONNECTION_DELETED',
  'DATA_ACCESS',
  'RATE_LIMIT_EXCEEDED'
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_type audit_event_type NOT NULL,
  event_description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Add comment to table
COMMENT ON TABLE audit_logs IS 'Security audit log for tracking important events and access attempts';
