-- Initial schema for BlogReader project
-- This project uses Edge Functions for API endpoints
-- No database tables needed for the current implementation

-- Create a simple log table for debugging (optional)
CREATE TABLE IF NOT EXISTS function_logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    function_name TEXT NOT NULL,
    request_data JSONB,
    response_data JSONB,
    error_message TEXT
);

-- Enable RLS (Row Level Security) for the logs table
ALTER TABLE function_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (adjust as needed)
CREATE POLICY "Allow all operations on function_logs" ON function_logs
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON function_logs TO authenticated, anon;
GRANT USAGE ON SEQUENCE function_logs_id_seq TO authenticated, anon;