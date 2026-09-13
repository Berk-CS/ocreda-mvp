import { createClient } from '@supabase/supabase-js';
import { IS_LOCAL_MODE } from '@/dev/local-mode';  // DEV-LOCAL-MODE

// createClient throws on an empty URL at module load, and this module is
// imported all over the app. In local mode nothing ever calls the client, so a
// syntactically valid placeholder keeps imports working without asking for
// Supabase credentials that local mode does not use.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (IS_LOCAL_MODE ? 'https://local-mode.invalid' : '');  // DEV-LOCAL-MODE
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (IS_LOCAL_MODE ? 'local-mode-anon-key' : '');  // DEV-LOCAL-MODE

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
