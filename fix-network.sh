#!/bin/bash

echo "🔧 Fixing WSL2 Network Issues..."

# Get WSL2 IP address
WSL_IP=$(hostname -I | awk '{print $1}')
echo "📍 WSL2 IP: $WSL_IP"

# Update hosts file to map localhost to WSL IP
echo "🌐 Updating network configuration..."

# Fix Windows hosts file if accessible
if [ -f "/mnt/c/Windows/System32/drivers/etc/hosts" ]; then
    echo "🪟 Updating Windows hosts file..."
    # Remove old entries
    sudo sed -i '/# WSL2-PARKING/d' /mnt/c/Windows/System32/drivers/etc/hosts
    # Add new entries
    echo "$WSL_IP localhost # WSL2-PARKING" | sudo tee -a /mnt/c/Windows/System32/drivers/etc/hosts
    echo "$WSL_IP parking.local # WSL2-PARKING" | sudo tee -a /mnt/c/Windows/System32/drivers/etc/hosts
fi

# Create local network aliases
echo "🔗 Creating network aliases..."
sudo ip addr add 127.0.0.2/32 dev lo 2>/dev/null || true
sudo ip addr add 127.0.0.3/32 dev lo 2>/dev/null || true

# Set up port forwarding
echo "🚀 Setting up port forwarding..."
sudo iptables -t nat -A OUTPUT -p tcp --dport 3007 -j DNAT --to-destination $WSL_IP:3007 2>/dev/null || true
sudo iptables -t nat -A OUTPUT -p tcp --dport 8000 -j DNAT --to-destination $WSL_IP:8000 2>/dev/null || true

echo "✅ Network configuration updated!"
echo ""
echo "📋 Access URLs:"
echo "   🌐 Frontend: http://localhost:3007"
echo "   🌐 Alt Frontend: http://$WSL_IP:3007" 
echo "   🔗 Backend: http://localhost:8000"
echo "   🔗 Alt Backend: http://$WSL_IP:8000"
echo ""
echo "💡 If localhost still doesn't work, use the IP addresses above"