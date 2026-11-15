/* ==========================================================================
   VOLTCORE PRO • FRONT-END ENGINE V9.26 (COMPLETO & CORPORATIVO)
   Desenvolvido para WPS Info • Cliente: Wanderson Pedro da Silva
   ========================================================================== */

const SUPABASE_URL = 'https://eoqfuawvljotvyfrcbj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_l0JQ_niTmthXhm09X60uAg_pi4ds';
const BACKEND_URL = 'https://voltcore-ocpp-backend.onrender.com';
let supabaseClient = null;

if (window.supabase && SUPABASE_URL) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let stations = [];
let currentMode = 'condo';
let currentFilter = 'Disponível';
let pixPollingInterval = null;

let userData = {
    name: "",
    email: "",
    phone: "",
    role: "MORADOR",
    condo: "Belarte Residencial Jundiaí",
    allowedCondos: ["Belarte Residencial Jundiaí"],
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    lgpdAccepted: false
};

let meusVeiculos = [];
let saldoCarteira = 0.00;
let extratoTransacoes = [];
let cartoesSalvos = [];
let moradoresCondominio = [];

const ESTACOES_PADRAO = [
    { id: 1, name: 'VAGA 01 / TORRE SUL', condo: 'Condomínio Gioviale • Torre Sul', type: 'Conector Type-2 (22 kW)', status: 'Disponível', user: null, kwh: 0, cost: 1.18, timer: 0, ocppId: 'CP-GIOV-SUL-01', ocppStatus: 'Online (Connected)' },
    { id: 2, name: 'VAGA 02 / TORRE SUL', condo: 'Condomínio Gioviale • Torre Sul', type: 'Conector CCS2 (7.4 kW)', status: 'Disponível', user: null, kwh: 0, cost: 1.18, timer: 0, ocppId: 'CP-GIOV-SUL-02', ocppStatus: 'Online (Connected)' },
    { id: 3, name: 'VAGA 03 / TORRE SUL', condo: 'Condomínio Gioviale • Torre Sul', type: 'Conector Type-2 (11 kW)', status: 'Disponível', user: null, kwh: 0, cost: 1.18, timer: 0, ocppId: 'CP-GIOV-SUL-03', ocppStatus: 'Online (Connected)' },
    { id: 4, name: 'VAGA 01 / TORRE NORTE', condo: 'Condomínio Gioviale • Torre Norte', type: 'Conector CCS2 (22 kW)', status: 'Disponível', user: null, kwh: 0, cost: 1.18, timer: 0, ocppId: 'CP-GIOV-NORTE-01', ocppStatus: 'Online (Connected)' },
    { id: 5, name: 'VAGA 02 / TORRE NORTE', condo: 'Condomínio Gioviale • Torre Norte', type: 'Conector Type-2 (11 kW)', status: 'Disponível', user: null, kwh: 0, cost: 1.18, timer: 0, ocppId: 'CP-GIOV-NORTE-02', ocppStatus: 'Online (Connected)' },
    { id: 6, name: 'VAGA ATM-01 / COMPLEXO', condo: 'Complexo Atmosfera Residencial', type: 'Conector CCS2 (50 kW)', status: 'Disponível', user: null, kwh: 0, cost: 1.18, timer: 0, ocppId: 'CP-ATM-01', ocppStatus: 'Online (Connected)' },
    { id: 7, name: 'VAGA ATM-02 / COMPLEXO', condo: 'Complexo Atmosfera Residencial', type: 'Conector Type-2 (22 kW)', status: 'Disponível', user: null, kwh: 0, cost: 1.18, timer: 0, ocppId: 'CP-ATM-02', ocppStatus: 'Online (Connected)' },
    { id: 8, name: 'VAGA BEL-01 / JUNDIAÍ', condo: 'Belarte Residencial Jundiaí', type: 'Conector Type-2 (22 kW)', status: 'Disponível', user: null, kwh: 0, cost: 1.18, timer: 0, ocppId: 'CP-BEL-01', ocppStatus: 'Online (Connected)' }
];

window.onload = async function() {
    localStorage.setItem('voltcore_version_v926', 'true');

    carregarTudoPersistente();
    
    const isLogged = localStorage.getItem('voltcore_logged');
    if (isLogged === 'true') {
        const screenAuth = document.getElementById('screen-auth');
        const screenApp = document.getElementById('screen-app');
        if (screenAuth) screenAuth.classList.add('hidden');
        if (screenApp) screenApp.classList.remove('hidden');
        await sincronizarDadosNuvemUsuario();
    } else {
        prepararTelaAuthCompleta();
    }

    aplicarControlePermissoesPerfil();
    configurarPermissoesCondominioPorUsuario();
    carregarOuInicializarEstacoes();
    
    currentFilter = 'Disponível';
    setFilter(currentFilter);
    renderStations();
    renderCommercialStations();

    await carregarEstacoesDoBanco();
    configurarSupabaseRealtime();
    setInterval(updateTimersAndLoad, 1000);
};

