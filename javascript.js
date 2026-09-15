// Estado Global da Aplicação
let perfilAtual = 'morador';
let modoLoginAdmin = false;
let clickLogoCount = 0;
let clickLogoTimer = null;

let toastTimeout;
let tempFotoPerfil = null;
let tempLogoCondo = null;
let usuarioLogadoData = null;

// Controle de data do calendário dinâmico
let dataCalendarioAtual = new Date(); 
let dataSelecionadaReserva = null;

const estado = {
  nomeCondominio: 'CondoVIVER',
  tipoHabitacao: 'Apartamentos',
  blocos: ['Bloco A', 'Bloco B', 'Bloco C'],
  logoUrl: null,

  moradores: [
    { id: 'CND-1082', nome: 'Carlos Eduardo Silva', bloco: 'Bloco A', apto: '102', tel: '(91) 98765-4321', email: 'morador@condoviver.com', fotoUrl: null },
    { id: 'CND-2041', nome: 'Ana Souza', bloco: 'Bloco B', apto: '204', tel: '(91) 99123-8877', email: 'ana.souza@gmail.com', fotoUrl: null },
    { id: 'CND-3015', nome: 'Roberto Lima', bloco: 'Bloco C', apto: '501', tel: '(91) 98111-2233', email: 'roberto@empresa.com', fotoUrl: null }
  ],

  comunicados: [
    { id: 1, titulo: 'Coleta Seletiva e Descarte de Pilhas', tag: 'Aviso', data: '12/05/2026', tempoRelativo: 'Há 1 dia', texto: 'Lembramos que o lixo reciclável deve ser depositado devidamente separado nas lixeiras azuis no térreo.' },
    { id: 2, titulo: 'Limpeza Preventiva da Piscina', tag: 'Manutenção', data: '10/05/2026', tempoRelativo: 'Há 3 dias', texto: 'A piscina principal estará interditada para tratamento químico na próxima terça-feira.' }
  ],

  espacos: [
    { id: 1, nome: 'Salão de Festas Principal', taxa: 100, regras: 'Som permitido até 22h. Limpeza inclusa.' },
    { id: 2, nome: 'Churrasqueira Gourmet', taxa: 50, regras: 'Proibido recipientes de vidro na área externa.' }
  ],

  reservas: [
    { id: 101, moradorNome: 'Carlos Eduardo Silva', moradorUnidade: 'Bloco A - Apt 102', espacoId: 1, espacoNome: 'Salão de Festas Principal', data: '15/05/2026', status: 'Aguardando Pagamento' },
    { id: 102, moradorNome: 'Ana Souza', moradorUnidade: 'Bloco B - Apt 204', espacoId: 1, espacoNome: 'Salão de Festas Principal', data: '20/05/2026', status: 'Reservado' }
  ],

  // Step 1: Aceito (Roxo) | Step 2: Manutenção (Laranja) | Step 3: Concluído (Verde)
  chamados: [
    { id: 1, titulo: 'Infiltração Teto da Garagem SS1', morador: 'Carlos Eduardo Silva (Bloco A - Apt 102)', data: '09/05/2026', status: 'Em Manutenção', aprovado: true, step: 2 },
    { id: 2, titulo: 'Lâmpada do Corredor Bloco C', morador: 'Roberto Lima (Bloco C - Apt 501)', data: '12/05/2026', status: 'Aceito', aprovado: true, step: 1 }
  ],

  encomendas: [
    { id: 1, moradorId: 'CND-1082', destinatario: 'Carlos Eduardo Silva', unidade: 'Bloco A - Apt 102', pacote: 'Amazon - Caixa Média', data: 'Hoje às 09:15', retirado: false, cadastradoEm: Date.now() }
  ],

  regras: [
    'Respeitar o horário de silêncio rigorosamente entre 22h e 08h.',
    'Animais de estimação devem circular nas áreas comuns usando guia.',
    'Velocidade máxima de veículos na garagem é de 10 km/h.'
  ],

  documentos: [
    { id: 1, titulo: 'Regulamento Interno Atualizado 2026.pdf', tamanho: '1.2 MB' },
    { id: 2, titulo: 'Ata da Assembleia Geral Ordinária.pdf', tamanho: '850 KB' }
  ]
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  atualizarInterfaceCondominio();
  renderizarTudo();
  configurarEventListeners();
  iniciarLembreteAutomatico10Horas();
  gerarCalendario();
});

