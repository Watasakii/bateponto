import { supabase } from './supabase-client.js';
import { requireAuth, logout } from './auth.js';
import { calculateDistanceMeters, formatDate, formatTime, formatDateTime, dataURLtoBlob } from './utils.js';

// Exige autenticação de funcionário (ou admin testando como funcionário)
const currentUser = requireAuth(['employee', 'admin']);

// Estado local da aplicação
let openRecord = null;
let companySettings = null;
let mediaStream = null;
let currentCoords = null;
let pendingActionType = 'in'; // 'in' ou 'out'

// Elementos do DOM
const userNameDisplay = document.getElementById('user-display-name');
const btnLogout = document.getElementById('btn-logout');
const liveClock = document.getElementById('live-clock');
const liveDate = document.getElementById('live-date');
const punchStatusContainer = document.getElementById('punch-status-container');
const recordsTableBody = document.getElementById('records-table-body');
const justificationForm = document.getElementById('justification-form');

// Modais e Câmera
const modalCamera = document.getElementById('modal-camera');
const btnCloseCamera = document.getElementById('btn-close-camera');
const videoFeed = document.getElementById('video-feed');
const photoCanvas = document.getElementById('photo-canvas');
const btnCapturePhoto = document.getElementById('btn-capture-photo');

// Modal Ticket
const modalTicket = document.getElementById('modal-ticket');
const btnCloseTicket = document.getElementById('btn-close-ticket');
const btnFinishTicket = document.getElementById('btn-finish-ticket');
const ticketActionType = document.getElementById('ticket-action-type');
const ticketUserName = document.getElementById('ticket-user-name');
const ticketTimestamp = document.getElementById('ticket-timestamp');
const ticketCoords = document.getElementById('ticket-coords');
const ticketGeofence = document.getElementById('ticket-geofence');
const ticketQrcode = document.getElementById('ticket-qrcode');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  if (currentUser) {
    userNameDisplay.textContent = currentUser.name;
  }

  btnLogout.addEventListener('click', logout);

  // Relógio Digital
  updateClock();
  setInterval(updateClock, 1000);

  // Carregar dados iniciais
  await loadCompanySettings();
  await checkCurrentShiftStatus();
  await loadRecordsHistory();

  // Event Listeners dos Modais
  btnCloseCamera.addEventListener('click', stopCameraAndCloseModal);
  btnCapturePhoto.addEventListener('click', processPunchRegistration);
  btnCloseTicket.addEventListener('click', () => modalTicket.classList.remove('active'));
  btnFinishTicket.addEventListener('click', () => modalTicket.classList.remove('active'));

  // Form de justificativa
  justificationForm.addEventListener('submit', handleJustificationSubmit);
});

// Atualiza o relógio em tempo real
function updateClock() {
  const now = new Date();
  liveClock.textContent = formatTime(now);
  liveDate.textContent = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

// Carrega as configurações de geofencing da empresa
async function loadCompanySettings() {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.warn('Configurações da empresa não encontradas. Usando valor padrão.', error);
      companySettings = { company_lat: -22.9519, company_lng: -46.5419, allowed_radius_meters: 100 };
    } else {
      companySettings = data;
    }
  } catch (e) {
    console.error('Erro ao carregar company_settings:', e);
    companySettings = { company_lat: -22.9519, company_lng: -46.5419, allowed_radius_meters: 100 };
  }
}

// Verifica o status do turno atual do funcionário no banco de dados
async function checkCurrentShiftStatus() {
  punchStatusContainer.innerHTML = `
    <button class="btn-clock btn-clock-in" disabled>
      <i class="ph-bold ph-spinner spinner"></i> Verificando status...
    </button>
  `;

  try {
    // Procura por um registro do usuário sem clock_out
    const { data, error } = await supabase
      .from('time_records')
      .select('*')
      .eq('user_id', currentUser.id)
      .is('clock_out', null)
      .order('clock_in', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      openRecord = data[0];
      renderPunchButton('out');
    } else {
      openRecord = null;
      renderPunchButton('in');
    }
  } catch (err) {
    console.error('Erro ao verificar status do turno:', err);
    punchStatusContainer.innerHTML = `
      <p style="color: var(--danger-color); font-size: 0.9rem;">
        Erro de conexão ao verificar turno. <button onclick="location.reload()" style="text-decoration: underline; background: none; border: none; cursor: pointer; color: inherit;">Tentar novamente</button>
      </p>
    `;
  }
}

