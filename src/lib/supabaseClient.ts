import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Project URL
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your API Key

export const supabase = createClient(supabaseUrl, supabaseKey); 