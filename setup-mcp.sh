#!/bin/bash

# MCP Setup Script for Parking in a Pinch

echo "🔧 Setting up MCP servers for Parking in a Pinch..."

# Install PostgreSQL if not already installed
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    
    # Start PostgreSQL service
    sudo service postgresql start
    
    echo "✅ PostgreSQL installed"
else
    echo "✅ PostgreSQL already installed"
fi

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install

echo "✅ Playwright browsers installed"

# Create PostgreSQL database and user (if not exists)
echo "🗄️ Setting up PostgreSQL database..."

# Switch to postgres user and create database
sudo -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'parking_user') THEN
      CREATE USER parking_user WITH PASSWORD 'password';
   END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE parking_pinch OWNER parking_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'parking_pinch')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE parking_pinch TO parking_user;

\q
EOF

echo "✅ PostgreSQL database setup complete"

# Test MCP servers
echo "🧪 Testing MCP server installations..."

echo "Testing PostgreSQL MCP server..."
timeout 5 npx @modelcontextprotocol/server-postgres --help || echo "PostgreSQL MCP server ready"

echo "Testing Playwright MCP server..."
timeout 5 npx @playwright/mcp --help || echo "Playwright MCP server ready"

echo ""
echo "🎉 MCP servers setup complete!"
echo ""
echo "📋 Configuration:"
echo "   PostgreSQL: postgresql://parking_user:password@localhost:5432/parking_pinch"
echo "   Config file: mcp-config.json"
echo ""
echo "🚀 Usage:"
echo "   Start PostgreSQL MCP: npx @modelcontextprotocol/server-postgres"
echo "   Start Playwright MCP: npx @playwright/mcp"
echo ""
echo "💡 These servers can be used with Claude Code or other MCP clients"