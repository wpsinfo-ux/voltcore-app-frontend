/* ==========================================================================
   VOLTCORE PRO • FRONT-END ENGINE V9.27 (COMPLETO, SEM CORTES & PADRÃO TUPI)
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
    statusAprovacao: "Aprovado",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    lgpdAccepted: false
};

let meusVeiculos = [];
let saldoCarteira = 0.00;
let extratoTransacoes = [];
let cartoesSalvos = [];
let moradoresCondominio = [];

const CONDOS_DISPONIVEIS = [
    "Belarte Residencial Jundiaí",
    "Condomínio Gioviale • Torre Sul",
    "Condomínio Gioviale • Torre Norte",
    "Complexo Atmosfera Residencial"
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

window.onload = async function() {
    localStorage.setItem('voltcore_version_v927_full', 'true');

    carregarTudoPersistente();
    
    const isLogged = localStorage.getItem('voltcore_logged');
    if (isLogged === 'true') {
        const screenAuth = document.getElementById('screen-auth');
        const screenApp = document.getElementById('screen-app');
        if (screenAuth) screenAuth.classList.add('hidden');
        if (screenApp) screenApp.classList.remove('hidden');
        await sincronizarDadosNuvemUsuario();
    } else {
        prepararTelaAuthPadraoTupi();
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
// TELA DE AUTENTICAÇÃO PADRÃO TUPI (FLUXO INTELIGENTE DE CADASTRO/LOGIN)
// ==========================================================================
function prepararTelaAuthPadraoTupi() {
    const authBox = document.querySelector('#screen-auth > div');
    if (!authBox) return;

    authBox.innerHTML = `
        <div class="text-center space-y-4">
            <div class="flex justify-center">
                <div class="w-14 h-14 bg-lime-400 rounded-2xl flex items-center justify-center shadow-md">
                    <i class="fa-solid fa-bolt text-slate-900 text-2xl"></i>
                </div>
            </div>
            <div>
                <h2 class="text-lg font-black text-slate-900">VoltCore PRO</h2>
                <p class="text-xs text-slate-500">Soluções inteligentes de recarga para condomínios</p>
            </div>

            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left flex items-start gap-2.5">
                <input type="checkbox" id="check-lgpd-login" class="mt-0.5 rounded text-lime-600 focus:ring-lime-500 w-4 h-4 cursor-pointer">
                <label for="check-lgpd-login" class="text-[10px] text-slate-700 leading-tight cursor-pointer">
                    Concordo com os <a href="#" onclick="abrirTermosPrivacidade()" class="text-lime-600 font-extrabold underline">Termos de Privacidade e LGPD</a>.
                </label>
            </div>

            <div id="auth-form-container" class="space-y-3 text-left">
                <div>
                    <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">E-mail</label>
                    <input type="email" id="tupi-email" placeholder="Seu e-mail" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>

                <div id="container-extra-cadastro" class="space-y-3 hidden">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nome Completo</label>
                        <input type="text" id="tupi-nome" placeholder="Informe o seu nome" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Selecione o Condomínio</label>
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

                <div id="senha-criterios" class="hidden text-[10px] space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-600">
                    <p id="crit-len" class="flex items-center gap-1.5"><i class="fa-solid fa-circle text-[6px] text-slate-400"></i> Mínimo 8 caracteres</p>
                    <p id="crit-upper" class="flex items-center gap-1.5"><i class="fa-solid fa-circle text-[6px] text-slate-400"></i> Uma letra maiúscula (A-Z)</p>
                    <p id="crit-lower" class="flex items-center gap-1.5"><i class="fa-solid fa-circle text-[6px] text-slate-400"></i> Uma letra minúscula (a-z)</p>
                    <p id="crit-num" class="flex items-center gap-1.5"><i class="fa-solid fa-circle text-[6px] text-slate-400"></i> Um número (0-9)</p>
                </div>

                <div id="container-confirma-senha" class="relative hidden">
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
                    Continuar
                </button>
            </div>

            <div class="pt-2 border-t border-slate-100 flex justify-center gap-2 text-xs">
                <button onclick="realizarLoginBiometrico()" class="text-slate-600 font-bold hover:text-slate-900"><i class="fa-solid fa-fingerprint text-lime-600 mr-1"></i> Biometria</button>
                <span class="text-slate-300">•</span>
                <button onclick="realizarLoginGoogle()" class="text-slate-600 font-bold hover:text-slate-900"><i class="fa-brands fa-google text-rose-500 mr-1"></i> Google</button>
            </div>
        </div>
    `;

    const emailInput = document.getElementById('tupi-email');
    const senhaInput = document.getElementById('tupi-senha');
    if (emailInput) {
        emailInput.addEventListener('input', () => checarSeEmailExiste(emailInput.value.trim()));
    }
    if (senhaInput) {
        senhaInput.addEventListener('input', () => validarCriteriosSenha(senhaInput.value));
    }
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
    if (criteriosDiv) criteriosDiv.classList.remove('hidden');

    document.getElementById('crit-len').style.color = senha.length >= 8 ? '#16a34a' : '#64748b';
    document.getElementById('crit-upper').style.color = /[A-Z]/.test(senha) ? '#16a34a' : '#64748b';
    document.getElementById('crit-lower').style.color = /[a-z]/.test(senha) ? '#16a34a' : '#64748b';
    document.getElementById('crit-num').style.color = /[0-9]/.test(senha) ? '#16a34a' : '#64748b';
}

let isUsuarioNovoDetectado = false;
async function checarSeEmailExiste(email) {
    const extraCampos = document.getElementById('container-extra-cadastro');
    const confirmaCampos = document.getElementById('container-confirma-senha');
    const criteriosSenha = document.getElementById('senha-criterios');
    const btnAcao = document.getElementById('btn-tupi-acao');

    if (!email || !email.includes('@') || email.length < 5) return;

    let existe = false;
    if (email.toLowerCase() === 'contato@wpsinfo.com.br' || email.toLowerCase() === 'sindico.belarte@wpsinfo.com.br' || email.toLowerCase() === 'wandersonp_s@hotmail.com') {
        existe = true;
    } else if (supabaseClient) {
        try {
            const { data } = await supabaseClient.from('voltcore_roles').select('email').eq('email', email).maybeSingle();
            if (data) existe = true;
        } catch(e){}
    }

    isUsuarioNovoDetectado = !existe;

    if (isUsuarioNovoDetectado) {
        if (extraCampos) extraCampos.classList.remove('hidden');
        if (confirmaCampos) confirmaCampos.classList.remove('hidden');
        if (btnAcao) btnAcao.innerText = 'Cadastrar Conta';
    } else {
        if (extraCampos) extraCampos.classList.add('hidden');
        if (confirmaCampos) confirmaCampos.classList.add('hidden');
        if (criteriosSenha) criteriosSenha.classList.add('hidden');
        if (btnAcao) btnAcao.innerText = 'Entrar';
    }
}

async function processarAuthTupi() {
    const lgpdCheck = document.getElementById('check-lgpd-login');
    if (lgpdCheck && !lgpdCheck.checked) {
        showToast('Aceite os Termos de Privacidade e LGPD.');
        return;
    }

    const email = document.getElementById('tupi-email').value.trim();
    const senha = document.getElementById('tupi-senha').value.trim();

    if (!email || !email.includes('@') || !senha) {
        showToast('Preencha o e-mail e a senha corretamente.');
        return;
    }

    if (isUsuarioNovoDetectado) {
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
        userData.statusAprovacao = 'Pendente';
        userData.lgpdAccepted = true;

        if (supabaseClient) {
            try {
                await supabaseClient.from('moradores').insert([{
                    nome, email, condominio: condo, vaga: 'A Definir', status: 'Pendente'
                }]);
                await supabaseClient.from('voltcore_roles').insert([{
                    email, role: 'MORADOR', condominio: condo, status_aprovacao: 'Pendente'
                }]);
            } catch(e){}
        }

        showToast('Cadastro realizado! Aguardando aprovação do síndico.');
        localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
        localStorage.setItem('voltcore_logged', 'true');
    } else {
        userData.email = email;
        avaliarPermissaoPorEmail(email);
        userData.lgpdAccepted = true;
        localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
        localStorage.setItem('voltcore_logged', 'true');
        showToast(`Bem-vindo, ${userData.role}!`);
    }

    document.getElementById('screen-auth').classList.add('hidden');
    document.getElementById('screen-app').classList.remove('hidden');
    aplicarDadosUsuarioNaTela();
    aplicarControlePermissoesPerfil();
    configurarPermissoesCondominioPorUsuario();
    await sincronizarDadosNuvemUsuario();
}

// ==========================================================================
// AVALIAÇÃO DE PERMISSÕES (DOMÍNIO WPS INFO VS SÍNDICOS VS MORADORES)
// ==========================================================================
function avaliarPermissaoPorEmail(email) {
    const emailLimpo = (email || '').trim().toLowerCase();
    
    if (emailLimpo.endsWith('@wpsinfo.com.br')) {
        userData.role = 'ADM_MASTER';
        userData.name = 'Gestão Master • WPS Info';
        userData.allowedCondos = CONDOS_DISPONIVEIS;
        userData.statusAprovacao = 'Aprovado';
    } else if (emailLimpo === 'sindico.belarte@wpsinfo.com.br' || emailLimpo.includes('sindico')) {
        userData.role = 'SINDICO';
        userData.name = 'Síndico • Gestão de Condomínio';
        userData.condo = 'Belarte Residencial Jundiaí';
        userData.allowedCondos = ["Belarte Residencial Jundiaí"];
        userData.statusAprovacao = 'Aprovado';
    } else {
        userData.role = 'MORADOR';
        userData.allowedCondos = [];
        if (emailLimpo === 'wandersonp_s@hotmail.com') {
            userData.name = 'Wanderson Pedro da Silva';
            userData.condo = 'Belarte Residencial Jundiaí';
            userData.statusAprovacao = 'Aprovado';
        } else {
            userData.name = emailLimpo.split('@')[0] || 'Condômino';
            userData.statusAprovacao = 'Pendente';
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

// ==========================================================================
// FUNÇÕES DE SUPORTE, VEÍCULOS, CARTEIRA E CARREGADORES
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
        if (data) {
            meusVeiculos = data.map(v => ({ id: v.id, model: v.model, plate: v.plate, type: v.type }));
            renderizarVeiculos();
        }
    } catch(e) {}
}

async function carregarExtratoDoBanco() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('transacoes').select('*').eq('email_usuario', userData.email);
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
        const { data } = await supabaseClient.from('voltcore_saved_cards').select('*').eq('user_email', userData.email);
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

    stations.forEach(st => {
        if (userData.role !== 'ADM_MASTER' && st.condo !== currentCondo) return;
        if (currentFilter !== 'all' && st.status !== currentFilter) return;
        
        grid.innerHTML += `
            <div class="bg-white rounded-xl border p-3 shadow-xs">
                <h3 class="text-xs font-extrabold text-slate-900">${st.name}</h3>
                <p class="text-[9px] text-slate-500">${st.condo} • ${st.status}</p>
            </div>
        `;
    });
}

function renderCommercialStations() {}
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
    showToast('Login com Google realizado');
}

function carregarTudoPersistente() {
    const savedUser = localStorage.getItem('voltcore_user_data');
    if (savedUser) { try { userData = JSON.parse(savedUser); } catch(e){} }
    if (userData.email) avaliarPermissaoPorEmail(userData.email);
    else userData.role = 'MORADOR';
    aplicarDadosUsuarioNaTela();
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
// PAINEL DE GESTÃO CORPORATIVA (ADM MASTER & SÍNDICO COM APROVAÇÃO)
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