function configurarEventListeners() {
  document.getElementById('logo-clickable').addEventListener('click', tratarCliqueLogo);
  document.getElementById('form-login').addEventListener('submit', realizarLogin);
  document.getElementById('btn-logout').addEventListener('click', logout);
  document.getElementById('btn-salvar-perfil').addEventListener('click', salvarPerfil);
  document.getElementById('btn-ir-perfil').addEventListener('click', irParaPerfil);
  document.getElementById('btn-push-notif').addEventListener('click', verNotificacoesHeader);
  document.getElementById('btn-close-toast').addEventListener('click', hideToast);

  document.getElementById('prof-foto-input').addEventListener('change', previewFotoPerfil);
  document.getElementById('adm-condo-logo-input').addEventListener('change', previewLogoCondominio);
  document.getElementById('adm-condo-tipo').addEventListener('change', atualizarLabelTipoHabitacao);

  document.getElementById('btn-salvar-config').addEventListener('click', salvarConfigCondominio);
  document.getElementById('form-cad-morador').addEventListener('submit', cadastrarMorador);
  document.getElementById('btn-publicar-aviso').addEventListener('click', publicarAvisoMural);
  document.getElementById('btn-cadastrar-espaco').addEventListener('click', cadastrarNovoEspaco);
  document.getElementById('btn-solicitar-reserva').addEventListener('click', solicitarReserva);
  document.getElementById('btn-abrir-chamado').addEventListener('click', abrirNovoChamado);
  
  document.getElementById('adm-enc-bloco-select').addEventListener('change', buscarMoradorPorBlocoEApto);
  document.getElementById('adm-enc-apto-input').addEventListener('input', buscarMoradorPorBlocoEApto);
  document.getElementById('btn-entrada-encomenda').addEventListener('click', darEntradaEncomenda);

  document.getElementById('btn-disparar-notificacao-admin').addEventListener('click', dispararNotificacaoAdmin);

  document.getElementById('btn-adicionar-regra').addEventListener('click', adicionarRegra);
  document.getElementById('btn-anexar-doc').addEventListener('click', anexarDocumento);
  document.getElementById('reserva-espaco-select').addEventListener('change', () => {
    atualizarInfoEspaco();
    gerarCalendario();
  });

  // Navegação do Calendário
  document.getElementById('btn-cal-prev').addEventListener('click', () => {
    dataCalendarioAtual.setMonth(dataCalendarioAtual.getMonth() - 1);
    gerarCalendario();
  });
  document.getElementById('btn-cal-next').addEventListener('click', () => {
    dataCalendarioAtual.setMonth(dataCalendarioAtual.getMonth() + 1);
    gerarCalendario();
  });

  // Navegação Inferior
  document.getElementById('nav-mural').addEventListener('click', (e) => trocarTela('mural', '<i class="fa-solid fa-newspaper"></i> Mural de Notícias', e.currentTarget));
  document.getElementById('nav-chamados').addEventListener('click', (e) => trocarTela('chamados', '<i class="fa-solid fa-wrench"></i> Manutenção & Chamados', e.currentTarget));
  document.getElementById('nav-reservas').addEventListener('click', (e) => trocarTela('reservas', '<i class="fa-solid fa-calendar-days"></i> Reserva de Espaços', e.currentTarget));
  document.getElementById('nav-encomendas').addEventListener('click', (e) => trocarTela('encomendas', '<i class="fa-solid fa-box-open"></i> Encomendas', e.currentTarget));
  document.getElementById('nav-regras').addEventListener('click', (e) => trocarTela('regras', '<i class="fa-solid fa-file-contract"></i> Regras & PDF', e.currentTarget));
  document.getElementById('nav-admin').addEventListener('click', (e) => trocarTela('admin', '<i class="fa-solid fa-user-gear"></i> Painel Admin', e.currentTarget));

  // Tabs do Painel Administrativo
  const admTabs = ['config', 'moradores', 'mural', 'espacos', 'baixas', 'chamados', 'encomendas', 'notificacoes', 'regras'];
  admTabs.forEach(tab => {
    const el = document.getElementById(`adm-tab-${tab}`);
    if (el) el.addEventListener('click', () => mudarTabAdmin(tab));
  });
}

// Lógica de 6 Cliques na Logo
function tratarCliqueLogo() {
  clickLogoCount++;
  clearTimeout(clickLogoTimer);

  clickLogoTimer = setTimeout(() => { clickLogoCount = 0; }, 1500);

  if (clickLogoCount === 6) {
    clickLogoCount = 0;
    modoLoginAdmin = !modoLoginAdmin;

    const subtitle = document.getElementById('login-subtitle');
    const labelUser = document.getElementById('login-label-user');
    const btnSubmit = document.getElementById('btn-submit-login');
    const inputEmail = document.getElementById('login-email');

    if (modoLoginAdmin) {
      perfilAtual = 'sindico';
      subtitle.innerHTML = '<strong style="color: #ef4444;"><i class="fa-solid fa-lock"></i> MODO SÍNDICO / ADMIN ATIVADO</strong>';
      labelUser.innerText = 'E-mail Administrador';
      inputEmail.value = 'sindico@condoviver.com';
      btnSubmit.className = 'btn-danger w-100';
      btnSubmit.innerHTML = '<i class="fa-solid fa-user-shield"></i> Entrar no Painel Admin';
      showToast('<i class="fa-solid fa-key"></i> Modo de login do Síndico ativado!');
    } else {
      perfilAtual = 'morador';
      subtitle.innerText = 'Acesso exclusivo para Moradores';
      labelUser.innerText = 'E-mail ou Usuário';
      inputEmail.value = 'morador@condoviver.com';
      btnSubmit.className = 'btn-primary w-100';
      btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar como Morador';
      showToast('<i class="fa-solid fa-house-user"></i> Retornado ao Login de Morador.');
    }
  }
}

// Autenticação
function realizarLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email').value;

  document.getElementById('screen-login').classList.remove('active');
  document.getElementById('main-header').style.display = 'flex';
  document.getElementById('main-nav').style.display = 'flex';

  if (perfilAtual === 'sindico' && modoLoginAdmin) {
    usuarioLogadoData = { id: 'MASTER-SINDICO', nome: 'Síndico Geral' };
    document.getElementById('nav-admin').style.display = 'flex';
    document.getElementById('prof-id-display').innerText = 'ID: MASTER-SINDICO';
    document.getElementById('prof-unidade-display').innerText = 'Administração do Condomínio';
    document.getElementById('prof-nome').value = 'Síndico Geral';
    atualizarFotoPerfilDisplay(null);
    trocarTela('admin', '<i class="fa-solid fa-user-gear"></i> Painel Admin', document.getElementById('nav-admin'));
  } else {
    perfilAtual = 'morador';
    document.getElementById('nav-admin').style.display = 'none';

    let moradorEncontrado = estado.moradores.find(m => m.email.toLowerCase() === emailInput.toLowerCase());
    if (!moradorEncontrado) moradorEncontrado = estado.moradores[0];

    usuarioLogadoData = moradorEncontrado;

    document.getElementById('prof-id-display').innerText = `ID: ${moradorEncontrado.id}`;
    document.getElementById('prof-unidade-display').innerText = `${moradorEncontrado.bloco} - Apt ${moradorEncontrado.apto}`;
    document.getElementById('prof-nome').value = moradorEncontrado.nome;
    document.getElementById('prof-telefone').value = moradorEncontrado.tel;
    document.getElementById('prof-email').value = moradorEncontrado.email;
    atualizarFotoPerfilDisplay(moradorEncontrado.fotoUrl);

    trocarTela('mural', '<i class="fa-solid fa-newspaper"></i> Mural de Notícias', document.getElementById('nav-mural'));
  }

  renderizarMinhasReservas();
  renderizarEncomendasMorador();
  atualizarBadgeNotificacoes();
  showToast('<i class="fa-solid fa-circle-check"></i> Autenticado com sucesso!');
}

