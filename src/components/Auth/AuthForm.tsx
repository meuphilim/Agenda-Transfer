import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader } from 'lucide-react';
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
    <div className="relative flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 w-full">

      {/* Fundo Decorativo - Retângulo Rotacionado */}
      <div className="absolute w-full h-full max-w-sm max-h-[550px] bg-lime-200 rounded-3xl transform rotate-6 lg:-translate-x-24 transition-transform duration-300 ease-in-out"></div>

      {/* Card com Imagem - Rotacionado */}
      <div className="absolute w-full h-full max-w-sm max-h-[550px] rounded-3xl shadow-2xl transform -rotate-12 lg:-translate-x-32 overflow-hidden transition-transform duration-300 ease-in-out">
        <img
          src="https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          alt="Decoração"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Card de Login/Cadastro Principal */}
      <div className="relative z-10 w-full max-w-sm p-8 space-y-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl lg:transform lg:translate-x-16 transition-transform duration-300 ease-in-out">

        {/* Cabeçalho */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta!'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp
              ? 'Preencha os dados para criar sua conta.'
              : 'Acesse sua conta para continuar.'}
          </p>
        </div>

        {/* Formulário */}
        <form className="space-y-5" onSubmit={handleSubmit}>

          {/* Campos de Cadastro */}
          {isSignUp && (
            <>
              {/* Nome Completo */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nome Completo
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg bg-white border border-gray-200 px-3 py-3 text-gray-900 placeholder-gray-400 focus:border-lime-500 focus:ring-lime-500 sm:text-sm transition"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Digite seu nome completo"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.fullName}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Telefone
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  className="mt-1 block w-full rounded-lg bg-white border border-gray-200 px-3 py-3 text-gray-900 placeholder-gray-400 focus:border-lime-500 focus:ring-lime-500 sm:text-sm transition"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
                {errors.phone && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.phone}</p>
                )}
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full rounded-lg bg-white border border-gray-200 px-3 py-3 text-gray-900 placeholder-gray-400 focus:border-lime-500 focus:ring-lime-500 sm:text-sm transition"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="voce@exemplo.com"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.email}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                className="mt-1 block w-full rounded-lg bg-white border border-gray-200 px-3 py-3 pr-10 text-gray-900 placeholder-gray-400 focus:border-lime-500 focus:ring-lime-500 sm:text-sm transition"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.password}</p>
            )}
          </div>

          {/* Opções Extras (apenas no login) */}
          {!isSignUp && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-200 text-lime-500 focus:ring-lime-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Lembrar-me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-lime-500 hover:text-lime-700">
                  Esqueceu a senha?
                </a>
              </div>
            </div>
          )}

          {/* Botão Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center items-center rounded-xl border border-transparent bg-lime-500 py-3 px-4 text-sm font-bold text-gray-900 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 transition-colors disabled:bg-lime-400 disabled:cursor-wait"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-3" />
                  <span>{isSignUp ? 'Criando conta...' : 'Entrando...'}</span>
                </>
              ) : (
                isSignUp ? 'Criar Conta' : 'Entrar'
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="space-y-3 text-center border-t border-gray-200 pt-5">
          <button
            type="button"
            onClick={onToggleMode}
            className="text-sm text-gray-600"
          >
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
            <span className="font-medium text-lime-500 hover:text-lime-700">
              {isSignUp ? 'Faça login' : 'Cadastre-se'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