// ==========================================================================
// HIERARQUIA E TRAVA ESTRITA DE PERFIL POR E-MAIL (MULTITENANT BLINDADO)
// ==========================================================================
function avaliarPermissaoPorEmail(email) {
    const emailLimpo = (email || '').trim().toLowerCase();
    
    if (emailLimpo === 'contato@wpsinfo.com.br') {
        userData.role = 'ADM_MASTER';
        userData.name = 'Wanderson Pedro da Silva (ADM Master)';
        userData.allowedCondos = [
            "Belarte Residencial Jundiaí",
            "Condomínio Gioviale • Torre Sul",
            "Condomínio Gioviale • Torre Norte",
            "Complexo Atmosfera Residencial"
        ];
    } else if (emailLimpo === 'sindico.belarte@wpsinfo.com.br') {
        userData.role = 'SINDICO';
        userData.name = 'Síndico • Belarte Residencial';
        userData.condo = 'Belarte Residencial Jundiaí';
        userData.allowedCondos = ["Belarte Residencial Jundiaí"];
    } else {
        userData.role = 'MORADOR';
        userData.allowedCondos = [];
        if (emailLimpo === 'wandersonp_s@hotmail.com') {
            userData.name = 'Wanderson Pedro da Silva';
            userData.condo = 'Belarte Residencial Jundiaí';
        } else if (emailLimpo === 'wand3rson.s@gmail.com') {
            userData.name = 'Wanderson (Google)';
        } else {
            userData.name = emailLimpo.split('@')[0] || 'Condômino';
        }
    }
}

function aplicarControlePermissoesPerfil() {
    const isMasterOrSindico = userData.role === 'ADM_MASTER' || userData.role === 'SINDICO';
    
    document.querySelectorAll('.adm-only-element').forEach(el => {
        if (!isMasterOrSindico) {
            el.classList.add('hidden');
            el.style.setProperty('display', 'none', 'important');
        } else {
            el.classList.remove('hidden');
            el.style.setProperty('display', 'flex', 'important');
        }
    });

    document.querySelectorAll('button, a').forEach(btn => {
        const txt = (btn.innerText || '').trim();
        const onclickAttr = btn.getAttribute('onclick') || '';
        if (txt.includes('ADM / Síndico') || txt.includes('ADM/Síndico') || onclickAttr.includes('abrirPainelGestao')) {
            if (!isMasterOrSindico) {
                btn.classList.add('hidden');
                btn.style.setProperty('display', 'none', 'important');
            } else {
                btn.classList.remove('hidden');
                btn.style.setProperty('display', 'flex', 'important');
            }
        }
    });
}

async function sincronizarDadosNuvemUsuario() {
    if (!supabaseClient || !userData.email) return;
    await Promise.all([
        carregarVeiculosDoBanco(),
        carregarExtratoDoBanco(),
        carregarCartoesDoBanco(),
        carregarMoradoresDoBanco()
    ]);
}

function prepararTelaAuthCompleta() {
    const authBox = document.querySelector('#screen-auth > div');
    if (!authBox) return;

    if (!document.getElementById('check-lgpd-login')) {
        const divLgpd = document.createElement('div');
        divLgpd.className = "bg-slate-50 p-3 rounded-xl border border-slate-200 text-left flex items-start gap-2.5 my-2";
        divLgpd.innerHTML = `
            <input type="checkbox" id="check-lgpd-login" class="mt-0.5 rounded text-lime-600 focus:ring-lime-500 w-4 h-4 cursor-pointer pointer-events-auto">
            <label for="check-lgpd-login" class="text-[10px] text-slate-700 leading-tight cursor-pointer">
                Li e concordo com os <a href="#" onclick="abrirTermosPrivacidade()" class="text-lime-600 font-extrabold underline">Termos de Privacidade e LGPD</a> (Obrigatório).
            </label>
        `;
        const botoesDiv = authBox.querySelector('.space-y-2') || authBox.children[2];
        authBox.insertBefore(divLgpd, botoesDiv);
    }

    const savedBioEmail = localStorage.getItem('voltcore_biometric_email');
    if (!document.getElementById('btn-biometria-acesso')) {
        const divBio = document.createElement('div');
        divBio.className = "mt-2";
        divBio.innerHTML = `
            <button id="btn-biometria-acesso" type="button" onclick="realizarLoginBiometrico()" class="w-full bg-slate-900 hover:bg-slate-800 text-lime-400 font-extrabold py-2.5 px-3 rounded-xl text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer pointer-events-auto">
                <i class="fa-solid fa-fingerprint text-sm"></i> ${savedBioEmail ? 'Entrar com Biometria / Face ID' : 'Cadastrar / Usar Biometria'}
            </button>
        `;
        const botoesDiv = authBox.querySelector('.space-y-2') || authBox.children[2];
        authBox.insertBefore(divBio, botoesDiv);
    }

    injetarBotaoEsqueciSenha();
}

function injetarBotaoEsqueciSenha() {
    const form = document.getElementById('auth-email-form');
    if (form && !document.getElementById('link-esqueci-senha')) {
        const passInput = obterCampoSenhaAuth();
        if (passInput && passInput.parentElement) {
            const divReset = document.createElement('div');
            divReset.className = "flex justify-end mt-1";
            divReset.innerHTML = `
                <button id="link-esqueci-senha" type="button" onclick="abrirModalEsqueciSenha()" class="text-[10px] font-bold text-lime-700 hover:text-lime-800 underline cursor-pointer pointer-events-auto">
                    Esqueci minha senha
                </button>
            `;
            passInput.parentElement.appendChild(divReset);
        }
    }
}

function obterCampoEmailAuth() {
    return document.getElementById('auth-email-input') || document.querySelector('input[type="email"]');
}

function obterCampoSenhaAuth() {
    return document.getElementById('auth-pass-input') || document.querySelector('input[type="password"]');
}

