import { createClient } from '@supabase/supabase-js';

// URL del proyecto Supabase
const supabaseUrl = 'https://zrpfulkklnjnkrvuiwbo.supabase.co';

/**
 * Inicialización del cliente de Supabase.
 * Se utiliza la clave de API proporcionada por el usuario.
 */
const supabaseKey = 'sb_publishable_ElIgYT9fhZ-8oMFB-O1Pow_hycvPm9m';
export const supabase = createClient(supabaseUrl, supabaseKey);
