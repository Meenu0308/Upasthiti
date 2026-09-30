-- ============ roles ============
create type public.app_role as enum ('ddhs','dho','bmo','doctor');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select, insert on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "claim own role" on public.user_roles for insert to authenticated with check (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email)
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ attendance domain ============
create table public.phcs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  block text not null,
  district text not null,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);
grant select on public.phcs to authenticated;
grant all on public.phcs to service_role;
alter table public.phcs enable row level security;
create policy "authenticated read phcs" on public.phcs for select to authenticated using (true);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  designation text not null default 'Medical Officer',
  phc_id uuid not null references public.phcs(id) on delete cascade,
  employee_code text unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.doctors to authenticated;
grant all on public.doctors to service_role;
alter table public.doctors enable row level security;
create policy "authenticated read doctors" on public.doctors for select to authenticated using (true);

create table public.attendance_events (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  phc_id uuid not null references public.phcs(id) on delete cascade,
  event_type text not null check (event_type in ('in','out')),
  source text not null default 'biometric' check (source in ('biometric','gps','manual')),
  occurred_at timestamptz not null default now(),
  gps_accuracy_m double precision,
  status text not null default 'verified' check (status in ('verified','flagged','incomplete')),
  flag_reason text,
  created_at timestamptz not null default now()
);
create index attendance_events_day_idx on public.attendance_events (occurred_at desc);
grant select on public.attendance_events to authenticated;
grant all on public.attendance_events to service_role;
alter table public.attendance_events enable row level security;
create policy "officers read attendance" on public.attendance_events for select to authenticated using (
  public.has_role(auth.uid(),'ddhs') or public.has_role(auth.uid(),'dho') or public.has_role(auth.uid(),'bmo')
);

-- ============ MediWiki ============
create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  generic_name text,
  brand_names text[] not null default '{}',
  form text,
  strength text,
  composition text,
  uses text[] not null default '{}',
  how_it_works text,
  dosage text,
  side_effects text[] not null default '{}',
  warnings text[] not null default '{}',
  interactions text[] not null default '{}',
  storage text,
  price_range text,
  prescription_required boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.medicines to anon, authenticated;
grant all on public.medicines to service_role;
alter table public.medicines enable row level security;
create policy "public read medicines" on public.medicines for select to anon, authenticated using (true);

create table public.saved_medicines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medicine_id uuid not null references public.medicines(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, medicine_id)
);
grant select, insert, delete on public.saved_medicines to authenticated;
grant all on public.saved_medicines to service_role;
alter table public.saved_medicines enable row level security;
create policy "own saved read" on public.saved_medicines for select to authenticated using (auth.uid() = user_id);
create policy "own saved insert" on public.saved_medicines for insert to authenticated with check (auth.uid() = user_id);
create policy "own saved delete" on public.saved_medicines for delete to authenticated using (auth.uid() = user_id);

create table public.recent_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  medicine_id uuid references public.medicines(id) on delete set null,
  mode text not null default 'text' check (mode in ('text','scan')),
  created_at timestamptz not null default now()
);
create index recent_searches_user_idx on public.recent_searches (user_id, created_at desc);
grant select, insert, delete on public.recent_searches to authenticated;
grant all on public.recent_searches to service_role;
alter table public.recent_searches enable row level security;
create policy "own searches read" on public.recent_searches for select to authenticated using (auth.uid() = user_id);
create policy "own searches insert" on public.recent_searches for insert to authenticated with check (auth.uid() = user_id);
create policy "own searches delete" on public.recent_searches for delete to authenticated using (auth.uid() = user_id);

-- ============ seed data ============
insert into public.phcs (id, name, block, district, latitude, longitude) values
 ('11111111-1111-4111-8111-111111111111','PHC Hunsur','Hunsur','Mysuru',12.3038,76.2930),
 ('22222222-2222-4222-8222-222222222222','PHC Nanjangud','Nanjangud','Mysuru',12.1173,76.6844),
 ('33333333-3333-4333-8333-333333333333','PHC Periyapatna','Periyapatna','Mysuru',12.3370,76.0990),
 ('44444444-4444-4444-8444-444444444444','PHC T. Narasipura','T. Narasipura','Mysuru',12.2075,76.8990);

