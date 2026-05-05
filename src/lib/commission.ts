import { CommissionSettings, DailyRecord, CommissionType } from '@/types';
import { safeNumber } from './currency';

export const calculateCommission = (
  entries: number,
  settings: CommissionSettings,
  periodKey: keyof CommissionSettings | null = null
): number => {
  if (settings.commission_type === 'manual') return 0;
  
  if (settings.commission_type === 'percentage') {
    const percentage = periodKey 
      ? safeNumber(settings[periodKey as keyof CommissionSettings]) || settings.default_percentage
      : settings.default_percentage;
    return (entries * percentage) / 100;
  }
  
  if (settings.commission_type === 'fixed') {
    if (settings.apply_mode === 'day') return 0; // Handled at total level
    
    return periodKey 
      ? safeNumber(settings[periodKey as keyof CommissionSettings]) || settings.default_fixed_value
      : settings.default_fixed_value;
  }
  
  return 0;
};

export const applyCommissionSettingsToDay = (
  record: DailyRecord,
  settings: CommissionSettings
): DailyRecord => {
  const newRecord = { ...record };
  
  if (!settings.auto_calculate || record.commission_manual_override) {
    return newRecord;
  }

  newRecord.commission_type_used = settings.commission_type;
  newRecord.commission_auto_calculated = true;
  newRecord.commission_settings_snapshot = { ...settings };

  if (settings.commission_type === 'manual') return newRecord;

  // Calculate for each period
  if (settings.commission_type === 'percentage') {
    newRecord.morning_commission = (safeNumber(record.morning_entries) * (settings.morning_percentage || settings.default_percentage)) / 100;
    newRecord.afternoon_commission = (safeNumber(record.afternoon_entries) * (settings.afternoon_percentage || settings.default_percentage)) / 100;
    newRecord.night_commission = (safeNumber(record.night_entries) * (settings.night_percentage || settings.default_percentage)) / 100;
    newRecord.group_morning_commission = (safeNumber(record.group_morning_entries) * (settings.group_morning_percentage || settings.default_percentage)) / 100;
    newRecord.group_afternoon_commission = (safeNumber(record.group_afternoon_entries) * (settings.group_afternoon_percentage || settings.default_percentage)) / 100;
    newRecord.group_night_commission = (safeNumber(record.group_night_entries) * (settings.group_night_percentage || settings.default_percentage)) / 100;
  } else if (settings.commission_type === 'fixed') {
    if (settings.apply_mode === 'period') {
        newRecord.morning_commission = settings.morning_fixed_value || settings.default_fixed_value;
        newRecord.afternoon_commission = settings.afternoon_fixed_value || settings.default_fixed_value;
        newRecord.night_commission = settings.night_fixed_value || settings.default_fixed_value;
        newRecord.group_morning_commission = 0;
        newRecord.group_afternoon_commission = 0;
        newRecord.group_night_commission = 0;
    } else if (settings.apply_mode === 'group') {
        newRecord.morning_commission = 0;
        newRecord.afternoon_commission = 0;
        newRecord.night_commission = 0;
        newRecord.group_morning_commission = settings.group_morning_fixed_value || settings.default_fixed_value;
        newRecord.group_afternoon_commission = settings.group_afternoon_fixed_value || settings.default_fixed_value;
        newRecord.group_night_commission = settings.group_night_fixed_value || settings.default_fixed_value;
    } else if (settings.apply_mode === 'day') {
        // Apply fixed value to morning only or distribute? User said "fixed per day". 
        // Let's put it in morning_commission and zero others, or handle in totals. 
        // Recommendation: add it to a specific field or keep it simple.
        newRecord.morning_commission = settings.default_fixed_value;
        newRecord.afternoon_commission = 0;
        newRecord.night_commission = 0;
        newRecord.group_morning_commission = 0;
        newRecord.group_afternoon_commission = 0;
        newRecord.group_night_commission = 0;
    }
  }

  return newRecord;
};
