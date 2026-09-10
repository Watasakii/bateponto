import { supabase } from './supabase-client.js';
import { setCurrentUser, getCurrentUser } from './auth.js';

// Se já estiver logado, redireciona para o painel do funcionário
if (getCurrentUser()) {
  window.location.href = 'employee.html';
}

const form = document.getElementById('register-form');
const alertMessage = document.getElementById('alert-message');
const successMessage = document.getElementById('success-message');
const btnSubmit = document.getElementById('btn-submit');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertMessage.style.display = 'none';
  successMessage.style.display = 'none';

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  // Validações no cliente
  if (!name || !email || !password) {
    showError('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  if (password !== confirmPassword) {
    showError('As senhas não coincidem. Verifique e tente novamente.');
    return;
  }

  if (password.length < 4) {
    showError('A senha deve ter pelo menos 4 caracteres.');
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="ph ph-spinner spinner"></i> Cadastrando...';

  try {
    // 1. Verificar se o usuário/email já existe na tabela `users`
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},name.eq.${name}`);

    if (checkError) {
      console.error('Erro ao verificar usuário existente:', checkError);
      showError('Erro ao conectar com o banco de dados.');
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="ph ph-user-plus"></i> Cadastrar';
      return;
    }

    if (existingUsers && existingUsers.length > 0) {
      showError('Este usuário ou e-mail já está cadastrado no sistema.');
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="ph ph-user-plus"></i> Cadastrar';
      return;
    }

    // 2. Inserir o novo usuário na tabela `users`
    const newUser = {
      name: name,
      email: email,
      password_hash: password,
      role: 'employee'
    };

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao cadastrar usuário:', insertError);
      showError('Falha ao cadastrar usuário: ' + (insertError.message || 'Erro no banco de dados.'));
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="ph ph-user-plus"></i> Cadastrar';
      return;
    }

    // Success! Salvar sessão e redirecionar
    successMessage.textContent = 'Cadastro realizado com sucesso! Redirecionando...';
    successMessage.style.display = 'block';

    const sessionUser = {
      id: insertedUser.id,
      name: insertedUser.name,
      email: insertedUser.email,
      role: insertedUser.role
    };

    setCurrentUser(sessionUser);

    setTimeout(() => {
      window.location.href = 'employee.html';
    }, 1200);

  } catch (err) {
    console.error('Erro inesperado no cadastro:', err);
    showError('Ocorreu um erro inesperado ao realizar o cadastro.');
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="ph ph-user-plus"></i> Cadastrar';
  }
});

function showError(msg) {
  alertMessage.textContent = msg;
  alertMessage.style.display = 'block';
}
