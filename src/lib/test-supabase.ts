
import { getLotteries, saveLotteries } from './lotteriesService';
import { Sorteo } from './types';

const testSupabase = async () => {
  console.log('--- Running Supabase Test ---');

  try {
    // 1. Test reading lotteries
    console.log('Attempting to fetch lotteries...');
    const initialLotteries = await getLotteries();
    console.log('Fetched lotteries:', initialLotteries);

    // 2. Test writing a new lottery
    console.log('Attempting to save a new lottery...');
    const newLottery: Sorteo = {
      id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      name: 'Test Lottery',
      number_of_digits: 4,
      enabled: true,
      draw_times: ['10:00', '14:00', '20:00'],
      cost: 10,
      icon: 'test-icon'
    };
    await saveLotteries([newLottery]);
    console.log('Saved new lottery.');

    // 3. Test reading again to confirm the write
    console.log('Attempting to fetch lotteries again...');
    const updatedLotteries = await getLotteries();
    console.log('Fetched lotteries after save:', updatedLotteries);

    // 4. Clean up the test data
    console.log('Attempting to clean up test data...');
    const { error } = await supabase.from('lotteries').delete().match({ id: newLottery.id });
    if (error) {
        console.error('Error cleaning up test data:', error);
    } else {
        console.log('Test data cleaned up successfully.');
    }


  } catch (error) {
    console.error('An error occurred during the Supabase test:', error);
  } finally {
    console.log('--- Supabase Test Finished ---');
  }
};

testSupabase();
