# ONUR Task Manager — foydalanish qo‘llanmasi

## Boshlash

Birinchi marta `/setup` sahifasida Owner emaili, kamida 8 belgili parol va mahalliy `.dev.vars` faylidagi boshlang‘ich sozlash kalitini kiriting. Bu kalit parolni tiklash so‘zi emas; u birinchi Owner hisobini yaratishga ruxsat beradi. Mavjud ish maydoni va vazifalar shu hisobga o‘tadi. Keyinchalik `/login` sahifasida shu email va parol bilan kiring. `example.test` manzilli namuna a’zolar haqiqiy hisob emas; haqiqiy xodim uchun admin panelda yangi hisob yarating.

## Vazifa bilan ishlash

1. Doskani tanlang, **Vazifa qo‘shish** tugmasini bosing.
2. Nom, tavsif, mas’ul, ustun, prioritet va muddatni kiriting.
3. Checklist bandlarini kiriting va **Saqlash** tugmasini bosing.
4. Kartochkani ochib izoh yozing yoki 10 MB gacha fayl biriktiring. `.exe`, `.sh`, HTML va SVG fayllari yuklanmaydi.
5. Desktopda kartochkani boshqa ustunga torting. Klaviatura bilan Enter orqali ochib **Ustun** ro‘yxatidan ham ko‘chirish mumkin.
6. Yashil oxirgi ustun bajarilgan vazifalar uchun. Dastlabki doskada unga faqat Board Admin ko‘chira oladi.

Ustun limiti to‘lsa yoki vazifa qulflansa, server amalni to‘xtatadi. Bog‘liq vazifa tugamagan bo‘lsa, ishni keyingi ustunga olib o‘tib bo‘lmaydi.

## Ko‘rinishlar va qidiruv

**Ro‘yxat** jadvalda ko‘rsatadi, katakchalar orqali bir nechta vazifani tanlash mumkin. Guruhli ko‘chirish bitta doska ichida ishlaydi. **Kalendar** sanasi bor vazifalarni ko‘rsatadi. **Mening vazifalarim** barcha ruxsatli doskalardan sizga biriktirilgan ishlarni yig‘adi.

Yuqoridagi qidiruv nom, tavsif, izoh va fayl nomidan izlaydi. **Filtrlar** mas’ul, prioritet yoki muddatni toraytiradi. **Filtr havolasi** ayni filtrni ulashish uchun nusxalaydi; havola huquq bermaydi.

## Huquqlar va taklif

Platforma administratori avval **Sozlamalar → Doska rollari va huquqlar** bo‘limida rolni tayyorlaydi. Rol nomi avtomatik tarjima qilinmaydi: o‘zbek lotin, o‘zbek kirill va ruscha nomni alohida yozing. Standart rollarning uch tildagi nomlari tayyor; yangi rol saqlangandan keyingina tanlovlarda paydo bo‘ladi. Huquqlar yashil katakli tugmalar orqali yoqiladi yoki o‘chiriladi.

Keyin **Admin panel → Foydalanuvchi yaratish** oynasida xodimning ismi, emaili, boshlang‘ich paroli, bo‘limi va sozlamadagi doska rolini tanlang. Tanlangan rol barcha mavjud doskalarga va keyin yaratiladigan doskalarga beriladi. Hisob yaratilgach, **Email ilovasida taklifni yuborish** tugmasi tayyor xatni pochta dasturingizda ochadi. Xatni o‘zingiz yuborasiz; parolni xatga yozmang, xodimga alohida xavfsiz kanal orqali bering. Pochta xizmati sozlanmagani uchun ilova xatni avtomatik yubormaydi. **A’zo huquqlari** oynasida ism, doska roli va faol holatni o‘zgartirish, yangi parol belgilash va sessiyalarni yopish mumkin. Parol o‘zgargan zahoti xodim barcha qurilmalarda qayta kirishi kerak. Alohida doska huquqini **Doska sozlamalari** ichida keyin alohida o‘zgartirish mumkin.

Vazifa oynasidagi **Huquqlar** orqali Board Admin private/lock va individual override’larni boshqaradi. **Yashirin vazifa**ni tanlangan odamlar, Owner va Board Admin ko‘radi. **Qulflangan vazifa**ni administrator ham avval ochishi kerak.

## Bir vaqtda ishlash

Doska 15 soniyada yangilanadi. Ochiq tahrir vaqtida boshqa o‘zgarish bo‘lsa, **Yangi nusxa** orqali serverdagi variantni oling yoki **Mening nusxam** bilan o‘z variantingizni saqlashni aniq tanlang. Bu amal boshqa o‘zgarishlarni almashtirishi mumkin; mazmunni tekshirib bosing.

## Arxiv va hisobot

Vazifa yoki doska arxivlanganda **Arxiv** ekranidan qaytariladi. Butunlay o‘chirish alohida tasdiq talab qiladi. **Hisobotlar** xodim kesimini va ustunlar sonini ko‘rsatadi; CSV fayli Excel’da ochiladi. CSV haqiqiy `.xlsx` fayli emas.

## Chegaralar

Ilova internetga hali nashr qilinmagan. Lokal preview’dagi foydalanuvchilar va production bazasi alohida bo‘ladi; production uchun migratsiya, maxfiy kalit, HTTPS va backup kerak. Hozir email va SMS avtomatik yuborilmaydi. Barcha qolgan T.Z. bandlari `coverage.md` da ko‘rsatilgan.