insert into public.doctors (id, full_name, designation, phc_id, employee_code) values
 ('aaaaaaaa-0001-4000-8000-000000000001','Dr. Anitha Rao','Medical Officer','11111111-1111-4111-8111-111111111111','MO-1001'),
 ('aaaaaaaa-0002-4000-8000-000000000002','Dr. Vikram Shetty','Medical Officer','11111111-1111-4111-8111-111111111111','MO-1002'),
 ('aaaaaaaa-0003-4000-8000-000000000003','Dr. Fatima Noor','Senior Medical Officer','22222222-2222-4222-8222-222222222222','MO-1003'),
 ('aaaaaaaa-0004-4000-8000-000000000004','Dr. Rahul Menon','Medical Officer','22222222-2222-4222-8222-222222222222','MO-1004'),
 ('aaaaaaaa-0005-4000-8000-000000000005','Dr. Shweta Patil','Medical Officer','33333333-3333-4333-8333-333333333333','MO-1005'),
 ('aaaaaaaa-0006-4000-8000-000000000006','Dr. Girish Kumar','Medical Officer','33333333-3333-4333-8333-333333333333','MO-1006'),
 ('aaaaaaaa-0007-4000-8000-000000000007','Dr. Meera Joshi','Medical Officer','44444444-4444-4444-8444-444444444444','MO-1007'),
 ('aaaaaaaa-0008-4000-8000-000000000008','Dr. Arjun Das','Medical Officer','44444444-4444-4444-8444-444444444444','MO-1008');

insert into public.attendance_events (doctor_id, phc_id, event_type, source, occurred_at, gps_accuracy_m, status, flag_reason) values
 ('aaaaaaaa-0001-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','in','biometric', now() - interval '5 hours', 8, 'verified', null),
 ('aaaaaaaa-0002-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','in','gps', now() - interval '4 hours 30 minutes', 22, 'verified', null),
 ('aaaaaaaa-0003-4000-8000-000000000003','22222222-2222-4222-8222-222222222222','in','biometric', now() - interval '6 hours', 6, 'verified', null),
 ('aaaaaaaa-0004-4000-8000-000000000004','22222222-2222-4222-8222-222222222222','in','gps', now() - interval '3 hours', 120, 'flagged', 'GPS accuracy above 50 m'),
 ('aaaaaaaa-0005-4000-8000-000000000005','33333333-3333-4333-8333-333333333333','in','biometric', now() - interval '7 hours', 9, 'verified', null),
 ('aaaaaaaa-0005-4000-8000-000000000005','33333333-3333-4333-8333-333333333333','out','biometric', now() - interval '1 hour', 9, 'verified', null),
 ('aaaaaaaa-0007-4000-8000-000000000007','44444444-4444-4444-8444-444444444444','in','biometric', now() - interval '8 hours', 7, 'incomplete', 'No check-out recorded'),
 ('aaaaaaaa-0001-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','in','biometric', now() - interval '1 day 6 hours', 8, 'verified', null),
 ('aaaaaaaa-0001-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','out','biometric', now() - interval '1 day', 8, 'verified', null),
 ('aaaaaaaa-0003-4000-8000-000000000003','22222222-2222-4222-8222-222222222222','in','biometric', now() - interval '2 day 6 hours', 6, 'verified', null);

