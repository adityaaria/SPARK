# Telegram Release Notifier

Mengirim notifikasi otomatis ke channel Telegram setiap kali ada **release baru**
di repo GitHub — mirip gaya broadcast "fitur baru" resmi WhatsApp: banner +
ringkasan singkat, dengan opsi changelog lengkap sebagai pesan lanjutan.

## Cara Setup

### 1. Siapkan Bot & Channel Telegram

1. Buat channel baru di Telegram (bisa public atau private).
2. Tambahkan bot kamu sebagai **Administrator** di channel, beri izin
   **"Post Messages"**.
3. Dapatkan **Chat ID** channel:
   - Kirim satu pesan apa saja ke channel.
   - Buka `https://api.telegram.org/bot<TOKEN>/getUpdates` di browser.
   - Cari `"chat":{"id": -100xxxxxxxxxx}` — itu Chat ID-nya.

### 2. Siapkan Banner (opsional tapi disarankan)

Taruh gambar banner di `assets/banner.png` (rasio 16:9 disarankan, misal 1200x630px)
lalu commit & push ke repo. Script akan otomatis memakai gambar ini via:

```
https://raw.githubusercontent.com/<owner>/<repo>/main/assets/banner.png
```

Kalau ingin pakai banner berbeda per rilis, override lewat secret `BANNER_URL`.

### 3. Tambahkan GitHub Secrets

Di repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Isi |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token dari @BotFather |
| `TELEGRAM_CHAT_ID` | Chat ID channel (langkah 1.3) |
| `BANNER_URL` | (opsional) URL gambar custom |

### 4. Selesai — Bot akan otomatis kirim notifikasi

Setiap kali kamu publish **GitHub Release** baru di repo ini, workflow
`.github/workflows/notify-telegram.yml` otomatis jalan dan kirim pesan ke channel.

## Testing Manual (tanpa harus bikin release beneran)

Buka tab **Actions** di GitHub → pilih workflow **"Notify Telegram on Release"** →
**Run workflow** → isi field tag/judul/changelog/url secara manual → Run.

## Format Pesan

- **Pesan 1 (foto + caption)**: banner + judul rilis + beberapa baris pertama
  changelog + link "Lihat detail lengkap"
- **Pesan 2 (opsional, hanya jika changelog panjang)**: isi changelog lengkap,
  dikirim sebagai reply ke pesan pertama, otomatis dipecah jika lebih dari
  4096 karakter (batas Telegram)

## Kustomisasi

Semua logic format pesan ada di `scripts/notify-telegram.js` — gampang diubah:

- Ganti emoji/teks di `buildCaption()`
- Ubah jumlah baris highlight di `buildHighlights(body, maxLines)`
- Ubah HTML jadi MarkdownV2 kalau prefer format lain
