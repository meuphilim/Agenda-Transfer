export const formatPhone = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
};

export const validatePhone = (phone: string): boolean => {
  return /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(phone);
};
