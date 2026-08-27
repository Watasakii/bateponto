# SPECIFICATION - Sistema de Ponto Eletrônico Anti-Fraude

## 1. Diretrizes para o Agente de IA (Google Jules)
- **Não codifique se houver dúvidas:** Pare e solicite esclarecimentos ao usuário antes de prosseguir com suposições.
- **Divisão de Tarefas:** Sempre divida programações extensas em tarefas e subtarefas menores e lógicas antes de escrever o código.
- **Manutenção de Log:** Você DEVE gerar e atualizar constantemente um arquivo chamado `backlog.md` na raiz do projeto. Este arquivo deve registrar todas as funcionalidades implementadas, ajustadas, alteradas ou pendentes.
- **Autonomia:** Siga as regras de arquitetura estritamente. Use o Supabase via API/CDN e escreva código Vanilla puro.

## 2. Stack Tecnológico
- **Hospedagem / Repositório:** GitHub / GitHub Pages.
- **Banco de Dados / Backend:** Supabase (Acesso via biblioteca oficial JS em CDN).
- **Frontend:** HTML5, CSS3, JavaScript Vanilla (ES6+).
- **Sem Bundlers:** NENHUM pacote NPM, Node.js, Webpack ou Vite. Tudo deve rodar diretamente no navegador via importações de módulos (`<script type="module">`).

## 3. Bibliotecas de Terceiros Permitidas (Via CDN)
Para reduzir código e evitar erros, utilize EXCLUSIVAMENTE as seguintes bibliotecas via CDN:
1. **Supabase JS Client:** Para comunicação direta com o banco de dados e Storage (armazenamento de fotos).
2. **Phosphor Icons (ou Feather Icons):** Biblioteca de ícones SVG. **Não utilize emojis em nenhuma parte da interface.**
3. **Face-api.js (Opcional para IA Facial no Client-side):** Para detectar rostos na câmera antes de salvar a imagem.
4. **SweetAlert2 (Opcional):** Para modais de alerta esteticamente limpos e sem muito CSS manual.

## 4. UI / UX Guidelines
- **Plataforma Alvo:** Exclusivo para uso em Tablets e Desktops. Não é necessário focar em responsividade mobile complexa.
- **Estilo Visual:** Interface extremamente limpa (Clean UI), minimalista.
- **Cores:** Fundo predominantemente branco (`#FFFFFF` ou `#F8F9FA`), com textos em cinza escuro (`#212529`). Cores de ação limitadas ao essencial (ex: Verde para abrir ponto, Vermelho para fechar, Amarelo/Laranja para alertas).
- **Tipografia:** Sans-serif moderna (ex: Inter ou Roboto via Google Fonts).
- **APIs Nativas:** Utilizar `navigator.geolocation` estritamente no momento do clique, e `navigator.mediaDevices.getUserMedia` apenas durante o fluxo de bater o ponto.

## 5. Escopo de Funcionalidades

### 5.1. Módulo de Autenticação
- Tela de login simples com Usuário e Senha.
- Mock inicial/provisório no banco de dados: usuário `admin` e senha `admin` (redireciona para o painel admin). Outros usuários redirecionam para o painel do funcionário.
- Controle de sessão baseado em LocalStorage integrado ao Auth do Supabase.

### 5.2. Painel do Funcionário (Tablet/Desktop)
- **Status do Turno:** Um botão central que alterna seu estado e texto com base na verificação no banco de dados.
  - Se não houver registro aberto hoje: Botão "Abrir Ponto".
  - Se houver registro aberto: Botão "Encerrar Turno".
- **Fluxo de Ação (Bater Ponto):**
  1. Ao clicar, acionar `navigator.geolocation` para obter Latitude/Longitude.
  2. Acionar a câmera web, renderizar um `<video>` para o usuário ver o enquadramento, e capturar um frame (foto) em base64.
  3. Enviar a foto para o Supabase Storage e os dados (Hora, Lat, Lng, URL da Foto) para a tabela `time_records`.
- **Resumo de Horas:** Tabela simples mostrando os horários batidos na semana atual e o status.
- **Justificativas:** Formulário simples para enviar um texto (ex: atraso) ou anexo (atestado), inserindo na tabela `justifications`.

### 5.3. Sistema Anti-Fraude (Regra de Negócio)
- **Cálculo de Geofencing:** No momento do envio, o JS (ou o banco) deve calcular a distância entre a coordenada atual e a coordenada base (`company_settings`).
- **Lógica de Flag (Não Bloqueante):** 
  - Se a distância for maior que o raio permitido, o ponto **É SALVO**, mas a coluna `is_flagged` recebe `true` e a `flag_reason` recebe "Fora do perímetro permitido".
  - Se não houver rosto na foto capturada, recebe flag "Rosto não identificado".

### 5.4. Painel do Administrador (Tablet/Desktop)
- **Dashboard / Tempo Real:** Lista em formato de tabela ou cards dos funcionários indicando quem está "Trabalhando" e quem está "Ausente/Atrasado".
- **Fila de Análise (Flags):** Tabela listando apenas os `time_records` onde `is_flagged = true` ou `status = 'pending'`.
  - O Admin pode clicar para ver a foto capturada, a localização em um mapa estático ou link, e o motivo da flag.
  - Botões de ação na linha: "Aprovar Ponto" ou "Rejeitar Ponto" (atualiza o status no banco).
- **Gestão de Justificativas:** Lista de justificativas enviadas, com botões para aprovar ou rejeitar.
- **Configurações:** Formulário para o Admin atualizar a Latitude, Longitude e Raio de segurança da empresa.

## 6. Estrutura de Diretórios Recomendada
O agente deve criar a seguinte estrutura na raiz do repositório:
/
|-- index.html (Tela de Login)
|-- employee.html (Painel do Funcionário)
|-- admin.html (Painel do Admin)
|-- /css
|   |-- style.css (Estilos globais)
|-- /js
|   |-- auth.js (Lógica de login e sessão)
|   |-- employee.js (Lógica de bater ponto, câmera, GPS)
|   |-- admin.js (Lógica do dashboard e aprovações)
|   |-- supabase-client.js (Configuração e exportação da instância do Supabase)
|   |-- utils.js (Funções auxiliares, cálculo de distância, formatação de datas)
|-- backlog.md (Arquivo de controle do Agente)