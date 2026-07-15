import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bruafdfakvdreagfeqau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJydWFmZGZha3ZkcmVhZ2ZlcWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODAzNTYsImV4cCI6MjA4MDA1NjM1Nn0.bIFFTG3McJhYZJYNmhn_24099ahNNdb8oxPsLOGwtZ8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('--- Checking plans table schema ---');
  const { data: plans, error: plansError } = await supabase
    .from('plans')
    .select('*')
    .limit(5);

  if (plansError) {
    console.error('Error fetching plans:', plansError);
  } else {
    console.log('Plans sample:', plans);
  }

  console.log('--- Checking preset_exercises table ---');
  const { data: presets, error: presetsError } = await supabase
    .from('preset_exercises')
    .select('*');

  if (presetsError) {
    console.error('Error fetching presets:', presetsError);
  } else {
    console.log('Presets count:', presets?.length);
    console.log('Presets:', presets);
  }
}

check();
