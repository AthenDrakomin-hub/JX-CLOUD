#!/bin/bash
# 设置环境变量并部署Supabase函数

export SUPABASE_ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsYmVtb3BjZ2pvaHJueXlpd3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Njg5MzksImV4cCI6MjA4MTQ0NDkzOX0.JL3nNxW7s5x4D1Bz7t8Kq2p5v4Y6j3n2W9x8z7R4t1Y"
export SUPABASE_DB_PASSWORD="BUAu5RXUctzLUjScaws-1-ap-south-1.pooler.supabase.com"

echo "正在部署API网关..."
npx supabase functions deploy api --project-ref zlbemopcgjohrnyyiwvs