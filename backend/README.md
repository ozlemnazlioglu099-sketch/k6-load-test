# K6 Load Test Backend

Yük testi senaryolarında kullanılmak üzere hazırlanmış, NestJS ve PostgreSQL tabanlı örnek backend uygulaması. Uygulama; kullanıcı oluşturma/listeleme, basit kimlik doğrulama, sağlık kontrolü ve çalışma zamanı metriklerini HTTP üzerinden sunar.

## Teknolojiler

- [NestJS](https://nestjs.com/) 12
- TypeScript
- PostgreSQL
- `pg` bağlantı havuzu
- Vitest ve Supertest
- [Artillery](https://www.artillery.io/) (yük testi bağımlılığı)
- NestJS Observe (gözlemlenebilirlik)

## Gereksinimler

- Node.js 20 veya üzeri
- npm
- PostgreSQL 14 veya üzeri

## Kurulum

1. Backend klasörüne geçin:

   ```bash
   cd backend
   ```

2. Bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

3. PostgreSQL bağlantı adresini `.env` dosyasında tanımlayın:

   ```env
   DATABASE_URL=postgresql://kullanici:sifre@localhost:5432/loadtest
   PORT=3000
   ```

   `PORT` belirtilmezse uygulama `3000` portunda başlar.

4. Uygulamanın kullandığı tabloyu oluşturun:

   ```sql
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     password TEXT NOT NULL
   );
   ```

## Çalıştırma

```bash
# Geliştirme
npm run start

# Dosya değişikliklerini izleyerek geliştirme
npm run start:dev

# Production derlemesi ve çalıştırma
npm run build
npm run start:prod
```

Uygulama başladıktan sonra varsayılan adres: <http://localhost:3000>

## API

### Sağlık kontrolü

```http
GET /health
```

Örnek yanıt:

```json
{
  "status": "ok"
}
```

### Kullanıcıları listeleme

```http
GET /users
```

### Kullanıcı görüntüleme

```http
GET /users/:id
```

`id` sayısal olmalıdır. Kayıt bulunamazsa `null` döner.

### Kullanıcı oluşturma

```http
POST /users
Content-Type: application/json
```

İstek gövdesi:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "change-me"
}
```

Yanıt, oluşturulan kullanıcının `id`, `name` ve `email` alanlarını içerir; parola yanıt gövdesine dahil edilmez.

### Giriş

```http
POST /auth/login
Content-Type: application/json
```

İstek gövdesi:

```json
{
  "email": "ada@example.com",
  "password": "change-me"
}
```

Kimlik bilgileri geçerliyse kullanıcı bilgileriyle birlikte başarı yanıtı döner. Geçersiz bilgiler için `401 Unauthorized` döndürülür.

### Uygulama metrikleri

```http
GET /metrics
```

Yanıt aşağıdaki bilgileri içerir:

- Process bilgileri: PID ve uptime
- Bellek kullanımı: RSS, heap kullanımı ve heap toplamı
- CPU kullanım yüzdesi
- Event loop gecikmesi: ortalama, maksimum ve p95
- PostgreSQL havuzu: toplam, boşta ve bekleyen bağlantılar ile havuz limiti

## Test ve kalite kontrolleri

```bash
# Birim testleri
npm run test

# Testleri izleme modunda çalıştırma
npm run test:watch

# E2E testleri
npm run test:e2e

# Kapsama raporu
npm run test:cov

# Lint
npm run lint

# Formatlama
npm run format
```

## Proje yapısı

```text
src/
├── auth/       # Giriş endpoint'i ve kimlik doğrulama servisi
├── database/   # PostgreSQL bağlantı havuzu
├── metrics/    # Çalışma zamanı ve veritabanı metrikleri
├── users/      # Kullanıcı endpoint'leri ve servisi
├── app.module.ts
└── main.ts
test/           # E2E testleri
```

## Gözlemlenebilirlik

Uygulama `@nestjs/observe` ile enstrümante edilmiştir. `src/app.module.ts` içindeki Observe yapılandırmasında kullanılan uygulama anahtarlarını gerçek ortamda güvenli bir secret yönetimi çözümünden sağlayın; anahtarları kaynak koduna veya sürüm kontrolüne eklemeyin.

## Güvenlik notları

- `.env` dosyasını sürüm kontrolüne eklemeyin.
- Üretim ortamında kullanıcı parolalarını düz metin olarak saklamayın; güçlü bir parola hash algoritması kullanın.
- Üretimde TLS, istek doğrulama, rate limiting ve uygun kimlik doğrulama/yetkilendirme katmanlarını ekleyin.
- Yük testlerini yalnızca kontrol ettiğiniz ortamlarda ve ilgili ekiplerin onayıyla çalıştırın.

## Lisans

Bu proje şu anda `UNLICENSED` olarak yapılandırılmıştır.
