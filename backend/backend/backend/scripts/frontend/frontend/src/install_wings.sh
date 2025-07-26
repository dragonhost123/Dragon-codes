#!/bin/bash
set -e

echo "Installing latest Wings..."

WINGS_VERSION=$(curl -s https://api.github.com/repos/pterodactyl/wings/releases/latest | grep tag_name | cut -d '"' -f 4)
curl -L "https://github.com/pterodactyl/wings/releases/download/$WINGS_VERSION/wings_linux_amd64" -o /usr/local/bin/wings
chmod +x /usr/local/bin/wings

mkdir -p /etc/pterodactyl

cat > /etc/pterodactyl/config.yml << EOF
api:
  host: "::"
  port: 8080
  ssl:
    enabled: false

panel:
  url: http://localhost:3000
  token_id: your-token-id
  token: your-token
EOF

echo "Starting Wings daemon..."
wings