function logout() {
  modoLoginAdmin = false;
  perfilAtual = 'morador';
  usuarioLogadoData = null;

  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById('main-header').style.display = 'none';
  document.getElementById('main-nav').style.display = 'none';
  document.getElementById('nav-admin').style.display = 'none';

  document.getElementById('login-subtitle').innerText = 'Acesso exclusivo para Moradores';
  document.getElementById('login-label-user').innerText = 'E-mail ou Usuário';
  document.getElementById('login-email').value = 'morador@condoviver.com';
  const btnSubmit = document.getElementById('btn-submit-login');
  btnSubmit.className = 'btn-primary w-100';
  btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar como Morador';

  document.getElementById('screen-login').classList.add('active');
  showToast('<i class="fa-solid fa-arrow-right-from-bracket"></i> Sessão encerrada.');
}

function trocarTela(idTela, tituloHTML, elemento) {
  if (idTela === 'admin' && perfilAtual !== 'sindico') {
    showToast('<i class="fa-solid fa-ban"></i> Acesso negado!');
    return;
  }

  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  
  const targetScreen = document.getElementById('screen-' + idTela);
  if (targetScreen) targetScreen.classList.add('active');
  
  document.getElementById('screen-title').innerHTML = tituloHTML;
  if (elemento) elemento.classList.add('active');
}

function irParaPerfil() {
  trocarTela('perfil', '<i class="fa-solid fa-user-tie"></i> Meu Perfil', null);
}

function salvarPerfil() {
  if (perfilAtual === 'morador' && usuarioLogadoData) {
    usuarioLogadoData.nome = document.getElementById('prof-nome').value;
    usuarioLogadoData.tel = document.getElementById('prof-telefone').value;
    usuarioLogadoData.email = document.getElementById('prof-email').value;
    if (tempFotoPerfil) usuarioLogadoData.fotoUrl = tempFotoPerfil;
  }
  showToast('<i class="fa-solid fa-floppy-disk"></i> Alterações e foto salvas com sucesso!');
}

function previewFotoPerfil(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      tempFotoPerfil = evt.target.result;
      atualizarFotoPerfilDisplay(tempFotoPerfil);
    };
    reader.readAsDataURL(file);
  }
}

function atualizarFotoPerfilDisplay(fotoUrl) {
  const img = document.getElementById('prof-foto-img');
  const icon = document.getElementById('prof-icon');
  if (img && icon) {
    if (fotoUrl) {
      img.src = fotoUrl;
      img.style.display = 'block';
      icon.style.display = 'none';
    } else {
      img.style.display = 'none';
      icon.style.display = 'block';
    }
  }
}

function previewLogoCondominio(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      tempLogoCondo = evt.target.result;
      showToast('<i class="fa-solid fa-image"></i> Prévia da logo carregada! Clique em Salvar para aplicar.');
    };
    reader.readAsDataURL(file);
  }
}

function salvarConfigCondominio() {
  const novoNome = document.getElementById('adm-condo-nome').value.trim();
  const tipo = document.getElementById('adm-condo-tipo').value;
  const blocosStr = document.getElementById('adm-condo-blocos').value.trim();

  if (!novoNome || !blocosStr) {
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> Preencha todos os campos obrigatórios!');
    return;
  }

  estado.nomeCondominio = novoNome;
  estado.tipoHabitacao = tipo;
  if (tempLogoCondo) estado.logoUrl = tempLogoCondo;
  estado.blocos = blocosStr.split(',').map(b => b.trim()).filter(b => b.length > 0);

  atualizarInterfaceCondominio();
  renderizarBlocosSelect();
  showToast('<i class="fa-solid fa-circle-check"></i> Configurações salvas!');
}

function atualizarLabelTipoHabitacao() {
  const tipo = document.getElementById('adm-condo-tipo').value;
  const labelBlocos = document.getElementById('adm-label-blocos');
  const inputBlocos = document.getElementById('adm-condo-blocos');

  if (tipo === 'Casas') {
    labelBlocos.innerText = 'Quadras / Alameda / Ruas (separados por vírgula)';
    if (!inputBlocos.value || inputBlocos.value.includes('Bloco')) inputBlocos.value = 'Quadra 01, Quadra 02, Quadra 03';
  } else if (tipo === 'Loteamento') {
    labelBlocos.innerText = 'Setores / Fases / Lotes (separados por vírgula)';
    if (!inputBlocos.value || inputBlocos.value.includes('Bloco')) inputBlocos.value = 'Setor Norte, Setor Sul, Fase 1';
  } else {
    labelBlocos.innerText = 'Blocos / Torres do Prédio (separados por vírgula)';
    if (!inputBlocos.value || inputBlocos.value.includes('Quadra') || inputBlocos.value.includes('Setor')) inputBlocos.value = 'Bloco A, Bloco B, Bloco C';
  }
}

function atualizarInterfaceCondominio() {
  const loginTitle = document.getElementById('login-condo-title');
  const inputAdmin = document.getElementById('adm-condo-nome');
  const selectTipo = document.getElementById('adm-condo-tipo');
  const inputBlocos = document.getElementById('adm-condo-blocos');

  if (loginTitle) loginTitle.innerText = estado.nomeCondominio;
  if (inputAdmin) inputAdmin.value = estado.nomeCondominio;
  if (selectTipo) selectTipo.value = estado.tipoHabitacao;
  if (inputBlocos) inputBlocos.value = estado.blocos.join(', ');

  const loginLogoImg = document.getElementById('login-logo-img');
  const loginLogoIcon = document.getElementById('login-logo-icon');
  if (loginLogoImg && loginLogoIcon) {
    if (estado.logoUrl) {
      loginLogoImg.src = estado.logoUrl;
      loginLogoImg.style.display = 'block';
      loginLogoIcon.style.display = 'none';
    } else {
      loginLogoImg.style.display = 'none';
      loginLogoIcon.style.display = 'block';
    }
  }

  const labelCadBloco = document.getElementById('label-cad-bloco');
  const labelCadApto = document.getElementById('label-cad-apto');
  const inputApto = document.getElementById('cad-morador-apto');

  if (estado.tipoHabitacao === 'Casas') {
    if (labelCadBloco) labelCadBloco.innerText = 'Quadra / Alameda';
    if (labelCadApto) labelCadApto.innerText = 'Número da Casa';
    if (inputApto) inputApto.placeholder = 'Ex: Casa 12, Lote 05';
  } else if (estado.tipoHabitacao === 'Loteamento') {
    if (labelCadBloco) labelCadBloco.innerText = 'Setor / Quadra';
    if (labelCadApto) labelCadApto.innerText = 'Número do Lote';
    if (inputApto) inputApto.placeholder = 'Ex: Lote 42';
  } else {
    if (labelCadBloco) labelCadBloco.innerText = 'Bloco / Torre';
    if (labelCadApto) labelCadApto.innerText = 'Número do Apto';
    if (inputApto) inputApto.placeholder = 'Ex: 101, 304';
  }

  renderizarBlocosSelect();
}

