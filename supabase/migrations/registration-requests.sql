-- 注册审核表
CREATE TABLE IF NOT EXISTS registration_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    request_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    approved_time TIMESTAMP WITH TIME ZONE,
    rejected_time TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    requested_by UUID REFERENCES "user"(id),
    approved_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_requests_email ON registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_registration_requests_request_time ON registration_requests(request_time);

-- RLS策略
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有请求
CREATE POLICY "Admins can view all registration requests"
ON registration_requests FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- 管理员可以更新请求状态
CREATE POLICY "Admins can update registration requests"
ON registration_requests FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- 任何人都可以创建注册请求
CREATE POLICY "Anyone can create registration requests"
ON registration_requests FOR INSERT
TO anon
WITH CHECK (true);

-- 触发器更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_registration_requests_updated_at 
    BEFORE UPDATE ON registration_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();