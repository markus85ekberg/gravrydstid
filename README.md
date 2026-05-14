# Gravryds Last & Loss – Projektverktyg

Webbaserat projektverktyg för tidregistrering, kundhantering och rapporter.

## Kom igång – tre steg

---

### Steg 1: Sätt upp databasen i Supabase (gratis)

1. Gå till **https://supabase.com** och skapa ett gratiskonto
2. Klicka **New project** – välj ett namn, t.ex. `gravryds`
3. Vänta ~2 minuter tills projektet är klart
4. Gå till **SQL Editor** → **New Query**
5. Klistra in hela innehållet från filen `supabase_schema.sql` och klicka **Run**
6. Gå till **Settings** → **API** och kopiera:
   - **Project URL** (ser ut som `https://xxxxx.supabase.co`)
   - **anon public key** (lång nyckel)

---

### Steg 2: Lägg upp koden på GitHub

1. Gå till **https://github.com** och skapa ett gratiskonto
2. Klicka **New repository** – sätt till **Private**
3. Ladda upp alla filerna från denna mapp till repot
4. Skapa filen `.env` i repot (lägg **inte** till den i git) med:
   ```
   VITE_SUPABASE_URL=https://ditt-projekt.supabase.co
   VITE_SUPABASE_ANON_KEY=din-anon-key-här
   ```

---

### Steg 3: Driftsätt på Vercel (gratis)

1. Gå till **https://vercel.com** och logga in med ditt GitHub-konto
2. Klicka **Add New Project** → välj ditt GitHub-repo
3. Under **Environment Variables**, lägg till:
   - `VITE_SUPABASE_URL` = din Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = din anon key
4. Klicka **Deploy** – vänta ~1 minut
5. Du får en länk, t.ex. `https://gravryds.vercel.app` ✅

---

### Skapa användare

1. Gå till ditt **Supabase-projekt** → **Authentication** → **Users**
2. Klicka **Invite user** eller **Add user**
3. Fyll i e-post och lösenord
4. Lägg till metadata (klicka på användaren → Edit):
   ```json
   {
     "name": "Karl Förare",
     "role": "driver",
     "initials": "KF",
     "color": "#1D9E75"
   }
   ```
   För admin: `"role": "admin"`

---

### Lokalt (för testning)

```bash
npm install
cp .env.example .env   # fyll i dina Supabase-nycklar
npm run dev
```

Öppna http://localhost:5173

---

## Roller

| Roll | Kan se |
|------|--------|
| **Admin** | Allt – kunder, projekt, alla förares tid, rapporter, användare |
| **Förare** | Bara sin egen tidregistrering och översikt |

## Teknisk stack

- **Frontend:** React + Vite
- **Databas & auth:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Excel-export:** SheetJS (xlsx)