function renderizarBlocosSelect() {
  const selectCad = document.getElementById('cad-morador-bloco');
  const selectPortaria = document.getElementById('adm-enc-bloco-select');

  if (selectCad) {
    selectCad.innerHTML = '';
    estado.blocos.forEach(b => selectCad.innerHTML += `<option value="${b}">${b}</option>`);
  }
  if (selectPortaria) {
    selectPortaria.innerHTML = '';
    estado.blocos.forEach(b => selectPortaria.innerHTML += `<option value="${b}">${b}</option>`);
    buscarMoradorPorBlocoEApto();
  }
}

function renderizarTudo() {
  renderizarMural();
  renderizarChamadosMorador();
  renderizarEspacosSelect();
  renderizarMinhasReservas();
  renderizarEncomendasMorador();
  renderizarRegrasEDocumentos();
  renderizarAdminMoradores();
  renderizarAdminEspacos();
  renderizarAdminBaixas();
  renderizarAdminChamados();
  renderizarAdminEncomendasBaixa();
  renderizarAdminNotificacoesSelect();
  renderizarBlocosSelect();
}

function showToast(message) {
  const toastBox = document.getElementById('toast-box');
  const toastText = document.getElementById('toast-text');
  toastText.innerHTML = message;
  toastBox.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => hideToast(), 4500);
}

function hideToast() {
  document.getElementById('toast-box').classList.remove('show');
}

function renderizarMural() {
  const container = document.getElementById('mural-container');
  container.innerHTML = '';

  estado.comunicados.forEach(c => {
    let tagClass = 'tag-blue';
    if (c.tag === 'Urgente') tagClass = 'tag-rose';
    if (c.tag === 'Manutenção') tagClass = 'tag-amber';

    container.innerHTML += `
      <div class="card">
        <div class="card-title-row">
          <h3><i class="fa-solid fa-bullhorn" style="color:#2563eb;"></i> ${c.titulo}</h3>
          <span class="tag ${tagClass}">${c.tag}</span>
        </div>
        <p>${c.texto}</p>
        <div style="margin-top: 10px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 6px;">
          <span><i class="fa-solid fa-calendar-day"></i> ${c.data}</span>
          <span><i class="fa-solid fa-clock"></i> ${c.tempoRelativo}</span>
        </div>
      </div>
    `;
  });
}

function publicarAvisoMural() {
  const titulo = document.getElementById('admin-aviso-titulo').value;
  const tag = document.getElementById('admin-aviso-tag').value;
  const texto = document.getElementById('admin-aviso-msg').value;

  if (!titulo || !texto) {
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> Preencha o título e a mensagem!');
    return;
  }

  const hoje = new Date().toLocaleDateString('pt-BR');

  const novo = {
    id: Date.now(),
    titulo: titulo,
    tag: tag,
    data: `Hoje (${hoje})`,
    tempoRelativo: 'Agora mesmo',
    texto: texto
  };

  estado.comunicados.unshift(novo);
  renderizarMural();
  document.getElementById('admin-aviso-titulo').value = '';
  document.getElementById('admin-aviso-msg').value = '';
  showToast('<i class="fa-solid fa-circle-check"></i> Aviso publicado no Mural!');
}

function renderizarEspacosSelect() {
  const select = document.getElementById('reserva-espaco-select');
  select.innerHTML = '';
  estado.espacos.forEach(esp => {
    select.innerHTML += `<option value="${esp.id}">${esp.nome} (R$ ${esp.taxa.toFixed(2)})</option>`;
  });
  atualizarInfoEspaco();
}

function atualizarInfoEspaco() {
  const id = parseInt(document.getElementById('reserva-espaco-select').value);
  const espaco = estado.espacos.find(e => e.id === id);
  const box = document.getElementById('espaco-info-box');
  if (espaco) {
    box.innerHTML = `<strong>Taxa:</strong> R$ ${espaco.taxa.toFixed(2)} | <strong>Regras:</strong> ${espaco.regras}`;
  }
}

function cadastrarNovoEspaco() {
  const nome = document.getElementById('cad-espaco-nome').value;
  const taxa = parseFloat(document.getElementById('cad-espaco-taxa').value) || 0;
  const regras = document.getElementById('cad-espaco-regras').value;

  if (!nome) {
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> Digite o nome do espaço.');
    return;
  }

  const novo = {
    id: Date.now(),
    nome: nome,
    taxa: taxa,
    regras: regras || 'Sem regras específicas cadastradas.'
  };

  estado.espacos.push(novo);
  renderizarEspacosSelect();
  renderizarAdminEspacos();

  document.getElementById('cad-espaco-nome').value = '';
  document.getElementById('cad-espaco-taxa').value = '';
  document.getElementById('cad-espaco-regras').value = '';
  showToast('<i class="fa-solid fa-check"></i> Espaço cadastrado com sucesso!');
}

function renderizarAdminEspacos() {
  const lista = document.getElementById('adm-lista-espacos');
  if (!lista) return;
  lista.innerHTML = '';
  estado.espacos.forEach(e => {
    lista.innerHTML += `
      <div style="background: #f8fafc; padding: 8px; border-radius: 8px; margin-bottom: 6px; border: 1px solid #e2e8f0; font-size: 11px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong>${e.nome}</strong>
          <span class="tag tag-blue">R$ ${e.taxa.toFixed(2)}</span>
        </div>
        <div style="color: #64748b; margin-top: 2px;">Regras: ${e.regras}</div>
      </div>
    `;
  });
}

