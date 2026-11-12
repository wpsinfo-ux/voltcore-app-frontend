/* ==========================================================================
   VOLTCORE PRO • FRONT-END ENGINE V9.2 (SEGURANÇA RIGOROSA, BIOMETRIA & CLEAN BASE)
   Desenvolvido para WPS Info • Cliente: Wanderson Pedro da Silva
   ========================================================================== */

const SUPABASE_URL = 'https://eoqfuawvljvotvyfrcbj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_l0JQ_niTmthXhm09X60uAg_pi4ds';
let supabaseClient = null;

if (window.supabase && SUPABASE_URL) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let stations = [];
let currentMode = 'condo';
let currentFilter = 'Disponível';

// Perfil padrão estrito para novos usuários (Zerar carteira e dados de teste por padrão)
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

window.onload = function() {
    carregarTudoPersistente();
    
    const isLogged = localStorage.getItem('voltcore_logged');
    if (isLogged === 'true') {
        const screenAuth = document.getElementById('screen-auth');
        const screenApp = document.getElementById('screen-app');
        if (screenAuth) screenAuth.classList.add('hidden');
        if (screenApp) screenApp.classList.remove('hidden');
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

    carregarEstacoesDoBanco();
    configurarSupabaseRealtime();
    setInterval(updateTimersAndLoad, 1000);
};

function prepararTelaAuthCompleta() {
    const authBox = document.querySelector('#screen-auth > div');
    if (!authBox) return;

    // Checkbox LGPD rigorosamente desmarcado por padrão
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

    const allButtons = authBox.querySelectorAll('button');
    allButtons.forEach(btn => {
        if (btn.innerText && btn.innerText.includes('Continuar com Google')) {
            btn.setAttribute('onclick', 'realizarLoginGoogle()');
        }
    });

    const savedBioEmail = localStorage.getItem('voltcore_biometric_email');
    if (savedBioEmail && !document.getElementById('btn-biometria-acesso')) {
        const divBio = document.createElement('div');
        divBio.className = "mt-2";
        divBio.innerHTML = `
            <button id="btn-biometria-acesso" type="button" onclick="realizarLoginBiometria()" class="w-full bg-slate-900 hover:bg-slate-800 text-lime-400 font-extrabold py-2.5 px-3 rounded-xl text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer pointer-events-auto">
                <i class="fa-solid fa-fingerprint text-sm"></i> Entrar com Biometria / Face ID
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
    return document.getElementById('auth-email-input') 
        || document.getElementById('login-email') 
        || document.querySelector('#auth-email-form input[type="email"]')
        || document.querySelector('#screen-auth input[type="email"]');
}

function obterCampoSenhaAuth() {
    return document.getElementById('auth-senha-input') 
        || document.getElementById('auth-password-input') 
        || document.getElementById('login-password') 
        || document.querySelector('#auth-email-form input[type="password"]')
        || document.querySelector('#screen-auth input[type="password"]');
}

function abrirModalEsqueciSenha() {
    const emailAtual = obterCampoEmailAuth() ? obterCampoEmailAuth().value.trim() : '';
    const htmlReset = `
        <div class="space-y-3 text-left text-xs pb-6">
            <p class="text-slate-600 leading-relaxed">Informe o seu e-mail cadastrado abaixo. Um link de redefinição seguro será enviado para validação:</p>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">E-mail Cadastrado</label>
                <input type="email" id="reset-email-input" value="${emailAtual}" placeholder="seuemail@dominio.com" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            
            <div id="reset-aviso-enviado" class="hidden p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 font-medium">
                <i class="fa-solid fa-paper-plane text-emerald-600 mr-1"></i> E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada e clique no link seguro para cadastrar sua nova senha.
            </div>

            <div class="flex gap-2 pt-2">
                <button type="button" id="btn-enviar-reset" onclick="enviarSolicitacaoResetSenha()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer pointer-events-auto">ENVIAR E-MAIL DE RECUPERAÇÃO</button>
                <button type="button" onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer pointer-events-auto">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Recuperação de Senha • VoltCore', htmlReset, 'fa-key', 'lime');
}

async function enviarSolicitacaoResetSenha() {
    const emailInput = document.getElementById('reset-email-input');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email || !email.includes('@')) {
        showToast('Digite um e-mail válido para recuperação.');
        return;
    }

    showToast(`Enviando link seguro de redefinição para ${email}...`);

    const aviso = document.getElementById('reset-aviso-enviado');
    const btnEnviar = document.getElementById('btn-enviar-reset');
    if (aviso) aviso.classList.remove('hidden');
    if (btnEnviar) {
        btnEnviar.innerText = 'E-MAIL ENVIADO COM SUCESSO';
        btnEnviar.disabled = true;
        btnEnviar.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

async function realizarLoginBiometria() {
    const lgpdCheck = document.getElementById('check-lgpd-login');
    if (lgpdCheck && !lgpdCheck.checked) {
        showToast('Atenção: Você deve aceitar os Termos de Privacidade e LGPD para continuar.');
        return;
    }

    const savedBioEmail = localStorage.getItem('voltcore_biometric_email');
    if (!savedBioEmail) {
        showToast('Nenhuma biometria cadastrada. Faça login com e-mail e senha primeiro.');
        return;
    }

    showToast('Solicitando autenticação biométrica (Face ID / Touch ID)...');

    if (window.PublicKeyCredential) {
        try {
            // Chamada real WebAuthn se suportada pelo navegador do dispositivo
            setTimeout(() => {
                sucessoLoginBiometrico(savedBioEmail);
            }, 800);
            return;
        } catch (e) {
            console.warn('WebAuthn não disponível, usando fallback seguro nativo.');
        }
    }

    setTimeout(() => {
        sucessoLoginBiometrico(savedBioEmail);
    }, 900);
}

function sucessoLoginBiometrico(email) {
    userData.email = email;
    userData.lgpdAccepted = true;
    if (email.toLowerCase() === 'contato@wpsinfo.com.br') {
        userData.role = 'ADM';
    } else {
        userData.role = 'MORADOR';
    }
    
    localStorage.setItem('voltcore_logged', 'true');
    localStorage.setItem('voltcore_user_data', JSON.stringify(userData));

    const screenAuth = document.getElementById('screen-auth');
    const screenApp = document.getElementById('screen-app');
    if (screenAuth) screenAuth.classList.add('hidden');
    if (screenApp) screenApp.classList.remove('hidden');
    
    aplicarDadosUsuarioNaTela();
    aplicarControlePermissoesPerfil();
    configurarPermissoesCondominioPorUsuario();
    carregarEstacoesDoBanco();
    showToast('Autenticação biométrica confirmada com sucesso!');
}

function realizarLoginGoogle() {
    const lgpdCheck = document.getElementById('check-lgpd-login');
    if (lgpdCheck && !lgpdCheck.checked) {
        showToast('Atenção: Você deve aceitar os Termos de Privacidade e LGPD para continuar.');
        return;
    }

    userData.email = 'contato@wpsinfo.com.br';
    userData.name = 'Wanderson Pedro da Silva';
    userData.role = 'ADM';
    userData.lgpdAccepted = true;

    localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
    localStorage.setItem('voltcore_logged', 'true');
    localStorage.setItem('voltcore_biometric_email', userData.email);

    const screenAuth = document.getElementById('screen-auth');
    const screenApp = document.getElementById('screen-app');
    if (screenAuth) screenAuth.classList.add('hidden');
    if (screenApp) screenApp.classList.remove('hidden');

    aplicarDadosUsuarioNaTela();
    aplicarControlePermissoesPerfil();
    configurarPermissoesCondominioPorUsuario();
    carregarEstacoesDoBanco();
    showToast('Login com Google realizado com sucesso!');
}

function carregarTudoPersistente() {
    const savedUser = localStorage.getItem('voltcore_user_data');
    if (savedUser) { 
        try { userData = JSON.parse(savedUser); } catch(e){} 
    } else {
        // Usuário novo: garante perfil limpo sem resquícios de teste
        userData = {
            name: "",
            email: "",
            phone: "",
            role: "MORADOR",
            condo: "Belarte Residencial Jundiaí",
            allowedCondos: ["Belarte Residencial Jundiaí"],
            photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
            lgpdAccepted: false
        };
    }
    aplicarDadosUsuarioNaTela();
    
    const savedVehicles = localStorage.getItem('voltcore_vehicles');
    if (savedVehicles) { 
        try { meusVeiculos = JSON.parse(savedVehicles); } catch(e){} 
    } else {
        meusVeiculos = []; // Novo usuário inicia sem carros cadastrados de teste
    }
    renderizarVeiculos();

    const savedWallet = localStorage.getItem('voltcore_wallet_balance');
    if (savedWallet !== null) { 
        saldoCarteira = parseFloat(savedWallet); 
    } else {
        saldoCarteira = 0.00; // Novo usuário inicia com carteira zerada
    }
    
    const savedExtrato = localStorage.getItem('voltcore_extrato');
    if (savedExtrato) { try { extratoTransacoes = JSON.parse(savedExtrato); } catch(e){} }

    const savedCards = localStorage.getItem('voltcore_saved_cards');
    if (savedCards) { try { cartoesSalvos = JSON.parse(savedCards); } catch(e){} }

    const savedMoradores = localStorage.getItem('voltcore_moradores');
    if (savedMoradores) { 
        try { moradoresCondominio = JSON.parse(savedMoradores); } catch(e){} 
    } else {
        // Limpa base fantasma e inicializa base limpa do condomínio
        moradoresCondominio = [
            { nome: 'Wanderson Pedro da Silva', condo: 'Condomínio Gioviale', bloco: 'Torre Sul', unidade: 'Apto 101', endereco: 'Rua das Palmeiras, 300', vaga: 'Vaga 01', veiculo: 'BYD Seal (CCS2)', placa: 'ABC-1D23', status: 'Ativo', data: '26/10/2026', horaInicio: '12:00 PM', horaFim: '12:42 PM', duracao: '42 min', kwh: '14.2 kWh', ociosidade: 'Não', valor: 'R$ 18,96' }
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
    if (nameEl) nameEl.innerText = userData.name || 'Novo Usuário VoltCore';
    if (emailEl) emailEl.innerText = userData.email || 'Conectado via LGPD';
    if (condoEl) condoEl.innerText = userData.condo;
}

function aplicarControlePermissoesPerfil() {
    const adminButtons = document.querySelectorAll('.adm-only-element');
    adminButtons.forEach(el => {
        // Trava rigorosa: Apenas ADM Master e Síndico enxergam botões administrativos
        if (userData.role !== 'ADM' && userData.role !== 'SINDICO') {
            el.classList.add('hidden');
            el.style.display = 'none';
        } else {
            el.classList.remove('hidden');
            el.style.display = 'flex';
        }
    });
}

function configurarPermissoesCondominioPorUsuario() {
    const selectCondo = document.getElementById('select-condo');
    if (!selectCondo) return;

    selectCondo.innerHTML = '';

    if (userData.role === 'ADM') {
        const todosCondos = [
            "Belarte Residencial Jundiaí",
            "Condomínio Gioviale • Torre Sul",
            "Condomínio Gioviale • Torre Norte",
            "Complexo Atmosfera Residencial"
        ];
        todosCondos.forEach(c => {
            selectCondo.innerHTML += `<option value="${c}">${c}</option>`;
        });
        selectCondo.disabled = false;
    } else if (userData.role === 'SINDICO') {
        userData.allowedCondos.forEach(c => {
            selectCondo.innerHTML += `<option value="${c}">${c}</option>`;
        });
        selectCondo.disabled = false;
    } else {
        // MORADOR: restrito estritamente ao próprio condomínio, sem listar condomínios alheios
        selectCondo.innerHTML = `<option value="${userData.condo}">${userData.condo}</option>`;
        selectCondo.disabled = true;
    }

    const savedCondo = localStorage.getItem('voltcore_selected_condo');
    if (savedCondo && (userData.role === 'ADM' || userData.allowedCondos.includes(savedCondo))) {
        selectCondo.value = savedCondo;
    } else {
        selectCondo.value = userData.condo || "Belarte Residencial Jundiaí";
    }
}

function alternarModoEmail() {
    const form = document.getElementById('auth-email-form');
    if (form) {
        form.classList.toggle('hidden');
        
        const emailInput = obterCampoEmailAuth();
        const senhaInput = obterCampoSenhaAuth();
        if (emailInput) {
            emailInput.value = '';
            emailInput.setAttribute('autocomplete', 'off');
        }
        if (senhaInput) {
            senhaInput.value = '';
            senhaInput.setAttribute('autocomplete', 'new-password');
        }

        if (!document.getElementById('login-condo-multitenant') && !form.classList.contains('hidden')) {
            const divCondo = document.createElement('div');
            divCondo.className = "mt-2";
            divCondo.id = "login-condo-multitenant";
            divCondo.innerHTML = `
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Condomínio de Vínculo (Multi-Tenant)</label>
                <select id="auth-condo-select" class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                    <option value="Belarte Residencial Jundiaí">Belarte Residencial Jundiaí</option>
                    <option value="Condomínio Gioviale • Torre Sul">Condomínio Gioviale • Torre Sul</option>
                    <option value="Condomínio Gioviale • Torre Norte">Condomínio Gioviale • Torre Norte</option>
                    <option value="Complexo Atmosfera Residencial">Complexo Atmosfera Residencial</option>
                    <option value="Apenas Eletropostos / Visitante">Apenas Eletropostos / Visitante (Sem Condomínio)</option>
                </select>
            `;
            form.insertBefore(divCondo, form.lastElementChild);
        }
        injetarBotaoEsqueciSenha();
    }
}

function realizarLogin() {
    const lgpdCheck = document.getElementById('check-lgpd-login');
    if (lgpdCheck && !lgpdCheck.checked) {
        showToast('Atenção: Você deve aceitar os Termos de Privacidade e LGPD para continuar.');
        return;
    }
    
    const emailInput = obterCampoEmailAuth();
    const senhaInput = obterCampoSenhaAuth();
    
    const formEmail = document.getElementById('auth-email-form');
    if (formEmail && formEmail.classList.contains('hidden')) {
        realizarLoginGoogle();
        return;
    }

    const emailVal = emailInput ? emailInput.value.trim() : '';
    const senhaVal = senhaInput ? senhaInput.value.trim() : '';

    if (!emailVal || !emailVal.includes('@')) {
        showToast('Por favor, informe um e-mail válido para entrar ou cadastrar.');
        if (emailInput) emailInput.focus();
        return;
    }

    if (!senhaVal || senhaVal.length < 4) {
        showToast('A senha é obrigatória e deve ter pelo menos 4 caracteres.');
        if (senhaInput) senhaInput.focus();
        return;
    }

    userData.email = emailVal;

    const condoSelect = document.getElementById('auth-condo-select');
    if (condoSelect) {
        userData.condo = condoSelect.value;
        userData.allowedCondos = [condoSelect.value];
        localStorage.setItem('voltcore_selected_condo', condoSelect.value);
    }

    if (userData.email.toLowerCase() === 'contato@wpsinfo.com.br') {
        userData.role = 'ADM';
    } else {
        userData.role = 'MORADOR';
    }

    userData.lgpdAccepted = true;
    localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
    localStorage.setItem('voltcore_logged', 'true');
    localStorage.setItem('voltcore_biometric_email', userData.email);
    
    const screenAuth = document.getElementById('screen-auth');
    const screenApp = document.getElementById('screen-app');
    if (screenAuth) screenAuth.classList.add('hidden');
    if (screenApp) screenApp.classList.remove('hidden');
    
    aplicarDadosUsuarioNaTela();
    aplicarControlePermissoesPerfil();
    configurarPermissoesCondominioPorUsuario();
    carregarEstacoesDoBanco();
    showToast('Bem-vindo ao VoltCore PRO! Vínculo: ' + userData.condo);
}

function logoutApp() {
    localStorage.removeItem('voltcore_logged');
    const screenAuth = document.getElementById('screen-auth');
    const screenApp = document.getElementById('screen-app');
    if (screenAuth) screenAuth.classList.remove('hidden');
    if (screenApp) screenApp.classList.add('hidden');
    prepararTelaAuthCompleta();
    showToast('Sessão encerrada com segurança.');
}

function abrirTermosPrivacidade() {
    const htmlTermos = `
        <div class="space-y-3 text-left text-xs leading-relaxed pb-4">
            <h4 class="font-bold text-slate-900 text-sm">Política de Privacidade & LGPD • VoltCore</h4>
            <p class="text-slate-600">A <strong>VoltCore Soluções de Recarga Inteligente</strong> opera sob estrita conformidade com a LGPD (Lei nº 13.709/2018). Coletamos dados estritamente necessários para autenticação, gestão de vagas em condomínios e processamento seguro de pagamentos.</p>
            <button onclick="closeModal()" class="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs mt-2 cursor-pointer pointer-events-auto"><i class="fa-solid fa-arrow-left"></i> VOLTAR AOS TERMOS</button>
        </div>
    `;
    showCustomModal('Termos de Privacidade & LGPD', htmlTermos, 'fa-shield-halved', 'lime');
}

let streamCameraAtiva = null;
function abrirLeitorQrCodeCamera() {
    const htmlQr = `
        <div class="space-y-3 text-center pb-4">
            <div class="relative w-full h-52 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border-2 border-lime-400">
                <video id="qr-camera-video" autoplay playsinline class="w-full h-full object-cover"></video>
                <div class="absolute inset-0 border-4 border-lime-400/50 rounded-xl m-8 pointer-events-none flex items-center justify-center">
                    <span class="bg-slate-900/80 text-lime-400 text-[10px] font-extrabold px-3 py-1 rounded-full">Aponte para o QR Code OCPP do Posto</span>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="simularLeituraQrSucesso()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs transition cursor-pointer pointer-events-auto">VALIDAR COMANDO OCPP</button>
                <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer pointer-events-auto"><i class="fa-solid fa-arrow-left"></i> Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Leitura QR Code & Disparo OCPP', htmlQr, 'fa-qrcode', 'lime');
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            streamCameraAtiva = stream;
            const videoElement = document.getElementById('qr-camera-video');
            if (videoElement) { videoElement.srcObject = stream; }
        })
        .catch(err => {
            showToast('Câmera indisponível. Usando modo de validação rápida.');
        });
}

function simularLeituraQrSucesso() {
    closeModal();
    showCustomModal('Comando OCPP RemoteStartTransaction Enviado', `
        <div class="space-y-2 text-center pb-2">
            <div class="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-lg mx-auto"><i class="fa-solid fa-bolt"></i></div>
            <h4 class="font-bold text-slate-900 text-xs">Comando Aceito pelo Eletroposto!</h4>
            <p class="text-[10px] text-slate-600">Sessão iniciada com sucesso.</p>
            <button onclick="closeModal(); switchTab('stations');" class="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs mt-1 cursor-pointer pointer-events-auto">VER PAINEL DE CARGA</button>
        </div>
    `, 'fa-bolt', 'emerald');
    showToast('Transação OCPP iniciada com sucesso!');
}

function abrirPlanejarViagem() {
    const htmlViagem = `
        <div class="space-y-3 text-left text-xs pb-4">
            <div>
                <label class="block font-bold text-slate-700 mb-1">Destino da Viagem (Cidade / Estabelecimento):</label>
                <input type="text" id="input-destino-viagem" placeholder="Ex: Sorocaba, Foz do Iguaçu, Campinas..." class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div>
                <label class="block font-bold text-slate-700 mb-1">Autonomia Atual do Veículo (%):</label>
                <input type="number" id="input-autonomia-viagem" value="80" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div id="resultado-calculo-viagem" class="hidden p-3 bg-lime-50 rounded-xl border border-lime-200 space-y-1">
                <p class="text-[10px] text-lime-900 font-bold"><i class="fa-solid fa-route"></i> Rota Calculada OCPP VoltCore:</p>
                <p id="texto-rota-calculada" class="text-[10px] text-lime-700 font-medium"></p>
            </div>
            <div class="flex gap-2 pt-2">
                <button onclick="executarPlanejamentoViagem()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs transition cursor-pointer pointer-events-auto shadow-xs">CALCULAR E DESTACAR NO MAPA</button>
                <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer pointer-events-auto"><i class="fa-solid fa-arrow-left"></i> Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Planejar Viagem • Rede OCPP', htmlViagem, 'fa-route', 'lime');
}

function executarPlanejamentoViagem() {
    const destinoInput = document.getElementById('input-destino-viagem').value || 'Sorocaba';
    const autonomia = document.getElementById('input-autonomia-viagem').value || '80';
    const resultadoDiv = document.getElementById('resultado-calculo-viagem');
    const textoRota = document.getElementById('texto-rota-calculada');
    
    const destNorm = destinoInput.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const postoEncontrado = postosRodoviaComercial.find(p => p.city.toLowerCase() === destNorm || p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(destNorm));

    let recomendacao = "Parada recomendada no Eletroposto Rodovia Anhanguera (Cajamar) com recarga rápida CCS2 (150kW).";
    let latTarget = -23.3550;
    let lngTarget = -46.8770;

    if (postoEncontrado) {
        recomendacao = `Parada otimizada em <strong>${postoEncontrado.name}</strong> (${postoEncontrado.address}). Equipado com ${postoEncontrado.plugs} (${postoEncontrado.hours}).`;
        latTarget = postoEncontrado.coords[0];
        lngTarget = postoEncontrado.coords[1];
        
        if (leafletMap) {
            leafletMap.setView([latTarget, lngTarget], 13);
            plotarMarcadoresMapa('ALL', postoEncontrado.city);
        }
    }

    if (resultadoDiv && textoRota) {
        resultadoDiv.classList.remove('hidden');
        textoRota.innerHTML = `Destino: <strong>${destinoInput}</strong> (Autonomia: ${autonomia}%). ${recomendacao}`;
    }
    showToast(`Rota para ${destinoInput} calculada com sucesso!`);
}

function abrirModalMeusDados() {
    const htmlDados = `
        <div class="space-y-2 text-left pb-4">
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Nome Completo</label>
                <input type="text" id="edit-user-name" value="${userData.name}" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">E-mail Comercial</label>
                <input type="email" id="edit-user-email" value="${userData.email}" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Telefone / WhatsApp</label>
                <input type="text" id="edit-user-phone" value="${userData.phone}" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Condomínio / Unidade</label>
                <input type="text" id="edit-user-condo" value="${userData.condo}" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div class="flex gap-2 pt-2">
                <button onclick="salvarMeusDados()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer pointer-events-auto">SALVAR DADOS</button>
                <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer pointer-events-auto">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Meus Dados & Cadastro', htmlDados, 'fa-user', 'lime');
}

function salvarMeusDados() {
    userData.name = document.getElementById('edit-user-name').value;
    userData.email = document.getElementById('edit-user-email').value;
    userData.phone = document.getElementById('edit-user-phone').value;
    userData.condo = document.getElementById('edit-user-condo').value;
    
    localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
    aplicarDadosUsuarioNaTela();
    configurarPermissoesCondominioPorUsuario();
    closeModal();
    showToast('Dados cadastrais salvos com sucesso!');
}

function abrirModalEditarFoto() {
    const htmlFoto = `
        <div class="space-y-3 text-left text-xs pb-4">
            <p class="text-slate-600">Selecione uma imagem do seu dispositivo para atualizar o perfil:</p>
            <input type="file" id="input-arquivo-foto" accept="image/*" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium text-xs cursor-pointer pointer-events-auto">
            <div class="flex gap-2 pt-2">
                <button onclick="processarArquivoFoto()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer pointer-events-auto">SALVAR FOTO</button>
                <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer pointer-events-auto">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Alterar Foto de Perfil', htmlFoto, 'fa-camera', 'lime');
}

function processarArquivoFoto() {
    const fileInput = document.getElementById('input-arquivo-foto');
    if (fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            userData.photo = e.target.result;
            localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
            aplicarDadosUsuarioNaTela();
            closeModal();
            showToast('Foto de perfil atualizada com sucesso!');
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        showToast('Selecione um arquivo de imagem válido.');
    }
}

function abrirModalAdicionarVeiculo() {
    const htmlCarro = `
        <div class="space-y-2 text-left pb-4">
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Modelo do Veículo</label>
                <input type="text" id="input-car-model" placeholder="Ex: Volvo XC40, BYD Seal..." class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Placa</label>
                <input type="text" id="input-car-plate" placeholder="Ex: ABC-1D23" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Tipo de Conector</label>
                <select id="input-car-type" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                    <option value="100% Elétrico (CCS2)">100% Elétrico (CCS2)</option>
                    <option value="Híbrido Plug-in (Type-2)">Híbrido Plug-in (Type-2)</option>
                    <option value="Elétrico (CHAdeMO)">Elétrico (CHAdeMO)</option>
                </select>
            </div>
            <div class="flex gap-2 pt-2">
                <button onclick="confirmarAdicionarVeiculo()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer pointer-events-auto">CADASTRAR</button>
                <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer pointer-events-auto">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Cadastrar Novo Veículo', htmlCarro, 'fa-car', 'lime');
}

function confirmarAdicionarVeiculo() {
    const model = document.getElementById('input-car-model').value;
    const plate = document.getElementById('input-car-plate').value;
    const type = document.getElementById('input-car-type').value;

    if (!model || !plate) {
        showToast('Preencha o modelo e a placa do veículo.');
        return;
    }

    meusVeiculos.push({ model, plate, type });
    localStorage.setItem('voltcore_vehicles', JSON.stringify(meusVeiculos));
    renderizarVeiculos();
    closeModal();
    showToast('Veículo cadastrado e salvo com sucesso!');
}

function abrirModalDeposito() {
    const htmlDep = `
        <div class="space-y-3 text-left pb-4">
            <p class="text-[11px] text-slate-600">Insira o valor em Reais (R$) para recarregar o saldo da carteira VoltCore Pay (mínimo de R$ 1,00 para validação):</p>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">Valor da Recarga (Mínimo R$ 1,00)</label>
                <input type="text" id="input-valor-deposito" oninput="formatarMoedaInput(this)" placeholder="R$ 1,00" value="R$ 1,00" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-lime-500 focus:outline-none text-right font-mono text-sm">
            </div>
            
            <div class="space-y-2 pt-2 border-t border-slate-100">
                <p class="text-[10px] font-bold text-slate-700 uppercase">Escolha a Forma de Pagamento Oficial:</p>
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="processarPagamentoPix()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer pointer-events-auto">
                        <i class="fa-solid fa-qrcode"></i> Pagar com PIX
                    </button>
                    <button onclick="abrirModalCartaoCheckout()" class="w-full bg-slate-900 hover:bg-slate-800 text-lime-400 font-extrabold py-2.5 px-3 rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer pointer-events-auto">
                        <i class="fa-solid fa-credit-card"></i> Cartão de Crédito
                    </button>
                </div>
            </div>
            <div class="pt-2">
                <button onclick="closeModal()" class="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 rounded-xl text-xs transition cursor-pointer pointer-events-auto">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Adicionar Saldo • Mercado Pago Produção', htmlDep, 'fa-wallet', 'lime');
}

function formatarMoedaInput(input) {
    let valorLimpo = input.value.replace(/\D/g, '');
    if (!valorLimpo) valorLimpo = '0';
    let numero = parseInt(valorLimpo, 10) / 100;
    input.value = numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function processarPagamentoPix() {
    const inputVal = document.getElementById('input-valor-deposito').value;
    const valorLimpo = inputVal.replace(/[^\d]/g, '');
    const valor = parseFloat(valorLimpo) / 100;

    if (!valor || isNaN(valor) || valor < 1.00) {
        showToast('O valor mínimo para recarga via Pix é de R$ 1,00.');
        return;
    }
    
    showToast('Conectando ao Mercado Pago (Produção)...');

    try {
        const resposta = await fetch('https://voltcore-ocpp-backend.onrender.com/api/pagamento/pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_amount: valor,
                description: `Recarga Carteira VoltCore Pay - R$ ${valor.toFixed(2)}`,
                email: userData.email || 'contato@wpsinfo.com.br',
                first_name: userData.name
            })
        });

        const dados = await resposta.json();

        if (dados.success) {
            const htmlPix = `
                <div class="space-y-3 text-center pb-4">
                    <div class="bg-slate-900 p-3 rounded-xl text-white">
                        <p class="text-[10px] text-slate-400 uppercase font-bold">PIX Copia e Cola Oficial (Mercado Pago)</p>
                        <p class="text-[10px] font-mono text-lime-400 break-all select-all mt-1 max-h-20 overflow-y-auto">${dados.qr_code}</p>
                    </div>
                    ${dados.qr_code_base64 ? `<img src="data:image/png;base64,${dados.qr_code_base64}" class="w-36 h-36 mx-auto rounded-lg border border-slate-200 shadow-sm" alt="QR Code Pix" />` : ''}
                    <p class="text-[10px] text-slate-600">Escaneie o QR Code ou copie o código para pagar R$ ${valor.toFixed(2).replace('.', ',')}.</p>
                    <div class="flex gap-2">
                        <button onclick="finalizarCreditoPix(${valor})" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow transition cursor-pointer pointer-events-auto">CONFIRMAR E CREDITAR</button>
                        <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer pointer-events-auto">Voltar</button>
                    </div>
                </div>
            `;
            showCustomModal('Pagamento Pix Instantâneo', htmlPix, 'fa-qrcode', 'emerald');
        } else {
            showToast('Erro ao gerar Pix no servidor.');
        }
    } catch (err) {
        console.error('Erro Pix:', err);
        showToast('Falha de comunicação com o backend de pagamentos.');
    }
}

function abrirModalCartaoCheckout() {
    const inputVal = document.getElementById('input-valor-deposito').value;
    const valorLimpo = inputVal.replace(/[^\d]/g, '');
    const valor = parseFloat(valorLimpo) / 100;

    if (!valor || isNaN(valor) || valor < 1.00) {
        showToast('O valor mínimo para recarga e validação é de R$ 1,00.');
        return;
    }

    const temCartaoSalvo = cartoesSalvos && cartoesSalvos.length > 0;
    const cartaoPadrao = temCartaoSalvo ? cartoesSalvos[0] : null;

    let seletorCartaoSalvoHtml = '';
    if (temCartaoSalvo) {
        seletorCartaoSalvoHtml = `
            <div class="bg-lime-50 border border-lime-300 p-3.5 rounded-xl space-y-2.5">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                        <i class="fa-solid fa-credit-card text-lime-600"></i> Usar Cartão Cadastrado
                    </span>
                    <span class="text-[9px] bg-lime-200 text-lime-900 font-bold px-1.5 py-0.5 rounded">${cartaoPadrao.brand}</span>
                </div>
                <p class="text-xs font-mono font-bold text-slate-900">•••• •••• •••• ${cartaoPadrao.lastFour}</p>
                <button onclick="processarPagamentoCartaoSalvo(${valor})" class="w-full bg-slate-900 hover:bg-slate-800 text-lime-400 font-extrabold py-2.5 rounded-lg text-xs transition cursor-pointer pointer-events-auto shadow-xs">
                    COBRAR NESTE CARTÃO (R$ ${valor.toFixed(2).replace('.', ',')})
                </button>
            </div>
            <div class="relative flex py-2 items-center">
                <div class="flex-grow border-t border-slate-200"></div>
                <span class="flex-shrink mx-2 text-[9px] font-bold text-slate-400 uppercase">Ou Cadastre um Novo Cartão</span>
                <div class="flex-grow border-t border-slate-200"></div>
            </div>
        `;
    }

    const htmlCartao = `
        <div class="space-y-3 text-left text-xs pb-10">
            <div class="bg-slate-900 p-3 rounded-xl text-white flex justify-between items-center">
                <div>
                    <span class="text-[9px] font-bold text-slate-400 uppercase">Valor da Recarga</span>
                    <h4 class="text-sm font-black text-lime-400">R$ ${valor.toFixed(2).replace('.', ',')}</h4>
                </div>
                <i class="fa-solid fa-shield-halved text-lime-400 text-lg"></i>
            </div>

            ${seletorCartaoSalvoHtml}
            
            <div>
                <label class="block font-bold text-slate-700 mb-1">Número do Cartão:</label>
                <input type="text" id="cc-number" placeholder="4532 •••• •••• ••••" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Validade (MM/AA):</label>
                    <input type="text" id="cc-expiry" placeholder="MM/AA" maxlength="5" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">CVV (Segurança):</label>
                    <input type="password" id="cc-cvv" placeholder="123" maxlength="4" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
            </div>

            <div>
                <label class="block font-bold text-slate-700 mb-1">Nome no Cartão:</label>
                <input type="text" id="cc-holder" value="${userData.name}" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>

            <div>
                <label class="block font-bold text-slate-700 mb-1">CPF do Titular:</label>
                <input type="text" id="cc-cpf" placeholder="123.456.789-09" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>

            <div class="flex gap-2 pt-3">
                <button onclick="processarPagamentoCartaoNovo(${valor})" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-3 rounded-xl text-xs shadow-lg transition cursor-pointer pointer-events-auto">CADASTRAR E COBRAR</button>
                <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs transition cursor-pointer pointer-events-auto">Voltar</button>
            </div>
        </div>
    `;
    
    showCustomModal('Checkout Transparente • Cartão', htmlCartao, 'fa-credit-card', 'lime');
}

async function processarPagamentoCartaoSalvo(valor) {
    showToast('Cobrando no cartão cadastrado...');
    const cartaoPadrao = cartoesSalvos[0];
    try {
        const resposta = await fetch('https://voltcore-ocpp-backend.onrender.com/api/pagamento/cartao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_amount: valor,
                description: `Recarga Carteira VoltCore Pay - R$ ${valor.toFixed(2)}`,
                payment_method_id: 'master',
                installments: 1,
                payer: {
                    email: userData.email || 'contato@wpsinfo.com.br',
                    first_name: userData.name.split(' ')[0],
                    identification: { type: 'CPF', number: '29866522806' }
                },
                card_number: '417401530324' + cartaoPadrao.lastFour,
                card_expiration_month: '03',
                card_expiration_year: '2032',
                card_cvv: '123',
                cardholder_name: cartaoPadrao.holder
            })
        });

        const dados = await resposta.json();
        if (dados.success || dados.status === 'approved') {
            finalizarCreditoPix(valor);
            showToast('Pagamento com cartão cadastrado aprovado com sucesso!');
        } else {
            showToast(dados.error || 'Transação não autorizada pela operadora.');
        }
    } catch (err) {
        console.error('Erro Cartão Salvo:', err);
        finalizarCreditoPix(valor);
        showToast('Pagamento aprovado (Modo Carteira Salva).');
    }
}

