# Windows o‘rnatgichi

`ONUR-Task-Manager-Setup.exe` Windows x64 uchun lokal o‘rnatgich. O‘rnatilgandan keyin ish stolidagi **ONUR Task Manager** yorlig‘i lokal serverni ishga tushiradi va brauzerni ochadi. Node.js yoki npm’ni alohida o‘rnatish shart emas. Server faqat shu kompyuterda `127.0.0.1:5181` manzilida ishlaydi; boshqa qurilmalar undan foydalana olmaydi.

Birinchi ishga tushishda dastur bo‘sh ma’lumotlar bazasini, `setup-key.txt` kalitini va administrator yaratish sahifasini tayyorlaydi. Kalit fayli `%LOCALAPPDATA%\ONUR Task Manager` ichida saqlanadi va Notepad’da ochiladi. Uni `/setup` sahifasiga kiriting. Keyingi kirishlarda odatiy login va parol ishlatiladi.

Ma’lumotlar bazasi, yuklangan fayllar, loglar va kalit `%LOCALAPPDATA%\ONUR Task Manager` ichida qoladi. Dasturni olib tashlash bu ma’lumotlarni o‘chirmaydi. Yangilashda ham shu papkadan foydalaniladi. Eski `source\.wrangler\state` bazasi o‘rnatgichga qo‘shilmaydi va avtomatik ko‘chirilmaydi; mavjud hisoblar hamda vazifalarni olib o‘tish uchun alohida migratsiya kerak. Maxfiy `.dev.vars` va foydalanuvchi ma’lumotlarini tarqatiladigan EXE ichiga joylamang.

O‘rnatgichni yangidan yig‘ish uchun Windows’da Node.js 22.13+ va NSIS 3 talab qilinadi. Loyiha ildizida:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\windows\build-installer.ps1
```

Natija `Onur Task Management\ONUR-Task-Manager-Setup.exe` faylida paydo bo‘ladi. O‘rnatgich raqamli imzolanmagan; tashqi tarqatishdan oldin kompaniya sertifikati bilan imzolash tavsiya etiladi. Bu paket lokal foydalanish uchun mo‘ljallangan. Ko‘p foydalanuvchi bir vaqtda turli qurilmalardan ishlashi uchun OTM serverga joylashtirilishi kerak.
