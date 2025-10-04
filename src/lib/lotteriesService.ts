import { supabase } from './supabaseClient';
import { Sorteo } from './types';

export const getLotteries = async (): Promise<Sorteo[]> => {
  const { data, error } = await supabase.from('lotteries').select('*');
  if (error) {
    console.error('Error fetching lotteries:', error);
    return [];
  }
  return data as Sorteo[];
};

export const saveLotteries = async (lotteries: Sorteo[]) => {
  const { data, error } = await supabase.from('lotteries').upsert(lotteries, { onConflict: 'id' });
  if (error) {
    console.error('Error saving lotteries:', error);
  }
  return data;
};
