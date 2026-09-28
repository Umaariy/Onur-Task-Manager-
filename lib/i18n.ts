export type Locale = 'uz-Latn' | 'uz-Cyrl' | 'ru';

export const languageOptions: { value: Locale; label: string; short: string }[] = [
    { value: 'uz-Latn', label: 'O‘zbekcha (lotin)', short: 'UZ' },
    { value: 'uz-Cyrl', label: 'Ўзбекча (кирилл)', short: 'ЎЗ' },
    { value: 'ru', label: 'Русский', short: 'RU' },
];

const russian: Record<string, string> = {
    'Barcha doskalar': 'Все доски', 'Mening vazifalarim': 'Мои задачи', 'Kalendar': 'Календарь',
    'Jamoa a’zolari': 'Участники команды', 'Hisobotlar': 'Отчёты', 'Faoliyat tarixi': 'История действий',
    'Admin panel': 'Панель администратора', 'Taklif kutilmoqda': 'Ожидает приглашения',
    'Bloklangan': 'Заблокирован', 'Parolni tiklash havolasi': 'Ссылка для сброса пароля',
    'Sessiyalarni yopish': 'Завершить сеансы',
    'Foydalanuvchi yaratish': 'Создать пользователя', 'Hisob yaratildi': 'Учётная запись создана',
    'Doska roli': 'Роль на досках', 'Rolni tanlang': 'Выберите роль', 'Rol berilmagan': 'Роль не назначена',
    'Tanlangan rol barcha doskalarga beriladi. Yangi rollar sozlamalarda yaratiladi.': 'Выбранная роль применяется ко всем доскам. Новые роли создаются в настройках.',
    'Lotincha nom': 'Название на узбекском (латиница)', 'Kirillcha nom': 'Название на узбекском (кириллица)', 'Ruscha nom': 'Название на русском',
    'Rol nomlari avtomatik tarjima qilinmaydi. Har uch til uchun nom kiriting.': 'Названия ролей не переводятся автоматически. Введите название для каждого из трёх языков.',
    'Boshlang‘ich parol': 'Начальный пароль', 'Kirish havolasi': 'Ссылка для входа',
    'Parolni o‘zgartirish': 'Сменить пароль',
    'Parol o‘zgarsa, foydalanuvchi barcha qurilmalardan chiqariladi.': 'После смены пароля пользователь выйдет из учётной записи на всех устройствах.',
    'Admin parolni belgilaydi. Xodimga parolni alohida, xavfsiz usulda yetkazing.': 'Администратор задаёт пароль. Передайте его сотруднику отдельно безопасным способом.',
    'Email ilovasida taklifni yuborish': 'Отправить приглашение через почтовое приложение',
    'Email avtomatik yuborilmaydi; pochta ilovangizda yuborishni tasdiqlang.': 'Письмо не отправляется автоматически; подтвердите отправку в почтовом приложении.',
    'ONUR Task Manager taklifi': 'Приглашение в ONUR Task Manager',
    'Siz uchun ONUR Task Manager hisobi yaratildi. Kirish havolasi:': 'Для вас создана учётная запись ONUR Task Manager. Ссылка для входа:',
    'Boshlang‘ich parolni administratoringizdan alohida oling.': 'Получите начальный пароль отдельно у администратора.',
    'BIRINCHI SOZLASH': 'ПЕРВАЯ НАСТРОЙКА', 'HISOBGA KIRISH': 'ВХОД',
    'Owner hisobini yarating': 'Создайте учётную запись владельца', 'Xush kelibsiz': 'Добро пожаловать',
    'Mavjud ish maydoni va vazifalar saqlanadi. Parolni faqat o‘zingiz bilasiz.': 'Существующее рабочее пространство и задачи сохранятся. Пароль будете знать только вы.',
    'Admin ruxsat bergan email va parolingizni kiriting.': 'Введите адрес почты и пароль, разрешённые администратором.',
    'Parol': 'Пароль', 'Parolni takrorlang': 'Повторите пароль', 'Boshlang‘ich sozlash kaliti': 'Ключ первоначальной настройки',
    'Parollar bir xil emas': 'Пароли не совпадают', 'Kirish amalga oshmadi': 'Не удалось войти',
    'Parolni ko‘rsatish': 'Показать пароль', 'Parolni yashirish': 'Скрыть пароль',
    'Parolni kiriting': 'Введите пароль', 'Parol kamida 8 belgidan iborat bo‘lsin': 'Пароль должен содержать не менее 8 символов',
    'Email noto‘g‘ri': 'Неверный адрес электронной почты',
    'Boshlang‘ich sozlash kalitini kiriting': 'Введите ключ первоначальной настройки',
    'Bu parolni eslash uchun so‘z emas. Birinchi Owner hisobiga ruxsat beruvchi kalitni loyiha papkasidagi .dev.vars faylidan oling.': 'Это не слово для восстановления пароля. Ключ для создания первой учётной записи владельца находится в файле .dev.vars в папке проекта.',
    'Boshlang‘ich sozlash kaliti noto‘g‘ri': 'Неверный ключ первоначальной настройки',
    'Bosh administrator allaqachon yaratilgan': 'Учётная запись главного администратора уже создана',
    'Login yoki parol noto‘g‘ri': 'Неверный адрес почты или пароль',
    'Juda ko‘p urinish. Birozdan keyin urinib ko‘ring.': 'Слишком много попыток. Попробуйте позже.',
    'Hisobga faol ish maydoni biriktirilmagan': 'К учётной записи не привязано активное рабочее пространство',
    'Havola eskirgan yoki ishlatilgan': 'Ссылка устарела или уже использована',
    'Havola noto‘g‘ri': 'Неверная ссылка', 'Taklif ishlatilgan': 'Приглашение уже использовано',
    'Taklif bekor qilingan': 'Приглашение отменено',
    'Bu emailda hisob bor. Avval shu hisobga kiring.': 'Учётная запись с этим адресом уже существует. Сначала войдите в неё.',
    'Siz allaqachon a’zosiz': 'Вы уже являетесь участником',
    'Bir nechta eski Owner topildi; ma’lumotlarni qo‘lda ko‘chirish kerak': 'Найдено несколько прежних владельцев; требуется ручной перенос данных',
    'Kuting…': 'Подождите…', 'Owner hisobini yaratish': 'Создать учётную запись владельца',
    'Kirish': 'Войти', 'Hisobingiz yo‘qmi? Administratoringizdan taklif havolasini oling.': 'Нет учётной записи? Попросите администратора прислать приглашение.',
    'JAMOAGA TAKLIF': 'ПРИГЛАШЕНИЕ В КОМАНДУ', 'Birga ishlashni boshlang': 'Начните работать вместе',
    'Joriy hisobingiz bilan ish maydoniga qo‘shiling.': 'Присоединитесь к рабочему пространству с текущей учётной записью.',
    'Birinchi marta kirayotgan bo‘lsangiz, o‘z parolingizni o‘rnating.': 'Если вы входите впервые, задайте свой пароль.',
    'Taklifni qabul qilib bo‘lmadi': 'Не удалось принять приглашение', 'Qo‘shilmoqda…': 'Присоединение…',
    'Taklifni qabul qilish': 'Принять приглашение', 'Hisobingiz allaqachon bormi?': 'Уже есть учётная запись?',
    'Avval hisobga kiring': 'Сначала войдите', 'Yangi parol o‘rnating': 'Задайте новый пароль',
    'Yangi parol': 'Новый пароль', 'Parolni almashtirib bo‘lmadi': 'Не удалось сменить пароль',
    'Parolni saqlash': 'Сохранить пароль',
    'Sozlamalar': 'Настройки', 'Bildirishnomalar': 'Уведомления', 'Arxiv': 'Архив',
    'ISH MAYDONI': 'РАБОЧЕЕ ПРОСТРАНСТВО', 'DOSKALAR': 'ДОСКИ', 'BOSHQARUV': 'УПРАВЛЕНИЕ',
    'Ish maydoni': 'Рабочее пространство', 'Doskalar': 'Доски', 'LOYIHA DOSKASI': 'ДОСКА ПРОЕКТА',
    'Birga ishlash osonroq.': 'Работать вместе проще.', 'Har bir vazifa o‘z o‘rnida.': 'Каждая задача на своём месте.',
    'Jamoa ishlarini bir joyda kuzating va boshqaring.': 'Управляйте работой команды в одном месте.',
    'Qidiruv natijalari': 'Результаты поиска', 'Vazifa qidirish...': 'Поиск задачи...',
    'Jamoa': 'Команда', 'Kanban': 'Канбан', 'Ro‘yxat': 'Список', 'Yopiq doska': 'Закрытая доска',
    'Ish maydoniga ochiq': 'Доступна рабочему пространству', 'Filtrlar': 'Фильтры',
    'Vazifa qo‘shish': 'Добавить задачу', 'Ustun': 'Столбец', 'ta vazifa': 'задач',
    'Huquqlar himoyalangan · 15 soniyada yangilanadi': 'Права защищены · обновление каждые 15 секунд',
    'Namuna ma’lumotlar': 'Демонстрационные данные',
    'Namuna doska. Hisobingizga kirib o‘z ish maydoningizda ishlang.': 'Демонстрационная доска. Войдите, чтобы работать в своём пространстве.',
    'Ish maydoni yuklanmoqda…': 'Загрузка рабочего пространства…', 'Hisobga kirish': 'Войти',
    'Barcha prioritetlar': 'Все приоритеты', 'Barcha mas’ullar': 'Все ответственные',
    'Barcha muddatlar': 'Все сроки', 'Muddati o‘tgan': 'Просрочено', 'Bugun': 'Сегодня',
    'Tozalash': 'Сбросить', 'Filtr havolasi': 'Ссылка на фильтр',
    'Ustunga ko‘chirish': 'Переместить в столбец', 'ta tanlandi': 'выбрано', 'Arxivlash': 'В архив',
    'Vazifa': 'Задача', 'Holat': 'Статус', 'Mas’ul': 'Ответственный', 'Muddat': 'Срок',
    'Prioritet': 'Приоритет', 'Filtrga mos vazifa topilmadi': 'Задачи не найдены',
    'Jamoa ·': 'Команда ·', 'a’zo': 'участников', 'A’zo': 'Участник', 'A’zo taklif qilish': 'Пригласить участника',
    '· Namuna a’zo': '· Демонстрационный участник', '· Bloklangan': '· Заблокирован',
    '· Hisobot': '· Отчёт', 'CSV eksport': 'Экспорт CSV', 'Xodimlar kesimida': 'По сотрудникам',
    'Ochiq': 'Открыто', 'Bajarildi': 'Готово', 'Kechikkan': 'Просрочено',
    'O‘zgarishlar va xavfsizlik jurnali': 'Журнал изменений и безопасности',
    'Hozircha faoliyat yo‘q': 'Пока нет действий', 'Siz uchun xabarlar': 'Ваши уведомления',
    'O‘qilgan deb belgilash': 'Отметить прочитанным', 'Yangi bildirishnomalar yo‘q': 'Новых уведомлений нет',
    'Arxivlangan doskalar va vazifalar': 'Доски и задачи в архиве', 'Qaytarish': 'Восстановить',
    'Arxiv bo‘sh': 'Архив пуст', 'Nomi': 'Название', 'Tavsif': 'Описание', 'Saqlash': 'Сохранить',
    'Profil va ko‘rinish': 'Профиль и оформление', 'Ism-familiya': 'Имя и фамилия',
    'Profilni saqlash': 'Сохранить профиль', 'Qorong‘i rejim': 'Тёмная тема',
    'Yorug‘ rejim': 'Светлая тема', 'Yoqilgan': 'Включено', 'O‘chirilgan': 'Выключено',
    'Hisobdan chiqish': 'Выйти', 'Doska rollari va huquqlar': 'Роли и права доски',
    'Yangi rol': 'Новая роль', 'ta huquq': 'прав', 'Platforma tili': 'Язык платформы',
    'ONUR Task Manager': 'ONUR Task Manager', 'Task Manager': 'Task Manager',
    'Yangi doska': 'Новая доска', 'Yangi loyiha uchun joy oching': 'Создайте место для нового проекта',
    'Muddatsiz': 'Без срока', 'Past': 'Низкий', 'O‘rta': 'Средний', 'Yuqori': 'Высокий',
    'Shoshilinch': 'Срочный', 'Rejada': 'Запланировано', 'Jarayonda': 'В работе',
    'Tekshiruvda': 'На проверке', 'Mahsulot rivojlantirish': 'Развитие продукта',
    'Marketing va kontent': 'Маркетинг и контент', 'Ichki jarayonlar': 'Внутренние процессы',
    'G‘oyadan natijagacha — keyingi versiyani birga yaratamiz.': 'От идеи до результата — создаём следующую версию вместе.',
    'Kontent reja, kampaniyalar va yangi g‘oyalar.': 'Контент-план, кампании и новые идеи.',
    'Jamoaning kundalik ishlarini tartibga solamiz.': 'Организуем повседневную работу команды.',
    'Yopish': 'Закрыть', 'Havola': 'Ссылка', 'Nusxalash': 'Копировать', 'Huquqlar': 'Права',
    'O‘chirish': 'Удалить', 'Ustun sozlamalari': 'Настройки столбца', 'Doska sozlamalari': 'Настройки доски',
    'Vazifa huquqlari': 'Права задачи', 'A’zo huquqlari': 'Права участника',
    'Rol sozlamalari': 'Настройки роли', 'Ish maydonlari': 'Рабочие пространства',
    'Jamoaga taklif': 'Приглашение в команду', 'Tasdiqlash': 'Подтверждение',
    'Bekor qilish': 'Отмена', 'Amal faoliyat tarixiga yoziladi.': 'Действие будет записано в историю.',
    'Shablon': 'Шаблон', 'Standart Kanban': 'Обычный канбан',
    'Ko‘rinish': 'Видимость', 'Yopiq — faqat doska a’zolari': 'Закрытая — только участники доски',
    'Contributor yangi vazifa yarata oladi': 'Участник может создавать задачи',
    'Viewer fayllarni yuklab olishi mumkin': 'Наблюдатель может скачивать файлы',
    'Doska a’zolari': 'Участники доски', 'WIP limit (0 = cheklanmagan)': 'Лимит WIP (0 = без ограничений)',
    'Ustunni qulflash': 'Заблокировать столбец', 'Kim vazifa qo‘sha oladi': 'Кто может добавлять задачи',
    'Kim vazifa ko‘chira oladi': 'Кто может перемещать задачи',
    'Roli ruxsat bergan har bir a’zo': 'Любой участник с правом по роли',
    'Email': 'Эл. почта', 'Bo‘lim': 'Отдел', 'Workspace roli': 'Роль в пространстве',
    'Taklif 7 kun amal qiladi. Havolani kerakli kishiga o‘zingiz yuboring. Email avtomatik yuborilmaydi.': 'Приглашение действительно 7 дней. Отправьте ссылку нужному человеку. Письмо не отправляется автоматически.',
    'Taklif havolasi': 'Ссылка приглашения', 'Faol foydalanuvchi': 'Активный пользователь',
    'Yashirin vazifa': 'Скрытая задача', 'Vazifani qulflash': 'Заблокировать задачу',
    'Owner va Board Admin yashirin vazifalarni ham ko‘radi. Boshqalarga alohida kirish bering.': 'Владелец и администратор доски видят скрытые задачи. Предоставьте остальным отдельный доступ.',
    'Doska huquqidan olish': 'Использовать права доски', 'Yangi ish maydoni': 'Новое рабочее пространство',
    'Shablon saqlash': 'Сохранить шаблон', 'Shablon o‘chirish': 'Убрать шаблон',
    '← Chapga': '← Влево', 'O‘ngga →': 'Вправо →', 'Taklif havolasini yaratish': 'Создать ссылку приглашения',
    'Saqlanmoqda…': 'Сохранение…', 'O‘zgarish saqlandi': 'Изменения сохранены',
    'Saqlash uchun hisobingizga kiring.': 'Войдите, чтобы сохранить изменения.',
    'Ma’lumotlarni yuklab bo‘lmadi': 'Не удалось загрузить данные',
    'Fayl 10 MB dan oshmasin': 'Размер файла не должен превышать 10 МБ',
    'Fayl yuklandi': 'Файл загружен', 'Fayllar': 'Файлы',
    'Fayl biriktirish · 10 MB gacha': 'Прикрепить файл · до 10 МБ',
    'Checklist': 'Чек-лист', 'Mas’ullar': 'Ответственные', 'Yorliqlar (vergul bilan)': 'Метки (через запятую)',
    'Boshlanish': 'Начало', 'Bog‘liq vazifa': 'Связанная задача', 'Bog‘liqlik yo‘q': 'Нет связи',
    'Reja (soat)': 'План (часы)', 'Sarflandi (soat)': 'Потрачено (часы)',
    'Izohlar ·': 'Комментарии ·', 'Izoh': 'Комментарий', 'Izoh yozing… @ism': 'Написать комментарий… @имя',
    'Yuborish': 'Отправить', 'Yangi band...': 'Новый пункт...', 'Ustun tanlash': 'Выбрать столбец',
    'Yangi nusxa': 'Новая версия', 'Mening nusxam': 'Моя версия',
    'Vazifa qulflangan. Board Admin huquqlar oynasidan ochishi mumkin.': 'Задача заблокирована. Администратор доски может открыть её в настройках прав.',
    'Tadqiqot': 'Исследование', 'Strategiya': 'Стратегия', 'Mahsulot': 'Продукт',
    'Dizayn': 'Дизайн', 'Dasturlash': 'Разработка', 'Test': 'Тестирование',
    'Tayyorlash': 'Подготовить', 'Jamoa bilan tekshirish': 'Проверить с командой', 'Yakunlash': 'Завершить',
    'Bandni olib tashlash': 'Удалить пункт', 'Checklist bandi': 'Пункт чек-листа',
    'Doska yangilandi. Yangi nusxani tekshiring yoki o‘z nusxangizni saqlashni tanlang.': 'Доска обновилась. Проверьте новую версию или сохраните свою.',
    'Doska yaratish': 'Создать доску', 'Guruh holda ko‘chirish': 'Массовое перемещение',
    'Izohni o‘chirish': 'Удалить комментарий', 'Mas’ul filtri': 'Фильтр по исполнителю',
    'Menyuni ochish': 'Открыть меню', 'Menyuni yopish': 'Закрыть меню',
    'Muddat filtri': 'Фильтр по сроку', 'Namuna rejimi': 'Демонстрационный режим',
    'Prioritet filtri': 'Фильтр по приоритету', 'Sevimlilarga qo‘shish': 'Добавить в избранное',
    'Vazifa haqida batafsil yozing…': 'Опишите задачу подробнее…', 'Vazifa nomi': 'Название задачи',
    'Vazifalarni qidirish': 'Поиск задач', 'Vazifani o‘chirish': 'Удалить задачу',
    'Xabarni yopish': 'Закрыть сообщение',
    Du: 'Пн', Se: 'Вт', Ch: 'Ср', Pa: 'Чт', Ju: 'Пт', Sh: 'Сб', Ya: 'Вс',
    'Ustun qulflangan': 'Столбец заблокирован',
    'Bu ustun uchun alohida huquq kerak': 'Для этого столбца требуется отдельное право',
    'Ustundagi WIP limitga yetildi': 'Достигнут лимит задач в столбце',
    'Avval bog‘liq vazifani yakunlang': 'Сначала завершите связанную задачу',
    'Vazifa joyi noto‘g‘ri': 'Неверная позиция задачи', 'Ustun joyi noto‘g‘ri': 'Неверная позиция столбца',
    'Ustun topilmadi': 'Столбец не найден', 'Vazifa topilmadi': 'Задача не найдена',
};