// Renderiza o botão dinâmico ("Abrir Ponto" / "Encerrar Turno")
function renderPunchButton(type) {
  pendingActionType = type;
  if (type === 'in') {
    punchStatusContainer.innerHTML = `
      <button id="btn-clock-action" class="btn-clock btn-clock-in">
        <i class="ph-bold ph-play"></i> Abrir Ponto
      </button>
    `;
  } else {
    punchStatusContainer.innerHTML = `
      <button id="btn-clock-action" class="btn-clock btn-clock-out">
        <i class="ph-bold ph-stop"></i> Encerrar Turno
      </button>
    `;
  }

  document.getElementById('btn-clock-action').addEventListener('click', startPunchFlow);
}

// Inicia o fluxo de bater o ponto (Geolocalização -> Câmera)
async function startPunchFlow() {
  const btn = document.getElementById('btn-clock-action');
  btn.disabled = true;
  btn.innerHTML = `<i class="ph-bold ph-spinner spinner"></i> Obtendo GPS...`;

  // 1. Obter Geolocalização
  try {
    currentCoords = await getGeolocation();
  } catch (err) {
    alert('Acesso à localização negado ou indisponível. Para segurança do ponto, habilite o GPS no navegador.');
    console.warn('Não foi possível obter geolocalização:', err);
    // Coordenadas padrão/nulas caso falhe
    currentCoords = { latitude: null, longitude: null };
  }

  // 2. Abrir Câmera
  btn.innerHTML = `<i class="ph-bold ph-camera"></i> Abrindo Câmera...`;
  try {
    await startCamera();
    modalCamera.classList.add('active');
  } catch (err) {
    alert('Não foi possível acessar a câmera. Certifique-se de que a permissão foi concedida.');
    console.error('Erro ao acessar câmera:', err);
  } finally {
    renderPunchButton(pendingActionType);
  }
}

// Solicita geolocalização via API nativa do navegador
function getGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocalização não suportada pelo seu navegador.'));
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

// Inicia o vídeo da câmera via getUserMedia
async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('API getUserMedia não disponível.');
  }

  mediaStream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
    audio: false
  });

  videoFeed.srcObject = mediaStream;
}

// Para o stream da câmera e fecha o modal
function stopCameraAndCloseModal() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  modalCamera.classList.remove('active');
}

// Processa a foto e registra o ponto no Supabase
async function processPunchRegistration() {
  btnCapturePhoto.disabled = true;
  btnCapturePhoto.innerHTML = `<i class="ph-bold ph-spinner spinner"></i> Registrando Ponto...`;

  try {
    // Capturar frame no canvas
    const width = videoFeed.videoWidth || 640;
    const height = videoFeed.videoHeight || 480;
    photoCanvas.width = width;
    photoCanvas.height = height;

    const ctx = photoCanvas.getContext('2d');
    ctx.drawImage(videoFeed, 0, 0, width, height);
    const photoDataUrl = photoCanvas.toDataURL('image/jpeg', 0.85);

    // Parar câmera imediatamente
    stopCameraAndCloseModal();

    // Lógica de Geofencing
    let isFlagged = false;
    let flagReason = null;
    let distanceMeters = 0;

    if (currentCoords && currentCoords.latitude && currentCoords.longitude && companySettings) {
      distanceMeters = calculateDistanceMeters(
        currentCoords.latitude,
        currentCoords.longitude,
        companySettings.company_lat,
        companySettings.company_lng
      );

      if (distanceMeters > companySettings.allowed_radius_meters) {
        isFlagged = true;
        flagReason = `Fora do perímetro permitido (${Math.round(distanceMeters)}m da empresa)`;
      }
    }

    // Upload da Foto para o Supabase Storage
    const photoBlob = dataURLtoBlob(photoDataUrl);
    const fileName = `punches/${currentUser.id}_${Date.now()}.jpg`;

    let photoUrl = null;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('punches')
      .upload(fileName, photoBlob, { contentType: 'image/jpeg', upsert: true });

    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage.from('punches').getPublicUrl(fileName);
      photoUrl = urlData.publicUrl;
    } else {
      console.warn('Aviso: Não foi possível realizar upload da foto para o Storage (verifique se o bucket "punches" é público). Usando identificador base64.');
      photoUrl = photoDataUrl;
    }

    const nowIso = new Date().toISOString();

    if (pendingActionType === 'in') {
      // Criar novo registro de ponto
      const newRecord = {
        user_id: currentUser.id,
        clock_in: nowIso,
        clock_in_lat: currentCoords?.latitude || null,
        clock_in_lng: currentCoords?.longitude || null,
        clock_in_photo_url: photoUrl,
        is_flagged: isFlagged,
        flag_reason: flagReason,
        status: isFlagged ? 'pending' : 'approved'
      };

      const { data: savedRecord, error: insertError } = await supabase
        .from('time_records')
        .insert([newRecord])
        .select()
        .single();

      if (insertError) throw insertError;

      showConfirmationTicket('ENTRADA', nowIso, isFlagged, flagReason);
    } else {
      // Encerrar turno existente
      const updatedFields = {
        clock_out: nowIso,
        clock_out_lat: currentCoords?.latitude || null,
        clock_out_lng: currentCoords?.longitude || null,
        clock_out_photo_url: photoUrl
      };

      if (isFlagged) {
        updatedFields.is_flagged = true;
        updatedFields.flag_reason = openRecord.flag_reason
          ? `${openRecord.flag_reason} | Saída: ${flagReason}`
          : flagReason;
        updatedFields.status = 'pending';
      }

      const { error: updateError } = await supabase
        .from('time_records')
        .update(updatedFields)
        .eq('id', openRecord.id);

      if (updateError) throw updateError;

      showConfirmationTicket('SAÍDA', nowIso, isFlagged, flagReason);
    }

    // Atualizar estado da tela
    await checkCurrentShiftStatus();
    await loadRecordsHistory();

  } catch (err) {
    console.error('Erro ao salvar registro de ponto:', err);
    alert('Ocorreu um erro ao registrar o ponto: ' + (err.message || 'Erro no banco de dados.'));
  } finally {
    btnCapturePhoto.disabled = false;
    btnCapturePhoto.innerHTML = `<i class="ph ph-aperture"></i> Capturar Foto e Confirmar`;
  }
}