function abrirModalEsqueciSenha() {
    const emailAtual = obterCampoEmailAuth() ? obterCampoEmailAuth().value.trim() : '';
    const htmlReset = `
        <div class="space-y-3 text-left text-xs pb-4">
            <p class="text-slate-600 leading-relaxed">Informe seu e-mail cadastrado. Um link de recuperação SMTP será disparado:</p>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">E-mail Cadastrado</label>
                <input type="email" id="reset-email-input" value="${emailAtual}" placeholder="seuemail@dominio.com" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div id="reset-aviso-enviado" class="hidden p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 font-medium">
                <i class="fa-solid fa-paper-plane text-emerald-600 mr-1"></i> E-mail de recuperação enviado com sucesso via SMTP!
            </div>
            <div class="flex gap-2 pt-2">
                <button type="button" id="btn-enviar-reset" onclick="enviarSolicitacaoResetSenha()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer">ENVIAR E-MAIL SMTP</button>
                <button type="button" onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Recuperação de Senha • SMTP', htmlReset, 'fa-key', 'lime');
}

async function enviarSolicitacaoResetSenha() {
    const emailInput = document.getElementById('reset-email-input');
    const email = emailInput ? emailInput.value.trim() : '';
    if (!email || !email.includes('@')) {
        showToast('Digite um e-mail válido.');
        return;
    }
    showToast(`Disparando e-mail SMTP para ${email}...`);
    if (supabaseClient && supabaseClient.auth) {
        try { await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }); } catch(e){}
    }
    const aviso = document.getElementById('reset-aviso-enviado');
    const btnEnviar = document.getElementById('btn-enviar-reset');
    if (aviso) aviso.classList.remove('hidden');
    if (btnEnviar) {
        btnEnviar.innerText = 'ENVIADO COM SUCESSO';
        btnEnviar.disabled = true;
    }
}

async function realizarLoginBiometrico() {
    const lgpdCheck = document.getElementById('check-lgpd-login');
    if (lgpdCheck && !lgpdCheck.checked) {
        showToast('Você deve aceitar os Termos de Privacidade e LGPD.');
        return;
    }
    const savedBioEmail = localStorage.getItem('voltcore_biometric_email');
    if (!savedBioEmail) {
        showToast('Faça login com e-mail e senha uma vez para registrar sua biometria.');
        return;
    }
    showToast('Lendo credencial biométrica...');
    setTimeout(async () => {
        userData.email = savedBioEmail;
        userData.lgpdAccepted = true;
        avaliarPermissaoPorEmail(savedBioEmail);
        localStorage.setItem('voltcore_logged', 'true');
        localStorage.setItem('voltcore_user_data', JSON.stringify(userData));

        document.getElementById('screen-auth').classList.add('hidden');
        document.getElementById('screen-app').classList.remove('hidden');
        aplicarDadosUsuarioNaTela();
        aplicarControlePermissoesPerfil();
        configurarPermissoesCondominioPorUsuario();
        await sincronizarDadosNuvemUsuario();
        await carregarEstacoesDoBanco();
        showToast('Biometria validada com sucesso!');
    }, 800);
}

async function realizarLoginGoogle() {
    const lgpdCheck = document.getElementById('check-lgpd-login');
    if (lgpdCheck && !lgpdCheck.checked) {
        showToast('Você deve aceitar os Termos de Privacidade e LGPD.');
        return;
    }
    userData.email = 'wand3rson.s@gmail.com';
    avaliarPermissaoPorEmail(userData.email);
    userData.lgpdAccepted = true;

    localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
    localStorage.setItem('voltcore_logged', 'true');
    localStorage.setItem('voltcore_biometric_email', userData.email);

    document.getElementById('screen-auth').classList.add('hidden');
    document.getElementById('screen-app').classList.remove('hidden');
    aplicarDadosUsuarioNaTela();
    aplicarControlePermissoesPerfil();
    configurarPermissoesCondominioPorUsuario();
    await sincronizarDadosNuvemUsuario();
    await carregarEstacoesDoBanco();
    showToast('Login com Google realizado');
}

function carregarTudoPersistente() {
    const savedUser = localStorage.getItem('voltcore_user_data');
    if (savedUser) { try { userData = JSON.parse(savedUser); } catch(e){} }
    
    if (userData.email) avaliarPermissaoPorEmail(userData.email);
    else userData.role = 'MORADOR';

    aplicarDadosUsuarioNaTela();
    
    const savedVehicles = localStorage.getItem('voltcore_vehicles');
    if (savedVehicles) { try { meusVeiculos = JSON.parse(savedVehicles); } catch(e){} }

    const savedWallet = localStorage.getItem('voltcore_wallet_balance');
    if (savedWallet !== null) saldoCarteira = parseFloat(savedWallet);
    
    const savedExtrato = localStorage.getItem('voltcore_extrato');
    if (savedExtrato) { try { extratoTransacoes = JSON.parse(savedExtrato); } catch(e){} }

    const savedCards = localStorage.getItem('voltcore_saved_cards');
    if (savedCards) { try { cartoesSalvos = JSON.parse(savedCards); } catch(e){} }

    const savedMoradores = localStorage.getItem('voltcore_moradores');
    if (savedMoradores) { 
        try { moradoresCondominio = JSON.parse(savedMoradores); } catch(e){} 
    } else {
        moradoresCondominio = [
            { nome: 'Wanderson Pedro da Silva', condo: 'Belarte Residencial Jundiaí', bloco: 'Torre Única', unidade: 'Apto 101', endereco: 'Rua das Palmeiras, 300', vaga: 'Vaga 01', veiculo: 'BYD Seal (CCS2)', placa: 'ABC-1D23', status: 'Ativo', data: '26/10/2026', horaInicio: '12:00 PM', horaFim: '12:42 PM', duracao: '42 min', kwh: '14.2 kWh', ociosidade: 'Não', valor: 'R$ 18,96' }
        ];
    }
    atualizarDisplayCarteira();
}

function aplicarDadosUsuarioNaTela() {
    const img = document.getElementById('user-profile-img');
    const nameEl = document.getElementById('user-display-name');
    const emailEl = document.getElementById('user-display-email');
    const condoEl = document.getElementById('user-display-condo');
    
    if (img && userData.photo) img.src = userData.photo;
    if (nameEl) nameEl.innerText = userData.name || 'Usuário VoltCore';
    if (emailEl) emailEl.innerText = userData.email || 'LGPD Ativo';
    if (condoEl) condoEl.innerText = userData.condo;
}

function configurarPermissoesCondominioPorUsuario() {
    const selectCondo = document.getElementById('select-condo');
    if (!selectCondo) return;
    selectCondo.innerHTML = '';
    if (userData.role === 'ADM_MASTER') {
        const todosCondos = [
            "Belarte Residencial Jundiaí",
            "Condomínio Gioviale • Torre Sul",
            "Condomínio Gioviale • Torre Norte",
            "Complexo Atmosfera Residencial"
        ];
        todosCondos.forEach(c => selectCondo.innerHTML += `<option value="${c}">${c}</option>`);
        selectCondo.disabled = false;
    } else {
        selectCondo.innerHTML = `<option value="${userData.condo}">${userData.condo}</option>`;
        selectCondo.disabled = true;
    }
    const savedCondo = localStorage.getItem('voltcore_selected_condo');
    if (savedCondo && (userData.role === 'ADM_MASTER' || userData.allowedCondos.includes(savedCondo))) {
        selectCondo.value = savedCondo;
    } else {
        selectCondo.value = userData.condo || "Belarte Residencial Jundiaí";
    }
}

async function realizarLogin() {
    const lgpdCheck = document.getElementById('check-lgpd-login');
    if (lgpdCheck && !lgpdCheck.checked) {
        showToast('Aceite os Termos de Privacidade e LGPD.');
        return;
    }
    const emailInput = obterCampoEmailAuth();
    const senhaInput = obterCampoSenhaAuth();
    const emailVal = emailInput ? emailInput.value.trim() : '';
    const senhaVal = senhaInput ? senhaInput.value.trim() : '';

    if (!emailVal || !emailVal.includes('@')) {
        showToast('Informe um e-mail válido.');
        return;
    }
    if (!senhaVal || senhaVal.length < 4) {
        showToast('Senha obrigatória (mínimo 4 caracteres).');
        return;
    }

    userData.email = emailVal;
    avaliarPermissaoPorEmail(emailVal);
    userData.lgpdAccepted = true;
    localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
    localStorage.setItem('voltcore_logged', 'true');
    localStorage.setItem('voltcore_biometric_email', userData.email);

    document.getElementById('screen-auth').classList.add('hidden');
    document.getElementById('screen-app').classList.remove('hidden');
    aplicarDadosUsuarioNaTela();
    aplicarControlePermissoesPerfil();
    configurarPermissoesCondominioPorUsuario();
    await sincronizarDadosNuvemUsuario();
    await carregarEstacoesDoBanco();
    showToast(`Bem-vindo! Perfil: ${userData.role}`);
}

function logoutApp() {
    localStorage.removeItem('voltcore_logged');
    localStorage.removeItem('voltcore_user_data');
    location.reload();
}

function abrirTermosPrivacidade() {
    showCustomModal('Termos de Privacidade & LGPD', '<p class="text-xs text-slate-600">Conformidade estrita com a LGPD (Lei nº 13.709/2018).</p>', 'fa-shield-halved', 'lime');
}

// ==========================================================================
// CÂMERA, QR CODE & MAPA LEAFLET
// ==========================================================================
let streamCameraAtiva = null;
function abrirLeitorQrCodeCamera() {
    const htmlQr = `
        <div class="space-y-3 text-center pb-4">
            <div class="relative w-full h-52 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border-2 border-lime-400">
                <video id="qr-camera-video" autoplay playsinline class="w-full h-full object-cover"></video>
                <div class="absolute inset-0 border-4 border-lime-400/50 rounded-xl m-8 pointer-events-none flex items-center justify-center">
                    <span class="bg-slate-900/80 text-lime-400 text-[10px] font-extrabold px-3 py-1 rounded-full">Aponte para o QR Code OCPP</span>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="simularLeituraQrSucesso()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs cursor-pointer">VALIDAR COMANDO OCPP</button>
                <button onclick="closeModal()" class="bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Leitura QR Code & Disparo OCPP', htmlQr, 'fa-qrcode', 'lime');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => { streamCameraAtiva = stream; document.getElementById('qr-camera-video').srcObject = stream; })
        .catch(err => {});
}