const roleNames: Record<string, [string, string]> = {
    owner: ['Эгаси', 'Владелец'], admin: ['Админ', 'Администратор'], member: ['Аъзо', 'Участник'],
    guest: ['Меҳмон', 'Гость'], observer: ['Кузатувчи', 'Наблюдатель'],
    'board-admin': ['Доска админи', 'Администратор доски'], editor: ['Муҳаррир', 'Редактор'],
    contributor: ['Ҳисса қўшувчи', 'Соавтор'], commenter: ['Изоҳчи', 'Комментатор'],
    viewer: ['Кўрувчи', 'Наблюдатель'], none: ['Кириш йўқ', 'Нет доступа'],
};
const defaultRoleLatin: Record<string, string> = {
    owner: 'Owner', admin: 'Admin', member: 'A’zo', guest: 'Mehmon', observer: 'Kuzatuvchi',
    'board-admin': 'Board Admin', editor: 'Muharrir', contributor: 'Hissa qo‘shuvchi',
    commenter: 'Izohchi', viewer: 'Ko‘ruvchi', none: 'Kirish yo‘q',
};

export function roleNameFields(role: { id: string; name: string; nameCyrl?: string; nameRu?: string }) {
    const defaults = role.name === defaultRoleLatin[role.id] ? roleNames[role.id] : undefined;
    return { nameCyrl: role.nameCyrl ?? defaults?.[0] ?? '', nameRu: role.nameRu ?? defaults?.[1] ?? '' };
}

