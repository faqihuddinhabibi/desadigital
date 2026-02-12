import { getSetting } from './settings.service.js';

const timestamp = () => new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

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

// ── Camera Alerts with offline list ──

export async function sendCameraOfflineAlert(cameraName: string, location: string, offlineList: string[]) {
  let message = `🔴 <b>Kamera Terputus</b>\n\n📷 <b>${cameraName}</b>\n📍 ${location}\n🕐 ${timestamp()}`;
  if (offlineList.length > 0) {
    message += `\n\n📋 <b>Daftar kamera offline (${offlineList.length}):</b>`;
    for (const name of offlineList) {
      message += `\n  • ${name}`;
    }
  }
  return sendTelegramMessage(message);
}

export async function sendCameraOnlineAlert(cameraName: string, location: string, offlineList: string[]) {
  let message = `🟢 <b>Kamera Terhubung Kembali</b>\n\n📷 <b>${cameraName}</b>\n📍 ${location}\n🕐 ${timestamp()}`;
  if (offlineList.length > 0) {
    message += `\n\n📋 <b>Masih offline (${offlineList.length}):</b>`;
    for (const name of offlineList) {
      message += `\n  • ${name}`;
    }
  } else {
    message += '\n\n✅ Semua kamera online!';
  }
  return sendTelegramMessage(message);
}

// ── System Alerts ──

export async function sendSystemAlert(title: string, detail: string) {
  const message = `⚠️ <b>${title}</b>\n\n${detail}\n🕐 ${timestamp()}`;
  return sendTelegramMessage(message);
}

export async function sendBackupAlert(filename: string, size: string, totalBackups: number) {
  const message = `💾 <b>Backup Database Berhasil</b>\n\n📁 File: <code>${filename}</code>\n📦 Ukuran: ${size}\n🗂 Total backup: ${totalBackups} file\n🕐 ${timestamp()}`;
  return sendTelegramMessage(message);
}
