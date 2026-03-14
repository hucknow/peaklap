import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables check:', {
    url: supabaseUrl ? 'present' : 'MISSING',
    key: supabaseAnonKey ? 'present' : 'MISSING',
    allEnv: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
  });
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set in .env file. ' +
    'After adding them, restart the frontend: sudo supervisorctl restart frontend'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Utility: safe Supabase call wrapper
 * Ensures proper { data, error } pattern and prevents .json()/.text() anti-patterns
 * 
 * Usage:
 * const { data, error } = await supabaseQuery(() => 
 *   supabase.from('user_logs').insert({ ... }).select().single()
 * );
 * 
 * @param {Function} queryFn - A function that returns a Supabase query promise
 * @returns {Promise<{data: any, error: Error|null}>}
 */
export async function supabaseQuery(queryFn) {
  try {
    const result = await queryFn();
    
    // Supabase SDK always returns { data, error } - extract properly
    const { data, error } = result;
    
    if (error) {
      // Extract error message safely - never call .json() or .text()
      const errorMessage = typeof error === 'object' && error !== null
        ? (error.message || error.details || error.hint || JSON.stringify(error))
        : String(error);
      
      console.error('Supabase query error:', errorMessage);
      return { data: null, error: new Error(errorMessage) };
    }
    
    return { data, error: null };
  } catch (err) {
    // Catch any unexpected errors
    const errorMessage = err instanceof Error 
      ? err.message 
      : (typeof err === 'string' ? err : 'Unknown Supabase error');
    
    console.error('Supabase query exception:', errorMessage);
    return { data: null, error: new Error(errorMessage) };
  }
}

/**
 * Safe error message extractor for Supabase errors
 * @param {any} error - The error object from Supabase
 * @returns {string} - A safe string error message
 */
export function getSupabaseErrorMessage(error) {
  if (!error) return 'Unknown error';
  
  if (typeof error === 'string') return error;
  
  if (typeof error === 'object') {
    // PostgreSQL error
    if (error.message) return error.message;
    if (error.details) return error.details;
    if (error.hint) return error.hint;
    if (error.code) return `Database error: ${error.code}`;
    
    // Try to stringify but limit length
    try {
      const str = JSON.stringify(error);
      return str.length > 200 ? str.substring(0, 200) + '...' : str;
    } catch {
      return 'Error processing failed';
    }
  }
  
  return String(error);
}
