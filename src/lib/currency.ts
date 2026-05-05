export const formatCurrencyBRL = (value: number | string): string => {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(amount)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export const parseCurrencyInput = (value: string): number => {
  // Remove R$, spaces, and convert comma to dot for parsing
  const cleanValue = value
    .replace(/[^\d,.-]/g, '')
    .replace('.', '')
    .replace(',', '.');
    
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

export const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};
