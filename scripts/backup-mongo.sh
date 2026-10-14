#!/usr/bin/env bash
# Dumps a MongoDB Atlas database (mongodump --archive --gzip) and uploads the
# resulting archive to a Google Drive folder via rclone, authenticated as a
# real Google account (OAuth user token, not a service account - service
# accounts have no storage quota of their own on personal/non-Workspace
# Drive and fail on upload), then prunes backups older than the retention
# window. Intended to run from the "Backup MongoDB" GitHub Actions workflow,
# but is a plain script so it can also be run manually/locally.
#
# Drive has no native lifecycle/expiry rules the way S3-compatible object
# storage does, so retention is enforced here, after every successful
# upload, rather than left to the storage layer.
#
# The OAuth token was minted once, locally, via:
#   rclone authorize "drive" --drive-scope drive.file <client_id> <client_secret>
# scope is pinned to drive.file (non-sensitive - avoids Google's
# app-verification requirement) which means this app can only see files/
# folders it creates itself - hence uploading into a folder path under
# BACKUP_FOLDER_NAME that rclone creates on first run, rather than a
# pre-existing folder.
#
# Required env vars:
#   MONGO_URI                  mongodb+srv:// connection string, including
#                              the target database name (mongodump backs up
#                              only that database, matching the app's own
#                              scope)
#   GDRIVE_CLIENT_ID            OAuth client ID (Desktop app type)
#   GDRIVE_CLIENT_SECRET         OAuth client secret
#   GDRIVE_OAUTH_TOKEN_JSON       Full token JSON printed by `rclone
#                              authorize` (access_token/refresh_token/expiry)
#
# Optional env vars:
#   BACKUP_ENV_LABEL            Logical environment name, used in the
#                              filename so multiple environments can share
#                              one folder without colliding. Default: production
#   BACKUP_RETENTION_DAYS       Backups older than this are deleted after a
#                              successful upload. Default: 30
#   BACKUP_FOLDER_NAME          Drive folder (under "My Drive") backups are
#                              uploaded into; created automatically on first
#                              run. Default: sm-enterprises-mongo-backups
set -euo pipefail

: "${MONGO_URI:?Set MONGO_URI}"
: "${GDRIVE_CLIENT_ID:?Set GDRIVE_CLIENT_ID}"
: "${GDRIVE_CLIENT_SECRET:?Set GDRIVE_CLIENT_SECRET}"
: "${GDRIVE_OAUTH_TOKEN_JSON:?Set GDRIVE_OAUTH_TOKEN_JSON}"

BACKUP_ENV_LABEL="${BACKUP_ENV_LABEL:-production}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
BACKUP_FOLDER_NAME="${BACKUP_FOLDER_NAME:-sm-enterprises-mongo-backups}"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE_NAME="mongo-${BACKUP_ENV_LABEL}-${TIMESTAMP}.archive.gz"

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "${TMP_DIR}"; }
trap cleanup EXIT

ARCHIVE_PATH="${TMP_DIR}/${ARCHIVE_NAME}"

# Config-less rclone remote, defined entirely via env vars - no rclone.conf
# file needed.
export RCLONE_CONFIG_GDRIVE_TYPE=drive
export RCLONE_CONFIG_GDRIVE_SCOPE=drive.file
export RCLONE_CONFIG_GDRIVE_CLIENT_ID="${GDRIVE_CLIENT_ID}"
export RCLONE_CONFIG_GDRIVE_CLIENT_SECRET="${GDRIVE_CLIENT_SECRET}"
export RCLONE_CONFIG_GDRIVE_TOKEN="${GDRIVE_OAUTH_TOKEN_JSON}"

REMOTE_DIR="gdrive:${BACKUP_FOLDER_NAME}"

echo "[backup-mongo] Dumping '${BACKUP_ENV_LABEL}' database..."
mongodump --uri="${MONGO_URI}" --archive="${ARCHIVE_PATH}" --gzip

echo "[backup-mongo] Uploading ${ARCHIVE_NAME} to ${REMOTE_DIR} ..."
rclone copy "${ARCHIVE_PATH}" "${REMOTE_DIR}" --no-traverse

echo "[backup-mongo] Pruning backups older than ${BACKUP_RETENTION_DAYS} days..."
rclone delete "${REMOTE_DIR}" --min-age "${BACKUP_RETENTION_DAYS}d" --include "mongo-${BACKUP_ENV_LABEL}-*.archive.gz"

echo "[backup-mongo] Done - ${ARCHIVE_NAME} uploaded."
