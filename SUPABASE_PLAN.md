# Supabase Integration Plan

## Обзор

Добавляем опциональную облачную синхронизацию через Supabase. Локальная Dexie DB остаётся source of truth. Синхронизация — дополнительная фича для бэкапа и мультидевайса.

---

## 1. SQL-схема базы данных

### Таблица `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### Таблица `cycles`
```sql
CREATE TABLE cycles (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('classic', 'inverted')),
  training_maxes JSONB NOT NULL,  -- { squat, bench, ohp, deadlift }
  start_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ,  -- soft delete for sync
  PRIMARY KEY (id, user_id)
);
```

### Таблица `workout_logs`
```sql
CREATE TABLE workout_logs (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cycle_id TEXT NOT NULL,
  lift TEXT NOT NULL CHECK (lift IN ('squat', 'bench', 'ohp', 'deadlift')),
  wave TEXT NOT NULL CHECK (wave IN ('10s', '8s', '5s', '3s')),
  phase TEXT NOT NULL CHECK (phase IN ('accumulation', 'intensification', 'realization', 'deload')),
  week INTEGER NOT NULL,
  sets JSONB NOT NULL,  -- CompletedSet[]
  date TEXT NOT NULL,
  notes TEXT DEFAULT '' NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (id, user_id)
);
```

### Таблица `amrap_results`
```sql
CREATE TABLE amrap_results (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cycle_id TEXT NOT NULL,
  lift TEXT NOT NULL CHECK (lift IN ('squat', 'bench', 'ohp', 'deadlift')),
  wave TEXT NOT NULL CHECK (wave IN ('10s', '8s', '5s', '3s')),
  weight REAL NOT NULL,
  target_reps INTEGER NOT NULL,
  actual_reps INTEGER NOT NULL,
  date TEXT NOT NULL,
  estimated_one_rep_max REAL NOT NULL,
  new_training_max REAL NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (id, user_id)
);
```

### Таблица `tabata_logs`
```sql
CREATE TABLE tabata_logs (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cycle_id TEXT NOT NULL,
  wave TEXT NOT NULL CHECK (wave IN ('10s', '8s', '5s', '3s')),
  phase TEXT NOT NULL CHECK (phase IN ('accumulation', 'intensification', 'realization', 'deload')),
  week INTEGER NOT NULL,
  blocks JSONB NOT NULL,  -- TabataCompletedBlock[]
  date TEXT NOT NULL,
  rpe INTEGER NOT NULL CHECK (rpe BETWEEN 1 AND 10),
  notes TEXT DEFAULT '' NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (id, user_id)
);
```

### Индексы
```sql
CREATE INDEX idx_cycles_user ON cycles(user_id, updated_at);
CREATE INDEX idx_workout_logs_user ON workout_logs(user_id, updated_at);
CREATE INDEX idx_amrap_results_user ON amrap_results(user_id, updated_at);
CREATE INDEX idx_tabata_logs_user ON tabata_logs(user_id, updated_at);
```

---

## 2. Row-Level Security (RLS)

Одинаковая политика для всех таблиц данных:

```sql
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE amrap_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabata_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: user can only see/manage own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Template for data tables (repeat for each table):
CREATE POLICY "Users can view own data"
  ON cycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data"
  ON cycles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own data"
  ON cycles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own data"
  ON cycles FOR DELETE USING (auth.uid() = user_id);
-- (аналогично для workout_logs, amrap_results, tabata_logs)
```

### Auto-create profile on signup
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 3. Архитектура синхронизации

### Принципы
- **Offline-first**: Dexie = source of truth. Supabase = бэкап
- **Last-write-wins**: конфликты решаются по `updated_at`
- **Soft deletes**: удалённые записи помечаются `deleted_at`, не удаляются сразу
- **Incremental sync**: передаём только изменения с последней синхронизации

### Sync Flow

```
[Local Change] → Dexie write → mark dirty → [Sync Queue]
                                                    ↓
                                            [Online?] → Push to Supabase
                                                    ↓
                                            Pull remote changes since lastSyncAt
                                                    ↓
                                            Merge (last-write-wins) → Update Dexie
```

### Tracking Changes

Добавляем в Dexie-модели:
```typescript
// Новые поля для всех сущностей
interface SyncMeta {
  updatedAt: string    // ISO timestamp
  syncedAt?: string    // когда последний раз синхронизировано
  deleted?: boolean    // soft delete flag
}
```

**Dexie version 3** — добавляем `updatedAt` и `_dirty` индекс:
```typescript
this.version(3).stores({
  cycles: 'id, createdAt, updatedAt, _dirty',
  workoutLogs: 'id, cycleId, [cycleId+lift+wave+phase], date, updatedAt, _dirty',
  amrapResults: 'id, cycleId, [cycleId+lift+wave], date, updatedAt, _dirty',
  tabataLogs: 'id, cycleId, [cycleId+wave+phase], date, updatedAt, _dirty',
})
```

`_dirty: 1` означает "изменено локально, не синхронизировано".

### Sync Engine (`src/lib/sync/syncEngine.ts`)

```typescript
interface SyncEngine {
  // Полная синхронизация
  sync(): Promise<SyncResult>

  // Push локальных изменений
  pushChanges(): Promise<void>

  // Pull удалённых изменений
  pullChanges(since: string): Promise<void>

  // Статус
  getLastSyncTime(): string | null
  isSyncing(): boolean
}

interface SyncResult {
  pushed: number
  pulled: number
  conflicts: number
  errors: string[]
}
```

