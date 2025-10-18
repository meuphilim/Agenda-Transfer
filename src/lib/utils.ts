import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitário para combinar classes CSS do Tailwind
 * Resolve conflitos e remove duplicatas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}