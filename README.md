# ONUR Task Manager

Kanban asosidagi vazifalar platformasi. Uch til (o‘zbek lotin, o‘zbek kirill, rus), ish maydonlari, rollar, fayllar, hisobotlar hamda admin tomonidan boshqariladigan email/parol kirishi mavjud.

## Ishga tushirish

Node.js 22.13+ talab qilinadi. Baza — bitta SQLite fayl (Node.js ichidagi `node:sqlite`), fayllar — disk papkasi. Cloudflare, alohida SQL server yoki Docker kerak emas.

```sh
npm ci
npm run build      # .next/standalone ga server build
npm start          # http://127.0.0.1:5181
```

Ishlab chiqishda: `npm run dev` — A dizayni, http://localhost:5181; `npm run dev:b` — B dizayni, http://localhost:5182 (ikkalasini ikki oynada yonma-yon ishga tushirish mumkin, ma’lumotlar umumiy). Ma’lumotlar loyiha ichidagi `data/` da). `npm start` da ma’lumotlar loyihadan bir papka yuqoridagi `data/` ga yoziladi; `OTM_DATA_DIR` bilan o‘zgartiriladi. Birinchi ishga tushishda `data/setup-key.txt` yaratiladi — `/setup` sahifasida shu kalit bilan birinchi Owner hisobi ochiladi. Migratsiyalar (`drizzle/*.sql`) server ishga tushganda avtomatik qo‘llanadi.

**Windows serverga o‘rnatish (domen, HTTPS, avtoyuklash, zaxira): [docs/server-ornatish.md](docs/server-ornatish.md)**

Sozlamalar (`otm.env` yoki muhit o‘zgaruvchilari): `OTM_PUBLIC_URL`, `PORT`, `HOSTNAME`, `OTM_DATA_DIR`, `OTM_BACKUP_DIR`, `OTM_BACKUP_KEEP_DAYS`, `OTM_SETUP_SECRET`, `OTM_TRUST_PROXY` — namuna: `scripts/windows-server/otm.env.example`.

## Foydalanuvchilar

Platforma administratori avval **Sozlamalar → Doska rollari va huquqlar** bo‘limida rolni va uning uch tildagi nomini belgilaydi. Keyin **Admin panel → Foydalanuvchi yaratish** oynasida ism, email, kamida 8 belgili boshlang‘ich parol, bo‘lim va shu rollardan birini tanlaydi. Tanlangan rol barcha mavjud va keyingi doskalarga beriladi. Hisob yaratilgach, **Email ilovasida taklifni yuborish** tayyor xatni administratorning pochta dasturida ochadi. Xatga parol qo‘shilmaydi; parolni xodimga alohida xavfsiz kanal orqali yetkazing. SMTP/API sozlanmagani uchun xat avtomatik yuborilmaydi. Administrator a’zo oynasida ism va rolni o‘zgartiradi, yangi parol belgilaydi yoki sessiyalarni yopadi. Parol yangilanganda foydalanuvchi barcha qurilmalardan chiqariladi. Faqat faol a’zolar ish maydonini ko‘radi.

## Tekshirish

```sh
npm test                 # huquqlar va parol testlari
npx tsc --noEmit
npm run build
# To‘liq server sinovi (yangi bo‘sh data papkasi bilan ishlayotgan serverga):
OTM_TEST_URL=http://127.0.0.1:5181 OTM_SETUP_SECRET=<kalit> node --test tests/server.smoke.mjs
```

## Hujjatlar

- [Foydalanuvchi qo‘llanmasi](docs/user-guide-uz.md)
- [Windows serverga o‘rnatish](docs/server-ornatish.md)
- [Boshqaruv va tiklash](docs/deployment.md)
- [Arxitektura](docs/architecture.md)
- [Qamrov va cheklovlar](docs/coverage.md)
- [OpenAPI](docs/openapi.json)
- [Dasturchilar uchun tizim xaritasi](docs/dasturchilar-uchun-tizim-xaritasi.md)
- [Dasturchilar uchun tizim xaritasi (PDF)](docs/ONUR-Task-Manager-tizim-xaritasi.pdf)

Nashrdan avval: HTTPS (Caddy), `OTM_PUBLIC_URL`, 80/443 portlar va kunlik zaxira — [docs/server-ornatish.md](docs/server-ornatish.md).