const cyrillicOverrides: Record<string, string> = {
    'Lotincha nom': 'Лотин ёзувидаги ном', 'Kirillcha nom': 'Кирилл ёзувидаги ном', 'Ruscha nom': 'Русча ном',
    'Rol nomlari avtomatik tarjima qilinmaydi. Har uch til uchun nom kiriting.': 'Рол номлари автоматик таржима қилинмайди. Ҳар уч тил учун ном киритинг.',
    Du: 'Ду', Se: 'Се', Ch: 'Чо', Pa: 'Па', Ju: 'Жу', Sh: 'Ша', Ya: 'Як',
    'Email': 'Электрон почта',
    'Owner hisobini yarating': 'Эгаси ҳисобини яратинг',
    'Owner hisobini yaratish': 'Эгаси ҳисобини яратиш',
    'Bu parolni eslash uchun so‘z emas. Birinchi Owner hisobiga ruxsat beruvchi kalitni loyiha papkasidagi .dev.vars faylidan oling.': 'Бу паролни эслаш учун сўз эмас. Биринчи эгаси ҳисобини яратиш калитини лойиҳа папкасидаги .dev.vars файлидан олинг.',
};

const permissionNames: Record<string, [string, string]> = {
    view: ['Кўриш', 'Просмотр'], 'column.manage': ['Устунларни бошқариш', 'Управление столбцами'],
    'column.reorder': ['Устунлар тартибини ўзгартириш', 'Изменение порядка столбцов'],
    'card.create': ['Вазифа яратиш', 'Создание задач'], 'card.edit': ['Вазифани таҳрирлаш', 'Редактирование задач'],
    'card.move': ['Вазифани кўчириш ва тартиблаш', 'Перемещение и сортировка задач'],
    'card.delete': ['Вазифани ўчириш', 'Удаление задач'], 'card.transfer': ['Вазифани бошқа доскага ўтказиш', 'Перенос на другую доску'],
    comment: ['Изоҳ ёзиш', 'Комментирование'], 'file.upload': ['Файл юклаш', 'Загрузка файлов'],
    'file.download': ['Файлни юклаб олиш', 'Скачивание файлов'], assign: ['Масъул тайинлаш', 'Назначение исполнителя'],
    deadline: ['Муддатни ўзгартириш', 'Изменение срока'], members: ['Аъзоларни бошқариш', 'Управление участниками'],
    settings: ['Доска созламалари', 'Настройки доски'], audit: ['Фаолият тарихини кўриш', 'Просмотр истории'],
    export: ['Маълумотни экспорт қилиш', 'Экспорт данных'], share: ['Ҳавола улашиш', 'Обмен ссылкой'],
    acl: ['Вазифа ҳуқуқларини бошқариш', 'Управление правами задач'],
    'own.edit': ['Ўз вазифасини таҳрирлаш', 'Редактирование своих задач'],
    'own.move': ['Ўз вазифасини кўчириш', 'Перемещение своих задач'],
    'own.deadline': ['Ўз вазифасининг муддатини ўзгартириш', 'Изменение срока своих задач'],
};