### Push Logic
```
1. Найти все записи с _dirty = 1 в Dexie
2. Для каждой таблицы: upsert в Supabase (ON CONFLICT DO UPDATE)
3. При успехе: обновить syncedAt, снять _dirty
```

### Pull Logic
```
1. SELECT * FROM table WHERE user_id = ? AND updated_at > lastSyncAt
2. Для каждой записи:
   a. Если нет локально → добавить в Dexie
   b. Если есть локально и remote.updated_at > local.updatedAt → обновить Dexie
   c. Если есть локально и local.updatedAt >= remote.updated_at → skip (local wins)
3. Обработать deleted_at: если remote помечена удалённой → удалить из Dexie
4. Обновить lastSyncAt
```

### Когда синхронизировать
- При открытии приложения (если онлайн)
- При возврате онлайн (navigator.onLine event)
- Вручную (pull-to-refresh или кнопка)
- После каждого значимого действия (finish workout, save AMRAP) — с debounce 5 сек

---

## 4. Изменения в типах

```typescript
// Расширяем существующие типы
interface CycleConfig {
  // ... existing fields ...
  updatedAt: string    // NEW
  _dirty?: number      // NEW: 1 = needs sync
}

interface WorkoutLog {
  // ... existing fields ...
  updatedAt: string    // NEW
  _dirty?: number      // NEW
}

// Аналогично для AmrapResult, TabataLog
```

---

## 5. Auth Store (`src/stores/authStore.ts`)

```typescript
interface AuthState {
  user: User | null           // Supabase User object
  session: Session | null     // Supabase Session
  isLoading: boolean

  // Actions
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>  // check existing session on app start
}
```

Не персистим в localStorage — Supabase SDK сам хранит сессию.

---

## 6. Settings Store — расширение

```typescript
// Добавляем в settingsStore:
syncEnabled: boolean      // default: false
lastSyncAt: string | null // ISO timestamp последней синхронизации
```

---

## 7. Sync Store (`src/stores/syncStore.ts`)

```typescript
interface SyncState {
  isSyncing: boolean
  lastSyncAt: string | null
  syncError: string | null

  // Actions
  triggerSync: () => Promise<void>
  setSyncing: (v: boolean) => void
  setSyncError: (err: string | null) => void
  setLastSyncAt: (time: string) => void
}
```

---

## 8. Новые файлы

```
src/
  lib/
    sync/
      supabaseClient.ts     # Supabase client singleton
      syncEngine.ts          # Core push/pull logic
      syncHelpers.ts         # Table-specific mappers (camelCase ↔ snake_case)
      useSyncOnReconnect.ts  # Hook: sync when coming back online
  stores/
    authStore.ts             # Auth state
    syncStore.ts             # Sync status state
  components/
    settings/
      AuthSection.tsx        # Login/Register UI в настройках
      SyncSection.tsx        # Sync toggle + status + manual sync button
    layout/
      SyncIndicator.tsx      # Иконка в хедере: synced/syncing/error/offline
```

---

## 9. Env-переменные

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

`.env.example` — шаблон без реальных значений.

---

## 10. Миграция существующих данных

При первом включении sync:
1. Все записи в Dexie без `updatedAt` получают `updatedAt = createdAt || now()`
2. Все записи помечаются `_dirty = 1`
3. Первый sync = full push всех локальных данных в Supabase

---

## 11. UI изменения

### Settings Page — новые секции
1. **Account** (сверху, если не залогинен): кнопки "Sign In" / "Sign Up"
   - При нажатии — простая форма email + password
   - Если залогинен: показать email + кнопка "Sign Out"
2. **Sync** (после Account):
   - Toggle "Cloud Sync" (disabled если не залогинен)
   - Статус: "Last synced: 5 min ago" / "Never synced"
   - Кнопка "Sync Now"
   - Ошибка если есть

### Header — SyncIndicator
Маленькая иконка рядом с заголовком:
- ✓ (зелёная) — synced
- ↻ (анимация) — syncing
- ⚠ (жёлтая) — error
- Нет иконки — sync отключён

---

## 12. Порядок реализации (этапы)

### Этап 1: Foundation
- [ ] `npm install @supabase/supabase-js`
- [ ] `.env.example` + `supabaseClient.ts`
- [ ] Расширить типы: добавить `updatedAt`, `_dirty`
- [ ] Dexie version 3 миграция
- [ ] Обновить все write operations — ставить `updatedAt` и `_dirty`

### Этап 2: Auth
- [ ] `authStore.ts`
- [ ] `AuthSection.tsx` в настройках
- [ ] Auto-initialize auth on app start

### Этап 3: Sync Engine
- [ ] `syncHelpers.ts` — маппинг camelCase ↔ snake_case
- [ ] `syncEngine.ts` — push/pull логика
- [ ] `syncStore.ts`

### Этап 4: Sync UI & Triggers
- [ ] `SyncSection.tsx` в настройках
- [ ] `SyncIndicator.tsx` в хедере
- [ ] `useSyncOnReconnect.ts` hook
- [ ] Добавить sync triggers (после finish workout, AMRAP, etc.)
- [ ] Расширить settingsStore: `syncEnabled`, `lastSyncAt`

### Этап 5: i18n
- [ ] Добавить ключи переводов для auth/sync UI (ru + en)

---

## 13. Зависимости

```
@supabase/supabase-js ^2.x
```

Единственная новая зависимость.

---

## 14. Что НЕ входит в этот этап

- Real-time subscriptions (overkill для personal app)
- Social auth (Google, GitHub) — только email/password
- Data export/import
- Conflict resolution UI (автоматический last-write-wins достаточно)
- Server-side functions / Edge Functions