insert into public.medicines (name, slug, generic_name, brand_names, form, strength, composition, uses, how_it_works, dosage, side_effects, warnings, interactions, storage, price_range, prescription_required) values
('Paracetamol','paracetamol','Paracetamol (Acetaminophen)','{"Crocin","Dolo 650","Calpol"}','Tablet','500 mg / 650 mg','Paracetamol 650 mg','{"Fever","Mild to moderate pain","Headache","Body ache"}','Reduces fever and pain by acting on the brain centres that regulate temperature and pain perception.','Adults: 500-650 mg every 6 hours, maximum 3 g per day.','{"Nausea","Rash (rare)","Liver strain at high doses"}','{"Do not exceed 4 g per day","Avoid with alcohol","Caution in liver disease"}','{"Warfarin","Other paracetamol-containing cold medicines"}','Store below 30°C, away from moisture.','₹10 - ₹35 per strip', false),
('Amoxicillin','amoxicillin','Amoxicillin','{"Mox","Novamox","Amoxil"}','Capsule','250 mg / 500 mg','Amoxicillin trihydrate 500 mg','{"Throat infection","Ear infection","Chest infection","Urinary tract infection"}','A penicillin-type antibiotic that stops bacteria from building their cell walls.','Adults: 500 mg every 8 hours for 5-7 days, or as prescribed.','{"Diarrhoea","Nausea","Skin rash"}','{"Not for penicillin allergy","Complete the full course","Caution in kidney disease"}','{"Methotrexate","Oral contraceptives","Allopurinol"}','Store below 25°C. Keep dry syrup refrigerated after reconstitution.','₹40 - ₹90 per strip', true),
('Metformin','metformin','Metformin hydrochloride','{"Glycomet","Glucophage","Obimet"}','Tablet','500 mg / 850 mg','Metformin HCl 500 mg','{"Type 2 diabetes","Insulin resistance","PCOS (off-label)"}','Lowers glucose production in the liver and improves the body''s response to insulin.','Usually 500 mg once or twice daily with meals; titrated by the doctor.','{"Stomach upset","Metallic taste","Vitamin B12 deficiency on long use"}','{"Stop before contrast scans","Avoid in severe kidney disease","Risk of lactic acidosis"}','{"Alcohol","Contrast dyes","Diuretics"}','Store below 30°C in a dry place.','₹15 - ₹60 per strip', true),
('ORS Solution','ors-solution','Oral Rehydration Salts','{"Electral","ORSL","WHO ORS"}','Powder for solution','21.8 g sachet','Sodium chloride, potassium chloride, sodium citrate, dextrose','{"Dehydration","Diarrhoea","Heat exhaustion","Vomiting"}','Restores water and electrolytes lost through diarrhoea, vomiting or sweating.','Dissolve one sachet in 1 litre of clean water; sip through the day.','{"Mild vomiting if taken too fast"}','{"Use clean or boiled water","Discard the solution after 24 hours"}','{"None significant"}','Store the sachet in a cool dry place.','₹10 - ₹25 per sachet', false),
('Azithromycin','azithromycin','Azithromycin','{"Azithral","Zithromax","Azee"}','Tablet','250 mg / 500 mg','Azithromycin dihydrate 500 mg','{"Respiratory infections","Skin infections","Typhoid","Some sexually transmitted infections"}','A macrolide antibiotic that blocks bacterial protein synthesis.','Adults: 500 mg once daily for 3-5 days, or as prescribed.','{"Abdominal pain","Diarrhoea","Headache"}','{"May affect heart rhythm (QT prolongation)","Caution in liver disease"}','{"Antacids","Warfarin","Amiodarone"}','Store below 30°C, protect from light.','₹70 - ₹130 per strip', true),
('Cetirizine','cetirizine','Cetirizine hydrochloride','{"Cetzine","Alerid","Okacet"}','Tablet','10 mg','Cetirizine HCl 10 mg','{"Allergic rhinitis","Hives","Itching","Sneezing and watery eyes"}','Blocks histamine, the chemical that drives allergy symptoms.','Adults: 10 mg once daily, preferably at night.','{"Drowsiness","Dry mouth","Fatigue"}','{"Avoid driving if drowsy","Avoid alcohol"}','{"Sedatives","Alcohol","Theophylline"}','Store below 30°C.','₹15 - ₹40 per strip', false),
('Pantoprazole','pantoprazole','Pantoprazole sodium','{"Pan 40","Pantocid","Pantop"}','Tablet','40 mg','Pantoprazole 40 mg','{"Acidity","Gastric ulcer","GERD","Heartburn"}','Reduces stomach acid by blocking the acid pump in stomach lining cells.','40 mg once daily before breakfast.','{"Headache","Diarrhoea","Flatulence"}','{"Long-term use may lower magnesium and B12","Consult doctor beyond 8 weeks"}','{"Clopidogrel","Methotrexate","Ketoconazole"}','Store below 30°C, protect from moisture.','₹60 - ₹120 per strip', true),
('Iron and Folic Acid','iron-folic-acid','Ferrous sulphate + Folic acid','{"IFA Tablets","Fefol","Autrin"}','Tablet','100 mg + 500 mcg','Elemental iron 100 mg, Folic acid 500 mcg','{"Anaemia in pregnancy","Iron deficiency","Nutritional supplementation"}','Replenishes iron stores and folate needed to make healthy red blood cells.','One tablet daily after food, as advised in the national IFA programme.','{"Black stools","Constipation","Nausea"}','{"Keep away from children - overdose is dangerous","Take with vitamin C for better absorption"}','{"Antacids","Tetracycline","Calcium supplements"}','Store in a cool dry place.','₹5 - ₹30 per strip', false);