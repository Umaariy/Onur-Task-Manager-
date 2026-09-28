# Tekshiruv hisoboti

## Email/parol va admin oqimi — 2026-09-26

- Sozlamada uch tildagi maxsus rol saqlanib, keyin foydalanuvchi yaratilganda shu rol barcha 3 doskaga berilishi alohida D1 bazada HTTP orqali tekshirildi. Ruscha ko‘rinishda sozlama ro‘yxati, foydalanuvchi ro‘yxati va rol tanlovida “Часовой” chiqishi brauzerda tasdiqlandi.
- Rol huquqlarining belgilash kataklari oynasimon tugmalarga moslandi; tanlangan holat yashil belgi bilan brauzerda ko‘rildi. Modal ichidagi ro‘yxat oynaning yuqori yoki pastki bo‘sh joyiga qarab ochiladi.
- Joriy huquq/auth testlari: 47/47 muvaffaqiyatli. TypeScript va production build o‘tdi.
- Admin hisob yaratish, tayyor email havolasi, parolni almashtirish va eski sessiyani bekor qilish alohida bo‘sh D1 bazada 15 HTTP tekshiruvdan o‘tdi. Yangi parol workspace holatiga va API javobiga tushmadi.
- Brauzerda admin yaratish oynasi va maxsus rol menyusi 708 px kenglikda ko‘rildi; menyu modal scrollidan chiqib, oynaga mos oynali uslubda ochildi. Ilova kodida native `select` qolmadi.
- Hozirgi huquq va auth testlari: 43/43 muvaffaqiyatli. TypeScript va production build ham o‘tdi.
- Sozlash, taklif va tiklash sahifalarida parol uzunligi 8 belgi qilib moslashtirildi; 7 belgi rad, 8 belgi qabul qilinishi tekshirildi.
- Brauzerda rus va o‘zbek kirill tillaridagi ichki ogohlantirish, til menyusi va parolni ko‘rsatish tugmasi tekshirildi.
- TypeScript tekshiruvi va production build: muvaffaqiyatli.
- Huquq va parol testlari: 41/41 muvaffaqiyatli.
- Alohida bo‘sh D1 bazada HTTP sinov: 33 tekshiruv. Birinchi Owner, noto‘g‘ri/to‘g‘ri parol, taklif, yangi xodim paroli, ruxsat, sessiya bekori, bir martalik reset, bloklash va logout.
- Mavjud lokal bazaning alohida nusxasida Owner ko‘chirish: 1 ish maydoni, barcha doska va kartochka ID’lari, nom va tavsif saqlangan.
- Brauzerda `/setup` sahifasi va rus tiliga o‘tish ko‘rildi. Asl bazada Owner hisobi foydalanuvchi emaili va parolini tanlashi uchun yaratilmagan.
- `npm run db:generate`: sxema o‘zgarishi yo‘q; migratsiya snapshotlari mos.

## Avvalgi tekshiruvlar

2026-09-14 kuni mahalliy Node/Vinext/D1/R2 muhitida bajarildi.

- TypeScript: xatosiz kompilyatsiya.
- Huquqlar va biznes qoidalari: 35 ta avtomatik test. Rol matritsasi, private filter, ACL override, lock, WIP, bulk atomarlik, Owner himoyasi, deactivate, guest, dependency cycle, soxta ACL/fayl payloadlari va validatsiya.
- Haqiqiy HTTP API: 17 tekshiruv. 401 auth, doimiy saqlash, 409 eskirgan versiya, qulflangan kartaga 403, CSRF, izoh, o‘chirish, audit read-back.
- Fayl va ro‘yxatlar: 11 tekshiruv. R2 upload/download roundtrip, vaqtinchalik token, noto‘g‘ri token, `.exe` rad etilishi, pagination, sahifa hajmi validatsiyasi, CSV eksport va OpenAPI.
- Brauzer: doska va kartochka oynasi, yangi vazifani saqlash va qidiruvdan qayta topish.
- WebMCP: `search_tasks` ro‘yxatdan o‘tishi, haqiqiy qidiruv natijasi va noto‘g‘ri input rad etilishi.
- Mobil: 360 px viewport ko‘rinishi va document kengligi tekshirildi. Haqiqiy sensorli qurilmada drag-and-drop qabul testi bajarilmagan.

Bu natijalar 200 faol foydalanuvchilik yuklama testi yoki mustaqil penetration test o‘rnini bosmaydi. T.Z. qamrovi `coverage.md` da alohida ko‘rsatilgan. Production xizmati holati nashr operatsiyasi orqali tasdiqlanadi; bu hisobdagi funksional testlar mahalliy muhitga tegishli.
