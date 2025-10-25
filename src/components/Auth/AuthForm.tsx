import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { FormData, FormErrors, AuthFormProps } from '../../types/auth.types';
import { validateAuthForm } from '../../validators/authValidators';
import { formatPhone } from '../../utils/phoneFormatter';

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSubmit,
  onToggleMode,
  loading = false
}) => {
  const isSignUp = mode === 'signup';

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    const finalValue = field === 'phone' ? formatPhone(value) : value;
    setFormData(prev => ({ ...prev, [field]: finalValue }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateAuthForm(formData, isSignUp);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    await onSubmit(formData);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card com shadow e rounded-3xl */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg">
        <form className="space-y-6" onSubmit={handleSubmit}>

          {/* Campos de Cadastro */}
          {isSignUp && (
            <>
              {/* Nome Completo */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nome Completo
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Telefone
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
                {errors.phone && (
                  <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                )}
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="block w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Botão Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 space-y-4">
          <button
            type="button"
            onClick={onToggleMode}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            {isSignUp
              ? 'Já tem uma conta de colaborador? Faça login'
              : 'Não tem conta de colaborador? Cadastre-se'}
          </button>

          <p className="text-xs text-gray-500 border-t border-gray-200 pt-4">
            É uma agência?{' '}
            <Link
              to="/agency-register"
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Cadastre sua agência aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
