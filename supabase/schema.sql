-- ==============================================================================
-- Database Schema for SL-Learn LMS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Recordings Table (Stores YouTube links or video paths)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."Recordings" (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    title text NOT NULL,
    file_path text NOT NULL,
    access_level text DEFAULT 'free'::text,
    price numeric DEFAULT 0
);

-- ------------------------------------------------------------------------------
-- 2. Tutes Table (Stores Material/Document paths)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."Tutes" (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    title text NOT NULL,
    file_path text NOT NULL,
    access_level text DEFAULT 'free'::text,
    price numeric DEFAULT 0
);

-- ------------------------------------------------------------------------------
-- 3. Stu_Reciepts Table (Stores Student Payment Receipts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."Stu_Reciepts" (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    file_path text NOT NULL,
    reference_no text,
    user_email text NOT NULL,
    status text DEFAULT 'pending'::text -- Can be 'pending', 'approved', or 'rejected'
);

-- ==============================================================================
-- Security Policies (Row Level Security)
-- ==============================================================================
-- Note: In a production app, you should restrict INSERT/UPDATE to authenticated
-- users or admins only. For this demo, we allow public read/write to test the UI.

ALTER TABLE public."Recordings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable public select" ON public."Recordings" FOR SELECT USING (true);
CREATE POLICY "Enable public insert" ON public."Recordings" FOR INSERT WITH CHECK (true);

ALTER TABLE public."Tutes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable public select" ON public."Tutes" FOR SELECT USING (true);
CREATE POLICY "Enable public insert" ON public."Tutes" FOR INSERT WITH CHECK (true);

ALTER TABLE public."Stu_Reciepts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable public select" ON public."Stu_Reciepts" FOR SELECT USING (true);
CREATE POLICY "Enable public insert" ON public."Stu_Reciepts" FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable public update" ON public."Stu_Reciepts" FOR UPDATE USING (true);
