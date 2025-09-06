# DevPodcasts - Marketplace Podcastów Programistycznych

Aplikacja marketplace'u podcastów programistycznych z funkcjonalnością płatności, zarządzania użytkownikami i panelem administratora. System oferuje podcasty z kategorii Java, JavaScript, Azure i Architecture z możliwością odtwarzania demo przed zakupem.

## 🚀 Funkcje

### Dla Użytkowników
- **Przeglądanie Podcastów**: Katalog podzielony na kategorie programistyczne
- **Demo Audio**: Odtwarzanie fragmentów podcastów przed zakupem
- **System Płatności**: Integracja ze Stripe dla bezpiecznych transakcji
- **Biblioteka Osobista**: Zarządzanie zakupionymi podcastami
- **Uwierzytelnianie**: Rejestracja i logowanie przez Replit Auth

### Dla Administratorów
- **Panel Administracyjny**: Pełne zarządzanie treścią
- **CRUD Podcastów**: Dodawanie, edycja, usuwanie podcastów
- **Upload Plików**: Główne audio + pliki demo przez Object Storage
- **Zarządzanie Kategoriami**: Tworzenie i edycja kategorii
- **System Bundle**: Grupowanie podcastów w pakiety
- **Zarządzanie Użytkownikami**: Kontrola bibliotek użytkowników

## 🏗️ Architektura

### Frontend
- **React 18** z TypeScript i Vite
- **Radix UI + shadcn/ui** - komponenty UI z accessibility
- **Tailwind CSS** - stylowanie
- **TanStack Query** - zarządzanie stanem serwera
- **Wouter** - routing
- **React Hook Form + Zod** - walidacja formularzy

### Backend
- **Node.js + Express** - serwer REST API
- **PostgreSQL** - baza danych (Neon serverless)
- **Drizzle ORM** - mapowanie obiektowo-relacyjne
- **Express Sessions** - zarządzanie sesjami
- **Google Cloud Storage** - przechowywanie plików audio

### Uwierzytelnianie
- **Replit OIDC** - dostawca tożsamości
- **Sesje HTTP-only** - bezpieczne przechowywanie sesji
- **Role-based Access** - kontrola dostępu administratora

### Płatności
- **Stripe** - przetwarzanie płatności
- **Webhook Integration** - automatyczne przetwarzanie zakupów

## 📦 Instalacja Lokalna (Docker)

### Wymagania
- Docker i Docker Compose
- Node.js 18+ (dla developmentu)
- Google Cloud Storage bucket
- Stripe account
- PostgreSQL (lub użyj Docker Compose)

### 1. Klonowanie repozytorium
```bash
git clone <repository-url>
cd devpodcasts
```

### 2. Konfiguracja środowiska
Utwórz plik `.env` na podstawie `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/devpodcasts"

# Google Cloud Storage
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
PRIVATE_OBJECT_DIR="gs://your-bucket-name/private"
PUBLIC_OBJECT_DIR="gs://your-bucket-name/public"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Session
SESSION_SECRET="your-super-secret-session-key"

# Auth (opcjonalnie dla lokalnego developmentu)
REPLIT_AUTH_CLIENT_ID="your-client-id"
REPLIT_AUTH_CLIENT_SECRET="your-client-secret"
REPLIT_AUTH_REDIRECT_URI="http://localhost:5000/api/auth/callback"
```

### 3. Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

### 4. Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/devpodcasts
    depends_on:
      - db
    volumes:
      - ./google-credentials.json:/app/google-credentials.json
    env_file:
      - .env

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=devpodcasts
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 5. Uruchomienie
```bash
# Zbuduj i uruchom kontenery
docker-compose up --build

# Wykonaj migracje bazy danych
docker-compose exec app npm run db:push

# Opcjonalnie: załaduj dane testowe
docker-compose exec app npm run seed
```

## 🛠️ Development Setup

### 1. Instalacja zależności
```bash
npm install
```

### 2. Konfiguracja bazy danych
```bash
# Uruchom PostgreSQL lokalnie lub użyj Docker
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Wykonaj migracje
npm run db:push

# Załaduj dane testowe
npm run seed
```

### 3. Uruchomienie w trybie deweloperskim
```bash
npm run dev
```

## 📁 Struktura Projektu

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Komponenty UI
│   │   ├── pages/         # Strony aplikacji
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities i konfiguracja
├── server/                # Backend Express
│   ├── routes.ts          # Definicje API endpoints
│   ├── storage.ts         # Warstwa dostępu do danych
│   ├── objectStorage.ts   # Google Cloud Storage
│   └── seed.ts           # Dane testowe
├── shared/                # Współdzielone typy i schematy
│   └── schema.ts         # Drizzle ORM schemas
└── docker-compose.yml    # Konfiguracja kontenerów
```

## 🔧 Skrypty NPM

```bash
# Development
npm run dev              # Uruchom w trybie deweloperskim
npm run build           # Zbuduj aplikację
npm start              # Uruchom w trybie produkcyjnym

# Database
npm run db:push        # Wykonaj migracje
npm run db:studio      # Otwórz Drizzle Studio
npm run seed          # Załaduj dane testowe

# Utilities
npm run lint          # Sprawdź kod
npm run type-check    # Sprawdź typy TypeScript
```

## 🔒 Bezpieczeństwo

- **HTTPS Only** - wymaga SSL w produkcji
- **CSRF Protection** - ochrona przed atakami CSRF
- **Rate Limiting** - ograniczenia częstotliwości żądań
- **Input Validation** - walidacja danych wejściowych przez Zod
- **SQL Injection Protection** - parametryzowane zapytania przez Drizzle

## 📊 Monitorowanie

- **Express Logs** - logowanie żądań HTTP
- **Error Handling** - centralne przechwytywanie błędów
- **Database Logs** - logowanie operacji bazodanowych
- **Object Storage Logs** - monitorowanie operacji na plikach

## 🚀 Deploy

### Replit (Recommended)
Aplikacja jest zoptymalizowana pod Replit Deployments z automatyczną konfiguracją.

### Inne platformy
1. **Heroku**: Dodaj Postgres addon i skonfiguruj zmienne środowiskowe
2. **Vercel**: Użyj Vercel Postgres i Edge Functions
3. **DigitalOcean**: App Platform z Managed Database

## 🤝 Contributing

1. Fork repozytorium
2. Utwórz branch feature (`git checkout -b feature/amazing-feature`)
3. Commit zmiany (`git commit -m 'Add amazing feature'`)
4. Push do brancha (`git push origin feature/amazing-feature`)
5. Otwórz Pull Request

## 📝 Licencja

Ten projekt jest licencjonowany pod MIT License - zobacz plik [LICENSE](LICENSE) dla szczegółów.