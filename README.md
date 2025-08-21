# DevPodcasts - Marketplace Podcastów Programistycznych

Profesjonalna platforma do sprzedaży i zakupu podcastów programistycznych w języku polskim. Specjalizujemy się w treściach audio dla programistów, które można słuchać w drodze do pracy, podczas treningu lub w dowolnym miejscu.

## 🎯 Dla Kogo

- **Programiści Java** - podcasty o kolekcjach, garbage collection, Spring Framework
- **Deweloperzy JavaScript** - materiały o asynchroniczności, React, Node.js
- **Specjaliści Azure** - treści o chmurze Microsoft, DevOps, architekturze
- **Architekci oprogramowania** - podcasty o wzorcach projektowych, mikrousługach

## ✨ Kluczowe Funkcjonalności

### Dla Użytkowników
- **Przeglądanie podcastów** według kategorii (Java, JavaScript, Azure, Architecture)
- **Indywidualne strony produktów** z pełnymi opisami i przyciskami "Kup Teraz"
- **Bezpieczne płatności** przez Stripe w złotówkach (PLN)
- **Osobista biblioteka** zakupionych podcastów z linkami do pobrania
- **Autentykacja** przez Replit Auth (OpenID Connect)

### Dla Administratorów
- **Panel administracyjny** do zarządzania podcastami
- **Edytor treści** z prostym formatowaniem (bez wymagania API)
- **Zarządzanie kategoriami** i cenami w PLN
- **Monitoring zakupów** i statystyki sprzedaży

## 🏗 Architektura Techniczna

### Frontend
- **React 18** z TypeScript i Vite
- **Shadcn/UI** + Radix UI components
- **Tailwind CSS** do stylizacji
- **TanStack Query** do zarządzania stanem serwera
- **Wouter** do routingu po stronie klienta

### Backend
- **Node.js** z Express.js
- **PostgreSQL** przez Neon serverless
- **Drizzle ORM** z automatycznymi migracjami
- **Passport.js** z OIDC strategy

### Zewnętrzne Serwisy
- **Stripe** - płatności online w PLN
- **Google Cloud Storage** - przechowywanie plików audio
- **Replit Auth** - bezpieczna autentykacja użytkowników

## 🚀 Uruchomienie Projektu

### Wymagania
- Node.js 18+
- PostgreSQL database
- Konto Stripe (klucze API)
- Konto Replit (dla autentykacji)

### Instalacja

1. **Klonowanie repozytorium:**
```bash
git clone <repository-url>
cd devpodcasts
```

2. **Instalacja zależności:**
```bash
npm install
```

3. **Konfiguracja zmiennych środowiskowych:**
```bash
# Wymagane zmienne:
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_...
VITE_STRIPE_PUBLIC_KEY=pk_...
SESSION_SECRET=your-session-secret
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.replit.dev
```

4. **Inicjalizacja bazy danych:**
```bash
npm run db:push
```

5. **Uruchomienie w trybie developerskim:**
```bash
npm run dev
```

Aplikacja będzie dostępna na `http://localhost:5000`

## 📁 Struktura Projektu

```
├── client/src/
│   ├── components/     # Komponenty UI (przyciski, formularze)
│   ├── pages/         # Strony aplikacji
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utilities i konfiguracja
├── server/
│   ├── routes.ts      # API endpoints
│   ├── storage.ts     # Warstwa dostępu do danych
│   ├── db.ts         # Konfiguracja Drizzle ORM
│   └── replitAuth.ts  # Konfiguracja autentykacji
├── shared/
│   └── schema.ts      # Wspólne typy i schematy Zod
└── README.md
```

## 🛡 Bezpieczeństwo

- **HTTPS** wymagane w produkcji
- **Sesje** przechowywane bezpiecznie w PostgreSQL
- **CSRF protection** przez walidację sesji
- **Stripe payments** z pełną tokenizacją kart
- **File uploads** z ACL (Access Control Lists)

## 📊 Baza Danych

### Główne Tabele
- `users` - dane użytkowników z Replit Auth
- `categories` - kategorie podcastów (Java, JS, Azure, Architecture)
- `podcasts` - produkty z opisami, cenami, plikami audio
- `purchases` - historia zakupów użytkowników
- `sessions` - sesje autentykacji

### Relacje
- Podcast → Category (many-to-one)
- Purchase → User + Podcast (many-to-many przez junction table)

## 🔧 Dostępne Komendy

```bash
# Rozwój
npm run dev          # Uruchom serwer developmentu
npm run db:push      # Zastosuj zmiany w schemacie do bazy
npm run db:studio    # Otwórz Drizzle Studio

# Produkcja
npm run build        # Zbuduj aplikację
npm start           # Uruchom serwer produkcyjny
```

## 🐛 Debugowanie

### Logi Serwera
- Express logi dostępne w konsoli
- Błędy Stripe logowane z pełnymi szczegółami
- Database queries widoczne w trybie debug

### Popularne Problemy

1. **"Podcast nie znaleziony" na checkout**
   - Sprawdź czy endpoint `/api/podcasts/by-id/:id` działa
   - Zweryfikuj ID podcastu w URL

2. **Błędy płatności Stripe**
   - Upewnij się że `STRIPE_SECRET_KEY` jest ustawiony
   - Sprawdź czy używasz najnowszej wersji API Stripe

3. **Problemy z autentykacją**
   - Zweryfikuj konfigurację `REPLIT_DOMAINS`
   - Sprawdź czy `SESSION_SECRET` jest ustawiony

## 📈 Roadmapa

- [ ] Dodanie systemu recenzji podcastów
- [ ] Implementacja wishlisty użytkowników  
- [ ] Powiadomienia email o nowych podcastach
- [ ] Statystyki słuchaczy dla autorów
- [ ] Program partnerski dla twórców treści

## 🤝 Wsparcie

Dla problemów technicznych lub pytań biznesowych:
- Stwórz issue na GitHubie
- Napisz na email support@devpodcasts.pl
- Dołącz do naszego Discord serwera

## 📄 Licencja

Ten projekt jest własnością prywatną. Wszystkie prawa zastrzeżone.

---

**DevPodcasts** - Profesjonalne podcasty programistyczne po polsku 🎧