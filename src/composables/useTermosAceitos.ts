import { Preferences } from '@capacitor/preferences';

/**
 * Verifica se o usuário já aceitou os termos de uso.
 * @returns boolean (true = aceitou, false = não aceitou)
 */
export const useTermosAceitos = async (): Promise<boolean> => {
  try {
    const { value } = await Preferences.get({ key: 'aceitou_termos' });
    return value === 'true';
  } catch (error) {
    console.error('Erro ao verificar aceitação dos termos:', error);
    return false;
  }
};
