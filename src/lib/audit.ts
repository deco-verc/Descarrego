import { createClient } from './supabase';
import { AuditLog } from '@/types';

export const createAuditLog = async (log: Partial<AuditLog>) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  const { error } = await supabase.from('audit_logs').insert({
    user_id: user.id,
    user_email: user.email,
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    area_id: log.area_id,
    record_id: log.record_id,
    date_reference: log.date_reference,
    summary: log.summary,
    old_data: log.old_data,
    new_data: log.new_data,
    changed_fields: log.changed_fields,
    // Note: IP and User Agent could be added here if using a server action
  });

  if (error) console.error('Error creating audit log:', error);
};

export const getChangedFields = (oldData: any, newData: any) => {
  if (!oldData) return Object.keys(newData);
  
  const changed: string[] = [];
  for (const key in newData) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changed.push(key);
    }
  }
  return changed;
};