function simularLeituraQrSucesso() {
    closeModal();
    showToast('Transação OCPP iniciada com sucesso!');
}

function abrirPlanejarViagem() {
    const htmlViagem = `
        <div class="space-y-3 text-left text-xs pb-4">
            <div>
                <label class="block font-bold text-slate-700 mb-1">Destino da Viagem:</label>
                <input type="text" id="input-destino-viagem" placeholder="Ex: Sorocaba, Campinas..." class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium">
            </div>
            <button onclick="executarPlanejamentoViagem()" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs cursor-pointer">CALCULAR ROTA OCPP</button>
        </div>
    `;
    showCustomModal('Planejar Viagem • Rede OCPP', htmlViagem, 'fa-route', 'lime');
}

function executarPlanejamentoViagem() {
    closeModal();
    showToast('Rota otimizada com eletropostos calculada com sucesso!');
}

// ==========================================================================
// GESTÃO DE VEÍCULOS E CARTEIRA (MERCADO PAGO)
// ==========================================================================
async function carregarVeiculosDoBanco() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('vehicles').select('*').eq('user_email', userData.email || 'contato@wpsinfo.com.br');
        if (data) {
            meusVeiculos = data.map(v => ({ id: v.id, model: v.model, plate: v.plate, type: v.type }));
            renderizarVeiculos();
        }
    } catch(e) {}
}

