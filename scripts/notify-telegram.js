/**
 * notify-telegram.js
 *
 * Mengirim notifikasi "versi baru rilis" ke channel Telegram,
 * mirip gaya broadcast fitur baru di WhatsApp: banner + ringkasan singkat,
 * lalu (kalau changelog panjang) pesan lanjutan berisi detail lengkap.
 *
 * Env vars yang dibutuhkan:
 *  - TELEGRAM_BOT_TOKEN
 *  - TELEGRAM_CHAT_ID     (contoh: -1001234567890 untuk channel, atau @nama_channel)
 *  - REPO_NAME            (contoh: adityaaria/SPARK)
 *  - RELEASE_TAG          (contoh: v2.4.0)
 *  - RELEASE_NAME         (opsional, judul release)
 *  - RELEASE_BODY         (isi changelog, biasanya markdown dari GitHub Release)
 *  - RELEASE_URL          (link ke halaman release)
 *  - BANNER_URL           (opsional, URL gambar publik; kalau kosong pakai default di bawah)
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const REPO_NAME = process.env.REPO_NAME || "repo";
const RELEASE_TAG = process.env.RELEASE_TAG || "unknown";
const RELEASE_NAME = process.env.RELEASE_NAME || "";
const RELEASE_BODY = process.env.RELEASE_BODY || "";
const RELEASE_URL = process.env.RELEASE_URL || "";
const BANNER_URL =
  process.env.BANNER_URL ||
  `https://raw.githubusercontent.com/${REPO_NAME}/main/assets/banner.png`;

const TELEGRAM_CAPTION_LIMIT = 1024;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error(
    "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables."
  );
  process.exit(1);
}

// Escape karakter khusus HTML supaya aman dikirim dengan parse_mode HTML
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Ambil beberapa baris pertama changelog untuk ringkasan singkat di caption gambar
function buildHighlights(body, maxLines = 5) {
  if (!body) return "";
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, maxLines);
  return lines.join("\n");
}

function buildCaption() {
  const title = RELEASE_NAME || `${REPO_NAME} ${RELEASE_TAG}`;
  const header = `🚀 <b>${escapeHtml(title)} telah dirilis!</b>\n\n`;
  const link = `📖 <a href="${RELEASE_URL}">Lihat detail lengkap</a>`;

  let highlights = escapeHtml(buildHighlights(RELEASE_BODY));

  // Sisakan ruang untuk header + link + "\n\n" + "..." supaya truncation
  // hanya memotong bagian highlights, tidak pernah memotong tag <a> milik
  // link — kalau link ikut terpotong, Telegram akan reject seluruh pesan
  // karena HTML-nya jadi tidak valid.
  const reserved = header.length + link.length + "\n\n".length;
  const budget = TELEGRAM_CAPTION_LIMIT - reserved - 3;

  if (highlights && highlights.length > budget) {
    highlights = budget > 0 ? `${highlights.slice(0, budget)}...` : "";
  }

  let caption = header;
  if (highlights) {
    caption += `${highlights}\n\n`;
  }
  caption += link;

  return caption;
}

async function telegramApi(method, payload) {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API error (${method}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function sendBannerWithCaption() {
  return telegramApi("sendPhoto", {
    chat_id: CHAT_ID,
    photo: BANNER_URL,
    caption: buildCaption(),
    parse_mode: "HTML",
  });
}

async function sendFullChangelogIfLong(replyToMessageId) {
  if (!RELEASE_BODY || RELEASE_BODY.length <= TELEGRAM_CAPTION_LIMIT) {
    return; // Changelog pendek, sudah cukup di caption
  }

  const fullText =
    `📋 <b>Changelog lengkap ${escapeHtml(RELEASE_TAG)}</b>\n\n` +
    escapeHtml(RELEASE_BODY);

  // Telegram membatasi pesan teks maksimal 4096 karakter
  const chunks = [];
  let remaining = fullText;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, 4000));
    remaining = remaining.slice(4000);
  }

  for (const chunk of chunks) {
    await telegramApi("sendMessage", {
      chat_id: CHAT_ID,
      text: chunk,
      parse_mode: "HTML",
      reply_to_message_id: replyToMessageId,
      disable_web_page_preview: true,
    });
  }
}

async function main() {
  console.log(`Sending release notification for ${REPO_NAME} ${RELEASE_TAG}...`);

  let bannerMessage;
  try {
    bannerMessage = await sendBannerWithCaption();
  } catch (err) {
    console.warn(
      `Gagal kirim foto banner (${err.message}). Fallback ke pesan teks biasa.`
    );
    bannerMessage = await telegramApi("sendMessage", {
      chat_id: CHAT_ID,
      text: buildCaption(),
      parse_mode: "HTML",
      disable_web_page_preview: false,
    });
  }

  const messageId = bannerMessage.result.message_id;
  await sendFullChangelogIfLong(messageId);

  console.log("Notifikasi berhasil dikirim ke Telegram.");
}

main().catch((err) => {
  console.error("Gagal mengirim notifikasi Telegram:", err);
  process.exit(1);
});
