import { createClient } from '@supabase/supabase-js';

// URL del proyecto Supabase
const supabaseUrl = 'https://zrpfulkklnjnkrvuiwbo.supabase.co';

/**
 * Inicialización del cliente de Supabase.
 * Se utiliza la clave Anon Key específica del proyecto proporcionada por el usuario.
 */
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpycGZ1bGtrbG5qbmtydnVpd2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxNzIyNDUsImV4cCI6MjA1Mjc0ODI0NX0.W8FZ3UfN_5MvH9yH-5VnW8K1cPzYGJQXvD0xZTk7234';

export const supabase = createClient(supabaseUrl, supabaseKey);
