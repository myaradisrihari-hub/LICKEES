-- ============================================================================
-- Analytics views — stock levels, costs and sales velocity
-- All views use security_invoker so RLS of the base tables applies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- item_stock : current stock + cost basis + inventory value per item
-- ----------------------------------------------------------------------------
create or replace view public.item_stock
with (security_invoker = true) as
select
  i.id                                                            as item_id,
  i.user_id                                                       as user_id,
  i.name                                                          as name,
  i.pieces_per_box                                                as pieces_per_box,
  coalesce(p.purchased_boxes, 0)                                  as purchased_boxes,
  coalesce(p.purchased_boxes, 0) * i.pieces_per_box               as purchased_pieces,
  coalesce(p.total_amount, 0)                                     as total_purchase_amount,
  coalesce(s.sold_boxes, 0)                                       as sold_boxes,
  coalesce(s.sold_boxes, 0) * i.pieces_per_box                    as sold_pieces,
  coalesce(d.damaged_pieces, 0)                                   as damaged_pieces,
  (coalesce(p.purchased_boxes, 0) * i.pieces_per_box)
    - (coalesce(s.sold_boxes, 0) * i.pieces_per_box)
    - coalesce(d.damaged_pieces, 0)                               as remaining_pieces,
  case
    when coalesce(p.purchased_boxes, 0) > 0
    then round(coalesce(p.total_amount, 0)
         / (coalesce(p.purchased_boxes, 0) * i.pieces_per_box), 4)
    else 0
  end                                                             as avg_cost_per_piece,
  round(
    greatest(
      (coalesce(p.purchased_boxes, 0) * i.pieces_per_box)
        - (coalesce(s.sold_boxes, 0) * i.pieces_per_box)
        - coalesce(d.damaged_pieces, 0), 0
    )
    * case
        when coalesce(p.purchased_boxes, 0) > 0
        then coalesce(p.total_amount, 0)
             / (coalesce(p.purchased_boxes, 0) * i.pieces_per_box)
        else 0
      end, 2)                                                     as inventory_value
from public.inventory_items i
left join (
  select item_id, sum(boxes) as purchased_boxes, sum(amount) as total_amount
  from public.stock_purchases
  group by item_id
) p on p.item_id = i.id
left join (
  select item_id, sum(empty_boxes) as sold_boxes
  from public.empty_boxes
  group by item_id
) s on s.item_id = i.id
left join (
  select item_id, sum(quantity) as damaged_pieces
  from public.damaged_stock
  group by item_id
) d on d.item_id = i.id;

-- ----------------------------------------------------------------------------
-- daily_pnl : per-day revenue, expenses and profit
-- ----------------------------------------------------------------------------
create or replace view public.daily_pnl
with (security_invoker = true) as
with rev as (
  select user_id, entry_date,
         sum(cash_revenue + online_revenue) as revenue
  from public.daily_revenue
  group by user_id, entry_date
),
exp as (
  select user_id, entry_date, sum(amount) as expenses
  from public.expenses
  group by user_id, entry_date
)
select
  coalesce(rev.user_id, exp.user_id)        as user_id,
  coalesce(rev.entry_date, exp.entry_date)  as entry_date,
  coalesce(rev.revenue, 0)                  as revenue,
  coalesce(exp.expenses, 0)                 as expenses,
  coalesce(rev.revenue, 0) - coalesce(exp.expenses, 0) as profit
from rev
full outer join exp
  on rev.user_id = exp.user_id and rev.entry_date = exp.entry_date;

-- Open single-owner app: allow the anon/authenticated roles to read the views.
grant select on public.item_stock to anon, authenticated;
grant select on public.daily_pnl  to anon, authenticated;
