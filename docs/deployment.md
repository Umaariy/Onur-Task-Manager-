# O‘rnatish, boshqaruv va tiklash

## O‘rnatish

O‘rnatish, domen, HTTPS, xizmat va yangilash: [server-ornatish.md](server-ornatish.md).

Platforma oddiy Node.js serverda ishlaydi: baza `OTM_DATA_DIR/otm.db` (SQLite), fayllar `OTM_DATA_DIR/files/`. Migratsiyalar server ishga tushganda avtomatik va bir marta qo‘llanadi (`_otm_migrations` jadvali). Birinchi Owner `OTM_DATA_DIR/setup-key.txt` kaliti bilan `/setup` da yaratiladi.

## Admin

- Birinchi Owner `/setup` va maxfiy kalit orqali yaratiladi; u platforma admini bo‘ladi.
- Workspace Admin Owner’ni pasaytira olmaydi. Oxirgi faol Owner himoyalangan.
- Board rol matritsasi Sozlamalar ekranida saqlanadi. Board Admin va No access asosiy rollari o‘zgartirilmaydi.
- Deactivate ma’lumotlarni o‘chirmaydi. Keyingi API so‘rovdan boshlab foydalanuvchi bloklanadi.
- Platforma administratori admin panelda foydalanuvchining ismi, emaili va parolini belgilab hisob yaratadi. Tayyor taklif xati mahalliy email ilovasida ochiladi; pochta provayderisiz avtomatik yuborilmaydi. Parolni xodimga xatdan alohida yetkazing. Parolni yangilash barcha sessiyalarni tugatadi. Eski bir martalik parol tiklash API ham mavjud.
- Xavfsizlik voqealari audit jadvalida. Ilovada audit o‘chirish endpointi mavjud emas.
- Namuna a’zolarni haqiqiy xodim deb hisoblamang. Haqiqiy email uchun yangi hisob yaratib, kerakli board rolini belgilang.
- `example.test` manzillariga hech qanday xat yuborilmaydi.

## Backup

`npm run backup` (`scripts/server/backup.mjs`) bazaning izchil nusxasini (`VACUUM INTO`) va `files/` papkasini `OTM_BACKUP_DIR/YYYY-MM-DD_HHmm/` ga yozadi, nusxani ochib tekshiradi va `OTM_BACKUP_KEEP_DAYS` (standart 30) kundan eskilarini o‘chiradi. Windows’da `install.ps1` uni har kuni 02:00 ga rejalashtiradi. Nusxalarni server diskidan tashqariga ham ko‘chirib turing.

Tiklash tartibi:

1. Maqsadli izolyatsiyalangan muhitni aniqlang va yozishlarni to‘xtating.
2. Zaxiradagi `otm.db`, `files/` va source commit bir sanaga mosligini tekshiring.
3. Serverni to‘xtating, zaxiradagi `otm.db` va `files/` ni `OTM_DATA_DIR` ga qo‘ying.
4. Mos source versiyani ishga tushiring; `_otm_migrations` tarixini tekshiring.
5. Owner kirishi, private card filtri, ACL, izoh, fayl havolasi va audit read-back testini bajaring.
6. Sinov muvaffaqiyatli bo‘lsa yozishlarni qayta oching. Har chorak alohida tiklash mashqi o‘tkazing.

Haqiqiy backup/tiklash sinovi bu topshirishda bajarilmagan. Server yurisdiksiyasi, SMTP, Telegram tokeni, SMS provayderi, tashkilot repozitoriysi va production siyosatlari hali taqdim etilmagan.