function toCyrillic(value: string) {
    const pairs: [RegExp, string][] = [
        [/O[‘’']/g, 'Ў'], [/o[‘’']/g, 'ў'], [/G[‘’']/g, 'Ғ'], [/g[‘’']/g, 'ғ'],
        [/SH/g, 'Ш'], [/Sh/g, 'Ш'], [/sh/g, 'ш'], [/CH/g, 'Ч'], [/Ch/g, 'Ч'], [/ch/g, 'ч'],
        [/YO/g, 'Ё'], [/Yo/g, 'Ё'], [/yo/g, 'ё'], [/YU/g, 'Ю'], [/Yu/g, 'Ю'], [/yu/g, 'ю'],
        [/YA/g, 'Я'], [/Ya/g, 'Я'], [/ya/g, 'я'], [/YE/g, 'Е'], [/Ye/g, 'Е'], [/ye/g, 'е'],
        [/NG/g, 'НГ'], [/Ng/g, 'Нг'], [/ng/g, 'нг'],
    ];
    let result = value;
    for (const [pattern, replacement] of pairs) result = result.replace(pattern, replacement);
    const letters: Record<string, string> = {
        a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к',
        l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у',
        v: 'в', x: 'х', y: 'й', z: 'з', c: 'ц', w: 'в',
    };
    result = result.replace(/\bE/g, 'Э').replace(/\be/g, 'э');
    return result.replace(/[A-Za-z]/g, letter => {
        const converted = letters[letter.toLowerCase()] ?? letter;
        return letter === letter.toUpperCase() ? converted.toUpperCase() : converted;
    }).replace(/[‘’']/g, 'ъ');
}

export function translate(source: string, locale: Locale): string {
    if (locale === 'uz-Latn' || !source.trim()) return source;
    const leading = source.match(/^\s*/)?.[0] ?? '';
    const trailing = source.match(/\s*$/)?.[0] ?? '';
    const key = source.trim();
    const value = locale === 'ru' ? russian[key] ?? key : key === 'ONUR Task Manager' || key === 'Task Manager' ? key : cyrillicOverrides[key] ?? toCyrillic(key);
    return leading + value + trailing;
}

const presetContent = new Set([
    'Rejada', 'Jarayonda', 'Tekshiruvda', 'Bajarildi',
    'Mahsulot rivojlantirish', 'Marketing va kontent', 'Ichki jarayonlar',
    'G‘oyadan natijagacha — keyingi versiyani birga yaratamiz.',
    'Kontent reja, kampaniyalar va yangi g‘oyalar.',
    'Jamoaning kundalik ishlarini tartibga solamiz.',
    'Tadqiqot', 'Strategiya', 'Mahsulot', 'Dizayn', 'Dasturlash', 'Test',
    'Tayyorlash', 'Jamoa bilan tekshirish', 'Yakunlash',
]);

export function translatePreset(value: string, locale: Locale) {
    return presetContent.has(value) ? translate(value, locale) : value;
}

export function countLabel(count: number, kind: 'tasks' | 'permissions', locale: Locale) {
    if (locale !== 'ru') return `${count} ${translate(kind === 'tasks' ? 'ta vazifa' : 'ta huquq', locale)}`;
    const forms = kind === 'tasks' ? ['задача', 'задачи', 'задач'] : ['право', 'права', 'прав'];
    const mod100 = count % 100;
    const form = mod100 >= 11 && mod100 <= 14 ? 2 : count % 10 === 1 ? 0 : count % 10 >= 2 && count % 10 <= 4 ? 1 : 2;
    return `${count} ${forms[form]}`;
}

export function roleLabel(id: string, name: string, locale: Locale, role?: { nameCyrl?: string; nameRu?: string }) {
    if (locale === 'uz-Latn') return name;
    const translated = locale === 'ru' ? role?.nameRu : role?.nameCyrl;
    if (translated?.trim()) return translated;
    if (name === defaultRoleLatin[id]) return roleNames[id][locale === 'ru' ? 1 : 0];
    return name;
}

export function permissionLabel(code: string, locale: Locale) {
    const latin: Record<string, string> = {
        view: 'Ko‘rish', 'column.manage': 'Ustunlarni boshqarish', 'column.reorder': 'Ustunlar tartibini o‘zgartirish',
        'card.create': 'Vazifa yaratish', 'card.edit': 'Vazifani tahrirlash', 'card.move': 'Vazifani ko‘chirish va tartiblash',
        'card.delete': 'Vazifani o‘chirish', 'card.transfer': 'Boshqa doskaga o‘tkazish', comment: 'Izoh yozish',
        'file.upload': 'Fayl yuklash', 'file.download': 'Faylni yuklab olish', assign: 'Mas’ul tayinlash',
        deadline: 'Muddatni o‘zgartirish', members: 'A’zolarni boshqarish', settings: 'Doska sozlamalari',
        audit: 'Faoliyat tarixini ko‘rish', export: 'Ma’lumotni eksport qilish', share: 'Havola ulashish',
        acl: 'Vazifa huquqlarini boshqarish', 'own.edit': 'O‘z vazifasini tahrirlash',
        'own.move': 'O‘z vazifasini ko‘chirish', 'own.deadline': 'O‘z vazifasining muddatini o‘zgartirish',
    };
    if (locale === 'uz-Latn') return latin[code] ?? code;
    return permissionNames[code]?.[locale === 'ru' ? 1 : 0] ?? code;
}

export function translateNotice(message: string, locale: Locale) {
    const denied = 'Bu amal uchun huquqingiz yo‘q: ';
    if (message.startsWith(denied)) {
        const permission = message.slice(denied.length);
        return locale === 'ru' ? `Недостаточно прав: ${permissionLabel(permission, locale)}` : locale === 'uz-Cyrl' ? `Бу амал учун ҳуқуқингиз йўқ: ${permissionLabel(permission, locale)}` : message;
    }
    return translate(message, locale);
}