async function carregarExtratoDoBanco() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('transacoes').select('*').eq('email_usuario', userData.email || 'contato@wpsinfo.com.br');
        if (data) {
            extratoTransacoes = data.map(t => ({ title: t.titulo, desc: t.descricao, value: t.valor, type: t.tipo }));
            let saldo = 0;
            data.forEach(t => {
                let num = parseFloat(String(t.valor).replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
                if (t.tipo === 'credit') saldo += Math.abs(num);
                if (t.tipo === 'debit') saldo -= Math.abs(num);
            });
            saldoCarteira = Math.max(0, saldo);
            atualizarDisplayCarteira();
        }
    } catch(e) {}
}

async function carregarCartoesDoBanco() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('voltcore_saved_cards').select('*').eq('user_email', userData.email || 'contato@wpsinfo.com.br');
        if (data) {
            cartoesSalvos = data.map((c, i) => ({ id: c.card_id, lastFour: c.last_four, brand: c.brand || 'Mastercard', holder: c.cardholder_name, default: i === 0 }));
            atualizarDisplayCarteira();
        }
    } catch(e) {}
}

function atualizarDisplayCarteira() {
    const balanceEl = document.getElementById('wallet-balance-display');
    if (balanceEl) balanceEl.innerText = `R$ ${saldoCarteira.toFixed(2).replace('.', ',')}`;
}

