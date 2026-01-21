import { createClient } from '@supabase/supabase-js';

// URL del proyecto Supabase
const supabaseUrl = 'https://zrpfulkklnjnkrvuiwbo.supabase.co';

/**
 * Inicialización del cliente de Supabase.
 * Se utiliza la clave de API proporcionada para la comunicación con el backend.
 */
const supabaseKey = 'sb_publicable_ElIgYT9fhZ-8oMFB-O1Pow_hycvPm9m';

export const supabase = createClient(supabaseUrl, supabaseKey);
