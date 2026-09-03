import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://vzvctulybkzjuiujoolv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mCU7qzAp-4Ujer3fbc_eVA_0XC1tEQX';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
