# Backlog do Projeto - Ponto Eletrônico Anti-Fraude

## 📋 Visão Geral
Este documento registra e acompanha o progresso do desenvolvimento de todas as tarefas e subtarefas do sistema de Ponto Eletrônico Anti-Fraude.

---

## 🚀 Tarefas e Subtarefas

### 1. Estrutura Inicial e Configuração
- [x] Criar arquivo `backlog.md` para registro das tarefas.
- [ ] Criar arquivo `css/style.css` com estilos globais e variáveis de design (Clean UI).
- [ ] Criar `js/supabase-client.js` configurando a inicialização e exportação da instância do Supabase via CDN.
- [ ] Criar `index.html` com a estrutura da tela de login inicial.

### 2. Módulo de Autenticação e Sessão
- [ ] Criar `js/auth.js` para controle de formulário de login (usuário e senha).
- [ ] Implementar verificação com mock e tabela `users` no Supabase (admin / funcionário).
- [ ] Configurar controle de sessão no `localStorage` e suporte a logout.
- [ ] Implementar redirecionamento automático baseado na role (`admin.html` vs `employee.html`).

### 3. Painel do Funcionário (`employee.html` & `js/employee.js`)
- [ ] Criar layout do painel do funcionário com status do turno (Botão "Abrir Ponto" / "Encerrar Turno").
- [ ] Integrar `navigator.geolocation` para captura de coordenadas (Latitude/Longitude) no momento da ação.
- [ ] Integrar `navigator.mediaDevices.getUserMedia` com renderização de `<video>` e captura de foto do funcionário.
- [ ] Integrar biblioteca de detecção facial/rosto na foto para verificação client-side.
- [ ] Implementar cálculo de Geofencing (comparação com raio permitido em `company_settings`).
- [ ] Implementar lógica de marcação de flags não-bloqueantes (`is_flagged`, `flag_reason`).
- [ ] Implementar envio de registro de ponto para a tabela `time_records` e upload da foto no Supabase Storage.
- [ ] Criar tabela de histórico de pontos batidos na semana atual.
- [ ] Criar formulário de justificativas e atestados com inserção na tabela `justifications`.

### 4. Painel do Administrador (`admin.html` & `js/admin.js`)
- [ ] Criar layout do painel administrativo com estatísticas e tempo real (funcionários trabalhando vs ausentes).
- [ ] Criar Fila de Análise para registros marcados com `is_flagged = true` ou `status = 'pending'`.
- [ ] Exibir modal/detalhes com a foto capturada, mapa/localização e motivo do alerta.
- [ ] Implementar ações de aprovação e rejeição de registros de ponto.
- [ ] Criar tela de Gestão de Justificativas com ações para aprovar ou rejeitar.
- [ ] Criar formulário de Configurações da Empresa (alteração de Latitude, Longitude e Raio de tolerância em `company_settings`).

### 5. Utilidades e Estilização Geral (`js/utils.js`)
- [ ] Desenvolver `js/utils.js` com funções utilitárias:
  - Cálculo da fórmula de Haversine para cálculo de distância entre coordenadas GPS.
  - Formatação de data, hora e duração.
  - Notificações/Alertas visuais (SweetAlert2 ou toast customizado).
- [ ] Garantir integração de ícones SVG (Phosphor Icons) em toda a interface sem uso de emojis.

---

## 📌 Histórico de Alterações
- **[Data Atual]**: Inicializado o repositório, especificação lida e criado o arquivo `backlog.md`.