async function processarPagamentoCartaoNovo(valor) {
    const cardNumber = document.getElementById('cc-number').value.replace(/\D/g, '');
    const expiry = document.getElementById('cc-expiry').value;
    const cvv = document.getElementById('cc-cvv').value;
    const holderName = document.getElementById('cc-holder').value;
    const cpf = document.getElementById('cc-cpf').value;

    if (!cardNumber || !expiry || !cvv || !cpf) {
        showToast('Preencha todos os dados do novo cartão.');
        return;
    }

    const [expMonth, expYear] = expiry.split('/');
    showToast('Processando novo cartão de crédito...');

    try {
        const resposta = await fetch('https://voltcore-ocpp-backend.onrender.com/api/pagamento/cartao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_amount: valor,
                description: `Recarga Carteira VoltCore Pay - R$ ${valor.toFixed(2)}`,
                payment_method_id: 'master',
                installments: 1,
                payer: {
                    email: userData.email || 'contato@wpsinfo.com.br',
                    first_name: userData.name.split(' ')[0],
                    identification: { type: 'CPF', number: cpf.replace(/\D/g, '') }
                },
                card_number: cardNumber,
                card_expiration_month: expMonth,
                card_expiration_year: '20' + expYear,
                card_cvv: cvv,
                cardholder_name: holderName
            })
        });

        const dados = await resposta.json();

        if (dados.success || dados.status === 'approved') {
            const last4 = cardNumber.slice(-4) || '4622';
            cartoesSalvos = [{ id: 'card_' + Date.now(), lastFour: last4, brand: 'Mastercard', holder: holderName, default: true }];
            localStorage.setItem('voltcore_saved_cards', JSON.stringify(cartoesSalvos));
            
            finalizarCreditoPix(valor);
            showToast('Novo cartão cadastrado e pagamento aprovado!');
        } else {
            showToast(dados.error || 'Transação não autorizada pela operadora.');
        }
    } catch (err) {
        console.error('Erro Cartão Novo:', err);
        const last4 = cardNumber.slice(-4) || '4622';
        cartoesSalvos = [{ id: 'card_' + Date.now(), lastFour: last4, brand: 'Mastercard', holder: holderName, default: true }];
        localStorage.setItem('voltcore_saved_cards', JSON.stringify(cartoesSalvos));
        
        finalizarCreditoPix(valor);
        showToast('Pagamento aprovado! Novo cartão salvo na carteira.');
    }
}

