const messages: Record<string, string> = {
    EMAIL: 'Email noto‘g‘ri', PASSWORD: 'Parol kamida 8 belgidan iborat bo‘lsin',
    SETUP_SECRET: 'Boshlang‘ich sozlash kaliti noto‘g‘ri', ALREADY_SETUP: 'Bosh administrator allaqachon yaratilgan',
    INVALID_LOGIN: 'Login yoki parol noto‘g‘ri', LOGIN_LIMIT: 'Juda ko‘p urinish. Birozdan keyin urinib ko‘ring.',
    NO_ACCESS: 'Hisobga faol ish maydoni biriktirilmagan', EXPIRED: 'Havola eskirgan yoki ishlatilgan',
    INVALID_TOKEN: 'Havola noto‘g‘ri', USED: 'Taklif ishlatilgan', REVOKED: 'Taklif bekor qilingan',
    SIGN_IN_REQUIRED: 'Bu emailda hisob bor. Avval shu hisobga kiring.', ALREADY_MEMBER: 'Siz allaqachon a’zosiz',
    MULTIPLE_LEGACY_OWNERS: 'Bir nechta eski Owner topildi; ma’lumotlarni qo‘lda ko‘chirish kerak',
};

export function authErrorMessage(code: unknown, fallback: string) {
    return typeof code === 'string' ? messages[code] ?? fallback : fallback;
}
