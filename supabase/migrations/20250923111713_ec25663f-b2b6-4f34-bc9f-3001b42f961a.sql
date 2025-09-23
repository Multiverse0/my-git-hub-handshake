-- Fix RLS for existing tables that have policies but RLS disabled
ALTER TABLE public.range_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_target_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_session_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;