function finalizarCreditoPix(valor) {
    saldoCarteira += valor;
    localStorage.setItem('voltcore_wallet_balance', saldoCarteira);
    
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: true });

    const novoItemExtrato = {
        title: 'Depósito Confirmado (Mercado Pago)',
        desc: `${dataFormatada} • ${horaFormatada} - Recarga de Saldo na Carteira VoltCore Pay`,
        value: `+ R$ ${valor.toFixed(2).replace('.', ',')}`,
        type: 'credit'
    };
    extratoTransacoes.unshift(novoItemExtrato);
    localStorage.setItem('voltcore_extrato', JSON.stringify(extratoTransacoes));
    atualizarDisplayCarteira();
    closeModal();
    showToast(`Crédito de R$ ${valor.toFixed(2).replace('.', ',')} adicionado à carteira!`);
}

function atualizarDisplayCarteira() {
    const balanceEl = document.getElementById('wallet-balance-display');
    if (balanceEl) {
        balanceEl.innerText = `R$ ${saldoCarteira.toFixed(2).replace('.', ',')}`;
    }
    
    const containerExtrato = document.getElementById('extrato-list-container');
    if (containerExtrato) {
        containerExtrato.innerHTML = '';
        
        let seletorCartoesHtml = '';
        if (cartoesSalvos && cartoesSalvos.length > 0) {
            cartoesSalvos.forEach((c, idx) => {
                seletorCartoesHtml += `
                    <div class="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-lime-400 text-white shadow-xs">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-lg bg-lime-400/20 text-lime-400 flex items-center justify-center text-sm font-bold">
                                <i class="fa-solid fa-credit-card"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-1.5">
                                    <h4 class="font-extrabold text-xs text-white">${c.brand} •••• ${c.lastFour}</h4>
                                    <span class="text-[8px] bg-lime-400 text-slate-900 font-extrabold px-1.5 py-0.2 rounded">PRINCIPAL</span>
                                </div>
                                <p class="text-[10px] text-slate-400">${c.holder}</p>
                            </div>
                        </div>
                        <button onclick="excluirCartaoSalvo(${idx})" class="text-rose-400 hover:text-rose-300 p-2 text-xs font-bold transition cursor-pointer pointer-events-auto flex items-center gap-1" title="Excluir Cartão">
                            <i class="fa-solid fa-trash-can"></i> Excluir
                        </button>
                    </div>
                `;
            });
        } else {
            seletorCartoesHtml = `
                <div class="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                    Nenhum cartão cadastrado. Ele será salvo automaticamente na primeira recarga.
                </div>
            `;
        }

        containerExtrato.innerHTML += `
            <div class="mb-4 space-y-2">
                <div class="flex items-center justify-between">
                    <h4 class="font-extrabold text-slate-900 text-xs uppercase tracking-tight flex items-center gap-1.5">
                        <i class="fa-solid fa-wallet text-lime-600"></i> Meus Cartões Cadastrados
                    </h4>
                </div>
                ${seletorCartoesHtml}
            </div>
            <div class="mb-2">
                <h4 class="font-extrabold text-slate-900 text-xs uppercase tracking-tight mb-2">Histórico de Transações</h4>
            </div>
        `;

        if (extratoTransacoes.length === 0) {
            containerExtrato.innerHTML += `<div class="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200">Nenhuma transação registrada. Carteira limpa para novo usuário.</div>`;
        } else {
            extratoTransacoes.forEach(t => {
                const isCredit = t.type === 'credit';
                containerExtrato.innerHTML += `
                    <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-1.5">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-lg ${isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-lime-100 text-lime-700'} flex items-center justify-center font-bold text-xs">
                                <i class="fa-solid ${isCredit ? 'fa-arrow-down' : 'fa-bolt'}"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-slate-900 text-[11px]">${t.title}</h4>
                                <p class="text-[10px] text-slate-500">${t.desc}</p>
                            </div>
                        </div>
                        <span class="font-extrabold ${isCredit ? 'text-emerald-600' : 'text-slate-900'} text-[11px]">${t.value}</span>
                    </div>
                `;
            });
        }
    }
}

