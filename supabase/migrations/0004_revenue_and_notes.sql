-- ============================================================================
-- Revenue tracking + daily notes
--   * selling_price (per piece) on inventory_items  -> powers Ice Cream Revenue
--   * note on daily_revenue                          -> optional daily notes
--   * item_stock view gains selling_price + melted_pieces + ice_cream_revenue
-- Safe to run multiple times.
-- ============================================================================

alter table if exists public.inventory_items
  add column if not exists selling_price numeric not null default 0;

alter table if exists public.daily_revenue
  add column if not exists note text;

-- ----------------------------------------------------------------------------
-- item_stock : now also exposes selling price, melted pieces and the
-- automatically-derived ice cream revenue per item.
--   sold pieces      = empty boxes * pieces per box
--   melted pieces    = damaged_stock where reason = 'Melted'
--   ice cream revenue = max(sold_pieces - melted_pieces, 0) * selling_price
--
-- Dropped first because CREATE OR REPLACE VIEW cannot insert a new column
-- (selling_price) in the middle of the existing column list.
-- ----------------------------------------------------------------------------
drop view if exists public.item_stock;

-- Empty-box accounting:
--   gross pieces from emptied boxes = sold_boxes * pieces_per_box
--   melted pieces are absorbed *inside* those emptied boxes, so they reduce the
--   revenue-generating "sold_pieces" but are NOT subtracted again from stock.
--   Non-melted wastage (Damaged / Expired) reduces stock separately.
--   Everything is clamped at >= 0 so inventory can never go negative.
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
    coalesce(s.sold_boxes, 0) * i.pieces_per_box      as sold_pieces_gross,
    coalesce(m.melted_pieces, 0)                      as melted_pieces,
    coalesce(o.other_damaged_pieces, 0)              as other_damaged_pieces,
    coalesce(d.damaged_pieces, 0)                     as damaged_pieces
  from public.inventory_items i
  left join (
    select item_id, sum(boxes) as purchased_boxes, sum(amount) as total_amount
    from public.stock_purchases group by item_id
  ) p on p.item_id = i.id
  left join (
    select item_id, sum(empty_boxes) as sold_boxes
    from public.empty_boxes group by item_id
  ) s on s.item_id = i.id
  left join (
    select item_id, sum(quantity) as damaged_pieces
    from public.damaged_stock group by item_id
  ) d on d.item_id = i.id
  left join (
    select item_id, sum(quantity) as melted_pieces
    from public.damaged_stock where reason = 'Melted' group by item_id
  ) m on m.item_id = i.id
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
    * case
        when purchased_boxes > 0
        then total_purchase_amount / nullif(purchased_pieces, 0)
        else 0
      end, 2)                                               as inventory_value
from base;

grant select on public.item_stock to anon, authenticated;
