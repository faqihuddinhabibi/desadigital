import { getSetting, getSettings } from './settings.service.js';

const timestamp = () => new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

// All notification event types that can be toggled
export const NOTIFICATION_EVENTS = [
  { key: 'notif_camera_online', label: 'Kamera Online', description: 'Saat kamera kembali online' },
  { key: 'notif_camera_offline', label: 'Kamera Offline', description: 'Saat kamera terputus/offline' },
  { key: 'notif_camera_added', label: 'Kamera Ditambahkan', description: 'Saat kamera baru ditambahkan' },
  { key: 'notif_camera_deleted', label: 'Kamera Dihapus', description: 'Saat kamera dihapus' },
  { key: 'notif_user_login', label: 'User Login', description: 'Saat user berhasil login' },
  { key: 'notif_user_created', label: 'User Baru', description: 'Saat user baru dibuat' },
  { key: 'notif_system_alert', label: 'Peringatan Sistem', description: 'Peringatan kesehatan sistem' },
] as const;

export type NotificationEventKey = typeof NOTIFICATION_EVENTS[number]['key'];

export async function sendTelegramMessage(message: string) {
  const botToken = await getSetting('telegram_bot_token');
  const chatId = await getSetting('telegram_chat_id');
  const enabled = await getSetting('telegram_enabled');

  if (!botToken || !chatId || enabled !== 'true') {
    return null;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    return res.json();
  } catch (error) {
    console.error('Telegram send failed:', error);
    return null;
  }
}

/**
 * Send a telegram notification only if the event type is enabled in settings.
 * eventType maps to settings key "notif_<eventType>" e.g. "camera_online" → "notif_camera_online"
 */
export async function sendTelegramNotification(eventType: string, message: string) {
  const settingKey = `notif_${eventType}`;
  const toggle = await getSetting(settingKey);
  // Default to enabled if setting doesn't exist yet (toggle === null)
  if (toggle === 'false') {
    return null;
  }
  const fullMessage = `${message}\n🕐 ${timestamp()}`;
  return sendTelegramMessage(fullMessage);
}

export async function testTelegramConnection(botToken: string, chatId: string) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '✅ <b>Desa Digital</b>\nKoneksi Telegram berhasil!',
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json() as { ok?: boolean };
    return { success: data.ok === true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getNotificationToggles() {
  const keys = NOTIFICATION_EVENTS.map(e => e.key);
  const values = await getSettings(keys);
  return NOTIFICATION_EVENTS.map(e => ({
    ...e,
    enabled: values[e.key] !== 'false', // default enabled
  }));
}

// ── System Alerts ──

export async function sendSystemAlert(title: string, detail: string) {
  return sendTelegramNotification('system_alert', `⚠️ <b>${title}</b>\n\n${detail}`);
}