// CALENDÁRIO COM CORES E STATUS APLICADOS
function gerarCalendario() {
  const container = document.getElementById('cal-days-container');
  const title = document.getElementById('cal-header-title');
  if (!container || !title) return;

  container.innerHTML = '';

  const ano = dataCalendarioAtual.getFullYear();
  const mes = dataCalendarioAtual.getMonth();

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  title.innerText = `${nomesMeses[mes]} ${ano}`;

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const espacoIdSel = parseInt(document.getElementById('reserva-espaco-select').value);

  for (let i = 0; i < primeiroDiaSemana; i++) {
    const emptySpan = document.createElement('span');
    emptySpan.className = 'cal-day empty';
    container.appendChild(emptySpan);
  }

  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const dataDia = new Date(ano, mes, dia);
    dataDia.setHours(0, 0, 0, 0);

    const diaFmt = String(dia).padStart(2, '0');
    const mesFmt = String(mes + 1).padStart(2, '0');
    const dataStr = `${diaFmt}/${mesFmt}/${ano}`;

    const daySpan = document.createElement('span');
    daySpan.innerText = dia;
    daySpan.className = 'cal-day';

    if (dataDia.getTime() === hoje.getTime()) {
      daySpan.classList.add('today');
    }

    if (dataDia.getTime() < hoje.getTime()) {
      daySpan.classList.add('disabled');
    } else {
      const reservaExistente = estado.reservas.find(r => r.espacoId === espacoIdSel && r.data === dataStr && r.status !== 'Recusado');

      if (reservaExistente) {
        if (reservaExistente.status === 'Reservado') {
          daySpan.classList.add('reserved');
        } else if (reservaExistente.status === 'Aguardando Pagamento') {
          daySpan.classList.add('pending');
        }
      } else {
        daySpan.classList.add('free');
        
        daySpan.addEventListener('click', () => {
          document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
          daySpan.classList.add('selected');
          
          dataSelecionadaReserva = dataStr;
          document.getElementById('reserva-data-input').value = dataSelecionadaReserva;
        });
      }
    }

    if (dataSelecionadaReserva === dataStr) {
      daySpan.classList.add('selected');
    }

    container.appendChild(daySpan);
  }
}

function solicitarReserva() {
  if (!usuarioLogadoData) return;
  const espacoId = parseInt(document.getElementById('reserva-espaco-select').value);
  const espaco = estado.espacos.find(e => e.id === espacoId);
  const data = document.getElementById('reserva-data-input').value;

  if (!data) {
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> Por favor, selecione uma data válida no calendário.');
    return;
  }

  const nova = {
    id: Date.now(),
    moradorNome: usuarioLogadoData.nome,
    moradorUnidade: `${usuarioLogadoData.bloco} - Apt ${usuarioLogadoData.apto}`,
    espacoId: espacoId,
    espacoNome: espaco ? espaco.nome : 'Espaço',
    data: data,
    status: 'Aguardando Pagamento'
  };

  estado.reservas.push(nova);
  renderizarMinhasReservas();
  renderizarAdminBaixas();
  gerarCalendario();
  showToast('<i class="fa-solid fa-paper-plane"></i> Reserva solicitada! Aguardando confirmação do pagamento.');
}

function renderizarMinhasReservas() {
  const div = document.getElementById('minhas-reservas-lista');
  div.innerHTML = '';
  if (!usuarioLogadoData) return;

  const minhas = estado.reservas.filter(r => r.moradorNome === usuarioLogadoData.nome);

  if (minhas.length === 0) {
    div.innerHTML = '<p style="font-size: 11px; color: #94a3b8;">Nenhuma reserva realizada.</p>';
    return;
  }

  minhas.forEach(r => {
    let statusTag = '';
    if (r.status === 'Reservado') {
      statusTag = '<span class="tag tag-gray"><i class="fa-solid fa-circle-check"></i> Reservado</span>';
    } else if (r.status === 'Recusado') {
      statusTag = '<span class="tag tag-rose"><i class="fa-solid fa-circle-xmark"></i> Recusado</span>';
    } else {
      statusTag = '<span class="tag tag-amber"><i class="fa-solid fa-clock"></i> Aguardando Pagamento</span>';
    }

    div.innerHTML += `
      <div class="card">
        <div class="card-title-row">
          <h3><i class="fa-solid fa-calendar-day"></i> ${r.espacoNome}</h3>
          ${statusTag}
        </div>
        <p style="font-size: 11px;">Data Solicitada: <strong>${r.data}</strong></p>
      </div>
    `;
  });
}

