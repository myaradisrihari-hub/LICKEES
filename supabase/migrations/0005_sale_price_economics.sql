-- ============================================================================
-- Sale-price driven economics + melted handled at empty-box time
--
--   * Sale price per piece lives on the inventory item.
--   * Cost  = 65% of sale price   (no purchase amount needed)
--   * Profit = 35% of sale value
--   * Melted ice creams are recorded directly on the empty-box entry
--     (pieces_per_box can also be overridden per entry), so:
--        sold pieces = empty_boxes * pieces_per_box - melted_pieces
--     and melted no longer comes from the wastage table.
--
-- Safe to run multiple times.
-- ============================================================================

alter table if exists public.empty_boxes
  add column if not exists melted_pieces integer not null default 0;

alter table if exists public.empty_boxes
  add column if not exists pieces_per_box integer;

-- Purchase amount is now auto-derived from the sale price.
alter table if exists public.stock_purchases
  alter column amount set default 0;

-- ----------------------------------------------------------------------------
-- item_stock — economics derived from the sale price.
--   cost per piece     = selling_price * 0.65
--   sold pieces (net)  = emptied gross - melted   (clamped >= 0)
--   remaining          = purchased - emptied gross - non-melted wastage (>= 0)
-- ----------------------------------------------------------------------------
drop view if exists public.item_stock;

create view public.item_stock
with (security_invoker = true) as
with
purch as (
  select item_id, sum(boxes) as purchased_boxes
  from public.stock_purchases
  group by item_id
),
emp as (
  select
    b.item_id,
    sum(b.empty_boxes) as sold_boxes,
    sum(b.empty_boxes * coalesce(b.pieces_per_box, i.pieces_per_box)) as sold_pieces_gross,
    sum(coalesce(b.melted_pieces, 0)) as melted_pieces
  from public.empty_boxes b
  join public.inventory_items i on i.id = b.item_id
  group by b.item_id
),
dmg as (
  select item_id, sum(quantity) as damaged_pieces
  from public.damaged_stock
  group by item_id
),
other_dmg as (
  select item_id, sum(quantity) as other_damaged_pieces
  from public.damaged_stock
  where reason <> 'Melted'
  group by item_id
)
select
  i.id                                            as item_id,
  i.user_id                                       as user_id,
  i.name                                          as name,
  i.pieces_per_box                                as pieces_per_box,
  i.selling_price                                 as selling_price,
  coalesce(p.purchased_boxes, 0)                  as purchased_boxes,
  coalesce(p.purchased_boxes, 0) * i.pieces_per_box as purchased_pieces,
  round(coalesce(p.purchased_boxes, 0) * i.pieces_per_box * i.selling_price * 0.65, 2)
                                                  as total_purchase_amount,
  coalesce(e.sold_boxes, 0)                       as sold_boxes,
  coalesce(e.sold_pieces_gross, 0)                as sold_pieces_gross,
  greatest(coalesce(e.sold_pieces_gross, 0) - coalesce(e.melted_pieces, 0), 0)
                                                  as sold_pieces,
  coalesce(d.damaged_pieces, 0)                   as damaged_pieces,
  coalesce(e.melted_pieces, 0)                    as melted_pieces,
  coalesce(od.other_damaged_pieces, 0)            as other_damaged_pieces,
  greatest(
    coalesce(p.purchased_boxes, 0) * i.pieces_per_box
      - coalesce(e.sold_pieces_gross, 0)
      - coalesce(od.other_damaged_pieces, 0), 0
  )                                               as remaining_pieces,
  round(i.selling_price * 0.65, 4)                as avg_cost_per_piece,
  round(greatest(coalesce(e.sold_pieces_gross, 0) - coalesce(e.melted_pieces, 0), 0)
        * i.selling_price, 2)                     as ice_cream_revenue,
  round(coalesce(e.melted_pieces, 0) * i.selling_price, 2)
                                                  as melted_loss,
  round(
    greatest(
      coalesce(p.purchased_boxes, 0) * i.pieces_per_box
        - coalesce(e.sold_pieces_gross, 0)
        - coalesce(od.other_damaged_pieces, 0), 0
    ) * i.selling_price * 0.65, 2
  )                                               as inventory_value
from public.inventory_items i
left join purch p on p.item_id = i.id
left join emp e on e.item_id = i.id
left join dmg d on d.item_id = i.id
left join other_dmg od on od.item_id = i.id;

grant select on public.item_stock to anon, authenticated;
