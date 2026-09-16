import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ngxrmcqvuegyrojkbegm.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_4TMP6s1-aVLetrxyGElShQ_U345kF2V';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
