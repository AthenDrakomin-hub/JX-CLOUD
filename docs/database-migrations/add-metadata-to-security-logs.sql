-- 添加元数据字段到安全日志表以支持更详细的审计信息

-- 为 security_logs 表添加 metadata JSONB 字段
ALTER TABLE security_logs 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 为 security_logs 表添加 timestamp 字段（如果不存在）
ALTER TABLE security_logs 
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- 创建索引以优化审计日志查询
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON security_logs (action);
CREATE INDEX IF NOT EXISTS idx_security_logs_risk_level ON security_logs (risk_level);

-- 创建一个函数来清理旧的审计日志（保留最近1年的日志）
CREATE OR REPLACE FUNCTION cleanup_old_security_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM security_logs 
    WHERE timestamp < NOW() - (retention_days || ' days')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- 创建定期清理任务（如果pg_cron可用）
-- 注意：需要先在Supabase中启用pg_cron扩展
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--     'cleanup-security-logs', 
--     '0 2 * * 0',  -- 每周日凌晨2点执行
--     'SELECT cleanup_old_security_logs(365);'
-- );