import { FormData, FormErrors } from '../types/auth.types';
import { validatePhone } from '../utils/phoneFormatter';

export const validateAuthForm = (
  data: FormData,
  isSignUp: boolean
): FormErrors => {
  const errors: FormErrors = {};

  // Email
  if (!data.email) {
    errors.email = 'Email é obrigatório';
  } else if (!/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = 'Email inválido';
  }

  // Senha
  if (!data.password) {
    errors.password = 'Senha é obrigatória';
  } else if (data.password.length < 6) {
    errors.password = 'Senha deve ter pelo menos 6 caracteres';
  }

  // Campos de cadastro
  if (isSignUp) {
    if (!data.fullName.trim()) {
      errors.fullName = 'Nome completo é obrigatório';
    }

    if (!data.phone.trim()) {
      errors.phone = 'Telefone é obrigatório';
    } else if (!validatePhone(data.phone)) {
      errors.phone = 'Formato: (00) 00000-0000';
    }
  }

  return errors;
};
