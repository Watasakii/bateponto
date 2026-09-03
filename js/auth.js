import { supabase } from './supabase-client.js';

const SESSION_KEY = 'ponto_user_session';

/**
 * Obtém a sessão atual salva do usuário.
 * @returns {Object|null}
 */
export function getCurrentUser() {
  const sessionData = localStorage.getItem(SESSION_KEY);
  if (!sessionData) return null;
  try {
    return JSON.parse(sessionData);
  } catch (e) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

/**
 * Salva os dados do usuário logado na sessão local.
 * @param {Object} user
 */
export function setCurrentUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

/**
 * Realiza o encerramento da sessão do usuário.
 */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
}

/**
 * Realiza a autenticação do usuário com base no e-mail/usuário e senha.
 * @param {string} usernameOrEmail
 * @param {string} password
 * @returns {Promise<{success: boolean, message?: string, user?: Object}>}
 */
export async function login(usernameOrEmail, password) {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${usernameOrEmail},name.eq.${usernameOrEmail}`);

    if (error) {
      console.error('Erro na consulta do banco:', error);
      return { success: false, message: 'Erro de conexão com o banco de dados.' };
    }

    if (!users || users.length === 0) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    const user = users.find(u => u.password_hash === password);

    if (!user) {
      return { success: false, message: 'Senha incorreta.' };
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    setCurrentUser(sessionUser);

    return { success: true, user: sessionUser };
  } catch (err) {
    console.error('Erro inesperado no login:', err);
    return { success: false, message: 'Erro inesperado no servidor.' };
  }
}

/**
 * Verifica se a página atual é protegida e redireciona de acordo com o estado do login.
 * @param {Array<string>} [allowedRoles] Roles permitidas na página atual (ex: ['admin'] ou ['employee'])
 */
export function requireAuth(allowedRoles = []) {
  const user = getCurrentUser();
  const currentPath = window.location.pathname;

  if (!user) {
    if (!currentPath.endsWith('index.html') && currentPath !== '/') {
      window.location.href = 'index.html';
    }
    return null;
  }

  // Se o usuário estiver na tela de login e já estiver logado, redireciona sempre para employee.html
  if (currentPath.endsWith('index.html') || currentPath === '/') {
    window.location.href = 'employee.html';
    return user;
  }

  return user;
}
