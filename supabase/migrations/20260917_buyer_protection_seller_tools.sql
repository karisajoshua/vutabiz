-- ─────────────────────────────────────────────────────────────────────────────
-- Sokonyumbani: Phase 2 Upgrade Migration
-- Buyer Protection (Escrow & Delivery), Seller Analytics, Engagement & Referrals
-- Fully backward-compatible.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Extend listings for expiration and analytics
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS ad_expires_at timestamptz DEFAULT (now() + interval '30 days'),
  ADD COLUMN IF NOT EXISTS contact_clicks_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS listings_expires_idx ON public.listings(ad_expires_at);

-- 2. Extend profiles for referrals
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_referrals_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS profiles_referral_code_idx ON public.profiles(referral_code);

-- 3. Escrow Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  delivery_fee numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL CHECK (total_amount >= amount),
  payment_method text NOT NULL DEFAULT 'mpesa',
  payment_ref text,
  courier_partner text,
  tracking_number text,
  delivery_address text,
  delivery_status text NOT NULL DEFAULT 'pending',
  escrow_status text NOT NULL DEFAULT 'held',
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_buyer_idx ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS orders_seller_idx ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS orders_listing_idx ON public.orders(listing_id);
CREATE INDEX IF NOT EXISTS orders_escrow_status_idx ON public.orders(escrow_status);

GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS Buyers and sellers view own orders, or admin ON public.orders;
CREATE POLICY Buyers and sellers view own orders, or admin ON public.orders
  FOR SELECT USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS Buyers can create orders ON public.orders;
CREATE POLICY Buyers can create orders ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS Participants and admins can update orders ON public.orders;
CREATE POLICY Participants and admins can update orders ON public.orders
  FOR UPDATE USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin')
  );

-- 4. Disputes Table
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  raised_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  against_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  evidence_url text,
  status text NOT NULL DEFAULT 'opened',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS disputes_order_idx ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS disputes_status_idx ON public.disputes(status);

GRANT SELECT, INSERT, UPDATE ON public.disputes TO authenticated;
GRANT ALL ON public.disputes TO service_role;

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS Dispute participants or admin view disputes ON public.disputes;
CREATE POLICY Dispute participants or admin view disputes ON public.disputes
  FOR SELECT USING (
    auth.uid() = raised_by OR auth.uid() = against_user_id OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS Users can raise dispute on own order ON public.disputes;
CREATE POLICY Users can raise dispute on own order ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = raised_by);

DROP POLICY IF EXISTS Admins can update disputes ON public.disputes;
CREATE POLICY Admins can update disputes ON public.disputes
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- 5. Favorites / Wishlist Table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_idx ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_listing_idx ON public.favorites(listing_id);

GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS Users manage own favorites ON public.favorites;
CREATE POLICY Users manage own favorites ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- 6. Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, seller_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_seller_idx ON public.follows(seller_id);

GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT ON public.follows TO anon;
GRANT ALL ON public.follows TO service_role;

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS Follows are viewable by anyone ON public.follows;
CREATE POLICY Follows are viewable by anyone ON public.follows
  FOR SELECT USING (true);

DROP POLICY IF EXISTS Followers can insert their own follows ON public.follows;
CREATE POLICY Followers can insert their own follows ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS Followers can delete their own follows ON public.follows;
CREATE POLICY Followers can delete their own follows ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- 7. Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_amount numeric NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'rewarded',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals(referrer_id);

GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS Users view own referrals ON public.referrals;
CREATE POLICY Users view own referrals ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- 8. Stored Procedure for contact clicks
CREATE OR REPLACE FUNCTION public.increment_contact_clicks(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  UPDATE public.listings
  SET contact_clicks_count = contact_clicks_count + 1
  WHERE id = p_listing_id;
END;
$;
