#!/bin/bash
cat > /var/lib/postgresql/data/pg_hba.conf <<EOL
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
host    all             all             0.0.0.0/0               md5
EOL
chown postgres:postgres /var/lib/postgresql/data/pg_hba.conf
chmod 0600 /var/lib/postgresql/data/pg_hba.conf