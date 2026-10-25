#!/bin/bash
set -euo pipefail
# Runs only inside the dedicated VM. No host folders are mounted.
export DEBIAN_FRONTEND=noninteractive
if dpkg-query -W -f='${Status}' onlyoffice-documentserver 2>/dev/null | grep -q 'install ok installed'; then
  echo 'ONLYOFFICE is already installed; preserving its configuration.'
  exit 0
fi
sudo env DEBIAN_FRONTEND=noninteractive apt-get update -qq
sudo env DEBIAN_FRONTEND=noninteractive apt-get install --no-remove -y ca-certificates curl gnupg nginx postgresql rabbitmq-server fonts-liberation fonts-noto-cjk
key_dir=$(mktemp -d)
curl --fail --silent --show-error --location https://download.onlyoffice.com/GPG-KEY-ONLYOFFICE -o "$key_dir/onlyoffice.asc"
gpg --show-keys --with-colons "$key_dir/onlyoffice.asc" | grep -q '^fpr:::::::::E09CA29F6E178040EF22B4098320CA65CB2DE8E5:'
gpg --batch --dearmor --output "$key_dir/onlyoffice.gpg" "$key_dir/onlyoffice.asc"
sudo install -m 0644 "$key_dir/onlyoffice.gpg" /usr/share/keyrings/codex-office-onlyoffice.gpg
printf '%s\n' 'deb [signed-by=/usr/share/keyrings/codex-office-onlyoffice.gpg] https://download.onlyoffice.com/repo/debian squeeze main' | sudo tee /etc/apt/sources.list.d/codex-office-onlyoffice.list >/dev/null
sudo systemctl start postgresql rabbitmq-server
password_file=/var/lib/postgresql/codex-office-db-password
if ! sudo test -f "$password_file"; then
  openssl rand -hex 24 | sudo tee "$password_file" >/dev/null
  sudo chmod 600 "$password_file"
fi
office_db_password=$(sudo cat "$password_file")
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='onlyoffice'" | grep -q 1; then
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE USER onlyoffice WITH PASSWORD '$office_db_password';" >/dev/null
fi
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='onlyoffice'" | grep -q 1; then
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c 'CREATE DATABASE onlyoffice OWNER onlyoffice;' >/dev/null
fi
printf '%s\n' 'onlyoffice-documentserver onlyoffice/db-host string localhost' "onlyoffice-documentserver onlyoffice/db-pwd password $office_db_password" 'onlyoffice-documentserver onlyoffice/ds-port select 8083' 'onlyoffice-documentserver onlyoffice/jwt-enabled boolean true' | sudo debconf-set-selections
sudo env DEBIAN_FRONTEND=noninteractive apt-get update -qq
sudo env DEBIAN_FRONTEND=noninteractive apt-get install --no-remove -y onlyoffice-documentserver=10.0.0-169
printf '%s\n' 'ONLYOFFICE installed in the local VM.'
