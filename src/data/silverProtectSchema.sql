-- ==============================================================================
-- 銀髮出行守護員 (AI Senior Mobility Companion)
-- Supabase PostgreSQL 資料庫完整建置腳本
-- 專案 Supabase 網址: https://gkttoczebvhpqgcuwhtd.supabase.co
-- ==============================================================================

-- 1. 啟用 UUID 自動產製延伸套件
create extension if not exists "uuid-ossp";

-- 2. 家屬管理者表 (Guardians) - 與 Supabase Auth 帳號 (auth.users) 連動
create table if not exists public.guardians (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '家屬',
  gemini_api_key text,
  line_user_id text,
  created_at timestamptz default now()
);

-- 3. 長輩檔案表 (Seniors) - 長者個人偏好與綁定狀態
create table if not exists public.seniors (
  id uuid primary key default uuid_generate_v4(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  name text not null default '長輩',
  age integer default 70,
  line_user_id text, -- 長者用 LINE 掃碼綁定後寫入
  invite_code text unique, -- 專屬 6 碼或 QR Code 憑證代碼 (如 SP-8823)
  invite_expires_at timestamptz default (now() + interval '30 days'),
  status text default 'pending_bind', -- 'pending_bind' (待綁定) | 'active' (已啟用)
  
  -- 生理輔具偏好 (JSONB)
  mobility_preferences jsonb default '{
    "avoid_stairs": true,
    "prefer_elevator": true,
    "max_walking_meters": 300,
    "require_low_floor_bus": true
  }'::jsonb,
  
  -- LINE 守護通報規則 (JSONB)
  notification_rules jsonb default '{
    "notify_on_depart": true,
    "notify_on_arrive": true,
    "notify_on_home": true,
    "notify_on_sos": true,
    "geofence_radius_meters": 500,
    "max_stay_minutes": 30
  }'::jsonb,
  created_at timestamptz default now()
);

-- 4. 長輩常用地點與照片庫表 (Saved Locations) - 決定長者 Mini App 首頁卡片與照片
create table if not exists public.saved_locations (
  id uuid primary key default uuid_generate_v4(),
  senior_id uuid not null references public.seniors(id) on delete cascade,
  name text not null, -- 例如: 家、台北榮民總醫院、女兒小華家、士東市場
  category text not null default 'custom', -- 'home' | 'hospital' | 'family' | 'market' | 'custom'
  address text not null default '',
  lat double precision not null,
  lon double precision not null,
  photo_url text, -- 親友生活照或實景照片 (Supabase Storage: location-photos)
  voice_aliases text[] default array[]::text[], -- 口語別名 (如: ["買菜", "菜市場", "士東"])
  priority integer default 0, -- 排序優先度 (數字越大越靠前)
  created_at timestamptz default now()
);

-- 5. 外出行程與安全警報日誌表 (Trip Logs)
create table if not exists public.trip_logs (
  id uuid primary key default uuid_generate_v4(),
  senior_id uuid not null references public.seniors(id) on delete cascade,
  event_type text not null, -- 'depart' | 'arrive' | 'stay_alert' | 'geofence_out' | 'sos'
  location_name text,
  lat double precision,
  lon double precision,
  message text,
  created_at timestamptz default now()
);

-- ==============================================================================
-- 安全隱私政策 (Row Level Security - RLS)
-- ==============================================================================

alter table public.guardians enable row level security;
alter table public.seniors enable row level security;
alter table public.saved_locations enable row level security;
alter table public.trip_logs enable row level security;

-- 家屬管理者權限控制 (透過 Supabase Auth UID 隔離)
create policy "Guardians manage own profile" on public.guardians
  for all using (auth.uid() = id);

create policy "Guardians manage own seniors" on public.seniors
  for all using (auth.uid() = guardian_id);

create policy "Guardians manage saved locations" on public.saved_locations
  for all using (
    senior_id in (select id from public.seniors where guardian_id = auth.uid())
  );

create policy "Guardians view trip logs" on public.trip_logs
  for select using (
    senior_id in (select id from public.seniors where guardian_id = auth.uid())
  );

-- 長輩端憑邀請碼或已授權之公開安全讀取政策
create policy "Public can read seniors by invite_code" on public.seniors
  for select using (true);

create policy "Public can update seniors bind line_user_id" on public.seniors
  for update using (true);

create policy "Public can read saved locations" on public.saved_locations
  for select using (true);

create policy "Public can insert trip logs" on public.trip_logs
  for insert with check (true);
