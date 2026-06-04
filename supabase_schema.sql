-- Supabase Schema for English Learning Platform

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    level TEXT DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Create a trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, level)
    VALUES (
        new.id,
        new.email,
        CASE WHEN new.email = 'codekittenforwork@gmail.com' THEN 'admin' ELSE 'user' END,
        'Beginner'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Create Vocabularies Table
CREATE TABLE IF NOT EXISTS public.vocabularies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    source_lang TEXT NOT NULL CHECK (source_lang IN ('th', 'en')),
    correct_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on vocabularies
ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;

-- Vocabularies Policies
CREATE POLICY "Users can view their own vocabularies" 
    ON public.vocabularies FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vocabularies" 
    ON public.vocabularies FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vocabularies" 
    ON public.vocabularies FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vocabularies" 
    ON public.vocabularies FOR DELETE 
    USING (auth.uid() = user_id);


-- 3. Create Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'user' or 'model'
    content TEXT NOT NULL,
    scenario VARCHAR(50) DEFAULT 'general' NOT NULL,
    extracted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat Messages Policies
CREATE POLICY "Users can view their own chat messages" 
    ON public.chat_messages FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages" 
    ON public.chat_messages FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" 
    ON public.chat_messages FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" 
    ON public.chat_messages FOR DELETE 
    USING (auth.uid() = user_id);


-- 4. Upgrade Profiles Table with Gamification Fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_date DATE DEFAULT NULL;


-- 5. Create Daily Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    activity_date DATE DEFAULT CURRENT_DATE NOT NULL,
    practices INTEGER DEFAULT 0,
    reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, activity_date)
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Activity Logs Policies
CREATE POLICY "Users can view their own activity logs" 
    ON public.activity_logs FOR SELECT 
    USING (auth.uid() = user_id);
    
CREATE POLICY "Users can insert their own activity logs" 
    ON public.activity_logs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update their own activity logs" 
    ON public.activity_logs FOR UPDATE 
    USING (auth.uid() = user_id);

