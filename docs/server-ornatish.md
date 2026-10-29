# ONUR Task Manager — Windows serverga o‘rnatish

Bu qo‘llanma dasturchi bo‘lmagan administrator uchun. Har bir qadam tartib bilan bajariladi.

## Qanday ishlaydi

```
Brauzer → https://tasks.onur.uz → (DNS) server IP → 443-port → Caddy (HTTPS) → 127.0.0.1:5181 → ONUR Task Manager → data\otm.db
```

- **ONUR Task Manager** — Node.js dasturi. Faqat serverning ichida (`127.0.0.1:5181`) ishlaydi, tashqaridan unga to‘g‘ridan-to‘g‘ri kirib bo‘lmaydi.
- **Caddy** — tashqaridan kelganlarni qabul qiladi, HTTPS sertifikatini o‘zi oladi va yangilaydi, so‘rovni dasturga uzatadi.
- **Ma’lumotlar** — bitta fayl `D:\OnurTasks\data\otm.db` (SQLite) va yuklangan fayllar `D:\OnurTasks\data\files\`. Alohida SQL server kerak emas.
- Ikkalasi ham Windows **Task Scheduler** orqali server yonganda o‘zi ishga tushadi va to‘xtab qolsa, qayta yonadi. RDP’dan chiqib ketsangiz ham ishlayveradi.

## Papkalar

```
D:\OnurTasks\
  app\        ← dastur kodi (GitHub’dan)
  data\       ← baza va fayllar  (ZAXIRA QILINADI)
  backups\    ← kunlik zaxira nusxalar
  logs\       ← server.log, backup.log, caddy.log
  caddy\      ← caddy.exe va Caddyfile
  otm.env     ← sozlamalar
```

Disk boshqa bo‘lsa (masalan `E:`), hamma joyda `D:` ni almashtiring.

---

## 1-bosqich. Serverga kerakli dasturlar (bir marta)

1. **Node.js 22 LTS** — https://nodejs.org → *LTS* → Windows Installer (.msi) → hammasini “Next” bilan o‘rnating.
2. **Git** — https://git-scm.com/download/win → standart sozlamalar bilan o‘rnating.
3. PowerShell’ni yopib, qayta oching va tekshiring:
   ```powershell
   node --version     # v22.13 yoki yangiroq bo‘lishi kerak
   git --version
   ```

## 2-bosqich. Dasturni yuklab olish va o‘rnatish

**PowerShell → o‘ng tugma → Run as administrator**:

```powershell
mkdir D:\OnurTasks
cd D:\OnurTasks
git clone -b server https://github.com/Umaariy/Onur-Task-Manager-.git app
cd app
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\windows-server\install.ps1
```

Skript o‘zi: paketlarni o‘rnatadi, dasturni yig‘adi, `D:\OnurTasks\otm.env` faylini yaratadi, xizmatni va kunlik zaxirani ro‘yxatdan o‘tkazadi, serverni yoqadi. Oxirida **“TAYYOR”** yozuvi chiqadi.

> Repozitoriy Private bo‘lsa, `git clone` GitHub login va **Personal access token** so‘raydi (GitHub → Settings → Developer settings → Tokens).

## 3-bosqich. Ichki sinov (internetga ochmasdan)

1. Serverning o‘zida (RDP ichida) brauzerda oching: `http://127.0.0.1:5181/setup`
2. `D:\OnurTasks\data\setup-key.txt` faylini Notepad’da oching, ichidagi kalitni nusxalang.
3. Setup sahifasida: email, kamida 8 belgili parol va shu kalit → **bosh administrator** yaratiladi.
4. Kirib ko‘ring: doska, kartochka qo‘shish, fayl yuklash.
5. Kalit endi kerak emas — `setup-key.txt` ni xavfsiz joyga ko‘chirib, serverdan o‘chirishingiz mumkin.

## 4-bosqich. Internetga ochish

**4.1. Domen (siz, domen panelida)**
`tasks` subdomeni uchun **A** yozuv: qiymati — serverning **tashqi IP** manzili. Tarqalishi 5 daqiqadan bir necha soatgacha.

Tekshirish (istalgan kompyuterda): `nslookup tasks.onur.uz` → serverning tashqi IP chiqishi kerak.

**4.2. Portlar (server admini)**
Datacenter / tarmoq firewall’ida shu serverga **80** va **443** (TCP) ochilsin.
**5181** va **3389 (RDP)** internetga ochilmasin.

**4.3. Caddy (siz, serverda)**
1. https://caddyserver.com/download → *Windows amd64* → yuklangan faylni `caddy.exe` deb nomlab, `D:\OnurTasks\caddy\` ga qo‘ying.
2. `D:\OnurTasks\app\scripts\windows-server\Caddyfile` ni `D:\OnurTasks\caddy\` ga nusxalang va ichidagi `tasks.onur.uz` ni o‘z domeningizga almashtiring (Notepad).
3. `D:\OnurTasks\otm.env` da `OTM_PUBLIC_URL=https://tasks.onur.uz` to‘g‘ri ekanini tekshiring.
4. Administrator PowerShell:
   ```powershell
   cd D:\OnurTasks\app
   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\windows-server\install-caddy.ps1
   ```
5. 1–2 daqiqadan keyin telefonda (Wi-Fi’siz, mobil internetda) `https://tasks.onur.uz` ni oching — qulf belgisi bilan login sahifasi chiqishi kerak.

---

## Kundalik ishlar

| Nima | Qanday |
|---|---|
| Ishlayaptimi? | Task Scheduler → “ONUR Task Manager” → Status: *Running*. Log: `D:\OnurTasks\logs\server.log` |
| Qayta yoqish | Task Scheduler → “ONUR Task Manager” → End → Run |
| Zaxira nusxa | Har kuni 02:00 da avtomatik: `D:\OnurTasks\backups\YYYY-MM-DD_HHmm\`. 30 kundan eskilari o‘chadi. Qo‘lda: `cd D:\OnurTasks\app; npm run backup` |
| Yangilash | Administrator PowerShell: `cd D:\OnurTasks\app; powershell -NoProfile -ExecutionPolicy Bypass -File scripts\windows-server\update.ps1` (avval zaxira oladi) |

**Zaxira nusxani boshqa joyga ham ko‘chiring** (boshqa disk yoki tarmoq papkasi) — server diski buzilsa, shu serverdagi nusxa ham yo‘qoladi.

## Zaxiradan tiklash

1. Task Scheduler → “ONUR Task Manager” → **End**.
2. `D:\OnurTasks\data\` ni boshqa nomga o‘zgartiring (masalan `data-eski`).
3. Kerakli zaxira papkasidan `otm.db` va `files\` ni yangi `D:\OnurTasks\data\` ga nusxalang.
4. Task Scheduler → **Run**. Kirib tekshiring.

## Muammolar

| Belgi | Sabab va yechim |
|---|---|
| Brauzerda sahifa ochilmaydi | `nslookup` domen IP sini to‘g‘ri ko‘rsatyaptimi? 80/443 ochiqmi? `logs\caddy.log` |
| “Juda ko‘p urinish” | Bitta IP dan 15 daqiqada 30 ta xato login. 15 daqiqa kuting |
| “Boshqa saytdan yozish taqiqlangan” | `otm.env` dagi `OTM_PUBLIC_URL` brauzerdagi manzil bilan bir xil emas |
| Server log’da xato | `logs\server.log` oxirgi qatorlarini dasturchiga yuboring |
