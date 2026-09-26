#!/bin/bash
# Runs once, when the data volume is empty.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
	CREATE DATABASE "${POSTGRES_TEST_DB:-lead_intake_test}" OWNER "$POSTGRES_USER";
SQL
