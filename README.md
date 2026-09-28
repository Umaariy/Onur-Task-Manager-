# ONUR Task Manager

Kanban asosidagi vazifalar platformasi. Uch til (o‘zbek lotin, o‘zbek kirill, rus), ish maydonlari, rollar, fayllar, hisobotlar hamda admin tomonidan boshqariladigan email/parol kirishi mavjud.

## Mahalliy ishga tushirish

Node.js 22.13+ talab qilinadi. GitHub’dan nusxa olgach, buyruqlarni loyiha ildizida bajaring:

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_clever_warstar.sql
node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_otm_accounts.sql
node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_password_resets.sql
npm run dev
```

Migratsiyalarni **faqat hali qo‘llanmagan bazada** ketma-ket bajaring. Mavjud baza uchun birinchi fayl ilgari qo‘llangan bo‘lsa, faqat `0001` va `0002` kerak. `npm run dev` manzili `http://127.0.0.1:5173/`.

Loyiha ildizida Git’ga kirmaydigan `.dev.vars` fayl yarating. Unda `OTM_SETUP_SECRET=` dan keyin kamida 32 baytli tasodifiy qiymat bo‘lsin. Bu parolni eslatadigan so‘z emas, birinchi Owner hisobiga ruxsat beruvchi maxfiy kalit. Birinchi Owner hisobini `/setup` sahifasida shu kalit, o‘zingiz tanlagan email va kamida 8 belgili parol bilan yarating. Ilgari yaratilgan bitta Owner ish maydoni va vazifalari yangi hisobga ko‘chadi. Keyingi tashriflar `/login` sahifasiga yo‘naltiriladi.

## Foydalanuvchilar

Platforma administratori avval **Sozlamalar → Doska rollari va huquqlar** bo‘limida rolni va uning uch tildagi nomini belgilaydi. Keyin **Admin panel → Foydalanuvchi yaratish** oynasida ism, email, kamida 8 belgili boshlang‘ich parol, bo‘lim va shu rollardan birini tanlaydi. Tanlangan rol barcha mavjud va keyingi doskalarga beriladi. Hisob yaratilgach, **Email ilovasida taklifni yuborish** tayyor xatni administratorning pochta dasturida ochadi. Xatga parol qo‘shilmaydi; parolni xodimga alohida xavfsiz kanal orqali yetkazing. SMTP/API sozlanmagani uchun xat avtomatik yuborilmaydi. Administrator a’zo oynasida ism va rolni o‘zgartiradi, yangi parol belgilaydi yoki sessiyalarni yopadi. Parol yangilanganda foydalanuvchi barcha qurilmalardan chiqariladi. Faqat faol a’zolar ish maydonini ko‘radi.

## Tekshirish

```sh
node --test tests/permissions.test.mjs tests/auth.test.mjs
npx tsc --noEmit
npm run build
```

Mahalliy API sinovlari alohida baza bilan bajarilsin; ular ma’lumot yozadi.

## Hujjatlar

- [Foydalanuvchi qo‘llanmasi](docs/user-guide-uz.md)
- [O‘rnatish, nashr, backup](docs/deployment.md)
- [Arxitektura](docs/architecture.md)
- [Qamrov va cheklovlar](docs/coverage.md)
- [OpenAPI](docs/openapi.json)
- [Windows o‘rnatgichi](docs/windows-installer.md)
- [Dasturchilar uchun tizim xaritasi](docs/dasturchilar-uchun-tizim-xaritasi.md)
- [Dasturchilar uchun tizim xaritasi (PDF)](docs/ONUR-Task-Manager-tizim-xaritasi.pdf)

Hozirgi lokal preview internetga nashr qilinmagan. Nashrdan avval production D1/R2 binding, HTTPS, migratsiyalar, maxfiy setup kaliti va backup sozlamalarini tekshiring.
