export type CommissionType = 'manual' | 'percentage' | 'fixed';
export type ApplyMode = 'period' | 'group' | 'day';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  id: string;
  user_id: string;
  default_area_id?: string;
  currency: string;
  company_name?: string;
  report_header_title?: string;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  user_id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Operator {
  id: string;
  user_id: string;
  area_id?: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrizeCategory {
  id: string;
  user_id: string;
  area_id?: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommissionSettings {
  id: string;
  user_id: string;
  area_id: string;
  commission_type: CommissionType;
  default_percentage: number;
  default_fixed_value: number;
  apply_mode: ApplyMode;
  auto_calculate: boolean;
  allow_manual_override: boolean;
  
  morning_percentage: number;
  afternoon_percentage: number;
  night_percentage: number;
  group_morning_percentage: number;
  group_afternoon_percentage: number;
  group_night_percentage: number;
  
  morning_fixed_value: number;
  afternoon_fixed_value: number;
  night_fixed_value: number;
  group_morning_fixed_value: number;
  group_afternoon_fixed_value: number;
  group_night_fixed_value: number;
  
  created_at: string;
  updated_at: string;
}

export interface DailyRecord {
  id?: string;
  user_id?: string;
  area_id: string;
  date: string;
  
  // Entries
  morning_entries: number;
  afternoon_entries: number;
  night_entries: number;
  group_morning_entries: number;
  group_afternoon_entries: number;
  group_night_entries: number;
  
  // Commission
  morning_commission: number;
  afternoon_commission: number;
  night_commission: number;
  group_morning_commission: number;
  group_afternoon_commission: number;
  group_night_commission: number;
  
  // Prizes
  morning_prizes: number;
  afternoon_prizes: number;
  night_prizes: number;
  group_morning_prizes: number;
  group_afternoon_prizes: number;
  group_night_prizes: number;

  // Operators
  morning_operator_id?: string;
  afternoon_operator_id?: string;
  night_operator_id?: string;
  group_morning_operator_id?: string;
  group_afternoon_operator_id?: string;
  group_night_operator_id?: string;

  // Totals
  total_entries: number;
  total_commission: number;
  total_prizes: number;
  total_final: number;
  total_extra_expenses: number;
  total_net_final: number;
  
  // Status & Notes
  notes?: string;
  saved_by?: string;
  last_modified_by?: string;
  closed: boolean;
  closed_at?: string;
  closed_by?: string;
  checked: boolean;
  checked_at?: string;
  checked_by?: string;

  // Commission Metadata
  commission_type_used?: CommissionType;
  commission_percentage_used?: number;
  commission_fixed_value_used?: number;
  commission_auto_calculated?: boolean;
  commission_manual_override?: boolean;
  commission_settings_snapshot?: Partial<CommissionSettings>;
  
  // Reporting
  report_snapshot?: any;

  created_at?: string;
  updated_at?: string;
}

export interface ExtraExpense {
    id: string;
    user_id: string;
    area_id: string;
    record_id: string;
    date: string;
    description: string;
    amount: number;
    created_at: string;
    updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  area_id?: string;
  record_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  date_reference?: string;
  summary?: string;
  old_data?: any;
  new_data?: any;
  changed_fields?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export type Period = 'Manhã' | 'Tarde' | 'Noite' | 'Grupo Manhã' | 'Grupo Tarde' | 'Grupo Noite' | 'Diário';
