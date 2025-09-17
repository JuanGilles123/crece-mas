// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ywilkhfkuwhsjvojocso.supabase.co'; // Reemplaza con tu URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWxraGZrdXdoc2p2b2pvY3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNjk5ODEsImV4cCI6MjA3MzY0NTk4MX0.QoFH7xBN9vYDZXAu_uOdUr8gHhCoFoW6Fz1SFSK5XuI'; // Reemplaza con tu anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);