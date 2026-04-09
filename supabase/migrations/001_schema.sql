-- Influencer Performance Dashboard — Supabase Schema
-- Run via: supabase db push  OR  paste into Supabase SQL editor

create table if not exists influencers (
  id                 text primary key,
  name               text not null,
  handle             text not null unique,
  platform           text not null check (platform in ('instagram', 'tiktok', 'youtube')),
  niche              text,
  discount_code      text not null unique,
  monthly_cost_eur   numeric(10, 2) not null,
  followers          integer,
  created_at         timestamptz default now()
);

create table if not exists orders (
  id               text primary key,
  influencer_id    text not null references influencers(id) on delete cascade,
  order_date       date not null,
  gross_value_eur  numeric(10, 2) not null,
  is_returned      boolean not null default false,
  return_value_eur numeric(10, 2) not null default 0,
  product_category text,
  created_at       timestamptz default now()
);

-- Index for fast per-influencer queries
create index if not exists orders_influencer_id_idx on orders(influencer_id);
create index if not exists orders_order_date_idx on orders(order_date);

-- View: influencer stats per month (used in future analytics queries)
create or replace view influencer_monthly_stats as
select
  i.id                                                        as influencer_id,
  i.name,
  i.handle,
  i.platform,
  i.monthly_cost_eur,
  date_trunc('month', o.order_date)::date                     as month,
  count(o.id)                                                 as total_orders,
  sum(o.gross_value_eur)                                      as gross_revenue,
  sum(o.return_value_eur)                                     as total_returns,
  sum(o.gross_value_eur - o.return_value_eur)                 as net_revenue,
  round(count(o.id) filter (where o.is_returned)::numeric
        / nullif(count(o.id), 0) * 100, 2)                   as return_rate_pct,
  sum(o.gross_value_eur - o.return_value_eur) - i.monthly_cost_eur as profit
from influencers i
join orders o on o.influencer_id = i.id
group by i.id, i.name, i.handle, i.platform, i.monthly_cost_eur, date_trunc('month', o.order_date);
