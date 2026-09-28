# T.Z. qamrovi — 2026-09-12

## Ishlaydigan va tekshirilgan qism

- React/TypeScript asosidagi moslashuvchan o‘zbekcha Kanban interfeysi, yorug‘/qorong‘i rejim.
- Email/parol kirishi, Owner sozlash, admin taklifi, sessiya va bir martalik parol tiklash; ko‘p ish maydoni va a’zolik tekshiruvi.
- Doska yaratish/nusxalash/arxivlash/qaytarish, shablon sifatida saqlash, sevimlilar.
- Ustun yaratish/nomlash/tartiblash, WIP, lock, ustun uchun alohida add/move rollari.
- Kartochka CRUD/arxiv, mas’ullar, yorliqlar, sanalar, prioritet, checklist, izohlar, bog‘liqliklar va vaqt soatlari.
- Kanban drag-and-drop, ro‘yxat, kalendar, mening vazifalarim, global qidiruv va filtr havolasi, bulk amallar.
- Workspace/board/card huquqlari, custom board rollari bazada, role tahriri, private/ACL/lock.
- Backend 403, xavfsizlik auditi, Owner himoyasi, atomar CAS va eskirgan nusxani ogohlantirish.
- Doimiy D1 saqlash, R2 fayllar, asosiy tur/signature/hajm nazorati, 5 daqiqalik havolalar.
- Administrator tomonidan ism, email va boshlang‘ich parol bilan hisob yaratish; parolni yangilash barcha sessiyalarni tugatadi. Taklif xati pochta dasturida tayyorlanadi, avtomatik jo‘natilmaydi. Eski 7 kunlik taklif API ham mavjud.
- Ilova ichidagi bildirishnomalar (biriktirish, kuzatuvchi o‘zgarishi, izohdagi ism), 15 soniyalik yangilanish.
- Hisobotlar va CSV eksport; OpenAPI hujjati; `/cards` pagination/sorting/filtering.

## Qisman bajarilgan yoki keyingi ishlab chiqish talab qilinadi

| Talab | Hozirgi holat / qolgan ish |
|---|---|
| Auth email/parol, SMS, JWT, refresh, 2FA, sessiyalar | Email/parol va server sessiyasi ishlaydi; SMS, JWT/refresh va 2FA hali yo‘q |
| Email reset/SMTP, Telegram | Provider va server sozlash, yetkazish navbati, retry va digest amalga oshirilmagan |
| WebSocket/presence | 15 soniyalik polling bor; haqiqiy WS, onlayn holat va editing-presence yo‘q |
| UZ/RU/EN i18n | O‘zbek lotin, o‘zbek kirill va rus mavjud; inglizcha hali yo‘q |
| Teams ACL | A’zolarda bo‘lim maydoni bor; bo‘limga birgalikda huquq berish yo‘q |
| Rich text | Oddiy matn; xavfsiz rich text muharriri hali yo‘q |
| Checklist | Bitta ro‘yxat; bir nechta ro‘yxat va bandga alohida mas’ul/muddat yo‘q |
| Fayl preview/antivirus | Himoyalangan yuklash/yuklab olish bor; preview va antivirus yo‘q |
| Kartochkalararo amallar | Bog‘liqlik va nusxa bor; boshqa doskaga transfer UI, sub-card boshqaruvi va recurrence worker yo‘q |
| Public link | Faqat ruxsatli a’zoga havola; anonim board link yo‘q |
| Mobil DnD | Touch boshlash mexanizmi bor; haqiqiy iOS/Android qurilmada qabul sinovi qilinmagan |
| Eksport | CSV bor; haqiqiy XLSX/PDF hali yo‘q |
| Super-admin | Birinchi Owner uchun platforma admin huquqi va foydalanuvchi boshqaruvi bor; barcha tenantlarga alohida super-admin konsoli yo‘q |
| Audit | API’dan o‘chirish yo‘q; infratuzilma adminidan WORM/immutable saqlash himoyasi yo‘q |
| Tezlik va yuklama | 200 foydalanuvchi/1000 kartochka/95% <500ms qabul testi bajarilmagan |
| PostgreSQL/Redis/Docker/CI | Bu nashr D1/R2/Sites; T.Z.dagi stack va CI/CD alohida ishlanishi kerak |
| Backup | Tiklash yo‘riqnomasi bor; 30 kunlik tashqi backup job sozlanmagan |
| Figma approval | Ishchi UI kodda tayyorlandi; tasdiqlangan Figma dizayni mavjud emas |
| Mobil ilova | T.Z. 2-bosqichi, amalga oshirilmagan |
| Topshirish/kafolat | Kod arxivi beriladi. Buyurtmachining GitHub/GitLab manzili kiritilmagan. 3 oylik xizmat kafolati ushbu ishda rasmiy kelishilmagan |

Bu jadvalni yashirish yoki bajarilmagan talablarni tayyor deb belgilash mumkin emas. Ilovani barcha qabul mezonlari bo‘yicha yakuniy mahsulot deb qabul qilishdan oldin qolgan bandlar bajarilishi kerak.
