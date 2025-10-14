// src/utils/testAccountSetup.ts
import { supabase } from '../lib/supabase';

export const testAccountSetup = async () => {
  console.log('🧪 Iniciando teste completo de configuração de conta...');

  try {
    // Teste 1: Criar novo usuário
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: `teste${Date.now()}@exemplo.com`,
      password: 'Teste123456!',
      options: {
        data: {
          full_name: 'Usuário Teste',
          phone: '(67) 99999-9999'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Erro no signup:', signUpError);
      return false;
    }

    console.log('✅ Signup realizado:', signUpData.user.id);

    // Aguarda processamento
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Teste 2: Verifica se profile foi criado
    if (!signUpData.user) {
      console.error('❌ User não criado');
      return false;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signUpData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar profile:', profileError);
      return false;
    }

    if (profileData) {
      console.log('✅ Profile criado com sucesso:', profileData);
      return true;
    } else {
      console.log('⚠️ Profile não encontrado');
      return false;
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return false;
  }
};
