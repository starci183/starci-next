#!/bin/sh
# Runs once, on the first start of an empty data volume (docker-entrypoint-initdb.d): the app's owner role and database. The password comes from the sealed file
# the db grant mounts (member db: DB_OWNER_PASSWORD) as a psql variable. A volume that already holds data never runs it again.
set -eu
psql -v ON_ERROR_STOP=1 --username postgres --dbname postgres   -v owner_secret="$(cat /run/secrets/DB_OWNER_PASSWORD)" <<'SQL'
CREATE ROLE starci_next LOGIN;
ALTER ROLE starci_next WITH PASSWORD :'owner_secret';
CREATE DATABASE starci_next OWNER starci_next;
SQL