function renderizarAdminBaixas() {
  const div = document.getElementById('adm-lista-reservas');
  div.innerHTML = '';

  if (estado.reservas.length === 0) {
    div.innerHTML = '<p style="font-size: 11px; color: #94a3b8;">Nenhuma solicitação de reserva cadastrada.</p>';
    return;
  }

  estado.reservas.forEach(r => {
    let statusTag = '';
    if (r.status === 'Reservado') {
      statusTag = '<span class="tag tag-gray"><i class="fa-solid fa-circle-check"></i> Reservado</span>';
    } else if (r.status === 'Recusado') {
      statusTag = '<span class="tag tag-rose"><i class="fa-solid fa-circle-xmark"></i> Recusado</span>';
    } else {
      statusTag = '<span class="tag tag-amber"><i class="fa-solid fa-clock"></i> Aguardando Pagamento</span>';
    }

    const card = document.createElement('div');
    card.style.cssText = 'background: #f8fafc; padding: 10px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e2e8f0; font-size: 12px;';
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px; align-items: center;">
        <span>${r.moradorNome} (${r.moradorUnidade})</span>
        ${statusTag}
      </div>
      <p style="font-size: 11px; color: #475569; margin-bottom: 6px;">Espaço: <strong>${r.espacoNome}</strong> | Data: <strong>${r.data}</strong></p>
      <div style="display: flex; gap: 4px; flex-wrap: wrap;">
        <button type="button" class="btn-primary btn-sm btn-recusar" style="background: #64748b;">
          <i class="fa-solid fa-ban"></i> Recusar
        </button>
        <button type="button" class="btn-primary btn-sm btn-aguardando" style="background: #f59e0b;">
          <i class="fa-solid fa-clock"></i> Aguardando
        </button>
        <button type="button" class="btn-primary btn-success btn-sm btn-aprovar">
          <i class="fa-solid fa-check"></i> Reservar
        </button>
      </div>
    `;

    card.querySelector('.btn-recusar').addEventListener('click', () => atualizarStatusReserva(r.id, 'Recusado'));
    card.querySelector('.btn-aguardando').addEventListener('click', () => atualizarStatusReserva(r.id, 'Aguardando Pagamento'));
    card.querySelector('.btn-aprovar').addEventListener('click', () => atualizarStatusReserva(r.id, 'Reservado'));

    div.appendChild(card);
  });
}

function atualizarStatusReserva(reservaId, novoStatus) {
  const res = estado.reservas.find(r => r.id === reservaId);
  if (res) {
    res.status = novoStatus;
    renderizarAdminBaixas();
    renderizarMinhasReservas();
    gerarCalendario();
    showToast(`<i class="fa-solid fa-receipt"></i> Status da reserva alterado para: <strong>${novoStatus}</strong>`);
  }
}

function cadastrarMorador(e) {
  e.preventDefault();
  const nome = document.getElementById('cad-morador-nome').value;
  const bloco = document.getElementById('cad-morador-bloco').value;
  const apto = document.getElementById('cad-morador-apto').value;
  const tel = document.getElementById('cad-morador-tel').value;
  const email = document.getElementById('cad-morador-email').value || 'Não informado';

  const idUnico = 'CND-' + Math.floor(1000 + Math.random() * 9000);

  const novo = {
    id: idUnico,
    nome: nome,
    bloco: bloco,
    apto: apto,
    tel: tel,
    email: email
  };

  estado.moradores.push(novo);
  renderizarAdminMoradores();
  renderizarAdminNotificacoesSelect();
  buscarMoradorPorBlocoEApto();

  document.getElementById('cad-morador-nome').value = '';
  document.getElementById('cad-morador-apto').value = '';
  document.getElementById('cad-morador-tel').value = '';
  document.getElementById('cad-morador-email').value = '';

  showToast(`<i class="fa-solid fa-user-check"></i> Morador Cadastrado com Sucesso! ID: <strong>${idUnico}</strong>`);
}

function renderizarAdminMoradores() {
  const lista = document.getElementById('adm-lista-moradores');
  lista.innerHTML = '';
  estado.moradores.forEach(m => {
    lista.innerHTML += `
      <div style="background: #f8fafc; padding: 8px; border-radius: 8px; margin-bottom: 6px; border: 1px solid #e2e8f0; font-size: 11px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong>${m.nome}</strong>
          <span class="id-badge">${m.id}</span>
        </div>
        <div style="color: #64748b; margin-top: 2px;">
          <span>${m.bloco} - Apt ${m.apto}</span> | <span>Tel: ${m.tel}</span>
        </div>
      </div>
    `;
  });
}

function abrirNovoChamado() {
  if (!usuarioLogadoData) return;
  const loc = document.getElementById('chamado-loc').value;

  if (!loc) {
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> Descreva o local/título do chamado.');
    return;
  }

  const hoje = new Date().toLocaleDateString('pt-BR');

  const novo = {
    id: Date.now(),
    titulo: loc,
    morador: `${usuarioLogadoData.nome} (${usuarioLogadoData.bloco} - Apt ${usuarioLogadoData.apto})`,
    data: `Hoje (${hoje})`,
    status: 'Aguardando',
    aprovado: true,
    step: 0
  };

  estado.chamados.unshift(novo);
  renderizarChamadosMorador();
  renderizarAdminChamados();

  document.getElementById('chamado-loc').value = '';
  document.getElementById('chamado-desc').value = '';
  showToast('<i class="fa-solid fa-paper-plane"></i> Chamado enviado ao Síndico!');
}

// RENDERIZAÇÃO DA LINHA DO TEMPO REFORMA DADOS
function renderizarChamadosMorador() {
  const container = document.getElementById('chamados-lista-morador');
  container.innerHTML = '';

  estado.chamados.forEach(c => {
    const isPurple = c.step >= 1 ? 'active' : '';
    const isOrange = c.step >= 2 ? 'active' : '';
    const isGreen = c.step >= 3 ? 'active' : '';

    let progressWidth = '0%';
    let progressColor = '#cbd5e1';
    if (c.step === 1) { progressWidth = '35%'; progressColor = '#8b5cf6'; }
    if (c.step === 2) { progressWidth = '68%'; progressColor = '#f59e0b'; }
    if (c.step === 3) { progressWidth = '100%'; progressColor = '#10b981'; }

    let tagClass = 'tag-gray';
    if (c.step === 1) tagClass = 'tag-purple';
    if (c.step === 2) tagClass = 'tag-amber';
    if (c.step === 3) tagClass = 'tag-green';
    if (c.status.includes('Recusado')) tagClass = 'tag-rose';

    container.innerHTML += `
      <div class="card">
        <div class="card-title-row">
          <h3><i class="fa-solid fa-wrench"></i> ${c.titulo}</h3>
          <span class="tag ${tagClass}">${c.status}</span>
        </div>
        <p style="font-size: 10px; color: #94a3b8;">Aberto em: ${c.data}</p>

        <!-- LINHA DO TEMPO VISUAL (STATUS) -->
        <div class="status-timeline-wrapper">
          <div class="status-timeline">
            <div class="status-progress-bar" style="width: ${progressWidth}; background-color: ${progressColor};"></div>
            
            <div class="timeline-step step-purple ${isPurple}">
              <div class="node-circle"><i class="fa-solid fa-check"></i></div>
              <span class="step-text">Aceito</span>
            </div>
            
            <div class="timeline-step step-orange ${isOrange}">
              <div class="node-circle"><i class="fa-solid fa-wrench"></i></div>
              <span class="step-text">Manutenção</span>
            </div>
            
            <div class="timeline-step step-green ${isGreen}">
              <div class="node-circle"><i class="fa-solid fa-flag-checkered"></i></div>
              <span class="step-text">Concluído</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

function renderizarAdminChamados() {
  const container = document.getElementById('adm-lista-chamados');
  container.innerHTML = '';

  estado.chamados.forEach(c => {
    const card = document.createElement('div');
    card.style.cssText = 'background: #f8fafc; padding: 10px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e2e8f0; font-size: 12px;';
    card.innerHTML = `
      <strong>${c.titulo}</strong>
      <p style="font-size: 11px; color: #64748b;">${c.morador}</p>
      <div style="margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap;">
        <button type="button" class="btn-primary btn-purple btn-sm btn-aceitar">
          <i class="fa-solid fa-thumbs-up"></i> Aceitar (Roxo)
        </button>
        <button type="button" class="btn-primary btn-warning btn-sm btn-manutencao">
          <i class="fa-solid fa-wrench"></i> Manutenção (Laranja)
        </button>
        <button type="button" class="btn-primary btn-success btn-sm btn-concluir">
          <i class="fa-solid fa-check"></i> Concluir (Verde)
        </button>
        <button type="button" class="btn-primary btn-danger btn-sm btn-recusar">
          <i class="fa-solid fa-xmark"></i> Recusar
        </button>
      </div>
    `;

    card.querySelector('.btn-aceitar').addEventListener('click', () => atualizarStatusChamado(c.id, 'Aceito', 1));
    card.querySelector('.btn-manutencao').addEventListener('click', () => atualizarStatusChamado(c.id, 'Manutenção', 2));
    card.querySelector('.btn-concluir').addEventListener('click', () => atualizarStatusChamado(c.id, 'Concluído', 3));
    card.querySelector('.btn-recusar').addEventListener('click', () => recusarChamado(c.id));

    container.appendChild(card);
  });
}

function atualizarStatusChamado(id, statusTxt, stepNum) {
  const c = estado.chamados.find(ch => ch.id === id);
  if (c) {
    c.status = statusTxt;
    c.aprovado = true;
    c.step = stepNum;
    renderizarAdminChamados();
    renderizarChamadosMorador();
    showToast(`<i class="fa-solid fa-wrench"></i> Status atualizado para: <strong>${statusTxt}</strong>`);
  }
}

function recusarChamado(id) {
  const c = estado.chamados.find(ch => ch.id === id);
  if (c) {
    c.status = 'Recusado pelo Síndico';
    c.aprovado = false;
    c.step = 0;
    renderizarAdminChamados();
    renderizarChamadosMorador();
    showToast('<i class="fa-solid fa-circle-xmark"></i> Chamado recusado.');
  }
}

function renderizarRegrasEDocumentos() {
  const regDiv = document.getElementById('regras-lista');
  regDiv.innerHTML = '';
  estado.regras.forEach((r, idx) => {
    regDiv.innerHTML += `
      <div style="font-size: 12px; margin-bottom: 6px; padding: 6px; background: #f8fafc; border-radius: 6px; display: flex; gap: 8px;">
        <strong style="color: #2563eb;">#${idx+1}</strong> <span>${r}</span>
      </div>
    `;
  });

  const docDiv = document.getElementById('documentos-lista');
  docDiv.innerHTML = '';
  estado.documentos.forEach(d => {
    const card = document.createElement('div');
    card.style.cssText = 'font-size: 12px; padding: 8px; background: #f8fafc; border-radius: 6px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e2e8f0;';
    card.innerHTML = `
      <div>
        <i class="fa-solid fa-file-pdf" style="color: #ef4444; font-size: 16px;"></i>
        <strong style="margin-left: 6px;">${d.titulo}</strong>
        <div style="font-size: 10px; color: #94a3b8; margin-left: 22px;">${d.tamanho}</div>
      </div>
      <button type="button" class="btn-primary btn-sm btn-baixar">
        <i class="fa-solid fa-download"></i> Baixar
      </button>
    `;
    card.querySelector('.btn-baixar').addEventListener('click', () => {
      showToast('<i class="fa-solid fa-download"></i> Baixando documento PDF...');
    });
    docDiv.appendChild(card);
  });
}

function adicionarRegra() {
  const txt = document.getElementById('adm-regra-texto').value;
  if (txt) {
    estado.regras.push(txt);
    renderizarRegrasEDocumentos();
    document.getElementById('adm-regra-texto').value = '';
    showToast('<i class="fa-solid fa-check"></i> Regra adicionada!');
  }
}

function anexarDocumento() {
  const titulo = document.getElementById('adm-doc-titulo').value;
  if (titulo) {
    estado.documentos.push({ id: Date.now(), titulo: titulo, tamanho: '1.5 MB' });
    renderizarRegrasEDocumentos();
    document.getElementById('adm-doc-titulo').value = '';
    showToast('<i class="fa-solid fa-file-pdf"></i> Documento publicado aos moradores!');
  }
}

function buscarMoradorPorBlocoEApto() {
  const blocoSelect = document.getElementById('adm-enc-bloco-select');
  const aptoInput = document.getElementById('adm-enc-apto-input');
  const moradorFoundInput = document.getElementById('adm-enc-morador-encontrado');

  if (!blocoSelect || !aptoInput || !moradorFoundInput) return;

  const blocoVal = blocoSelect.value;
  const aptoVal = aptoInput.value.trim();

  const morador = estado.moradores.find(m => 
    m.bloco.toLowerCase() === blocoVal.toLowerCase() && 
    m.apto.toLowerCase() === aptoVal.toLowerCase()
  );

  if (morador) {
    moradorFoundInput.value = `${morador.nome} (${morador.id})`;
    moradorFoundInput.style.color = '#059669';
    moradorFoundInput.dataset.moradorId = morador.id;
  } else {
    moradorFoundInput.value = aptoVal ? 'Morador Não Encontrado!' : 'Informe Bloco e Apto acima...';
    moradorFoundInput.style.color = aptoVal ? '#dc2626' : '#64748b';
    moradorFoundInput.dataset.moradorId = '';
  }
}

function darEntradaEncomenda() {
  const moradorFoundInput = document.getElementById('adm-enc-morador-encontrado');
  const moradorId = moradorFoundInput ? moradorFoundInput.dataset.moradorId : null;
  const desc = document.getElementById('adm-enc-desc').value.trim();

  if (!moradorId) {
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> Encontre um morador válido inserindo Bloco e Apto.');
    return;
  }
  if (!desc) {
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> Informe a descrição do pacote.');
    return;
  }

  const morador = estado.moradores.find(m => m.id === moradorId);

  const nova = {
    id: Date.now(),
    moradorId: morador.id,
    destinatario: morador.nome,
    unidade: `${morador.bloco} - Apt ${morador.apto}`,
    pacote: desc,
    data: 'Hoje às ' + new Date().toLocaleTimeString().slice(0, 5),
    retirado: false,
    cadastradoEm: Date.now()
  };

  estado.encomendas.unshift(nova);
  renderizarEncomendasMorador();
  renderizarAdminEncomendasBaixa();
  atualizarBadgeNotificacoes();

  dispararNotificacaoParaMorador(morador, `Nova encomenda cadastrada: ${desc}`);

  document.getElementById('adm-enc-desc').value = '';
  document.getElementById('adm-enc-apto-input').value = '';
  buscarMoradorPorBlocoEApto();

  showToast(`<i class="fa-solid fa-box"></i> Encomenda registrada para ${morador.nome}! Notificação enviada.`);
}

function renderizarAdminEncomendasBaixa() {
  const container = document.getElementById('adm-lista-encomendas-baixa');
  if (!container) return;
  container.innerHTML = '';

  const pendentes = estado.encomendas.filter(e => !e.retirado);

  if (pendentes.length === 0) {
    container.innerHTML = '<p style="font-size: 11px; color: #94a3b8;">Nenhum pacote pendente na portaria.</p>';
    return;
  }

  pendentes.forEach(e => {
    const card = document.createElement('div');
    card.style.cssText = 'background: #f8fafc; padding: 8px; border-radius: 8px; margin-bottom: 6px; border: 1px solid #e2e8f0; font-size: 11px; display: flex; justify-content: space-between; align-items: center;';
    card.innerHTML = `
      <div>
        <strong>${e.pacote}</strong>
        <div style="color: #64748b; font-size: 10px;">${e.destinatario} (${e.unidade})</div>
      </div>
      <button type="button" class="btn-primary btn-success btn-sm btn-dar-baixa">
        <i class="fa-solid fa-check"></i> Dar Baixa / Retirado
      </button>
    `;

    card.querySelector('.btn-dar-baixa').addEventListener('click', () => darBaixaEncomenda(e.id));
    container.appendChild(card);
  });
}

function darBaixaEncomenda(id) {
  const enc = estado.encomendas.find(e => e.id === id);
  if (enc) {
    enc.retirado = true;
    renderizarEncomendasMorador();
    renderizarAdminEncomendasBaixa();
    atualizarBadgeNotificacoes();
    showToast('<i class="fa-solid fa-circle-check"></i> Encomenda marcada como RETIRADA.');
  }
}

function renderizarEncomendasMorador() {
  const div = document.getElementById('encomendas-morador-lista');
  div.innerHTML = '';

  if (!usuarioLogadoData || perfilAtual === 'sindico') {
    div.innerHTML = '<p style="font-size: 11px; color: #94a3b8;">Nenhuma encomenda disponível.</p>';
    return;
  }

  const minhas = estado.encomendas.filter(e => e.moradorId === usuarioLogadoData.id && !e.retirado);

  if (minhas.length === 0) {
    div.innerHTML = '<p style="font-size: 11px; color: #94a3b8;">Nenhuma encomenda pendente no momento.</p>';
    return;
  }

  minhas.forEach(e => {
    div.innerHTML += `
      <div class="card">
        <div class="card-title-row">
          <h3><i class="fa-solid fa-box" style="color: #f59e0b;"></i> ${e.pacote}</h3>
          <span class="tag tag-amber"><i class="fa-solid fa-clock"></i> Pendente</span>
        </div>
        <p style="font-size: 11px;">Destinatário: <strong>${e.destinatario}</strong></p>
        <p style="font-size: 11px;">Unidade: <strong>${e.unidade}</strong></p>
        <p style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Chegada: ${e.data}</p>
      </div>
    `;
  });
}

function renderizarAdminNotificacoesSelect() {
  const select = document.getElementById('adm-notif-destinatario');
  if (!select) return;
  select.innerHTML = '';
  estado.moradores.forEach(m => {
    select.innerHTML += `<option value="${m.id}">${m.nome} (${m.bloco} - Apt ${m.apto})</option>`;
  });
}

function dispararNotificacaoAdmin() {
  const moradorId = document.getElementById('adm-notif-destinatario').value;
  const msg = document.getElementById('adm-notif-msg').value.trim();

  if (!msg) {
    showToast('<i class="fa-solid fa-triangle-exclamation"></i> Escreva a mensagem da notificação.');
    return;
  }

  const morador = estado.moradores.find(m => m.id === moradorId);
  if (morador) {
    dispararNotificacaoParaMorador(morador, msg);
    document.getElementById('adm-notif-msg').value = '';
    showToast(`<i class="fa-solid fa-paper-plane"></i> Notificação disparada com sucesso para <strong>${morador.nome}</strong>!`);
  }
}

function dispararNotificacaoParaMorador(morador, mensagem) {
  if (usuarioLogadoData && usuarioLogadoData.id === morador.id) {
    showToast(`<i class="fa-solid fa-bell" style="color:#f59e0b;"></i> <strong>[Notificação para ${morador.nome}]</strong>: ${mensagem}`);
    atualizarBadgeNotificacoes();
  }
}

function iniciarLembreteAutomatico10Horas() {
  const DEZ_HORAS_MS = 10 * 60 * 60 * 1000; 

  setInterval(() => {
    const pendentes = estado.encomendas.filter(e => !e.retirado);
    pendentes.forEach(e => {
      const morador = estado.moradores.find(m => m.id === e.moradorId);
      if (morador) {
        dispararNotificacaoParaMorador(morador, `Lembrete: Você possui o pacote "${e.pacote}" aguardando retirada na portaria.`);
      }
    });
  }, DEZ_HORAS_MS);
}

function verNotificacoesHeader() {
  if (!usuarioLogadoData) return;
  const pendentes = estado.encomendas.filter(e => e.moradorId === usuarioLogadoData.id && !e.retirado);
  if (pendentes.length > 0) {
    showToast(`<i class="fa-solid fa-box"></i> Você tem <strong>${pendentes.length}</strong> pacote(s) aguardando na portaria!`);
  } else {
    showToast('<i class="fa-solid fa-circle-check"></i> Você não possui notificações ou pendências.');
  }
}

function atualizarBadgeNotificacoes() {
  const badge = document.getElementById('notif-count');
  if (!badge) return;

  if (usuarioLogadoData && perfilAtual === 'morador') {
    const qtd = estado.encomendas.filter(e => e.moradorId === usuarioLogadoData.id && !e.retirado).length;
    badge.innerText = qtd;
    badge.style.display = qtd > 0 ? 'inline-block' : 'none';
  } else {
    badge.innerText = '0';
    badge.style.display = 'none';
  }
}

function mudarTabAdmin(secao) {
  document.querySelectorAll('.adm-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('#screen-admin .tab-btn').forEach(b => b.classList.remove('active'));

  const secElement = document.getElementById('adm-sec-' + secao);
  const tabElement = document.getElementById('adm-tab-' + secao);

  if (secElement) secElement.style.display = 'block';
  if (tabElement) tabElement.classList.add('active');
}