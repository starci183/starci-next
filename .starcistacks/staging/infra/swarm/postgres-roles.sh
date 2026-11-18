#!/bin/sh
# Runs once, on the first start of an empty data volume (docker-entrypoint-initdb.d): the app's owner role and database, and Keycloak's own role and
# database. The passwords come from the sealed files the postgres grant mounts (member db: DB_OWNER_PASSWORD, KEYCLOAK_DB_PASSWORD) as psql variables.
set -eu
psql -v ON_ERROR_STOP=1 --username postgres --dbname postgres   -v owner_secret="$(cat /run/secrets/DB_OWNER_PASSWORD)"   -v keycloak_secret="$(cat /run/secrets/KEYCLOAK_DB_PASSWORD)" <<'SQL'
CREATE ROLE starci_next LOGIN;
ALTER ROLE starci_next WITH PASSWORD :'owner_secret';
CREATE DATABASE starci_next OWNER starci_next;
CREATE ROLE keycloak LOGIN;
ALTER ROLE keycloak WITH PASSWORD :'keycloak_secret';
CREATE DATABASE keycloak OWNER keycloak;
SQL
