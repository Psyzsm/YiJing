#!/bin/bash

# =============================================================================
# YÌJÌNG OS: INFRASTRUCTURE PROVISIONING SCRIPT
# =============================================================================

echo "===================================================="
echo "[SYSTEM] Yìjìng OS Initialization Routine Started"
echo "===================================================="
echo ""

# -----------------------------------------------------------------------------
# 0. System Dependency Validation
# -----------------------------------------------------------------------------
if ! command -v docker &> /dev/null; then
  echo "[0/6] WARN: Docker executable not found in PATH."
  read -p ">> Initialize automated Docker installation? (y/n): " INSTALL_DOCKER
  if [[ "$INSTALL_DOCKER" =~ ^[Yy]$ ]]; then
    echo "  -> Downloading and executing Docker provisioning script..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    echo "  -> OK: Docker installed successfully."
  else
    echo "FATAL: Docker is required. Manual installation necessary. Exiting."
    exit 1
  fi
fi

# -----------------------------------------------------------------------------
# 1. Cryptographic Initialization
# -----------------------------------------------------------------------------
echo "[1/6] Generating Cryptographic Keys..."
HMAC_KEY=$(tr -dc 'a-zA-Z0-9' < /dev/urandom | fold -w 25 | head -n 1)

# -----------------------------------------------------------------------------
# 2. Environment Configuration
# -----------------------------------------------------------------------------
echo "[2/6] Writing Environment Variables..."
if [ ! -f .env.local ]; then
  cat <<EOF > .env.local
# --- ALTCHA CRYPTOGRAPHY ---
ALTCHA_HMAC_KEY=${HMAC_KEY}

# --- GHOST CMS API ---
GHOST_API_URL=http://yijing-ghost:2368
GHOST_CONTENT_API_KEY=insert_api_key_here

# --- SMTP EMAIL (Contact Vault) ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=insert_email@gmail.com
SMTP_PASS=insert_app_password
DESTINATION_EMAIL=insert_destination@gmail.com
EOF
  echo "  -> OK: Generated .env.local with secure HMAC parameter."
else
  echo "  -> OK: .env.local already exists. Bypassing creation to prevent overwrite."
fi

# -----------------------------------------------------------------------------
# 3. Package Manager Security Policies
# -----------------------------------------------------------------------------
echo "[3/6] Applying Build Security Permissions..."
cat <<EOF > pnpm-workspace.yaml
packages:
  - '.'

allowBuilds:
  sharp: true
  unrs-resolver: true
EOF
echo "  -> OK: Generated pnpm-workspace.yaml."

# -----------------------------------------------------------------------------
# 4. Proxy & Topology Setup
# -----------------------------------------------------------------------------
echo "[4/6] Configuring Infrastructure Topology..."
read -p ">> Deploy local Ghost CMS instance alongside the OS environment? (y/n): " INSTALL_GHOST
read -p ">> Configure Caddy (SSL & Reverse Proxy) automatically? (y/n): " INSTALL_CADDY

if [[ "$INSTALL_CADDY" =~ ^[Yy]$ ]]; then
  read -p ">> Enter target domain name (e.g., example.com): " RAW_DOMAIN
  # Force domain to lowercase to prevent Let's Encrypt SSL errors
  USER_DOMAIN=$(echo "$RAW_DOMAIN" | tr '[:upper:]' '[:lower:]')
  
  if [[ "$INSTALL_GHOST" =~ ^[Yy]$ ]]; then
    # Write Caddyfile with Subdomain Routing
    cat <<EOF > Caddyfile
blog.${USER_DOMAIN} {
    reverse_proxy yijing-ghost:2368
}

${USER_DOMAIN}, portfolio.${USER_DOMAIN} {
    reverse_proxy yijing-os:3000
}
EOF
  else
    # Write Caddyfile for OS Only
    cat <<EOF > Caddyfile
${USER_DOMAIN}, portfolio.${USER_DOMAIN} {
    reverse_proxy yijing-os:3000
}
EOF
  fi
  echo "  -> OK: Generated Caddyfile for ${USER_DOMAIN}."
fi

# -----------------------------------------------------------------------------
# 5. Container Orchestration Setup
# -----------------------------------------------------------------------------
echo "[5/6] Generating Docker Compose Manifest..."

cat <<EOF > docker-compose.yml
services:
  yijing-os:
    build: .
    container_name: yijing-os
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env.local
EOF

if [[ "$INSTALL_GHOST" =~ ^[Yy]$ ]]; then
cat <<EOF >> docker-compose.yml

  ghost:
    image: ghost:latest
    container_name: yijing-ghost
    restart: unless-stopped
    ports:
      - "2368:2368"
    environment:
      url: https://blog.${USER_DOMAIN:-localhost}
      database__client: sqlite3
      database__connection__filename: content/data/ghost.db
      database__useNullAsDefault: "true"
      database__debug: "false"
    volumes:
      - ghost_data:/var/lib/ghost/content
EOF
fi

if [[ "$INSTALL_CADDY" =~ ^[Yy]$ ]]; then
cat <<EOF >> docker-compose.yml

  caddy:
    image: caddy:latest
    container_name: yijing-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - yijing-os
EOF
fi

# -----------------------------------------------------------------------------
# 6. Volume Registry Mapping
# -----------------------------------------------------------------------------
if [[ "$INSTALL_GHOST" =~ ^[Yy]$ ]] || [[ "$INSTALL_CADDY" =~ ^[Yy]$ ]]; then
cat <<EOF >> docker-compose.yml

volumes:
EOF

  if [[ "$INSTALL_GHOST" =~ ^[Yy]$ ]]; then
    echo "  ghost_data: {}" >> docker-compose.yml
  fi
  if [[ "$INSTALL_CADDY" =~ ^[Yy]$ ]]; then
    echo "  caddy_data: {}" >> docker-compose.yml
    echo "  caddy_config: {}" >> docker-compose.yml
  fi
fi

echo "[6/6] OK: Ecosystem Topology Configured."

echo ""
echo "===================================================="
echo "[SYSTEM] SETUP ROUTINE COMPLETE."
echo "===================================================="
echo ""

read -p ">> Initiate Ecosystem Boot Sequence? (y/n): " BOOT_NOW

if [[ "$BOOT_NOW" =~ ^[Yy]$ ]]; then
  echo "-> Triggering deployment..."
  chmod +x update.sh
  ./update.sh
  
  if [[ "$INSTALL_GHOST" =~ ^[Yy]$ ]]; then
    echo ""
    echo "!WARNING!  POST-INSTALLATION: GHOST CMS !WARNING!"
    echo "===================================================
    echo "Your ecosystem is live! To connect your blogs:"
    echo "1. Go to https://blog.${USER_DOMAIN}/ghost and create your admin account."
    echo "2. Create a Custom Integration and copy the Content API Key."
    echo "3. Paste that key into your .env.local file."
    echo "4. Run './update.sh' one last time to sync the database."
    echo ""
  fi
else
  echo "Deployment Pending. Run './update.sh' when ready."
fi