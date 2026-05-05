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
  
  // Se não estiver no automático ou se houver sobrescrita manual, não mexe
  if (!settings.auto_calculate || record.commission_manual_override) {
    return newRecord;
  }

  newRecord.commission_type_used = 'percentage';
  newRecord.commission_auto_calculated = true;
  newRecord.commission_settings_snapshot = { ...settings };

  // Regra de Ouro: 40% para Milhar, 30% para Grupo
  const milharPerc = settings.default_percentage || 40;
  const groupPerc = 30; // Sempre 30% para grupo conforme solicitado

  // Milhar (Manhã, Tarde, Noite)
  newRecord.morning_commission = (safeNumber(record.morning_entries) * (settings.morning_percentage || milharPerc)) / 100;
  newRecord.afternoon_commission = (safeNumber(record.afternoon_entries) * (settings.afternoon_percentage || milharPerc)) / 100;
  newRecord.night_commission = (safeNumber(record.night_entries) * (settings.night_percentage || milharPerc)) / 100;
  
  // Grupo (Grupo Manhã, Tarde, Noite)
  newRecord.group_morning_commission = (safeNumber(record.group_morning_entries) * (settings.group_morning_percentage || groupPerc)) / 100;
  newRecord.group_afternoon_commission = (safeNumber(record.group_afternoon_entries) * (settings.group_afternoon_percentage || groupPerc)) / 100;
  newRecord.group_night_commission = (safeNumber(record.group_night_entries) * (settings.group_night_percentage || groupPerc)) / 100;

  return newRecord;
};