// Exibe o Modal de Comprovante / Ticket do Ponto com QR Code
function showConfirmationTicket(actionType, timestamp, isFlagged, flagReason) {
  ticketActionType.textContent = `REGISTRO DE ${actionType}`;
  ticketUserName.textContent = currentUser.name;
  ticketTimestamp.textContent = formatDateTime(timestamp);

  if (currentCoords && currentCoords.latitude) {
    ticketCoords.textContent = `${currentCoords.latitude.toFixed(4)}, ${currentCoords.longitude.toFixed(4)}`;
  } else {
    ticketCoords.textContent = 'Não informado';
  }

  if (isFlagged) {
    ticketGeofence.innerHTML = `<span style="color: var(--warning-color); font-weight: 600;">Com Alerta (${flagReason})</span>`;
  } else {
    ticketGeofence.innerHTML = `<span style="color: var(--success-color); font-weight: 600;">Dentro do Perímetro OK</span>`;
  }

  // Dados para QR Code
  const qrData = encodeURIComponent(`Ponto:${actionType}|User:${currentUser.name}|Data:${formatDateTime(timestamp)}|Status:${isFlagged ? 'FLAGGED' : 'OK'}`);
  ticketQrcode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;

  modalTicket.classList.add('active');
}

// Carrega o histórico recente de pontos do funcionário
async function loadRecordsHistory() {
  try {
    const { data: records, error } = await supabase
      .from('time_records')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!records || records.length === 0) {
      recordsTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhum ponto registrado até o momento.</td>
        </tr>
      `;
      return;
    }

    recordsTableBody.innerHTML = records.map(record => {
      const dateStr = formatDate(record.clock_in);
      const inTime = formatTime(record.clock_in);
      const outTime = record.clock_out ? formatTime(record.clock_out) : 'Em andamento...';

      let statusBadge = `<span class="badge badge-success">Aprovado</span>`;
      if (record.status === 'pending') {
        statusBadge = `<span class="badge badge-warning">Em Análise</span>`;
      } else if (record.status === 'rejected') {
        statusBadge = `<span class="badge badge-danger">Rejeitado</span>`;
      }

      let flagInfo = record.is_flagged
        ? `<span style="color: var(--danger-color); font-size: 0.8rem;"><i class="ph ph-warning"></i> ${record.flag_reason || 'Alerta do sistema'}</span>`
        : `<span style="color: var(--text-muted); font-size: 0.8rem;">Nenhum</span>`;

      return `
        <tr>
          <td><strong>${dateStr}</strong></td>
          <td>${inTime}</td>
          <td>${outTime}</td>
          <td>${statusBadge}</td>
          <td>${flagInfo}</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Erro ao carregar histórico:', err);
    recordsTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--danger-color);">Erro ao carregar histórico.</td>
      </tr>
    `;
  }
}

// Envio do formulário de justificativa
async function handleJustificationSubmit(e) {
  e.preventDefault();
  const descInput = document.getElementById('justification-desc');
  const description = descInput.value.trim();

  if (!description) return;

  try {
    const { error } = await supabase
      .from('justifications')
      .insert([{
        user_id: currentUser.id,
        time_record_id: openRecord ? openRecord.id : null,
        description: description,
        status: 'pending'
      }]);

    if (error) throw error;

    alert('Justificativa enviada com sucesso! Ela será analisada pelo administrador.');
    descInput.value = '';
  } catch (err) {
    console.error('Erro ao enviar justificativa:', err);
    alert('Erro ao enviar justificativa: ' + err.message);
  }
}
