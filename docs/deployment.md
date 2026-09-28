# O‘rnatish, boshqaruv va tiklash

## Talablar

Node.js 22.13+; npm; loyiha ildizidagi package-lock.json. Sites orqali private Worker deploy, D1 `DB`, R2 `BUCKET`. `.openai/hosting.json` mavjud site identifikatorini saqlaydi; qayta site yaratmang.

Mahalliy ishga tushirish:

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_clever_warstar.sql
node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_otm_accounts.sql
node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_password_resets.sql
npm run dev
```

Migratsiyani avval qo‘llangan bazaga qayta bajarmang. Mavjud bazada `0000` oldin qo‘llangan bo‘lsa, faqat `0001` va `0002` ni bajaring. Dastlab bazaning alohida nusxasini oling. `npm run db:generate` faqat sxema keyinchalik o‘zgartirilganda kerak; joriy migratsiyalar tayyor.

Preview server ko‘rsatgan loopback manzilidan ochiladi. `.dev.vars` ichida `OTM_SETUP_SECRET=` qiymatini o‘rnating va serverni qayta ishga tushiring. `/setup` sahifasida Owner emaili, yangi parol va shu kalitni kiriting. Agar bazada eski bitta Owner bo‘lsa, uning ish maydoni va vazifalari ko‘chadi. Keyingi kirishlar `/login` orqali bo‘ladi. `.dev.vars` va parollarni kod arxiviga yoki ommaviy repozitoriyga qo‘shmang.

## Nashr

Production uchun D1 `DB`, R2 `BUCKET`, HTTPS va kuchli `OTM_SETUP_SECRET` secret binding tayyorlang. Production bazasiga `0000`, `0001`, `0002` migratsiyalarini qo‘llang; mavjud baza bo‘lsa faqat yangi migratsiyalarni qo‘llang. Shundan keyin mos source versiyani deploy qiling va Owner hisobini o‘rnating. Hostingning tashqi auditoriya cheklovlarini alohida sozlang. Oldingi kod versiyasiga qaytish sxema migratsiyasini avtomatik qaytarmaydi.

## Admin

- Birinchi Owner `/setup` va maxfiy kalit orqali yaratiladi; u platforma admini bo‘ladi.
- Workspace Admin Owner’ni pasaytira olmaydi. Oxirgi faol Owner himoyalangan.
- Board rol matritsasi Sozlamalar ekranida saqlanadi. Board Admin va No access asosiy rollari o‘zgartirilmaydi.
- Deactivate ma’lumotlarni o‘chirmaydi. Keyingi API so‘rovdan boshlab foydalanuvchi bloklanadi.
- Platforma administratori admin panelda foydalanuvchining ismi, emaili va parolini belgilab hisob yaratadi. Tayyor taklif xati mahalliy email ilovasida ochiladi; pochta provayderisiz avtomatik yuborilmaydi. Parolni xodimga xatdan alohida yetkazing. Parolni yangilash barcha sessiyalarni tugatadi. Eski bir martalik parol tiklash API ham mavjud.
- Xavfsizlik voqealari audit jadvalida. Ilovada audit o‘chirish endpointi mavjud emas.
- Namuna a’zolarni haqiqiy xodim deb hisoblamang. Haqiqiy email uchun yangi hisob yaratib, kerakli board rolini belgilang.
- `example.test` manzillariga hech qanday xat yuborilmaydi.

## Backup siyosati — hali avtomatlashtirilmagan

T.Z. uchun tavsiya etilgan tashqi backup jarayoni: har kuni D1 to‘liq SQL eksporti, R2 obyektlarining versiyalangan nusxasi va source commit identifikatori. Kamida 30 kun saqlash, alohida cheklangan storage va shifrlash. Ish maydoni maxfiy ma’lumotlari bor backup’ni ochiq repozitoriyga kiritmang.

Bu jarayonning job’i nashrda sozlanmagan. Sites boshqaruvidagi resurslar uchun platforma ruxsatli export/backup usuli yoki buyurtmachining o‘z infratuzilmasi talab qilinadi. Tashqi Cloudflare hisobini bilmasdan taxminiy database ID bilan buyruq ishlatmang.

Tiklash tartibi:

1. Maqsadli izolyatsiyalangan muhitni aniqlang va yozishlarni to‘xtating.
2. Baza SQL nusxasi, R2 nusxasi va source commit bir sanaga mosligini tekshiring.
3. Bo‘sh bazaga SQL import qiling, obyekt kalitlarini aynan saqlab R2’ga tiklang.
4. Mos source versiyani deploy qiling; migration tarixini tekshiring.
5. Owner kirishi, private card filtri, ACL, izoh, fayl havolasi va audit read-back testini bajaring.
6. Sinov muvaffaqiyatli bo‘lsa yozishlarni qayta oching. Har chorak alohida tiklash mashqi o‘tkazing.

Haqiqiy backup/tiklash sinovi bu topshirishda bajarilmagan. Server yurisdiksiyasi, SMTP, Telegram tokeni, SMS provayderi, tashkilot repozitoriysi va production siyosatlari hali taqdim etilmagan.
