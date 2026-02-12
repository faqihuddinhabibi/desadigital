#!/bin/sh
# Daily database backup script for Desa Digital
# Runs via cron inside db-backup container

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="desa_digital_${DATE}.sql.gz"
KEEP_DAYS=7

echo "[$(date)] Starting database backup..."

# Create backup
pg_dump | gzip > "${BACKUP_DIR}/${FILENAME}"

if [ $? -eq 0 ]; then
  SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
  echo "[$(date)] Backup successful: ${FILENAME} (${SIZE})"

  # Delete old backups (older than KEEP_DAYS days)
  find "${BACKUP_DIR}" -name "desa_digital_*.sql.gz" -mtime +${KEEP_DAYS} -delete
  REMAINING=$(ls -1 "${BACKUP_DIR}"/desa_digital_*.sql.gz 2>/dev/null | wc -l)
  echo "[$(date)] Cleanup done. ${REMAINING} backups remaining."

  # Send Telegram notification if configured
  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    MSG="💾 <b>Backup Database Berhasil</b>%0A%0A📁 File: <code>${FILENAME}</code>%0A📦 Ukuran: ${SIZE}%0A🗂 Total backup: ${REMAINING} file%0A🕐 $(date '+%d/%m/%Y %H:%M WIB')"
    curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${MSG}&parse_mode=HTML" > /dev/null 2>&1
  fi
else
  echo "[$(date)] Backup FAILED!"

  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    MSG="❌ <b>Backup Database GAGAL</b>%0A%0A🕐 $(date '+%d/%m/%Y %H:%M WIB')%0APeriksa logs: docker logs desa-digital-backup"
    curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${MSG}&parse_mode=HTML" > /dev/null 2>&1
  fi
fi