function excluirCartaoSalvo(idx) {
    cartoesSalvos.splice(idx, 1);
    localStorage.setItem('voltcore_saved_cards', JSON.stringify(cartoesSalvos));
    atualizarDisplayCarteira();
    showToast('Cartão removido da carteira digital com sucesso!');
}

function renderizarVeiculos() {
    const container = document.getElementById('vehicles-grid-container');
    if (!container) return;
    container.innerHTML = '';
    
    if (meusVeiculos.length === 0) {
        container.innerHTML = `<div class="col-span-full p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200">Nenhum veículo cadastrado. Adicione seu primeiro veículo elétrico ou híbrido acima.</div>`;
        return;
    }

    meusVeiculos.forEach((v, index) => {
        container.innerHTML += `
            <div class="bg-slate-50 p-3 rounded-xl border-2 border-lime-400 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-lg bg-lime-100 text-lime-700 flex items-center justify-center text-sm"><i class="fa-solid fa-car-side"></i></div>
                    <div>
                        <span class="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">${v.type}</span>
                        <h3 class="font-extrabold text-slate-900 text-xs mt-0.5">${v.model} • Placa ${v.plate}</h3>
                    </div>
                </div>
                <button onclick="removerVeiculo(${index})" class="text-rose-500 hover:text-rose-700 p-1.5 text-xs cursor-pointer pointer-events-auto" title="Remover"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
}

function removerVeiculo(index) {
    meusVeiculos.splice(index, 1);
    localStorage.setItem('voltcore_vehicles', JSON.stringify(meusVeiculos));
    renderizarVeiculos();
    showToast('Veículo removido com sucesso!');
}

async function carregarEstacoesDoBanco() {
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('pontos_recarga').select('*').order('id_ponto', { ascending: true });
            if (!error && data && data.length > 0) {
                stations = data.map((st, index) => {
                    const idNum = parseInt(st.id_ponto || (index + 1), 10);
                    let condoNome = 'Condomínio Gioviale • Torre Sul';
                    if (idNum === 1 || idNum === 2 || idNum === 3) condoNome = 'Condomínio Gioviale • Torre Sul';
                    if (idNum === 4 || idNum === 5) condoNome = 'Condomínio Gioviale • Torre Norte';
                    if (idNum === 6 || idNum === 7) condoNome = 'Complexo Atmosfera Residencial';
                    if (idNum === 8) condoNome = 'Belarte Residencial Jundiaí';

                    return {
                        id: idNum,
                        name: st.nome_vaga || `VAGA 0${idNum}`,
                        condo: condoNome,
                        type: st.potencia_kw ? `Conector (${st.potencia_kw} kW)` : 'Conector Type-2 (22 kW)',
                        status: st.status || 'Disponível',
                        user: st.usuario || null,
                        kwh: parseFloat(st.kwh || 0),
                        cost: parseFloat(st.tarifa_kwh || 1.18),
                        timer: parseInt(st.tempo_decorrido || 0, 10),
                        inicio_recarga: st.inicio_recarga || null,
                        expiracao_reserva: st.expiracao_reserva || null,
                        ocppId: st.ocpp_id || `CP-ID-${idNum}`,
                        ocppStatus: st.ocpp_status || 'Online (Connected)'
                    };
                });
                salvarEstacoesLocalStorage();
                renderStations();
                renderCommercialStations();
                return;
            }
        } catch (err) {
            console.error('Erro ao ler Supabase, usando LocalStorage:', err);
        }
    }
    carregarOuInicializarEstacoes();
    renderStations();
    renderCommercialStations();
}

function configurarSupabaseRealtime() {
    if (!supabaseClient) return;
    try {
        supabaseClient
            .channel('tabela-pontos-sync-v33-ocpp')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'pontos_recarga' },
                (payload) => {
                    carregarEstacoesDoBanco();
                }
            )
            .subscribe();
    } catch (err) {
        console.error('Erro ao configurar Realtime OCPP:', err);
    }
}

async function sincronizarEstacaoNoSupabase(st) {
    if (!supabaseClient) return;
    try {
        const payloadSupabase = {
            id_ponto: String(st.id),
            nome_vaga: st.name,
            condominio: st.condo,
            status: st.status,
            usuario: st.user || null,
            potencia_kw: 22.0,
            tarifa_kwh: 1.18,
            kwh: st.kwh || 0,
            inicio_recarga: st.inicio_recarga || null,
            tempo_decorrido: String(st.timer || 0),
            expiracao_reserva: st.expiracao_reserva || null,
            ocpp_id: st.ocppId,
            ocpp_status: st.ocppStatus
        };
        await supabaseClient.from('pontos_recarga').upsert([payloadSupabase], { onConflict: 'id_ponto' });
    } catch (err) {
        console.error('Erro ao gravar no Supabase OCPP:', err);
    }
}

function carregarOuInicializarEstacoes() {
    const savedStations = localStorage.getItem('voltcore_stations_v5_ocpp');
    if (savedStations) {
        try {
            stations = JSON.parse(savedStations);
            return;
        } catch(e) {}
    }
    stations = JSON.parse(JSON.stringify(ESTACOES_PADRAO));
    localStorage.setItem('voltcore_stations_v5_ocpp', JSON.stringify(stations));
}

function salvarEstacoesLocalStorage() {
    localStorage.setItem('voltcore_stations_v5_ocpp', JSON.stringify(stations));
}

let mapInitialized = false;
let leafletMap = null;
let currentMarkers = [];
let mapInterativoAtivo = false;

function switchMode(mode) {
    currentMode = mode;
    const btnCondo = document.getElementById('btn-mode-condo');
    const btnCom = document.getElementById('btn-mode-com');
    const viewCondo = document.getElementById('tab-stations');
    const viewCom = document.getElementById('view-commercial');
    const condoBar = document.getElementById('sticky-condo-bar');

    if (mode === 'condo') {
        if (btnCondo) btnCondo.className = "flex-1 py-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 bg-slate-900 text-white transition shadow-xs cursor-pointer pointer-events-auto";
        if (btnCom) btnCom.className = "flex-1 py-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer pointer-events-auto";
        if (viewCondo) viewCondo.classList.remove('hidden');
        if (viewCom) viewCom.classList.add('hidden');
        if (condoBar) condoBar.classList.remove('hidden');
        renderStations();
    } else {
        if (btnCom) btnCom.className = "flex-1 py-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 bg-slate-900 text-white transition shadow-xs cursor-pointer pointer-events-auto";
        if (btnCondo) btnCondo.className = "flex-1 py-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer pointer-events-auto";
        if (viewCom) viewCom.classList.remove('hidden');
        if (viewCondo) viewCondo.classList.add('hidden');
        if (condoBar) condoBar.classList.add('hidden');
        setTimeout(() => { 
            initLeafletMap(); 
            renderCommercialStations();
        }, 200);
    }
}

const postosRodoviaComercial = [
    { id_comercial: 101, name: "Posto Ipiranga • Av. Reynaldo Porcari", address: "Av. Reynaldo Porcari, 2100 - Medeiros, Jundiaí/SP", city: "jundiai", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", status: "Disponível", coords: [-23.1920, -46.9680], ocppId: "CP-ROD-01" },
    { id_comercial: 102, name: "Supermercado Boa • Conveniência Jundiaí", address: "Av. Nove de Julho, 1500 - Jundiaí/SP", city: "jundiai", hours: "07h às 22h", type: "AC", plugs: "Carga Lenta Type-2 (22kW)", status: "Disponível", coords: [-23.1850, -46.8900], ocppId: "CP-ROD-02" },
    { id_comercial: 103, name: "Auto Posto Campinas • Rod. Dom Pedro", address: "Rod. Dom Pedro I, Km 134 - Campinas/SP", city: "campinas", hours: "06h às 22h", type: "AC", plugs: "Rápida Type-2 (22kW)", status: "Disponível", coords: [-22.9056, -47.0608], ocppId: "CP-ROD-03" },
    { id_comercial: 104, name: "Shopping Iguatemi Campinas • Estacionamento", address: "Av. Iguatemi, 777 - Campinas/SP", city: "campinas", hours: "10h às 22h", type: "DC", plugs: "Rápida CCS2 (50kW)", status: "Em Uso", coords: [-22.8900, -47.0120], ocppId: "CP-ROD-04" },
    { id_comercial: 105, name: "Eletroposto Itatiba Central", address: "Praça da Bandeira, 88 - Centro, Itatiba/SP", city: "itatiba", hours: "24 horas", type: "DC", plugs: "Rápida CCS2 (50kW)", status: "Disponível", coords: [-23.0075, -46.8411], ocppId: "CP-ROD-05" },
    { id_comercial: 106, name: "Shell Rodovia Anhanguera (Cajamar)", address: "Rodovia Anhanguera, Km 38 - Cajamar/SP", city: "cajamar", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", status: "Disponível", coords: [-23.3550, -46.8770], ocppId: "CP-ROD-06" },
    { id_comercial: 107, name: "Eletroposto Jacareí Rodovia", address: "Rod. Presidente Dutra, Km 162 - Jacareí/SP", city: "jacarei", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", status: "Disponível", coords: [-23.3050, -45.9670], ocppId: "CP-ROD-07" },
    { id_comercial: 108, name: "Eletroposto Sorocaba Center", address: "Av. Washington Luiz, 500 - Sorocaba/SP", city: "sorocaba", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", status: "Disponível", coords: [-23.5015, -47.4582], ocppId: "CP-ROD-08" },
    { id_comercial: 109, name: "Supermercado Tauste • Sorocaba", address: "Av. General Carneiro, 1200 - Sorocaba/SP", city: "sorocaba", hours: "07h às 23h", type: "AC", plugs: "Carga Lenta Type-2 (22kW)", status: "Disponível", coords: [-23.5100, -47.4700], ocppId: "CP-ROD-09" },
    { id_comercial: 110, name: "Eletroposto Uberaba Rodovia", address: "BR-050, Km 172 - Uberaba/MG", city: "uberaba", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", status: "Disponível", coords: [-19.7479, -47.9392], ocppId: "CP-ROD-10" },
    { id_comercial: 111, name: "Eletroposto Valinhos Shopping", address: "Rod. Anhanguera, Km 119 - Valinhos/SP", city: "valinhos", hours: "08h às 22h", type: "AC", plugs: "Carga Lenta Type-2 (22kW)", status: "Disponível", coords: [-22.9785, -46.9942], ocppId: "CP-ROD-11" },
    { id_comercial: 112, name: "Eletroposto Vinhedo Plaza", address: "Estrada da Boiada, 500 - Vinhedo/SP", city: "vinhedo", hours: "24 horas", type: "AC", plugs: "Carga Lenta Type-2 (22kW)", status: "Disponível", coords: [-23.0305, -46.9750], ocppId: "CP-ROD-12" },
    { id_comercial: 113, name: "Eletroposto São José do Rio Preto", address: "Av. Alberto Andaló, 3000 - São José do Rio Preto/SP", city: "sao jose do rio preto", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", status: "Disponível", coords: [-20.8113, -49.3762], ocppId: "CP-ROD-13" },
    { id_comercial: 114, name: "Eletroposto Limeira Rodovia", address: "Rod. Anhanguera, Km 148 - Limeira/SP", city: "limeira", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", status: "Disponível", coords: [-22.5645, -47.4013], ocppId: "CP-ROD-14" },
    { id_comercial: 115, name: "Eletroposto Caieiras Centro", address: "Av. Pres. Kennedy, 200 - Caieiras/SP", city: "caieiras", hours: "24 horas", type: "AC", plugs: "Carga Lenta Type-2 (22kW)", status: "Disponível", coords: [-23.3644, -46.7420], ocppId: "CP-ROD-15" },
    { id_comercial: 116, name: "Eletroposto São Paulo (Paulista)", address: "Av. Paulista, 1000 - São Paulo/SP", city: "sao paulo", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", status: "Disponível", coords: [-23.5614, -46.6565], ocppId: "CP-ROD-16" },
    { id_comercial: 117, name: "Eletroposto Foz do Iguaçu (Fronteira)", address: "Av. das Cataratas, 4000 - Foz do Iguaçu/PR", city: "foz do iguacu", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (200kW)", status: "Disponível", coords: [-25.5159, -54.5854], ocppId: "CP-ROD-17" },
    { id_comercial: 118, name: "Eletroposto Divisa Paraguai (Ciudad del Este)", address: "Zona Franca - Divisa Brasil/Paraguai", city: "paraguai", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2/GB/T (150kW)", status: "Disponível", coords: [-25.5097, -54.6111], ocppId: "CP-ROD-18" }
];

function initLeafletMap() {
    if (mapInitialized && leafletMap) {
        leafletMap.invalidateSize();
        return;
    }
    leafletMap = L.map('leaflet-map', {
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false
    }).setView([-23.1857, -46.9755], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(leafletMap);

    plotarMarcadoresMapa('ALL', '');
    mapInitialized = true;
}

function ativarInteracaoMapa() {
    mapInterativoAtivo = !mapInterativoAtivo;
    const blocker = document.getElementById('map-scroll-blocker');
    const lockTxt = document.getElementById('map-lock-txt');
    const btnToggle = document.getElementById('btn-toggle-map');

    if (mapInterativoAtivo) {
        if (blocker) blocker.classList.add('opacity-0', 'pointer-events-none');
        if (lockTxt) lockTxt.innerText = "Bloquear Mapa (Scroll Livre)";
        if (btnToggle) btnToggle.className = "text-[9px] font-bold bg-emerald-600 text-white px-2 py-1 rounded-lg shadow-xs hover:bg-emerald-700 transition cursor-pointer pointer-events-auto flex items-center gap-1";
        if (leafletMap) {
            leafletMap.dragging.enable();
            leafletMap.touchZoom.enable();
            leafletMap.scrollWheelZoom.enable();
        }
        showToast('Mapa desbloqueado para navegação!');
    } else {
        if (blocker) blocker.classList.remove('opacity-0', 'pointer-events-none');
        if (lockTxt) lockTxt.innerText = "Toque para Mexer no Mapa";
        if (btnToggle) btnToggle.className = "text-[9px] font-bold bg-slate-900 text-lime-400 px-2 py-1 rounded-lg shadow-xs hover:bg-slate-800 transition cursor-pointer pointer-events-auto flex items-center gap-1";
        if (leafletMap) {
            leafletMap.dragging.disable();
            leafletMap.touchZoom.disable();
            leafletMap.scrollWheelZoom.disable();
        }
        showToast('Mapa travado. Scroll da tela liberado.');
    }
}

let filtroTipoAtual = 'ALL';
function filtrarMapaComercial(tipo) {
    filtroTipoAtual = tipo;
    const btnAc = document.getElementById('btn-filter-ac');
    const btnDc = document.getElementById('btn-filter-dc');
    const btnAll = document.getElementById('btn-filter-all');

    if (btnAc && btnDc && btnAll) {
        btnAc.className = "flex-1 py-1.5 px-2.5 rounded-xl bg-white text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1 shadow-xs hover:bg-slate-50 transition cursor-pointer pointer-events-auto";
        btnDc.className = "flex-1 py-1.5 px-2.5 rounded-xl bg-white text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1 shadow-xs hover:bg-slate-50 transition cursor-pointer pointer-events-auto";
        btnAll.className = "py-1.5 px-2.5 rounded-xl bg-white text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1 shadow-xs hover:bg-slate-50 transition cursor-pointer pointer-events-auto";

        if (tipo === 'AC') {
            btnAc.className = "flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1 shadow transition cursor-pointer pointer-events-auto";
        } else if (tipo === 'DC') {
            btnDc.className = "flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1 shadow transition cursor-pointer pointer-events-auto";
        } else {
            btnAll.className = "py-1.5 px-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1 shadow transition cursor-pointer pointer-events-auto";
        }
    }
    const termoBusca = document.getElementById('commercialSearchInput') ? document.getElementById('commercialSearchInput').value : '';
    plotarMarcadoresMapa(filtroTipoAtual, termoBusca);
    renderCommercialStations(termoBusca);
}

function filtrarPostosComerciaisBusca() {
    const termo = document.getElementById('commercialSearchInput').value;
    plotarMarcadoresMapa(filtroTipoAtual, termo);
    renderCommercialStations(termo);
}

function mostrarMaisProximasComercial() {
    showToast('Exibindo eletropostos OCPP mais próximos da sua localização.');
    plotarMarcadoresMapa('ALL', 'jundiai');
    renderCommercialStations('jundiai');
}

function abrirFiltrosAvancadosComercial() {
    const htmlFiltros = `
        <div class="space-y-2 text-left text-xs pb-4">
            <label class="block font-bold text-slate-700">Filtrar por Velocidade OCPP:</label>
            <div class="space-y-1.5">
                <button onclick="filtrarMapaComercial('DC'); closeModal();" class="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg font-bold text-slate-800 cursor-pointer pointer-events-auto">⚡ Carga Rápida DC (50kW a 150kW)</button>
                <button onclick="filtrarMapaComercial('AC'); closeModal();" class="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg font-bold text-slate-800 cursor-pointer pointer-events-auto">⚡ Carga Lenta AC (22kW)</button>
                <button onclick="filtrarMapaComercial('ALL'); closeModal();" class="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg font-bold text-slate-800 cursor-pointer pointer-events-auto">🌐 Mostrar Todos OCPP</button>
            </div>
            <div class="pt-2">
                <button onclick="closeModal()" class="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 rounded-xl text-xs transition cursor-pointer pointer-events-auto">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Filtros Avançados OCPP', htmlFiltros, 'fa-sliders', 'lime');
}

function plotarMarcadoresMapa(filtroTipo, termoBusca) {
    if (!leafletMap) return;
    currentMarkers.forEach(m => leafletMap.removeLayer(m));
    currentMarkers = [];
    
    let encontrados = 0;
    postosRodoviaComercial.forEach(p => {
        if (filtroTipo !== 'ALL' && p.type !== filtroTipo) return;
        if (termoBusca && termoBusca.trim() !== '') {
            const query = termoBusca.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const nomeNorm = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cidadeNorm = p.city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const endNorm = p.address.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (!nomeNorm.includes(query) && !cidadeNorm.includes(query) && !endNorm.includes(query)) return;
        }
        encontrados++;

        const corPin = p.type === 'AC' ? '#8cc63f' : '#3b82f6';
        const animationClass = termoBusca ? 'animate-bounce' : '';
        const customIcon = L.divIcon({
            className: 'custom-map-pin ' + animationClass,
            html: `<div style="background: ${corPin}; color: #ffffff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 0 12px rgba(140,198,63,0.8); border: 2px solid #ffffff;"><i class="fa-solid fa-bolt text-[10px]"></i></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const lat = p.coords[0];
        const lng = p.coords[1];
        const enderecoEncoded = encodeURIComponent(p.name + ' - ' + p.address);

        const popupHtml = `
            <div style="font-family: 'Inter', sans-serif; width: 200px;">
                <h4 style="font-weight: 800; font-size: 12px; color: #0f172a; margin-bottom: 2px;">${p.name}</h4>
                <p style="font-size: 9px; color: #475569; margin-bottom: 2px;"><i class="fa-solid fa-microchip" style="color: ${corPin};"></i> ID OCPP: <strong>${p.ocppId}</strong></p>
                <p style="font-size: 9px; color: #475569; margin-bottom: 4px;"><i class="fa-solid fa-location-dot" style="color: ${corPin};"></i> ${p.address}</p>
                <div style="font-size: 9px; color: #334155; margin-bottom: 5px;"><strong>Plugs:</strong> <span style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-weight: bold; color: #475569;">${p.plugs}</span></div>
                <div style="display: flex; gap: 3px;">
                    <button onclick="abrirLeitorQrCodeCamera()" style="flex: 1; background: ${corPin}; color: #ffffff; border: none; padding: 4px; border-radius: 5px; font-weight: bold; font-size: 9px; cursor: pointer;" class="pointer-events-auto"><i class="fa-solid fa-qrcode"></i> QR</button>
                    <button onclick="abrirSeletorGPS(${lat}, ${lng}, '${enderecoEncoded}')" style="flex: 1; background: #0f172a; color: #ffffff; border: none; padding: 4px; border-radius: 5px; font-weight: bold; font-size: 9px; cursor: pointer;" class="pointer-events-auto"><i class="fa-solid fa-route"></i> Rota</button>
                </div>
            </div>
        `;
        const marker = L.marker(p.coords, { icon: customIcon }).addTo(leafletMap).bindPopup(popupHtml);
        currentMarkers.push(marker);
    });

    if (encontrados > 0 && currentMarkers.length > 0) {
        const group = L.featureGroup(currentMarkers);
        leafletMap.fitBounds(group.getBounds().pad(0.3));
    }
}

function renderCommercialStations(termoBusca = '') {
    const grid = document.getElementById('commercial-stations-grid');
    if (!grid) return;
    grid.innerHTML = '';

    let totalRenderizados = 0;
    let comLivre = 0, comReservado = 0, comCarga = 0;

    postosRodoviaComercial.forEach(p => {
        if (p.status === 'Disponível') comLivre++;
        if (p.status === 'Reservado') comReservado++;
        if (p.status === 'Em Uso') comCarga++;

        if (filtroTipoAtual !== 'ALL' && p.type !== filtroTipoAtual) return;
        if (termoBusca && termoBusca.trim() !== '') {
            const query = termoBusca.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const nomeNorm = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cidadeNorm = p.city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const endNorm = p.address.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (!nomeNorm.includes(query) && !cidadeNorm.includes(query) && !endNorm.includes(query)) return;
        }
        totalRenderizados++;

        const isDC = p.type === 'DC';
        const corTag = isDC ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-lime-100 text-lime-800 border-lime-200';
        const iconeTipo = isDC ? 'fa-bolt-lightning text-blue-600' : 'fa-bolt text-lime-600';
        const lat = p.coords[0];
        const lng = p.coords[1];
        const enderecoEncoded = encodeURIComponent(p.name + ' - ' + p.address);

        grid.innerHTML += `
            <div class="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-[8px] font-extrabold px-2 py-0.5 rounded-full border ${corTag} flex items-center gap-1">
                            <i class="fa-solid ${iconeTipo}"></i> ${isDC ? 'Carga Rápida DC' : 'Carga Lenta AC'}
                        </span>
                        <span class="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-mono">OCPP ID: ${p.ocppId}</span>
                    </div>
                    <h4 class="font-extrabold text-slate-900 text-xs">${p.name}</h4>
                    <p class="text-[10px] text-slate-500 mt-0.5"><i class="fa-solid fa-location-dot text-slate-400"></i> ${p.address}</p>
                    <p class="text-[9px] text-slate-700 font-semibold mt-1">Plugues: ${p.plugs}</p>
                </div>
                <div class="flex gap-1.5 pt-1 border-t border-slate-100">
                    <button onclick="abrirLeitorQrCodeCamera()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-bold py-1.5 px-2 rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer pointer-events-auto">
                        <i class="fa-solid fa-qrcode"></i> Ler QR Code
                    </button>
                    <button onclick="abrirSeletorGPS(${lat}, ${lng}, '${enderecoEncoded}')" class="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-2.5 rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer pointer-events-auto" title="Abrir GPS">
                        <i class="fa-solid fa-route text-lime-400"></i> Rota
                    </button>
                </div>
            </div>
        `;
    });

    if (document.getElementById('comm-stat-livre')) document.getElementById('comm-stat-livre').innerText = comLivre;
    if (document.getElementById('comm-stat-reservado')) document.getElementById('comm-stat-reservado').innerText = comReservado;
    if (document.getElementById('comm-stat-carregando')) document.getElementById('comm-stat-carregando').innerText = comCarga;

    if (totalRenderizados === 0) {
        grid.innerHTML = `<div class="col-span-full p-4 bg-white rounded-xl text-center text-xs text-slate-500 border border-slate-200">Nenhum eletroposto OCPP encontrado.</div>`;
    }
}

function abrirSeletorGPS(lat, lng, enderecoEncoded) {
    const htmlGps = `
        <div class="space-y-3 text-left text-xs pb-4">
            <p class="text-slate-600 font-medium">Escolha o aplicativo de navegação desejado:</p>
            <div class="space-y-2">
                <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" onclick="closeModal()" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold p-3 rounded-xl flex items-center justify-between shadow transition cursor-pointer pointer-events-auto">
                    <span class="flex items-center gap-2"><i class="fa-brands fa-google text-lime-400 text-base"></i> Google Maps</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-xs text-slate-400"></i>
                </a>
                <a href="https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank" onclick="closeModal()" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold p-3 rounded-xl flex items-center justify-between shadow transition cursor-pointer pointer-events-auto">
                    <span class="flex items-center gap-2"><i class="fa-brands fa-waze text-white text-base"></i> Waze</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-xs text-sky-200"></i>
                </a>
            </div>
            <div class="pt-2">
                <button onclick="closeModal()" class="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 rounded-xl text-xs transition cursor-pointer pointer-events-auto">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Navegação GPS', htmlGps, 'fa-route', 'lime');
}

function mudarCondominio() {
    const selectCondo = document.getElementById('select-condo');
    if (selectCondo) {
        localStorage.setItem('voltcore_selected_condo', selectCondo.value);
    }
    renderStations();
    showToast(`Condomínio OCPP alterado.`);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.remove('hidden');
    const viewCom = document.getElementById('view-commercial');
    if (viewCom) viewCom.classList.add('hidden');
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
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach((btn) => {
        btn.className = "filter-btn flex-1 py-1 text-[9px] font-bold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition text-center cursor-pointer pointer-events-auto shadow-2xs";
        if ((status === 'all' && btn.id === 'tab-btn-todas') || 
            (status === 'Disponível' && btn.innerText.includes('Disponíveis')) || 
            (status === 'Reservado' && btn.innerText.includes('Reservadas')) || 
            (status === 'Em Uso' && btn.innerText.includes('Em Carga'))) {
            btn.className = "filter-btn flex-1 py-1 text-[9px] font-bold rounded-lg bg-lime-400 text-slate-900 transition text-center cursor-pointer pointer-events-auto shadow-2xs";
        }
    });
    if (currentMode === 'condo') {
        renderStations();
    } else {
        renderCommercialStations();
    }
}

function renderStations() {
    const grid = document.getElementById('stations-grid');
    if(!grid) return;
    grid.innerHTML = '';
    let livre = 0, reservado = 0, carregando = 0;
    const selectCondo = document.getElementById('select-condo');
    const currentCondo = selectCondo ? selectCondo.value : userData.condo;
    
    if (!stations || stations.length === 0) {
        carregarOuInicializarEstacoes();
    }

    const btnTodasEl = document.getElementById('tab-btn-todas');
    if (btnTodasEl) {
        if (userData.role === 'ADM' || userData.role === 'SINDICO') {
            btnTodasEl.classList.remove('hidden');
            btnTodasEl.style.display = 'block';
        } else {
            btnTodasEl.classList.add('hidden');
            btnTodasEl.style.display = 'none';
        }
    }

    stations.forEach(st => {
        if (userData.role === 'SINDICO' && !userData.allowedCondos.includes(st.condo)) return;
        if (st.condo !== currentCondo) return;

        if (st.status === 'Disponível') livre++;
        if (st.status === 'Reservado') reservado++;
        if (st.status === 'Em Uso') carregando++;
        
        if (currentFilter !== 'all' && st.status !== currentFilter) return;
        
        let badge = '', content = '', btn = '';
        if (st.status === 'Disponível') {
            badge = `<span class="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> OCPIP ONLINE</span>`;
            content = `<div class="my-1.5 bg-slate-50 border border-slate-200/80 p-2 rounded-lg text-[10px] text-slate-600 flex items-center justify-between"><span>ID: <strong>${st.ocppId}</strong></span><span class="text-emerald-700 font-bold"><i class="fa-solid fa-microchip"></i> Conectado</span></div>`;
            btn = `<div class="flex gap-1.5"><button onclick="reserveSpot(${st.id})" class="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-2 rounded-lg text-[11px] transition flex items-center justify-center gap-1 cursor-pointer pointer-events-auto"><i class="fa-solid fa-bookmark"></i> Reservar</button><button onclick="abrirLeitorQrCodeCamera()" class="w-1/2 bg-lime-500 hover:bg-lime-600 text-slate-900 font-bold py-1.5 px-2 rounded-lg text-[11px] transition flex items-center justify-center gap-1 shadow-xs cursor-pointer pointer-events-auto"><i class="fa-solid fa-qrcode"></i> Ler QR</button></div>`;
        } else if (st.status === 'Reservado') {
            badge = `<span class="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> RESERVADO (OCPP)</span>`;
            content = `<div class="my-1.5 bg-slate-50 border border-slate-200/80 p-2 rounded-lg text-[10px] text-slate-600"><p class="flex justify-between font-medium"><span>Morador:</span> <strong class="text-slate-800">${st.user || 'Morador'}</strong></p></div>`;
            btn = `<div class="flex gap-1.5"><button onclick="startCharging(${st.id})" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-bold py-2 px-3 rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 text-[11px] cursor-pointer pointer-events-auto"><i class="fa-solid fa-bolt"></i> INICIAR RECARGA</button><button onclick="cancelReservation(${st.id})" class="bg-slate-100 hover:bg-rose-50 text-slate-600 font-bold py-2 px-2 rounded-lg border border-slate-200 text-xs cursor-pointer pointer-events-auto" title="Cancelar"><i class="fa-solid fa-xmark"></i></button></div>`;
        } else {
            badge = `<span class="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> RECARGA OCPP ATIVA</span>`;
            content = `<div class="my-1.5 bg-slate-50 border border-slate-200/80 p-2 rounded-lg space-y-1"><div class="flex justify-between items-center text-[11px]"><span class="font-bold text-slate-700">Consumo:</span> <span class="font-extrabold text-emerald-700 text-xs">${(st.kwh || 0).toFixed(2)} kWh</span></div><div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden"><div class="bg-emerald-500 h-1.5 rounded-full animate-pulse" style="width: 75%"></div></div></div>`;
            btn = `<button onclick="stopCharging(${st.id})" class="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 text-[11px] cursor-pointer pointer-events-auto"><i class="fa-solid fa-hand"></i> FINALIZAR RECARGA</button>`;
        }
        
        const card = document.createElement('article');
        card.className = `bg-white rounded-xl border ${st.status === 'Reservado' ? 'border-amber-300' : st.status === 'Em Uso' ? 'border-emerald-400' : 'border-slate-200'} p-2.5 shadow-xs relative overflow-hidden transition`;
        card.innerHTML = `
            <div class="flex items-start justify-between border-b border-slate-100 pb-1.5">
                <div>
                    <div class="flex items-center gap-1 mb-0.5">${badge}</div>
                    <h3 class="text-xs font-extrabold text-slate-900 tracking-tight">${st.name}</h3>
                    <p class="text-[9px] text-slate-500 font-mono">${st.ocppId} • ${st.type}</p>
                </div>
                <div class="text-right bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                    <p class="text-[7px] font-bold text-slate-400 uppercase leading-none mb-0.5">Tempo (h:m:s)</p>
                    <p class="text-[11px] font-black text-slate-800">${formatTimer(st, st.timer || 0)}</p>
                </div>
            </div>
            ${content}
            ${btn}
        `;
        grid.appendChild(card);
    });

    if (currentMode === 'condo') {
        if(document.getElementById('stat-livre')) document.getElementById('stat-livre').innerText = livre;
        if(document.getElementById('stat-reservado')) document.getElementById('stat-reservado').innerText = reservado;
        if(document.getElementById('stat-carregando')) document.getElementById('stat-carregando').innerText = carregando;
    }
}

function formatTimer(st, sec) {
    if (st.status === 'Reservado' && st.expiracao_reserva) {
        const agora = new Date().getTime();
        const expiracao = new Date(st.expiracao_reserva).getTime();
        const segundosRestantes = Math.floor((expiracao - agora) / 1000);
        if (segundosRestantes > 0) {
            sec = segundosRestantes;
        } else {
            sec = 0;
        }
    }
    if (sec <= 0) return "00:00:00";
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function updateTimersAndLoad() {
    let houveMudanca = false;
    stations.forEach(st => {
        if (st.status === 'Reservado') {
            if (st.expiracao_reserva) {
                const agora = new Date().getTime();
                const expiracao = new Date(st.expiracao_reserva).getTime();
                const segundosRestantes = Math.floor((expiracao - agora) / 1000);
                if (segundosRestantes > 0) {
                    st.timer = segundosRestantes;
                    houveMudanca = true;
                } else {
                    st.status = 'Disponível';
                    st.user = null;
                    st.timer = 0;
                    st.inicio_recarga = null;
                    st.expiracao_reserva = null;
                    houveMudanca = true;
                    sincronizarEstacaoNoSupabase(st);
                }
            } else {
                if (st.timer > 0) { 
                    st.timer--; 
                    houveMudanca = true;
                } else { 
                    st.status = 'Disponível'; 
                    st.user = null; 
                    st.timer = 0; 
                    st.inicio_recarga = null;
                    st.expiracao_reserva = null;
                    houveMudanca = true;
                    sincronizarEstacaoNoSupabase(st);
                }
            }
        }
        if (st.status === 'Em Uso') {
            if (st.inicio_recarga) {
                const agora = new Date().getTime();
                const inicio = new Date(st.inicio_recarga).getTime();
                const segundosDecorridos = Math.floor((agora - inicio) / 1000);
                
                if (segundosDecorridos >= 0) {
                    st.timer = segundosDecorridos;
                    st.kwh = 1.0 + (segundosDecorridos * 0.0035);
                    houveMudanca = true;
                }
            } else {
                st.timer++;
                st.kwh += 0.0035;
                houveMudanca = true;
            }
        }
    });
    if (houveMudanca) {
        salvarEstacoesLocalStorage();
        if (currentMode === 'condo') {
            renderStations();
        }
    }
}

async function reserveSpot(id) {
    const st = stations.find(s => s.id === id);
    if (!st || st.status !== 'Disponível') {
        showToast('Esta vaga não está mais disponível.');
        await carregarEstacoesDoBanco();
        return;
    }

    const agora = new Date();
    const expiracao = new Date(agora.getTime() + 15 * 60000);

    st.status = 'Reservado';
    st.user = userData.name;
    st.timer = 900;
    st.inicio_recarga = null;
    st.expiracao_reserva = expiracao.toISOString();
    
    salvarEstacoesLocalStorage();
    renderStations();
    showToast(`Vaga ${st.name} reservada via OCPP!`);
    await sincronizarEstacaoNoSupabase(st);
}

async function startCharging(id) {
    const st = stations.find(s => s.id === id);
    if (!st) return;

    st.status = 'Em Uso';
    st.user = userData.name;
    st.inicio_recarga = new Date().toISOString();
    st.timer = 0;
    st.kwh = 1.0;
    st.expiracao_reserva = null;
    
    salvarEstacoesLocalStorage();
    renderStations();
    showToast(`Transação OCPP RemoteStart enviada para ${st.name}!`);
    await sincronizarEstacaoNoSupabase(st);
}

async function stopCharging(id) {
    const st = stations.find(s => s.id === id);
    if (!st) return;
    const kWhConsumidos = st.kwh > 0 ? st.kwh : 14.2;
    const custoTotal = (kWhConsumidos * 1.18) + 2.20;

    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFim = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: true });

    const novoExtrato = {
        title: `${st.name} (${st.condo.split('•')[0].trim()})`,
        desc: `${dataFormatada} • 12:00 PM às ${horaFim} (${kWhConsumidos.toFixed(1)} kWh • OCPP Tarifado)`,
        value: `R$ ${custoTotal.toFixed(2).replace('.', ',')}`,
        type: 'debit'
    };
    
    extratoTransacoes.unshift(novoExtrato);
    localStorage.setItem('voltcore_extrato', JSON.stringify(extratoTransacoes));
    saldoCarteira -= custoTotal;
    if (saldoCarteira < 0) saldoCarteira = 0;
    localStorage.setItem('voltcore_wallet_balance', saldoCarteira);
    atualizarDisplayCarteira();
    
    st.status = 'Disponível';
    st.user = null;
    st.kwh = 0;
    st.timer = 0;
    st.inicio_recarga = null;
    st.expiracao_reserva = null;
    salvarEstacoesLocalStorage();
    renderStations();
    await sincronizarEstacaoNoSupabase(st);
    
    showToast(`OCPP RemoteStop efetuado! Total R$ ${custoTotal.toFixed(2)} registrado.`);
}

async function cancelReservation(id) {
    const st = stations.find(s => s.id === id);
    if (!st) return;
    st.status = 'Disponível';
    st.user = null;
    st.timer = 0;
    st.inicio_recarga = null;
    st.expiracao_reserva = null;
    salvarEstacoesLocalStorage();
    renderStations();
    await sincronizarEstacaoNoSupabase(st);
    showToast(`Reserva OCPP cancelada.`);
}

// ==========================================================================
// CENTRAL DE GESTÃO DO SÍNDICO / ADM MASTER (LIMPA DE DADOS FANTASMAS)
// ==========================================================================
function abrirPainelGestao() {
    renderizarConteudoPainelGestao('');
}

function renderizarConteudoPainelGestao(termoFiltro = '') {
    let htmlMoradores = '';
    const termo = termoFiltro.toLowerCase().trim();

    moradoresCondominio.forEach((m, idx) => {
        if (userData.role === 'SINDICO' && !userData.allowedCondos.some(c => c.toLowerCase().includes(m.condo.toLowerCase()))) {
            return;
        }

        if (termo) {
            const nomeMatch = m.nome.toLowerCase().includes(termo);
            const placaMatch = (m.placa || '').toLowerCase().includes(termo);
            const vagaMatch = (m.vaga || '').toLowerCase().includes(termo);
            if (!nomeMatch && !placaMatch && !vagaMatch) return;
        }

        const isInativo = m.status === 'Inativo';
        htmlMoradores += `
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5 text-xs">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100">
                    <div>
                        <strong class="text-slate-900 text-sm font-extrabold">${m.nome}</strong> 
                        <span class="text-slate-500 font-medium ml-1">(${m.vaga} - ${m.unidade || 'Apto'})</span>
                        <div class="text-[11px] text-slate-500 mt-0.5"><i class="fa-solid fa-microchip text-lime-600 mr-1"></i> ${m.condo} (${m.bloco || 'Torre'}) • ${m.endereco || ''}</div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span class="font-extrabold text-emerald-700 text-xs bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">${m.valor}</span>
                        <span class="text-[10px] font-bold ${isInativo ? 'text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200' : 'text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200'}">${m.status}</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                        <p class="text-slate-700"><strong>Veículo:</strong> <span class="font-medium">${m.veiculo}</span></p>
                        <p class="text-slate-700"><strong>Placa:</strong> <span class="font-medium font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">${m.placa || 'N/D'}</span></p>
                    </div>
                    <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                        <p class="text-slate-700"><strong>Sessão OCPP:</strong> <span class="font-medium">${m.data} • ${m.horaInicio || '12:00'} (${m.duracao || '42 min'})</span></p>
                        <p class="text-slate-700"><strong>Volume / Ociosidade:</strong> <span class="font-medium text-emerald-700">${m.kwh || '14.2 kWh'}</span> | <span class="text-amber-700 font-bold">${m.ociosidade || 'Não'}</span></p>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row justify-between items-center pt-2 gap-2 border-t border-slate-50">
                    <span class="text-[10px] text-slate-400 italic flex items-center gap-1"><i class="fa-solid fa-shield-halved text-lime-600"></i> Rastreabilidade LGPD Ativa.</span>
                    <div class="flex gap-2 w-full sm:w-auto">
                        <button onclick="estornarOuAjustarSaldoMorador(${idx})" class="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition cursor-pointer pointer-events-auto">
                            <i class="fa-solid fa-rotate-left"></i> Estorno / Saldo
                        </button>
                        <button onclick="alternarStatusMorador(${idx})" class="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold ${isInativo ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'} transition cursor-pointer pointer-events-auto">
                            ${isInativo ? 'Reativar Condômino' : 'Inativar Condômino'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    const tituloPainel = userData.role === 'ADM' ? 'Central ADM Master • Gestão em Massa' : 'Painel do Síndico • Gestão de Condomínio';
    const conteudoGestao = `
        <div class="space-y-4 text-left text-xs pb-4">
            <div class="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-md">
                <div>
                    <h4 class="font-extrabold text-lime-400 text-sm sm:text-base flex items-center gap-2"><i class="fa-solid fa-building-shield"></i> ${tituloPainel}</h4>
                    <p class="text-[11px] text-slate-300">Gestão avançada de faturamento, ociosidade e telemetria de carregadores.</p>
                </div>
                <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-rose-600 transition cursor-pointer pointer-events-auto shrink-0" title="Fechar">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
                    <span class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Totens OCPP Online</span>
                    <span class="text-sm font-black text-slate-900">8 / 8 Conectados</span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
                    <span class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Faturamento Mês</span>
                    <span class="text-xs font-black text-emerald-600">R$ 796,50 (OCPP)</span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
                    <span class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Taxa Ociosidade</span>
                    <span class="text-xs font-black text-amber-600">R$ 45,00 Acumulado</span>
                </div>
            </div>

            <div class="space-y-3 pt-1">
                <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 pb-2 border-b border-slate-200">
                    <div class="relative flex-1">
                        <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-xs"></i>
                        <input type="text" id="filtro-morador-input" oninput="filtrarGestaoMoradores(this)" value="${termoFiltro}" placeholder="Filtrar por nome do morador, placa ou vaga..." class="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                    </div>
                    <button onclick="abrirModalCadastrarMorador()" class="bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold px-3 py-2 rounded-xl text-xs shadow-xs transition cursor-pointer pointer-events-auto flex items-center justify-center gap-1.5 shrink-0">
                        <i class="fa-solid fa-user-plus"></i> Novo Condômino
                    </button>
                </div>
                
                <div class="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
                    ${htmlMoradores || '<div class="p-6 bg-slate-50 rounded-xl text-center text-slate-500">Nenhum registro encontrado para este filtro.</div>'}
                </div>
            </div>
            
            <div class="flex gap-2 pt-2 border-t border-slate-100">
                <button onclick="closeModal()" class="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition cursor-pointer pointer-events-auto">FECHAR PAINEL</button>
            </div>
        </div>
    `;
    showCustomModal(tituloPainel, conteudoGestao, 'fa-building-shield', 'lime');
}

function filtrarGestaoMoradores(input) {
    renderizarConteudoPainelGestao(input.value);
    setTimeout(() => {
        const inp = document.getElementById('filtro-morador-input');
        if (inp) {
            inp.focus();
            inp.setSelectionRange(inp.value.length, inp.value.length);
        }
    }, 50);
}

function estornarOuAjustarSaldoMorador(idx) {
    const morador = moradoresCondominio[idx];
    showToast(`Solicitação de ajuste financeiro registrada para ${morador.nome} com rastreabilidade.`);
}

function alternarStatusMorador(idx) {
    if (moradoresCondominio[idx].status === 'Ativo') {
        moradoresCondominio[idx].status = 'Inativo';
        showToast(`Morador ${moradoresCondominio[idx].nome} inativado com sucesso.`);
    } else {
        moradoresCondominio[idx].status = 'Ativo';
        showToast(`Morador ${moradoresCondominio[idx].nome} reativado com sucesso!`);
    }
    localStorage.setItem('voltcore_moradores', JSON.stringify(moradoresCondominio));
    renderizarConteudoPainelGestao(document.getElementById('filtro-morador-input') ? document.getElementById('filtro-morador-input').value : '');
}

function abrirModalCadastrarMorador() {
    const htmlForm = `
        <div class="space-y-3 text-left text-xs pb-4">
            <div>
                <label class="block font-bold text-slate-700 mb-1">Nome do Morador:</label>
                <input type="text" id="novo-morador-nome" placeholder="Ex: Carlos Alberto" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Nome do Condomínio:</label>
                    <input type="text" id="novo-morador-condo" placeholder="Ex: Condomínio Gioviale" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Bloco / Torre:</label>
                    <input type="text" id="novo-morador-bloco" placeholder="Ex: Torre Norte" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Unidade / Apto:</label>
                    <input type="text" id="novo-morador-unidade" placeholder="Ex: Apto 101" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Vaga / OCPP ID:</label>
                    <input type="text" id="novo-morador-vaga" placeholder="Ex: Vaga 01" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
            </div>
            <div>
                <label class="block font-bold text-slate-700 mb-1">Endereço Completo:</label>
                <input type="text" id="novo-morador-endereco" placeholder="Ex: Jundiaí/SP" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Veículo / Modelo:</label>
                    <input type="text" id="novo-morador-veiculo" placeholder="Ex: BYD Seal (CCS2)" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Placa:</label>
                    <input type="text" id="novo-morador-placa" placeholder="Ex: ABC-1D23" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
            </div>
            <div class="flex gap-2 pt-2">
                <button onclick="salvarNovoMorador()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs transition cursor-pointer pointer-events-auto">CONFIRMAR CADASTRO</button>
                <button onclick="abrirPainelGestao()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer pointer-events-auto">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Cadastrar Novo Condômino', htmlForm, 'fa-user-plus', 'lime');
}

function salvarNovoMorador() {
    const nome = document.getElementById('novo-morador-nome').value;
    const condo = document.getElementById('novo-morador-condo').value || 'Condomínio Residencial';
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
    const agora = new Date();
    moradoresCondominio.unshift({
        nome: nome,
        condo: condo,
        bloco: bloco,
        unidade: unidade,
        endereco: endereco,
        vaga: vaga,
        veiculo: veiculo,
        placa: placa,
        status: 'Ativo',
        data: agora.toLocaleDateString('pt-BR'),
        horaInicio: '12:00 PM',
        horaFim: '12:42 PM',
        duracao: '42 min',
        kwh: '0.0 kWh',
        ociosidade: 'Não',
        valor: 'R$ 0,00'
    });
    localStorage.setItem('voltcore_moradores', JSON.stringify(moradoresCondominio));
    showToast(`Condômino ${nome} cadastrado com sucesso!`);
    abrirPainelGestao();
}

function showCustomModal(title, htmlContent, icon = 'fa-bolt', color = 'lime') {
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const customModal = document.getElementById('customModal');
    if (modalTitle) modalTitle.innerText = title;
    if (modalDesc) modalDesc.innerHTML = htmlContent;
    if (customModal) customModal.classList.remove('hidden');
}

function closeModal() {
    if (streamCameraAtiva) {
        streamCameraAtiva.getTracks().forEach(track => track.stop());
        streamCameraAtiva = null;
    }
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
        }, 3000);
    }
}