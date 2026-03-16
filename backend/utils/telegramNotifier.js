const TELEGRAM_API_BASE = 'https://api.telegram.org';

export const isTelegramConfigured = () => {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
};

export const sendTelegramMessage = async (message) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error('Telegram bot token or chat id is missing');
  }

  const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: String(message || ''),
    disable_web_page_preview: true,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result?.description || 'Telegram API request failed');
  }

  return result;
};
