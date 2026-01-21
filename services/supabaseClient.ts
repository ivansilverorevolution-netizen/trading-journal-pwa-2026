import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zrpfulkklnjnkrvuiwbo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpycGZ1bGtrbG5qbmtydnVpd2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxNzIyNDUsImV4cCI6MjA1Mjc0ODI0NX0.sb_publishable_ElIgYT9fhZ-8oMFB-O1Pow_hycvPm9m';

export const supabase = createClient(supabaseUrl, supabaseKey);