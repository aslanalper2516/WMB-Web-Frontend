# WMB Tracker Frontend

Bu proje, WMB Tracker backend mikroservisleri için oluşturulmuş modern bir React frontend uygulamasıdır.

## Özellikler

- **4 Mikroservis Desteği**: Auth, CompanyBranch, RolePermission, CategoryProduct
- **Modern UI**: Tailwind CSS ile responsive tasarım
- **TypeScript**: Tip güvenliği
- **React Query**: Veri yönetimi ve cache
- **Axios**: HTTP istekleri
- **React Router**: Sayfa yönlendirme
- **Authentication**: JWT token tabanlı giriş sistemi

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Environment dosyasını oluşturun:
```bash
cp env.example .env
```

3. `.env` dosyasını düzenleyin:
```
VITE_API_BASE_URL=http://localhost:3000
```

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

## Kullanım

1. Backend sunucusunun çalıştığından emin olun (port 3000)
2. Frontend'i başlatın (port 5173)
3. http://localhost:5173 adresine gidin
4. Giriş yapın veya yeni hesap oluşturun

## Sayfalar

- **Dashboard**: Ana sayfa ve istatistikler
- **Şirketler**: Şirket yönetimi
- **Şubeler**: Şube yönetimi
- **Kategoriler**: Ürün kategorileri
- **Ürünler**: Ürün yönetimi
- **Mutfaklar**: Mutfak yönetimi
- **Roller**: Rol yönetimi
- **İzinler**: İzin yönetimi
- **Kullanıcılar**: Kullanıcı listesi

## Teknolojiler

- React 19
- TypeScript
- Tailwind CSS
- React Query
- Axios
- React Router
- Lucide React (İkonlar)
- Vite

## Proje Yapısı

```
src/
├── api/           # API servisleri
├── components/    # UI bileşenleri
├── contexts/      # React context'leri
├── pages/         # Sayfa bileşenleri
├── types/         # TypeScript tipleri
└── App.tsx        # Ana uygulama
```

## Geliştirme

```bash
# Geliştirme sunucusu
npm run dev

# Build
npm run build

# Lint
npm run lint

# Preview
npm run preview
```