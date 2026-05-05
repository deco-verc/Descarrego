import { DailyRecord } from '@/types';
import { safeNumber } from './currency';

export const calculateDailyTotals = (record: DailyRecord): DailyRecord => {
  const totals = { ...record };
  
  totals.total_entries = 
    safeNumber(record.morning_entries) + 
    safeNumber(record.afternoon_entries) + 
    safeNumber(record.night_entries) + 
    safeNumber(record.group_morning_entries) + 
    safeNumber(record.group_afternoon_entries) + 
    safeNumber(record.group_night_entries);
    
  totals.total_commission = 
    safeNumber(record.morning_commission) + 
    safeNumber(record.afternoon_commission) + 
    safeNumber(record.night_commission) + 
    safeNumber(record.group_morning_commission) + 
    safeNumber(record.group_afternoon_commission) + 
    safeNumber(record.group_night_commission);
    
  totals.total_prizes = 
    safeNumber(record.morning_prizes) + 
    safeNumber(record.afternoon_prizes) + 
    safeNumber(record.night_prizes) + 
    safeNumber(record.group_morning_prizes) + 
    safeNumber(record.group_afternoon_prizes) + 
    safeNumber(record.group_night_prizes);
    
  totals.total_final = totals.total_entries - totals.total_commission - totals.total_prizes;
  
  // Net final is now equal to total final (no expenses)
  totals.total_net_final = totals.total_final;
  
  return totals;
};

export const calculatePeriodTotals = (record: DailyRecord) => {
  const morning = {
    entries: safeNumber(record.morning_entries) + safeNumber(record.group_morning_entries),
    commission: safeNumber(record.morning_commission) + safeNumber(record.group_morning_commission),
    prizes: safeNumber(record.morning_prizes) + safeNumber(record.group_morning_prizes),
  };
  
  const afternoon = {
    entries: safeNumber(record.afternoon_entries) + safeNumber(record.group_afternoon_entries),
    commission: safeNumber(record.afternoon_commission) + safeNumber(record.group_afternoon_commission),
    prizes: safeNumber(record.afternoon_prizes) + safeNumber(record.group_afternoon_prizes),
  };
  
  const night = {
    entries: safeNumber(record.night_entries) + safeNumber(record.group_night_entries),
    commission: safeNumber(record.night_commission) + safeNumber(record.group_night_commission),
    prizes: safeNumber(record.night_prizes) + safeNumber(record.group_night_prizes),
  };
  
  return {
    morning: { ...morning, total: morning.entries - morning.commission - morning.prizes },
    afternoon: { ...afternoon, total: afternoon.entries - afternoon.commission - afternoon.prizes },
    night: { ...night, total: night.entries - night.commission - night.prizes },
  };
};
