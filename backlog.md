# Backlog do Projeto - Ponto Eletrônico Anti-Fraude

## 📋 Visão Geral
Este documento registra e acompanha o progresso do desenvolvimento de todas as tarefas e subtarefas do sistema de Ponto Eletrônico Anti-Fraude.

---

## 🚀 Tarefas e Subtarefas

### 1. Estrutura Inicial e Configuração
- [x] Criar arquivo `backlog.md` para registro das tarefas.
- [x] Criar arquivo `css/style.css` com estilos globais e variáveis de design (Clean UI).
- [x] Criar `js/supabase-client.js` configurando a inicialização e exportação da instância do Supabase via CDN.
- [x] Criar `index.html` com a estrutura da tela de login inicial.

### 2. Módulo de Autenticação e Sessão
- [x] Criar `js/auth.js` para controle de formulário de login (usuário e senha).
- [x] Implementar verificação consultando a tabela `users` no Supabase.
- [x] Configurar controle de sessão no `localStorage` e suporte a logout.
- [x] Unificar o direcionamento de login pós-autenticação para direcionar todos os usuários (inclusive contas de admin) diretamente para `employee.html`.

### 3. Painel do Funcionário (`employee.html` & `js/employee.js`)
- [x] Criar layout do painel do funcionário com status do turno (Botão dinâmico "Abrir Ponto" / "Encerrar Turno").
- [x] Integrar `navigator.geolocation` para captura de coordenadas (Latitude/Longitude) no momento da ação.
- [x] Integrar `navigator.mediaDevices.getUserMedia` com renderização de `<video>` e captura de foto do funcionário.
- [x] Implementar cálculo de Geofencing com fórmula de Haversine em `js/utils.js` (comparação com raio em `company_settings`).
- [x] Implementar lógica de marcação de flags não-bloqueantes (`is_flagged`, `flag_reason`).
- [x] Implementar envio de registro de ponto para a tabela `time_records` e upload da foto no Supabase Storage (`punches`).
- [x] Exibir modal de confirmação com comprovante (Ticket do Ponto) e QR Code ilustrativo via API `qrserver.com`.
- [x] Criar tabela de histórico de pontos batidos pelo funcionário.
- [x] Criar formulário de justificativas e atestados com inserção na tabela `justifications`.

### 4. Utilidades e Estilização Geral (`js/utils.js`)
- [x] Desenvolver `js/utils.js` com funções utilitárias:
  - Cálculo da fórmula de Haversine para cálculo de distância entre coordenadas GPS.
  - Formatação de data e hora no padrão brasileiro.
  - Auxiliar para conversão de Canvas/DataURL para Blob.
- [x] Garantir integração de ícones SVG (Phosphor Icons) em toda a interface sem uso de emojis no HTML.

---

## 📌 Histórico de Alterações
- **[Ajuste Estrutura Inicial]**: Inicializado repositório e cliente Supabase.
- **[Painel do Funcionário]**: Criados `employee.html`, `js/employee.js`, `js/auth.js` e `js/utils.js` com fluxo de bater ponto por foto e GPS, geofencing, ticket com QR Code e histórico.
- **[Ajuste Fluxo Login]**: Removido redirecionamento para `admin.html` em `js/auth.js` e `js/employee.js`. Todos os usuários logados acessam exclusivamente a página `employee.html`.
