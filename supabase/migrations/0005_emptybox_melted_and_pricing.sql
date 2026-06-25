-- ============================================================================
-- Empty-box melted handling + selling-price-based costing
--
--   * empty_boxes.melted_pieces  -> pieces that melted in that box (deducted
--                                   from the sold count, default 0)
--   * empty_boxes.pieces_per_box -> optional override of the item's pieces/box
--                                   for that specific entry (NULL = use item)
--
-- Pricing model (kept simple, no purchase amount required):
--   selling_price (per piece) is entered on the item in Inventory.
--   cost  = 65% of selling price        profit = 35% of selling price
--
-- item_stock is rebuilt so that:
--   sold pieces (revenue) = empty_boxes * pieces_per_box - melted   (>= 0)
--   melted comes from empty_boxes (not wastage) now
--   inventory value       = remaining pieces * (selling_price * 0.65)
--   ice cream revenue     = sold pieces * selling_price
-- Safe to run multiple times.
-- ============================================================================

alter table if exists public.empty_boxes
  add column if not exists melted_pieces integer not null default 0;

alter table if exists public.empty_boxes
  add column if not exists pieces_per_box integer;

drop view if exists public.item_stock;

create view public.item_stock
with (security_invoker = true) as
with base as (
  select
    i.id                                              as item_id,
    i.user_id                                         as user_id,
    i.name                                            as name,
    i.pieces_per_box                                  as pieces_per_box,
    i.selling_price                                   as selling_price,
    coalesce(p.purchased_boxes, 0)                    as purchased_boxes,
    coalesce(p.purchased_boxes, 0) * i.pieces_per_box as purchased_pieces,
    coalesce(p.total_amount, 0)                       as total_purchase_amount,
    coalesce(s.sold_boxes, 0)                         as sold_boxes,
    coalesce(s.sold_pieces_gross, 0)                  as sold_pieces_gross,
    coalesce(s.melted_pieces, 0)                      as melted_pieces,
    coalesce(o.other_damaged_pieces, 0)              as other_damaged_pieces,
    coalesce(d.damaged_pieces, 0)                     as damaged_pieces
  from public.inventory_items i
  left join (
    select item_id, sum(boxes) as purchased_boxes, sum(amount) as total_amount
    from public.stock_purchases group by item_id
  ) p on p.item_id = i.id
  left join (
    select
      eb.item_id,
      sum(eb.empty_boxes)                                                    as sold_boxes,
      sum(eb.empty_boxes * coalesce(eb.pieces_per_box, ii.pieces_per_box))   as sold_pieces_gross,
      sum(coalesce(eb.melted_pieces, 0))                                     as melted_pieces
    from public.empty_boxes eb
    join public.inventory_items ii on ii.id = eb.item_id
    group by eb.item_id
  ) s on s.item_id = i.id
  left join (
    select item_id, sum(quantity) as damaged_pieces
    from public.damaged_stock group by item_id
  ) d on d.item_id = i.id
  left join (
    select item_id, sum(quantity) as other_damaged_pieces
    from public.damaged_stock where reason <> 'Melted' group by item_id
  ) o on o.item_id = i.id
)
select
  item_id,
  user_id,
  name,
  pieces_per_box,
  selling_price,
  purchased_boxes,
  purchased_pieces,
  total_purchase_amount,
  sold_boxes,
  sold_pieces_gross,
  greatest(sold_pieces_gross - melted_pieces, 0)            as sold_pieces,
  damaged_pieces,
  melted_pieces,
  other_damaged_pieces,
  greatest(purchased_pieces - sold_pieces_gross - other_damaged_pieces, 0)
                                                            as remaining_pieces,
  case
    when purchased_boxes > 0
    then round(total_purchase_amount / nullif(purchased_pieces, 0), 4)
    else 0
  end                                                       as avg_cost_per_piece,
  round(greatest(sold_pieces_gross - melted_pieces, 0) * selling_price, 2)
                                                            as ice_cream_revenue,
  round(melted_pieces * selling_price, 2)                   as melted_loss,
  round(
    greatest(purchased_pieces - sold_pieces_gross - other_damaged_pieces, 0)
    * (selling_price * 0.65), 2)                            as inventory_value
from base;

grant select on public.item_stock to anon, authenticated;
