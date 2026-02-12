import { getSetting } from './settings.service.js';

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

export async function sendCameraOfflineAlert(cameraName: string, location: string) {
  const message = `🔴 <b>Kamera Offline</b>\n\n📷 <b>${cameraName}</b>\n📍 ${location}\n🕐 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
  return sendTelegramMessage(message);
}

export async function sendCameraOnlineAlert(cameraName: string, location: string) {
  const message = `🟢 <b>Kamera Online</b>\n\n📷 <b>${cameraName}</b>\n📍 ${location}\n🕐 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
  return sendTelegramMessage(message);
}

export async function sendSystemAlert(title: string, detail: string) {
  const message = `⚠️ <b>${title}</b>\n\n${detail}\n🕐 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
  return sendTelegramMessage(message);
}
