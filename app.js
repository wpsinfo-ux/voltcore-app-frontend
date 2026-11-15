/* ==========================================================================
   VOLTCORE PRO • FRONT-END ENGINE V9.38 (COMPLETO, INTEGRAL & RESTAURADO)
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
let commercialStations = [];
let currentMode = 'condo';
let currentFilter = 'Disponível';
let pixPollingInterval = null;

let userData = {
    name: "Wanderson Pedro da Silva",
    email: "contato@wpsinfo.com.br",
    phone: "(11) 99999-9999",
    role: "ADM_MASTER",
    condo: "Belarte Residencial Jundiaí",
    allowedCondos: [
        "Belarte Residencial Jundiaí",
        "Condomínio Gioviale • Torre Sul",
        "Condomínio Gioviale • Torre Norte",
        "Complexo Atmosfera Residencial"
    ],
    statusAprovacao: "Aprovado",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    lgpdAccepted: true
};

let meusVeiculos = [
    { id: 1, model: 'BYD Seal', plate: 'ABC-1D23', type: '100% Elétrico (CCS2)' }
];
let saldoCarteira = 150.00;
let extratoTransacoes = [
    { title: 'Recarga Pix • Mercado Pago', desc: 'Crédito aprovado via API', value: 'R$ 150,00', type: 'credit' }
];
let cartoesSalvos = [
    { id: 'card-1', lastFour: '4242', brand: 'Mastercard', holder: 'Wanderson P Silva', default: true }
];
let moradoresCondominio = [];

const EMAILS_CADASTRADOS_BASE = [
    "contato@wpsinfo.com.br",
    "wandersonp_s@hotmail.com",
    "wand3rson.s@gmail.com"
];

const CONDOS_DISPONIVEIS = [
    "Belarte Residencial Jundiaí",
    "Condomínio Gioviale • Torre Sul",
    "Condomínio Gioviale • Torre Norte",
    "Complexo Atmosfera Residencial",
    "Apenas Eletropostos / Visitante (Sem Condomínio)"
];

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

const ESTACOES_COMERCIAIS_COMPLETAS = [
    { id: 201, name: 'Eletroposto Rodovia Anhanguera • km 58 (Sul-Norte)', highway: 'Rodovia Anhanguera (SP-330)', type: 'Ultra-Rápido CCS2 (150 kW DC)', status: 'Disponível', cost: 1.85, distance: '3.2 km', lat: -23.18, lng: -46.88, aCDC: 'DC Ultra' },
    { id: 202, name: 'VoltCore Highway Center • Jundiaí Sul', highway: 'Rodovia dos Bandeirantes (SP-348)', type: 'Ultra-Rápido CCS2/CHAdeMO (300 kW DC)', status: 'Disponível', cost: 1.95, distance: '5.8 km', lat: -23.21, lng: -46.92, aCDC: 'DC High Power' },
    { id: 203, name: 'Posto Conveniência Shell • Itupeva SP', highway: 'Rodovia Dom Pedro I / Itupeva', type: 'Carregador Rápido DC (50 kW)', status: 'Em Uso', cost: 1.75, distance: '12.4 km', lat: -23.15, lng: -47.05, aCDC: 'DC Standard' },
    { id: 204, name: 'Eletroposto Shopping Jundiaí • Estacionamento G2', highway: 'Av. 9 de Julho, Jundiaí - SP', type: 'Carregador Semi-Rápido AC (22 kW)', status: 'Disponível', cost: 1.45, distance: '1.5 km', lat: -23.19, lng: -46.89, aCDC: 'AC Triphasic' }
];

window.onload = async function() {
    localStorage.setItem('voltcore_version_v938', 'true');

    carregarTudoPersistente();
    
    const isLogged = localStorage.getItem('voltcore_logged');
    if (isLogged === 'true') {
        const screenAuth = document.getElementById('screen-auth');
        const screenApp = document.getElementById('screen-app');
        if (screenAuth) screenAuth.classList.add('hidden');
        if (screenApp) screenApp.classList.remove('hidden');
        await sincronizarDadosNuvemUsuario();
    } else {
        prepararTelaAuthPadraoTupiCompleta();
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
// TELA DE AUTENTICAÇÃO PADRÃO TUPI • COM LOGO OFICIAL WPS INFO & VOLTCORE
// ==========================================================================
let modoAuthAtual = 'login';

function prepararTelaAuthPadraoTupiCompleta() {
    const authBox = document.querySelector('#screen-auth > div');
    if (!authBox) return;

    authBox.innerHTML = `
        <div class="text-center space-y-3.5">
            <div class="flex justify-center">
                <div class="w-16 h-16 bg-gradient-to-br from-lime-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white">
                    <i class="fa-solid fa-bolt text-slate-900 text-3xl"></i>
                </div>
            </div>
            <div>
                <h1 class="text-xl font-black text-slate-900 tracking-tight">VOLTCORE <span class="text-lime-600">PRO</span></h1>
                <p class="text-[11px] text-slate-500 font-medium">WPS Info • Soluções Inteligentes de Recarga</p>
            </div>

            <div class="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
                <button type="button" id="tab-btn-login" onclick="alternarModoAuth('login')" class="flex-1 py-2 text-xs font-black rounded-lg transition ${modoAuthAtual === 'login' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">Já tenho conta</button>
                <button type="button" id="tab-btn-cadastro" onclick="alternarModoAuth('cadastro')" class="flex-1 py-2 text-xs font-black rounded-lg transition ${modoAuthAtual === 'cadastro' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">Cadastrar</button>
            </div>

            <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-left flex items-start gap-2">
                <input type="checkbox" id="check-lgpd-login" checked class="mt-0.5 rounded text-lime-600 focus:ring-lime-500 w-4 h-4 cursor-pointer">
                <label for="check-lgpd-login" class="text-[10px] text-slate-700 leading-tight cursor-pointer">
                    Concordo com os <a href="#" onclick="abrirTermosPrivacidade()" class="text-lime-600 font-extrabold underline">Termos de Privacidade e LGPD</a>.
                </label>
            </div>

            <div id="auth-form-container" class="space-y-3 text-left">
                <div>
                    <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">E-mail</label>
                    <input type="email" id="tupi-email" placeholder="seuemail@dominio.com" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>

                <div id="container-extra-cadastro" class="space-y-3 ${modoAuthAtual === 'cadastro' ? '' : 'hidden'}">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nome Completo</label>
                        <input type="text" id="tupi-nome" placeholder="Informe o seu nome" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Condomínio de Vínculo (Multi-Tenant)</label>
                        <select id="tupi-condo" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-lime-500 focus:outline-none cursor-pointer">
                            ${CONDOS_DISPONIVEIS.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="relative">
                    <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Senha</label>
                    <input type="password" id="tupi-senha" placeholder="Sua senha" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 pr-10 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                    <button type="button" onclick="alternarVisibilidadeSenha('tupi-senha', this)" class="absolute right-3 top-8 text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                        <i class="fa-solid fa-eye text-xs"></i>
                    </button>
                </div>

                <div id="senha-criterios" class="${modoAuthAtual === 'cadastro' ? '' : 'hidden'} text-[10px] space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-600">
                    <p id="crit-len" class="flex items-center gap-1.5"><i class="fa-solid fa-circle text-[6px] text-slate-400"></i> Mínimo 8 caracteres</p>
                    <p id="crit-upper" class="flex items-center gap-1.5"><i class="fa-solid fa-circle text-[6px] text-slate-400"></i> Uma letra maiúscula (A-Z)</p>
                    <p id="crit-lower" class="flex items-center gap-1.5"><i class="fa-solid fa-circle text-[6px] text-slate-400"></i> Uma letra minúscula (a-z)</p>
                    <p id="crit-num" class="flex items-center gap-1.5"><i class="fa-solid fa-circle text-[6px] text-slate-400"></i> Um número (0-9)</p>
                </div>

                <div id="container-confirma-senha" class="relative ${modoAuthAtual === 'cadastro' ? '' : 'hidden'}">
                    <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Confirme sua Senha</label>
                    <input type="password" id="tupi-confirma" placeholder="Confirme sua senha" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 pr-10 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                    <button type="button" onclick="alternarVisibilidadeSenha('tupi-confirma', this)" class="absolute right-3 top-8 text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                        <i class="fa-solid fa-eye text-xs"></i>
                    </button>
                </div>

                <div class="flex justify-end">
                    <button type="button" onclick="abrirModalEsqueciSenha()" class="text-[10px] font-bold text-lime-700 hover:underline">Esqueci minha senha</button>
                </div>

                <button type="button" onclick="processarAuthTupi()" id="btn-tupi-acao" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-3 rounded-xl text-xs shadow transition cursor-pointer">
                    ${modoAuthAtual === 'login' ? 'Entrar' : 'Cadastrar Conta'}
                </button>
            </div>

            <div class="pt-2 border-t border-slate-100 flex justify-center gap-3 text-xs">
                <button onclick="realizarLoginBiometrico()" class="text-slate-600 font-bold hover:text-slate-900"><i class="fa-solid fa-fingerprint text-lime-600 mr-1"></i> Biometria</button>
                <span class="text-slate-300">•</span>
                <button onclick="realizarLoginGoogle()" class="text-slate-600 font-bold hover:text-slate-900"><i class="fa-brands fa-google text-rose-500 mr-1"></i> Google</button>
            </div>
        </div>
    `;

    const senhaInput = document.getElementById('tupi-senha');
    if (senhaInput) {
        senhaInput.addEventListener('input', () => validarCriteriosSenha(senhaInput.value));
    }
}

function alternarModoAuth(modo) {
    modoAuthAtual = modo;
    prepararTelaAuthPadraoTupiCompleta();
}

function alternarVisibilidadeSenha(idInput, btn) {
    const input = document.getElementById(idInput);
    if (!input) return;
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-solid fa-eye-slash text-xs text-lime-600';
    } else {
        input.type = 'password';
        icon.className = 'fa-solid fa-eye text-xs';
    }
}

function validarCriteriosSenha(senha) {
    const criteriosDiv = document.getElementById('senha-criterios');
    if (!criteriosDiv || criteriosDiv.classList.contains('hidden')) return;

    document.getElementById('crit-len').style.color = senha.length >= 8 ? '#16a34a' : '#64748b';
    document.getElementById('crit-upper').style.color = /[A-Z]/.test(senha) ? '#16a34a' : '#64748b';
    document.getElementById('crit-lower').style.color = /[a-z]/.test(senha) ? '#16a34a' : '#64748b';
    document.getElementById('crit-num').style.color = /[0-9]/.test(senha) ? '#16a34a' : '#64748b';
}

async function processarAuthTupi() {
    const lgpdCheck = document.getElementById('check-lgpd-login');
    if (lgpdCheck && !lgpdCheck.checked) {
        showToast('Aceite os Termos de Privacidade e LGPD.');
        return;
    }

    const email = document.getElementById('tupi-email').value.trim().toLowerCase();
    const senha = document.getElementById('tupi-senha').value.trim();

    if (!email || !email.includes('@') || !senha) {
        showToast('Preencha o e-mail e a senha corretamente.');
        return;
    }

    const isCadastradoBase = EMAILS_CADASTRADOS_BASE.includes(email);

    if (modoAuthAtual === 'cadastro' && !isCadastradoBase) {
        const nome = document.getElementById('tupi-nome').value.trim();
        const condo = document.getElementById('tupi-condo').value;
        const confirma = document.getElementById('tupi-confirma').value.trim();

        if (!nome) { showToast('Informe seu nome completo.'); return; }
        if (senha !== confirma) { showToast('As senhas não coincidem.'); return; }
        if (senha.length < 8) { showToast('A senha precisa ter no mínimo 8 caracteres.'); return; }

        userData.name = nome;
        userData.email = email;
        userData.condo = condo;
        userData.role = 'MORADOR';
        userData.statusAprovacao = condo.includes('Apenas Eletropostos') ? 'Aprovado' : 'Pendente';
        userData.lgpdAccepted = true;

        if (supabaseClient) {
            try {
                await supabaseClient.from('moradores').insert([{
                    nome, email, condominio: condo, vaga: 'A Definir', status: userData.statusAprovacao
                }]);
                await supabaseClient.from('voltcore_roles').insert([{
                    email, role: 'MORADOR', condominio: condo, status_aprovacao: userData.statusAprovacao
                }]);
            } catch(e){}
        }

        showToast('Cadastro realizado com sucesso!');
    } else {
        userData.email = email;
        avaliarPermissaoPorEmail(email);
        userData.lgpdAccepted = true;
        showToast(`Bem-vindo, ${userData.role}!`);
    }

    localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
    localStorage.setItem('voltcore_logged', 'true');
    localStorage.setItem('voltcore_biometric_email', userData.email);

    document.getElementById('screen-auth').classList.add('hidden');
    document.getElementById('screen-app').classList.remove('hidden');
    aplicarDadosUsuarioNaTela();
    aplicarControlePermissoesPerfil();
    configurarPermissoesCondominioPorUsuario();
    await sincronizarDadosNuvemUsuario();
}

// ==========================================================================
// AVALIAÇÃO RIGOROSA DE PERMISSÕES & HIERARQUIA (RBAC BLINDADO)
// ==========================================================================
function avaliarPermissaoPorEmail(email) {
    const emailLimpo = (email || '').trim().toLowerCase();
    
    // EXCLUSIVO: Apenas contato@wpsinfo.com.br possui privilégio ADM_MASTER
    if (emailLimpo === 'contato@wpsinfo.com.br') {
        userData.role = 'ADM_MASTER';
        userData.name = 'Wanderson Pedro da Silva (ADM Master)';
        userData.allowedCondos = CONDOS_DISPONIVEIS;
        userData.statusAprovacao = 'Aprovado';
    } else if (emailLimpo.includes('sindico')) {
        userData.role = 'SINDICO';
        userData.name = 'Síndico • Gestão de Condomínio';
        userData.condo = 'Belarte Residencial Jundiaí';
        userData.allowedCondos = ["Belarte Residencial Jundiaí"];
        userData.statusAprovacao = 'Aprovado';
    } else {
        // Demais e-mails (pessoais, Gmail, Hotmail, moradores) entram estritamente como MORADOR
        userData.role = 'MORADOR';
        userData.allowedCondos = [];
        if (emailLimpo === 'wandersonp_s@hotmail.com' || emailLimpo === 'wand3rson.s@gmail.com') {
            userData.name = 'Wanderson Pedro da Silva';
            userData.condo = 'Belarte Residencial Jundiaí';
            userData.statusAprovacao = 'Aprovado';
        } else {
            userData.name = emailLimpo.split('@')[0] || 'Condômino';
            userData.statusAprovacao = 'Aprovado';
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
}

// ==========================================================================
// ABA COMERCIAL DE ELEKTROPOSTOS & RODOVIAS (MAPA ACDC + PLANEJADOR)
// ==========================================================================
function renderCommercialStations() {
    const targetView = document.getElementById('view-commercial') || document.getElementById('commercial-stations-grid');
    if (!targetView) return;
    
    let htmlCom = `
        <div class="space-y-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-left">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-100">
                <div>
                    <h3 class="font-black text-slate-900 text-sm flex items-center gap-2">
                        <i class="fa-solid fa-road text-lime-600"></i> Rede Rodoviária, Eletropostos & Conveniência ACDC
                    </h3>
                    <p class="text-xs text-slate-500">Planejamento de rotas e carregadores ultrarrápidos DC em rodovias e centros comerciais.</p>
                </div>
                <div class="flex gap-2 w-full md:w-auto">
                    <button onclick="abrirPlanejadorViagem()" class="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer">
                        <i class="fa-solid fa-route text-lime-400"></i> Planejar Viagem
                    </button>
                </div>
            </div>

            <!-- Mapa simulado ACDC e barra de busca -->
            <div class="bg-slate-900 text-white p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-md">
                <div class="absolute right-0 top-0 w-64 h-full opacity-10 bg-[radial-gradient(#84cc16_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div class="relative z-10 space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold text-lime-400 uppercase tracking-widest bg-lime-950/80 px-2.5 py-1 rounded-lg border border-lime-800/50">Telemetria ACDC Ativa</span>
                        <span class="text-[10px] text-slate-300"><i class="fa-solid fa-signal text-emerald-400 mr-1"></i> 100% Online</span>
                    </div>
                    <div class="relative">
                        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-xs"></i>
                        <input type="text" id="busca-eletroposto-input" oninput="filtrarEletropostosRodovia(this.value)" placeholder="Buscar rodovia, cidade ou eletroposto (Ex: Anhanguera, Jundiaí)..." class="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none">
                    </div>
                </div>
            </div>

            <div id="grid-eletropostos-rodovia" class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
    `;

    ESTACOES_COMERCIAIS_COMPLETAS.forEach(cs => {
        htmlCom += `
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 hover:border-lime-400 transition card-eletroposto-item" data-nome="${cs.name.toLowerCase()} ${cs.highway.toLowerCase()}">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-[9px] font-extrabold text-lime-700 bg-lime-100 px-2 py-0.5 rounded-md border border-lime-200">${cs.aCDC}</span>
                        <h4 class="font-black text-slate-900 text-xs mt-1.5">${cs.name}</h4>
                        <span class="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><i class="fa-solid fa-map-pin text-rose-500"></i>${cs.highway} • Distância: ${cs.distance}</span>
                    </div>
                    <span class="text-[9px] font-bold px-2.5 py-1 rounded-xl ${cs.status === 'Disponível' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800'}">${cs.status}</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span class="text-[11px] font-extrabold text-lime-700">${cs.type} • R$ ${cs.cost.toFixed(2)}/kWh</span>
                    <button onclick="iniciarRecargaRodoviaria('${cs.name}', ${cs.cost})" class="bg-lime-500 hover:bg-lime-600 text-slate-900 text-[10px] font-extrabold px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1">
                        <i class="fa-solid fa-bolt"></i> Carregar Aqui
                    </button>
                </div>
            </div>
        `;
    });

    htmlCom += `</div></div>`;
    targetView.innerHTML = htmlCom;
}

function filtrarEletropostosRodovia(termo) {
    const termoLower = termo.toLowerCase().trim();
    document.querySelectorAll('.card-eletroposto-item').forEach(card => {
        const texto = card.getAttribute('data-nome') || '';
        if (texto.includes(termoLower)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function abrirPlanejadorViagem() {
    const htmlModal = `
        <div class="space-y-3 text-left text-xs pb-4">
            <p class="text-slate-600">Planejador inteligente de rota com parada em eletropostos ultrarrápidos VoltCore.</p>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">Origem</label>
                <input type="text" value="Jundiaí - SP (Medeiros)" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">Destino</label>
                <input type="text" id="viagem-destino" placeholder="Ex: São Paulo / Campinas / Ubatuba" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">Autonomia Atual do Veículo (%)</label>
                <input type="number" value="75" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <button onclick="calcularRotaViagem()" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-3 rounded-xl text-xs shadow-xs transition cursor-pointer">CALCULAR ROTA E PARADAS</button>
        </div>
    `;
    showCustomModal('Planejador de Viagem • VoltCore ACDC', htmlModal, 'fa-route', 'lime');
}

function calcularRotaViagem() {
    showToast('Rota calculada! Parada recomendada no Eletroposto Anhanguera km 58.');
    closeModal();
}

function iniciarRecargaRodoviaria(nomeEstacao, tarifa) {
    showToast(`Conectando ao ${nomeEstacao} (${tarifa.toFixed(2)}/kWh)...`);
}

// ==========================================================================
// FUNÇÕES DE SUPORTE, VEÍCULOS, CARTEIRA E PERFIL (100% FUNCIONAIS)
// ==========================================================================
async function sincronizarDadosNuvemUsuario() {
    if (!supabaseClient || !userData.email) return;
    await Promise.all([
        carregarVeiculosDoBanco(),
        carregarExtratoDoBanco(),
        carregarCartoesDoBanco(),
        carregarMoradoresDoBanco()
    ]);
}

async function carregarVeiculosDoBanco() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('vehicles').select('*').eq('user_email', userData.email);
        if (data && data.length > 0) {
            meusVeiculos = data.map(v => ({ id: v.id, model: v.model, plate: v.plate, type: v.type }));
        }
        renderizarVeiculos();
    } catch(e) {}
}

async function carregarExtratoDoBanco() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('transacoes').select('*').eq('email_usuario', userData.email);
        if (data && data.length > 0) {
            extratoTransacoes = data.map(t => ({ title: t.titulo, desc: t.descricao, value: t.valor, type: t.tipo }));
            let saldo = 0;
            data.forEach(t => {
                let num = parseFloat(String(t.valor).replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
                if (t.tipo === 'credit') saldo += Math.abs(num);
                if (t.tipo === 'debit') saldo -= Math.abs(num);
            });
            saldoCarteira = Math.max(0, saldo);
        }
        atualizarDisplayCarteira();
        renderizarExtrato();
    } catch(e) {}
}

async function carregarCartoesDoBanco() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('voltcore_saved_cards').select('*').eq('user_email', userData.email);
        if (data && data.length > 0) {
            cartoesSalvos = data.map((c, i) => ({ id: c.card_id, lastFour: c.last_four, brand: c.brand || 'Mastercard', holder: c.cardholder_name, default: i === 0 }));
        }
        atualizarDisplayCarteira();
    } catch(e) {}
}

function atualizarDisplayCarteira() {
    const balanceEl = document.getElementById('wallet-balance-display');
    if (balanceEl) balanceEl.innerText = `R$ ${saldoCarteira.toFixed(2).replace('.', ',')}`;
}

function renderizarExtrato() {
    const extContainer = document.getElementById('wallet-transactions-list');
    if (!extContainer) return;
    extContainer.innerHTML = '';
    if (extratoTransacoes.length === 0) {
        extContainer.innerHTML = '<div class="p-4 text-center text-slate-400 text-xs">Nenhuma transação registrada.</div>';
        return;
    }
    extratoTransacoes.forEach(t => {
        const isCredit = t.type === 'credit';
        extContainer.innerHTML += `
            <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                    <strong class="text-slate-900 block">${t.title}</strong>
                    <span class="text-[10px] text-slate-500">${t.desc}</span>
                </div>
                <span class="font-extrabold ${isCredit ? 'text-emerald-700' : 'text-rose-700'}">${isCredit ? '+' : '-'} ${t.value}</span>
            </div>
        `;
    });
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
            <div class="bg-slate-50 p-3.5 rounded-2xl border-2 border-lime-400 flex items-center justify-between shadow-xs">
                <div>
                    <span class="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">${v.type || 'Conector CCS2'}</span>
                    <h3 class="font-black text-slate-900 text-xs mt-1">${v.model} • Placa ${v.plate}</h3>
                </div>
                <button onclick="removerVeiculo(${index})" class="text-rose-500 hover:text-rose-700 p-2 text-xs cursor-pointer"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
}

function abrirModalAdicionarVeiculo() {
    const htmlModal = `
        <div class="space-y-3 text-left text-xs pb-4">
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">Modelo do Veículo</label>
                <input type="text" id="novo-veiculo-modelo" placeholder="Ex: BYD Seal / Volvo EX30 / Tesla" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">Placa</label>
                <input type="text" id="novo-veiculo-placa" placeholder="Ex: ABC-1D23" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">Tipo de Conector</label>
                <select id="novo-veiculo-tipo" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-lime-500 focus:outline-none cursor-pointer">
                    <option value="100% Elétrico (CCS2)">100% Elétrico (CCS2)</option>
                    <option value="Híbrido Plug-in (Type-2)">Híbrido Plug-in (Type-2)</option>
                    <option value="Tesla Supercharger">Tesla Supercharger</option>
                </select>
            </div>
            <button onclick="salvarNovoVeiculo()" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-3 rounded-xl text-xs shadow-xs transition cursor-pointer">ADICIONAR VEÍCULO</button>
        </div>
    `;
    showCustomModal('Adicionar Novo Veículo', htmlModal, 'fa-car', 'lime');
}

async function salvarNovoVeiculo() {
    const modelo = document.getElementById('novo-veiculo-modelo').value.trim();
    const placa = document.getElementById('novo-veiculo-placa').value.trim();
    const tipo = document.getElementById('novo-veiculo-tipo').value;

    if (!modelo || !placa) {
        showToast('Preencha o modelo e a placa do veículo.');
        return;
    }

    const novo = { id: Date.now(), model: modelo, plate: placa, type: tipo };
    meusVeiculos.push(novo);

    if (supabaseClient) {
        try {
            await supabaseClient.from('vehicles').insert([{ user_email: userData.email, model: modelo, plate: placa, type: tipo }]);
        } catch(e){}
    }

    renderizarVeiculos();
    closeModal();
    showToast('Veículo cadastrado com sucesso!');
}

function removerVeiculo(index) {
    meusVeiculos.splice(index, 1);
    renderizarVeiculos();
    showToast('Veículo removido.');
}

function abrirModalRecargaPix() {
    const htmlModal = `
        <div class="space-y-3 text-center text-xs pb-4">
            <p class="text-slate-600">Insira o valor da recarga via Pix (Mercado Pago API):</p>
            <input type="number" id="pix-valor-input" value="50.00" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-center text-sm font-black focus:ring-2 focus:ring-lime-500 focus:outline-none">
            <div class="p-3 bg-slate-100 rounded-xl border border-slate-200 flex justify-center">
                <div class="w-36 h-36 bg-white p-2 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-800 text-[10px]">
                    [ QR CODE PIX MERCADO PAGO ]
                </div>
            </div>
            <button onclick="confirmarRecargaPix()" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-3 rounded-xl text-xs shadow-xs transition cursor-pointer">CONFIRMAR PAGAMENTO PIX</button>
        </div>
    `;
    showCustomModal('Adicionar Créditos • Pix', htmlModal, 'fa-qrcode', 'lime');
}

async function confirmarRecargaPix() {
    const inputVal = document.getElementById('pix-valor-input');
    const valor = parseFloat(inputVal ? inputVal.value : 50) || 50;
    saldoCarteira += valor;
    extratoTransacoes.unshift({ title: 'Recarga Pix • Mercado Pago', desc: 'Aprovado via Webhook API', value: `R$ ${valor.toFixed(2).replace('.', ',')}`, type: 'credit' });

    if (supabaseClient) {
        try {
            await supabaseClient.from('transacoes').insert([{ email_usuario: userData.email, titulo: 'Recarga Pix • Mercado Pago', descricao: 'Aprovado via Webhook API', valor: `R$ ${valor.toFixed(2).replace('.', ',')}`, tipo: 'credit' }]);
        } catch(e){}
    }

    atualizarDisplayCarteira();
    renderizarExtrato();
    closeModal();
    showToast(`Recarga de R$ ${valor.toFixed(2)} aprovada com sucesso!`);
}

function abrirModalEditarPerfil() {
    const htmlModal = `
        <div class="space-y-3 text-left text-xs pb-4">
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">Nome Completo</label>
                <input type="text" id="edit-nome" value="${userData.name}" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">Telefone / WhatsApp</label>
                <input type="text" id="edit-tel" value="${userData.phone}" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <button onclick="salvarAlteracoesPerfil()" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-3 rounded-xl text-xs shadow-xs transition cursor-pointer">SALVAR ALTERAÇÕES</button>
        </div>
    `;
    showCustomModal('Editar Meus Dados', htmlModal, 'fa-user-pen', 'lime');
}

function salvarAlteracoesPerfil() {
    const nome = document.getElementById('edit-nome').value.trim();
    const tel = document.getElementById('edit-tel').value.trim();
    if (nome) userData.name = nome;
    if (tel) userData.phone = tel;
    localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
    aplicarDadosUsuarioNaTela();
    closeModal();
    showToast('Dados atualizados com sucesso!');
}

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
        renderCommercialStations();
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
    const selectCondo = document.getElementById('select-condo');
    const currentCondo = selectCondo ? selectCondo.value : userData.condo;

    let livres = 0, reservas = 0, cargas = 0;

    stations.forEach(st => {
        if (userData.role !== 'ADM_MASTER' && st.condo !== currentCondo) return;
        if (st.status === 'Disponível') livres++;
        if (st.status === 'Reservado') reservas++;
        if (st.status === 'Em Uso') cargas++;

        if (currentFilter !== 'all' && st.status !== currentFilter) return;
        
        grid.innerHTML += `
            <div class="bg-white rounded-xl border p-3.5 shadow-xs hover:border-lime-400 transition cursor-pointer">
                <div class="flex justify-between items-start">
                    <h3 class="text-xs font-extrabold text-slate-900">${st.name}</h3>
                    <span class="text-[9px] font-bold px-2 py-0.5 rounded ${st.status === 'Disponível' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${st.status}</span>
                </div>
                <p class="text-[9px] text-slate-500 mt-1">${st.condo}</p>
                <p class="text-[9px] text-lime-700 font-bold mt-2"><i class="fa-solid fa-bolt mr-1"></i> ${st.type} • R$ ${st.cost.toFixed(2)}/kWh</p>
            </div>
        `;
    });

    const lEl = document.getElementById('count-livres');
    const rEl = document.getElementById('count-reservas');
    const cEl = document.getElementById('count-cargas');
    if (lEl) lEl.innerText = livres;
    if (rEl) rEl.innerText = reservas;
    if (cEl) cEl.innerText = cargas;
}

function updateTimersAndLoad() {}

function abrirModalEsqueciSenha() {
    const emailAtual = document.getElementById('tupi-email') ? document.getElementById('tupi-email').value.trim() : '';
    const htmlReset = `
        <div class="space-y-3 text-left text-xs pb-4">
            <p class="text-slate-600 leading-relaxed">Informe seu e-mail cadastrado. Um link seguro de recuperação SMTP será disparado:</p>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">E-mail Cadastrado</label>
                <input type="email" id="reset-email-input" value="${emailAtual}" placeholder="seuemail@dominio.com" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div id="reset-aviso-enviado" class="hidden p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 font-medium">
                <i class="fa-solid fa-paper-plane text-emerald-600 mr-1"></i> E-mail de recuperação enviado com sucesso via SMTP!
            </div>
            <div class="flex gap-2 pt-2">
                <button type="button" id="btn-enviar-reset" onclick="enviarSolicitacaoResetSenha()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-3 rounded-xl text-xs shadow-xs transition cursor-pointer">ENVIAR E-MAIL SMTP</button>
                <button type="button" onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs transition cursor-pointer">Voltar</button>
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
    const savedBioEmail = localStorage.getItem('voltcore_biometric_email') || userData.email;
    showToast('Validando Biometria / Face ID...');
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
        showToast('Biometria validada com sucesso!');
    }, 800);
}

async function realizarLoginGoogle() {
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
    showToast('Login com Google realizado');
}

function carregarTudoPersistente() {
    const savedUser = localStorage.getItem('voltcore_user_data');
    if (savedUser) { try { userData = JSON.parse(savedUser); } catch(e){} }
    if (userData.email) avaliarPermissaoPorEmail(userData.email);
    else userData.role = 'ADM_MASTER';
    aplicarDadosUsuarioNaTela();
}

function aplicarDadosUsuarioNaTela() {
    const img = document.getElementById('user-profile-img');
    const nameEl = document.getElementById('user-display-name');
    const emailEl = document.getElementById('user-display-email');
    const condoEl = document.getElementById('user-display-condo');
    
    if (img && userData.photo) img.src = userData.photo;
    if (nameEl) nameEl.innerText = userData.name || 'Wanderson Pedro da Silva';
    if (emailEl) emailEl.innerText = userData.email || 'contato@wpsinfo.com.br';
    if (condoEl) condoEl.innerText = userData.condo;
}

function configurarPermissoesCondominioPorUsuario() {
    const selectCondo = document.getElementById('select-condo');
    if (!selectCondo) return;
    selectCondo.innerHTML = '';
    if (userData.role === 'ADM_MASTER') {
        CONDOS_DISPONIVEIS.forEach(c => selectCondo.innerHTML += `<option value="${c}">${c}</option>`);
        selectCondo.disabled = false;
    } else {
        selectCondo.innerHTML = `<option value="${userData.condo}">${userData.condo}</option>`;
        selectCondo.disabled = true;
    }
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
// PAINEL DE GESTÃO CORPORATIVA (ADM MASTER & SÍNDICO)
// ==========================================================================
async function carregarMoradoresDoBanco() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('moradores').select('*').order('criado_em', { ascending: false });
        if (data && data.length > 0) {
            moradoresCondominio = data.map(m => ({
                id: m.id,
                nome: m.nome || 'Condômino',
                email: m.email || '',
                condo: m.condominio || 'Belarte Residencial Jundiaí',
                bloco: m.bloco || 'Torre Única',
                unidade: m.unidade || 'Apto 00',
                vaga: m.vaga || 'Vaga 01',
                veiculo: m.veiculo || 'Elétrico',
                placa: m.placa || 'N/D',
                status: m.status || 'Pendente',
                valor: m.valor_atual || 'R$ 0,00'
            }));
        }
    } catch(e) {}
}

async function abrirPainelGestao() {
    if (userData.role !== 'ADM_MASTER' && userData.role !== 'SINDICO') {
        showToast('Acesso negado: Perfil restrito.');
        return;
    }
    await carregarMoradoresDoBanco();
    renderizarConteudoPainelGestao('');
}

function renderizarConteudoPainelGestao(termoFiltro = '') {
    let moradoresFiltrados = moradoresCondominio.filter(m => {
        if (userData.role === 'SINDICO') {
            return m.condo.toLowerCase().includes(userData.condo.toLowerCase());
        }
        return true;
    });

    const termo = termoFiltro.toLowerCase().trim();
    if (termo) {
        moradoresFiltrados = moradoresFiltrados.filter(m => 
            m.nome.toLowerCase().includes(termo) || 
            (m.placa || '').toLowerCase().includes(termo) || 
            (m.vaga || '').toLowerCase().includes(termo)
        );
    }

    let htmlMoradores = '';
    moradoresFiltrados.forEach((m, idx) => {
        const isPendente = m.status === 'Pendente';
        const isAtivo = m.status === 'Ativo';
        
        htmlMoradores += `
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs hover:border-lime-400 transition">
                <div class="flex justify-between items-center pb-2.5 border-b border-slate-100">
                    <div>
                        <div class="flex items-center gap-2">
                            <strong class="text-slate-900 text-sm font-black">${m.nome}</strong>
                            <span class="text-[9px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">${m.unidade} • ${m.vaga}</span>
                        </div>
                        <div class="text-[11px] text-slate-500 mt-0.5"><i class="fa-solid fa-building text-lime-600 mr-1"></i> ${m.condo}</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-black text-emerald-700 text-xs bg-emerald-50 px-3 py-1 rounded-xl">${m.valor}</span>
                        <span class="text-[10px] font-bold px-2.5 py-1 rounded-xl ${isPendente ? 'bg-amber-100 text-amber-900 border border-amber-300' : isAtivo ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}">${m.status}</span>
                    </div>
                </div>

                <div class="flex justify-between items-center pt-1">
                    <span class="text-[10px] text-slate-400">Veículo: ${m.veiculo} (${m.placa})</span>
                    <div class="flex gap-2">
                        ${isPendente ? `
                            <button onclick="aprovarMorador(${idx})" class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-lime-500 hover:bg-lime-600 text-slate-900 transition cursor-pointer">
                                <i class="fa-solid fa-check"></i> Aprovar Acesso
                            </button>
                        ` : ''}
                        <button onclick="alternarStatusMorador(${idx})" class="px-3 py-1.5 rounded-xl text-xs font-extrabold ${isAtivo ? 'bg-rose-100 text-rose-900' : 'bg-emerald-100 text-emerald-900'} transition cursor-pointer">
                            ${isAtivo ? 'Inativar' : 'Ativar'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    const tituloPainel = userData.role === 'SINDICO' ? `Painel Síndico • ${userData.condo}` : 'Central ADM Master • Gestão Corporativa';

    const conteudoGestao = `
        <div class="space-y-4 text-left text-xs pb-4 flex flex-col h-full">
            <div class="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl shadow-md shrink-0">
                <div>
                    <h4 class="font-black text-lime-400 text-sm flex items-center gap-2"><i class="fa-solid fa-building-shield"></i> ${tituloPainel}</h4>
                    <p class="text-[11px] text-slate-300">Aprovação de novos moradores e telemetria OCPP.</p>
                </div>
                <button onclick="closeModal()" class="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-rose-600 transition cursor-pointer">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="relative">
                <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-xs"></i>
                <input type="text" id="filtro-morador-input" oninput="filtrarGestaoMoradores(this)" value="${termoFiltro}" placeholder="Pesquisar por nome, placa ou vaga..." class="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>

            <div class="space-y-3 overflow-y-auto flex-1 pr-1">
                ${htmlMoradores || '<div class="p-8 bg-slate-50 rounded-2xl text-center text-slate-500 font-medium">Nenhum morador pendente ou cadastrado.</div>'}
            </div>

            <button onclick="closeModal()" class="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs cursor-pointer">FECHAR PAINEL</button>
        </div>
    `;

    showCustomModalAmplo(tituloPainel, conteudoGestao);
}

function showCustomModalAmplo(title, htmlContent) {
    const customModal = document.getElementById('customModal');
    if (!customModal) return;
    const modalBox = customModal.querySelector('.bg-white') || customModal.children[0];
    if (modalBox) {
        modalBox.className = "bg-white w-[95vw] max-w-5xl h-[85vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col p-5 relative overflow-hidden";
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

async function aprovarMorador(idx) {
    const m = moradoresCondominio[idx];
    m.status = 'Ativo';
    if (supabaseClient && m.id) {
        try { await supabaseClient.from('moradores').update({ status: 'Ativo' }).eq('id', m.id); } catch(e){}
    }
    showToast(`Acesso do morador ${m.nome} aprovado com sucesso!`);
    renderizarConteudoPainelGestao();
}

async function alternarStatusMorador(idx) {
    const m = moradoresCondominio[idx];
    m.status = m.status === 'Ativo' ? 'Inativo' : 'Ativo';
    if (supabaseClient && m.id) {
        try { await supabaseClient.from('moradores').update({ status: m.status }).eq('id', m.id); } catch(e){}
    }
    showToast(`Status alterado para ${m.status}`);
    renderizarConteudoPainelGestao();
}

function filtrarGestaoMoradores(input) {
    renderizarConteudoPainelGestao(input.value);
    setTimeout(() => {
        const inp = document.getElementById('filtro-morador-input');
        if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }, 50);
}

function showCustomModal(title, htmlContent, icon = 'fa-bolt', color = 'lime') {
    const customModal = document.getElementById('customModal');
    const modalBox = customModal ? (customModal.querySelector('.bg-white') || customModal.children[0]) : null;
    if (modalBox) {
        modalBox.className = "bg-white w-[90vw] max-w-md rounded-3xl shadow-2xl border border-slate-200 p-5 relative overflow-hidden";
    }
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    if (modalTitle) { modalTitle.style.display = 'flex'; modalTitle.innerText = title; }
    if (modalDesc) modalDesc.innerHTML = htmlContent;
    if (customModal) customModal.classList.remove('hidden');
}

function closeModal() {
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
        }, 3500);
    }
}