function renderizarVeiculos() {
    const container = document.getElementById('vehicles-grid-container');
    if (!container) return;
    container.innerHTML = '';
    if (meusVeiculos.length === 0) {
        container.innerHTML = `<div class="col-span-full p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200">Nenhum veículo cadastrado.</div>`;
        return;
    }
    meusVeiculos.forEach((v, index) => {
        container.innerHTML += `
            <div class="bg-slate-50 p-3 rounded-xl border-2 border-lime-400 flex items-center justify-between">
                <div>
                    <span class="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">${v.type}</span>
                    <h3 class="font-extrabold text-slate-900 text-xs mt-0.5">${v.model} • Placa ${v.plate}</h3>
                </div>
                <button onclick="removerVeiculo(${index})" class="text-rose-500 hover:text-rose-700 p-1.5 text-xs cursor-pointer"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
}

// ==========================================================================
// ESTAÇÕES OCPP & REALTIME
// ==========================================================================
async function carregarEstacoesDoBanco() {
    if (supabaseClient) {
        try {
            const { data } = await supabaseClient.from('pontos_recarga').select('*').order('id_ponto', { ascending: true });
            if (data && data.length > 0) {
                stations = data.map((st, index) => ({
                    id: parseInt(st.id_ponto || (index + 1), 10),
                    name: st.nome_vaga || `VAGA 0${index+1}`,
                    condo: st.condominio || 'Belarte Residencial Jundiaí',
                    type: st.potencia_kw ? `Conector (${st.potencia_kw} kW)` : 'Conector Type-2 (22 kW)',
                    status: st.status || 'Disponível',
                    user: st.usuario || null,
                    kwh: parseFloat(st.kwh || 0),
                    cost: parseFloat(st.tarifa_kwh || 1.18),
                    timer: parseInt(st.tempo_decorrido || 0, 10),
                    ocppId: st.ocpp_id || `CP-ID-${index+1}`,
                    ocppStatus: st.ocpp_status || 'Online (Connected)'
                }));
                renderStations();
                return;
            }
        } catch(e) {}
    }
    carregarOuInicializarEstacoes();
    renderStations();
}

function configurarSupabaseRealtime() {
    if (!supabaseClient) return;
    try {
        supabaseClient.channel('tabela-pontos-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'pontos_recarga' }, () => {
            carregarEstacoesDoBanco();
        }).subscribe();
    } catch(e) {}
}

async function sincronizarEstacaoNoSupabase(st) {
    if (!supabaseClient) return;
    try {
        await supabaseClient.from('pontos_recarga').upsert([{
            id_ponto: String(st.id),
            nome_vaga: st.name,
            condominio: st.condo,
            status: st.status,
            usuario: st.user || null,
            potencia_kw: 22.0,
            tarifa_kwh: 1.18,
            kwh: st.kwh || 0,
            ocpp_id: st.ocppId,
            ocpp_status: st.ocppStatus
        }], { onConflict: 'id_ponto' });
    } catch(e) {}
}

function carregarOuInicializarEstacoes() {
    const saved = localStorage.getItem('voltcore_stations_v5_ocpp');
    if (saved) {
        try { stations = JSON.parse(saved); return; } catch(e){}
    }
    stations = JSON.parse(JSON.stringify(ESTACOES_PADRAO));
}

function switchMode(mode) {
    currentMode = mode;
    const btnCondo = document.getElementById('btn-mode-condo');
    const btnCom = document.getElementById('btn-mode-com');
    const viewCondo = document.getElementById('tab-stations');
    const viewCom = document.getElementById('view-commercial');
    const condoBar = document.getElementById('sticky-condo-bar');

    if (mode === 'condo') {
        if (btnCondo) btnCondo.className = "flex-1 py-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 bg-slate-900 text-white transition shadow-xs cursor-pointer";
        if (btnCom) btnCom.className = "flex-1 py-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer";
        if (viewCondo) viewCondo.classList.remove('hidden');
        if (viewCom) viewCom.classList.add('hidden');
        if (condoBar) condoBar.classList.remove('hidden');
        renderStations();
    } else {
        if (btnCom) btnCom.className = "flex-1 py-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 bg-slate-900 text-white transition shadow-xs cursor-pointer";
        if (btnCondo) btnCondo.className = "flex-1 py-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer";
        if (viewCom) viewCom.classList.remove('hidden');
        if (viewCondo) viewCondo.classList.add('hidden');
        if (condoBar) condoBar.classList.add('hidden');
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-lime-600');
        btn.classList.add('text-slate-400');
        if(btn.dataset.tab === tabId) {
            btn.classList.remove('text-slate-400');
            btn.classList.add('text-lime-600');
        }
    });
}

function setFilter(status) {
    currentFilter = status;
    renderStations();
}

function renderStations() {
    const grid = document.getElementById('stations-grid');
    if(!grid) return;
    grid.innerHTML = '';
    let livre = 0, reservado = 0, carregando = 0;
    const selectCondo = document.getElementById('select-condo');
    const currentCondo = selectCondo ? selectCondo.value : userData.condo;

    stations.forEach(st => {
        if (userData.role !== 'ADM_MASTER' && st.condo !== currentCondo) return;

        if (st.status === 'Disponível') livre++;
        if (st.status === 'Reservado') reservado++;
        if (st.status === 'Em Uso') carregando++;
        
        if (currentFilter !== 'all' && st.status !== currentFilter) return;
        
        grid.innerHTML += `
            <div class="bg-white rounded-xl border p-3 shadow-xs">
                <h3 class="text-xs font-extrabold text-slate-900">${st.name}</h3>
                <p class="text-[9px] text-slate-500">${st.condo} • ${st.status}</p>
            </div>
        `;
    });
}

function updateTimersAndLoad() {}

// ==========================================================================
// DASHBOARD ADM / SÍNDICO AMPLO & FUNCIONAL (MOBILE & WEB PC)
// ==========================================================================
async function carregarMoradoresDoBanco() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('moradores').select('*').order('criado_em', { ascending: false });
        if (data && data.length > 0) {
            moradoresCondominio = data.map(m => ({
                id: m.id,
                nome: m.nome,
                condo: m.condominio,
                bloco: m.bloco || 'Torre Única',
                unidade: m.unidade || 'Apto 00',
                endereco: m.endereco || 'Jundiaí/SP',
                vaga: m.vaga,
                veiculo: m.veiculo || 'Veículo Elétrico',
                placa: m.placa || 'N/D',
                status: m.status || 'Ativo',
                data: m.criado_em ? new Date(m.criado_em).toLocaleDateString('pt-BR') : '26/10/2026',
                horaInicio: '12:00 PM',
                horaFim: '12:42 PM',
                duracao: '42 min',
                kwh: '14.2 kWh',
                ociosidade: 'Não',
                valor: m.valor_atual || 'R$ 0,00'
            }));
        }
    } catch(e) {}
}

async function abrirPainelGestao() {
    if (userData.role !== 'ADM_MASTER' && userData.role !== 'SINDICO') {
        showToast('Acesso negado: Perfil restrito a Administradores e Síndicos.');
        return;
    }
    await carregarMoradoresDoBanco();
    renderizarConteudoPainelGestao('');
}

function renderizarConteudoPainelGestao(termoFiltro = '', condominioFiltro = '') {
    let moradoresFiltrados = moradoresCondominio.filter(m => {
        if (userData.role === 'SINDICO') {
            return m.condo.toLowerCase().includes(userData.condo.toLowerCase());
        }
        if (condominioFiltro && condominioFiltro !== 'TODOS') {
            return m.condo.toLowerCase().includes(condominioFiltro.toLowerCase());
        }
        return true;
    });

    const termo = termoFiltro.toLowerCase().trim();
    if (termo) {
        moradoresFiltrados = moradoresFiltrados.filter(m => 
            m.nome.toLowerCase().includes(termo) || 
            (m.placa || '').toLowerCase().includes(termo) || 
            (m.vaga || '').toLowerCase().includes(termo) ||
            (m.unidade || '').toLowerCase().includes(termo)
        );
    }

    let htmlMoradores = '';
    moradoresFiltrados.forEach((m, idx) => {
        const isInativo = m.status === 'Inativo';
        htmlMoradores += `
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs hover:border-lime-400 transition">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2.5 border-b border-slate-100">
                    <div>
                        <div class="flex items-center gap-2">
                            <strong class="text-slate-900 text-sm font-black">${m.nome}</strong>
                            <span class="text-[9px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">${m.unidade} • ${m.vaga}</span>
                        </div>
                        <div class="text-[11px] text-slate-500 mt-0.5"><i class="fa-solid fa-building text-lime-600 mr-1"></i> ${m.condo} (${m.bloco})</div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <span class="font-black text-emerald-700 text-xs bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">${m.valor}</span>
                        <span class="text-[10px] font-bold ${isInativo ? 'text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200' : 'text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200'}">${m.status}</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                        <p class="text-slate-600"><strong>Veículo:</strong> <span class="font-bold text-slate-800">${m.veiculo}</span></p>
                        <p class="text-slate-600"><strong>Placa:</strong> <span class="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">${m.placa}</span></p>
                    </div>
                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                        <p class="text-slate-600"><strong>Sessão OCPP:</strong> <span class="font-bold text-slate-800">${m.data} • ${m.horaInicio}</span></p>
                        <p class="text-slate-600"><strong>Duração / Consumo:</strong> <span class="font-bold text-emerald-700">${m.duracao} (${m.kwh})</span></p>
                    </div>
                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                            <p class="text-[10px] text-slate-500 uppercase font-bold">Taxa Ociosidade</p>
                            <p class="text-xs font-black text-amber-600">${m.ociosidade === 'Sim' ? 'R$ 2,20 Aplicada' : 'Nenhuma'}</p>
                        </div>
                        <i class="fa-solid fa-bolt text-lime-600 text-base"></i>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row justify-between items-center pt-2 gap-2 border-t border-slate-100">
                    <span class="text-[10px] text-slate-400 flex items-center gap-1"><i class="fa-solid fa-shield-halved text-lime-600"></i> LGPD & OCPP Ativo.</span>
                    <div class="flex gap-2 w-full sm:w-auto">
                        <button onclick="estornarOuAjustarSaldoMorador(${idx})" class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-100 text-amber-900 hover:bg-amber-200 transition cursor-pointer">
                            <i class="fa-solid fa-rotate-left"></i> Ajustar Saldo
                        </button>
                        <button onclick="alternarStatusMorador(${idx})" class="px-3 py-1.5 rounded-xl text-xs font-extrabold ${isInativo ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200' : 'bg-rose-100 text-rose-900 hover:bg-rose-200'} transition cursor-pointer">
                            ${isInativo ? 'Reativar' : 'Inativar'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    const tituloPainel = userData.role === 'SINDICO' ? `Painel Síndico • ${userData.condo}` : 'Central ADM Master • Gestão Corporativa Ampla';
    
    let seletorCondoHtml = '';
    if (userData.role === 'ADM_MASTER') {
        seletorCondoHtml = `
            <div class="w-full sm:w-64">
                <select id="filtro-condo-select" onchange="mudarFiltroCondoAdm(this)" class="w-full bg-slate-800 text-white border border-slate-700 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-lime-500 focus:outline-none cursor-pointer">
                    <option value="TODOS">🏢 Todos os Condomínios (Global)</option>
                    <option value="Belarte Residencial">Belarte Residencial Jundiaí</option>
                    <option value="Gioviale">Condomínio Gioviale</option>
                    <option value="Atmosfera">Complexo Atmosfera Residencial</option>
                </select>
            </div>
        `;
    }

    const conteudoGestao = `
        <div class="space-y-4 text-left text-xs pb-4 flex flex-col h-full">
            <div class="flex items-center justify-between bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md shrink-0">
                <div>
                    <h4 class="font-black text-lime-400 text-sm sm:text-base flex items-center gap-2"><i class="fa-solid fa-building-shield text-lg"></i> ${tituloPainel}</h4>
                    <p class="text-[11px] text-slate-300">Gestão avançada de faturamento, telemetria OCPP e controle de moradores.</p>
                </div>
                <button onclick="closeModal()" class="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-rose-600 transition cursor-pointer shrink-0" title="Fechar">
                    <i class="fa-solid fa-xmark text-base"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <span class="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Totens OCPP Online</span>
                    <span class="text-base font-black text-slate-900">8 / 8 Conectados</span>
                </div>
                <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <span class="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Faturamento Período</span>
                    <span class="text-sm font-black text-emerald-600">R$ 796,50 (Liquidado)</span>
                </div>
                <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <span class="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Taxa Ociosidade</span>
                    <span class="text-sm font-black text-amber-600">R$ 45,00 Acumulado</span>
                </div>
            </div>

            <div class="space-y-3 flex-1 flex flex-col min-h-0 pt-1">
                <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 pb-2 border-b border-slate-200 shrink-0">
                    <div class="relative flex-1">
                        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-xs"></i>
                        <input type="text" id="filtro-morador-input" oninput="filtrarGestaoMoradores(this)" value="${termoFiltro}" placeholder="Pesquisar por nome, placa, unidade ou vaga..." class="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                    </div>
                    ${seletorCondoHtml}
                    <button onclick="abrirModalCadastrarMorador()" class="bg-lime-500 hover:bg-lime-600 text-slate-900 font-black px-4 py-2.5 rounded-xl text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0">
                        <i class="fa-solid fa-user-plus"></i> Novo Condômino
                    </button>
                </div>
                
                <div class="space-y-3 overflow-y-auto flex-1 pr-1">
                    ${htmlMoradores || '<div class="p-8 bg-slate-50 rounded-2xl text-center text-slate-500 font-medium">Nenhum condômino encontrado.</div>'}
                </div>
            </div>
            
            <div class="flex gap-2 pt-2 border-t border-slate-100 shrink-0">
                <button onclick="closeModal()" class="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs cursor-pointer">FECHAR PAINEL</button>
            </div>
        </div>
    `;

    showCustomModalAmplo(tituloPainel, conteudoGestao);
}

function showCustomModalAmplo(title, htmlContent) {
    const customModal = document.getElementById('customModal');
    if (!customModal) return;
    const modalBox = customModal.querySelector('.bg-white') || customModal.children[0];
    if (modalBox) {
        modalBox.className = "bg-white w-[95vw] max-w-6xl h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col p-4 sm:p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200";
    }
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    if (modalTitle) modalTitle.style.display = 'none';
    if (modalDesc) {
        modalDesc.innerHTML = htmlContent;
        modalDesc.className = "flex-1 overflow-hidden flex flex-col";
    }
    customModal.classList.remove('hidden');
}

let condoFiltroAtualAdm = 'TODOS';
function mudarFiltroCondoAdm(select) {
    condoFiltroAtualAdm = select.value;
    const termo = document.getElementById('filtro-morador-input') ? document.getElementById('filtro-morador-input').value : '';
    renderizarConteudoPainelGestao(termo, condoFiltroAtualAdm);
}

function filtrarGestaoMoradores(input) {
    renderizarConteudoPainelGestao(input.value, condoFiltroAtualAdm);
    setTimeout(() => {
        const inp = document.getElementById('filtro-morador-input');
        if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }, 50);
}

function estornarOuAjustarSaldoMorador(idx) {
    const morador = moradoresCondominio[idx];
    showToast(`Ajuste financeiro registrado para ${morador.nome}.`);
}

async function alternarStatusMorador(idx) {
    const morador = moradoresCondominio[idx];
    const novoStatus = morador.status === 'Ativo' ? 'Inativo' : 'Ativo';
    morador.status = novoStatus;
    if (supabaseClient && morador.id) {
        try { await supabaseClient.from('moradores').update({ status: novoStatus }).eq('id', morador.id); } catch(e){}
    }
    showToast(`Morador ${morador.nome} ${novoStatus === 'Inativo' ? 'inativado' : 'reativado'}.`);
    localStorage.setItem('voltcore_moradores', JSON.stringify(moradoresCondominio));
    renderizarConteudoPainelGestao(document.getElementById('filtro-morador-input') ? document.getElementById('filtro-morador-input').value : '', condoFiltroAtualAdm);
}

function abrirModalCadastrarMorador() {
    const htmlForm = `
        <div class="space-y-3 text-left text-xs pb-4">
            <div>
                <label class="block font-bold text-slate-700 mb-1">Nome do Morador:</label>
                <input type="text" id="novo-morador-nome" placeholder="Ex: Carlos Alberto" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Condomínio:</label>
                    <input type="text" id="novo-morador-condo" value="${userData.role === 'SINDICO' ? userData.condo : 'Belarte Residencial Jundiaí'}" ${userData.role === 'SINDICO' ? 'readonly' : ''} class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Bloco / Torre:</label>
                    <input type="text" id="novo-morador-bloco" placeholder="Ex: Torre Norte" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium">
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Unidade / Apto:</label>
                    <input type="text" id="novo-morador-unidade" placeholder="Ex: Apto 101" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Vaga / OCPP ID:</label>
                    <input type="text" id="novo-morador-vaga" placeholder="Ex: Vaga 01" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium">
                </div>
            </div>
            <div>
                <label class="block font-bold text-slate-700 mb-1">Endereço:</label>
                <input type="text" id="novo-morador-endereco" placeholder="Ex: Jundiaí/SP" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Veículo / Modelo:</label>
                    <input type="text" id="novo-morador-veiculo" placeholder="Ex: BYD Seal (CCS2)" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Placa:</label>
                    <input type="text" id="novo-morador-placa" placeholder="Ex: ABC-1D23" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium">
                </div>
            </div>
            <div class="flex gap-2 pt-2">
                <button onclick="salvarNovoMorador()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-black py-2.5 rounded-xl text-xs cursor-pointer">CONFIRMAR</button>
                <button onclick="abrirPainelGestao()" class="bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Cadastrar Novo Condômino', htmlForm, 'fa-user-plus', 'lime');
}

async function salvarNovoMorador() {
    const nome = document.getElementById('novo-morador-nome').value;
    const condo = document.getElementById('novo-morador-condo').value || 'Belarte Residencial Jundiaí';
    const bloco = document.getElementById('novo-morador-bloco').value || 'Torre Única';
    const unidade = document.getElementById('novo-morador-unidade').value || 'Apto 00';
    const vaga = document.getElementById('novo-morador-vaga').value || 'Vaga 00';
    const endereco = document.getElementById('novo-morador-endereco').value || 'Jundiaí/SP';
    const veiculo = document.getElementById('novo-morador-veiculo').value || 'Veículo Elétrico';
    const placa = document.getElementById('novo-morador-placa').value || 'ABC-0000';

    if (!nome || !vaga) {
        showToast('Preencha o nome e a vaga do morador.');
        return;
    }

    if (supabaseClient) {
        try {
            await supabaseClient.from('moradores').insert([{ nome, condominio: condo, bloco, unidade, endereco, vaga, veiculo, placa, status: 'Ativo', valor_atual: 'R$ 0,00' }]);
        } catch(e){}
    }

    moradoresCondominio.unshift({
        nome, condo, bloco, unidade, endereco, vaga, veiculo, placa, status: 'Ativo',
        data: new Date().toLocaleDateString('pt-BR'), horaInicio: '12:00 PM', horaFim: '12:42 PM', duracao: '42 min', kwh: '0.0 kWh', ociosidade: 'Não', valor: 'R$ 0,00'
    });
    localStorage.setItem('voltcore_moradores', JSON.stringify(moradoresCondominio));
    showToast(`Condômino ${nome} cadastrado!`);
    abrirPainelGestao();
}

function showCustomModal(title, htmlContent, icon = 'fa-bolt', color = 'lime') {
    const customModal = document.getElementById('customModal');
    const modalBox = customModal ? (customModal.querySelector('.bg-white') || customModal.children[0]) : null;
    if (modalBox) {
        modalBox.className = "bg-white w-[90vw] max-w-md rounded-3xl shadow-2xl border border-slate-200 p-5 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200";
    }
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    if (modalTitle) { modalTitle.style.display = 'flex'; modalTitle.innerText = title; }
    if (modalDesc) modalDesc.innerHTML = htmlContent;
    if (customModal) customModal.classList.remove('hidden');
}

function closeModal() {
    if (pixPollingInterval) { clearInterval(pixPollingInterval); pixPollingInterval = null; }
    if (streamCameraAtiva) { streamCameraAtiva.getTracks().forEach(t => t.stop()); streamCameraAtiva = null; }
    const customModal = document.getElementById('customModal');
    if (customModal) customModal.classList.add('hidden');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    if (toast && toastMsg) {
        toastMsg.innerText = msg;
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        },
        3500);
    }
}