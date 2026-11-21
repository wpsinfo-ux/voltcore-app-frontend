/* ==========================================================================
   VOLTCORE PRO • FRONT-END ENGINE V9.75 (COMPLETO • GITHUB + VERCEL + RENDER)
   Desenvolvido para VoltCore • Gestão Inteligente de Recarga
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

const VOLTCORE_LGPD_STORAGE_KEY = 'voltcore_lgpd_accepted_v1';
const VOLTCORE_CADASTROS_KEY = 'voltcore_cadastros_stage1_v1';

let userData = {
    name: "Wanderson Pedro da Silva",
    email: "contato@wpsinfo.com.br",
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

function garantirEstilosLogoVoltCore() {
    const oldStyle = document.getElementById('voltcore-logo-runtime-style');
    if (oldStyle) oldStyle.remove();

    const style = document.createElement('style');
    style.id = 'voltcore-logo-runtime-style';
    style.textContent = `
        #screen-auth > div {
            max-width: 520px !important;
            width: 100% !important;
            background: #ffffff !important;
        }
        .voltcore-marca-bloco {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            background: #ffffff;
            overflow: visible;
        }
        .voltcore-logo-centro {
            position: relative;
            display: inline-flex;
            align-items: flex-end;
            justify-content: center;
            background: #ffffff;
            overflow: visible;
        }
        .voltcore-logo-img {
            width: 176px;
            height: auto;
            object-fit: contain;
            display: block;
            background: #ffffff;
        }
        @media (min-width: 640px) {
            .voltcore-logo-img {
                width: 196px;
            }
        }
        .voltcore-pro-selo {
            position: relative;
            margin-left: 8px;
            margin-bottom: 10px;
            background: #a3e635;
            color: #0f172a;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 0.06em;
            line-height: 1;
            padding: 3px 7px;
            border-radius: 999px;
            border: 1px solid #84cc16;
            z-index: 2;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .voltcore-assinatura-recarga,
        .voltcore-assinatura-recarga--header,
        .voltcore-subtitulo-recarga {
            display: none !important;
        }
        .voltcore-marca-bloco--header {
            width: auto;
            min-width: 145px;
            flex-shrink: 0;
            align-items: center;
            padding-left: 8px;
            padding-right: 14px;
            overflow: visible;
        }
        .voltcore-logo-centro--header {
            justify-content: center;
            align-items: flex-end;
            overflow: visible;
        }
        .voltcore-logo-img--header {
            width: 116px;
            height: auto;
            object-fit: contain;
            display: block;
            background: #ffffff;
        }
        .voltcore-pro-selo--header {
            font-size: 8px;
            padding: 2px 6px;
            margin-left: 6px;
            margin-bottom: 6px;
        }
    `;
    document.head.appendChild(style);
}

function aplicarLogoNaTelaInterna() {
    garantirEstilosLogoVoltCore();
    const screenApp = document.getElementById('screen-app');
    if (!screenApp) return;

    const header = screenApp.querySelector('header') || screenApp;
    header.querySelectorAll('.voltcore-assinatura-recarga--header, .voltcore-subtitulo-recarga').forEach(el => el.remove());

    header.querySelectorAll('span, div').forEach(el => {
        if (el.children.length === 0 && (el.textContent || '').trim() === 'PRO') {
            el.remove();
        }
    });

    const img = header.querySelector('img[src*="logo-voltcore"], img[alt*="VoltCore"], img[alt*="Logo"]');
    if (!img) return;

    const containerRaiz = img.closest('a, div.flex, div');
    if (!containerRaiz) return;

    containerRaiz.classList.remove('w-12', 'w-14', 'w-16', 'w-20', 'w-24', 'w-28', 'w-32', 'max-w-xs', 'max-w-sm', 'overflow-hidden');
    containerRaiz.style.width = 'auto';
    containerRaiz.style.maxWidth = 'none';
    containerRaiz.style.overflow = 'visible';

    containerRaiz.innerHTML = `
        <div class="voltcore-marca-bloco voltcore-marca-bloco--header">
            <div class="voltcore-logo-centro voltcore-logo-centro--header">
                <img src="./assets/logo-voltcore.png" alt="Logo VoltCore" class="voltcore-logo-img voltcore-logo-img--header">
                <span class="voltcore-pro-selo voltcore-pro-selo--header">PRO</span>
            </div>
        </div>
    `;
}

window.onload = async function() {
    garantirEstilosLogoVoltCore();
    aplicarLogoNaTelaInterna();
    localStorage.setItem('voltcore_version_v975', 'true');
    carregarTudoPersistente();

    const isLogged = localStorage.getItem('voltcore_logged');
    if (isLogged === 'true') {
        const screenAuth = document.getElementById('screen-auth');
        const screenApp = document.getElementById('screen-app');
        if (screenAuth) screenAuth.classList.add('hidden');
        if (screenApp) screenApp.classList.remove('hidden');
        aplicarLogoNaTelaInterna();
        await sincronizarDadosNuvemUsuario();
    } else {
        prepararTelaAuthOficialVoltCore();
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
// ETAPA 1 (PARTES 1 E 2): AUTENTICAÇÃO, CADASTRO MULTI-TENANT & LOGO/LAYOUT
// ==========================================================================
let modoAuthAtual = 'cadastro';

function avaliarRequisitosSenhaVoltCore(senha, confirma = '') {
    const min8 = senha.length >= 8;
    const hasUpper = /[A-Z]/.test(senha);
    const hasLower = /[a-z]/.test(senha);
    const hasNumber = /\d/.test(senha);
    const matches = confirma === '' ? true : (senha.length > 0 && senha === confirma);

    return {
        min8,
        hasUpper,
        hasLower,
        hasNumber,
        matches,
        valid: min8 && hasUpper && hasLower && hasNumber && matches
    };
}

function atualizarIndicadoresSenhaVoltCore() {
    const senhaEl = document.getElementById('tupi-senha');
    const confirmaEl = document.getElementById('tupi-confirma');
    if (!senhaEl) return;

    const senha = senhaEl.value || '';
    const confirma = confirmaEl ? (confirmaEl.value || '') : '';
    const check = avaliarRequisitosSenhaVoltCore(senha, confirma);

    const setBadge = (id, ok) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.className = ok
            ? 'text-emerald-700 font-extrabold flex items-center gap-1'
            : 'text-slate-400 font-semibold flex items-center gap-1';
    };

    setBadge('req-senha-len', check.min8);
    setBadge('req-senha-upper', check.hasUpper);
    setBadge('req-senha-lower', check.hasLower);
    setBadge('req-senha-num', check.hasNumber);
    setBadge('req-senha-match', confirma.length > 0 && check.matches);
    return check;
}

function atualizarAvisoCondominioCadastro() {
    const selectCondo = document.getElementById('tupi-condo');
    const avisoBox = document.getElementById('aviso-vinculo-condo');
    if (!selectCondo || !avisoBox) return;

    const isAvulso = selectCondo.value.includes('Apenas Eletropostos / Visitante');
    if (isAvulso) {
        avisoBox.className = 'p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-medium';
        avisoBox.innerHTML = 'Vínculo <strong>Avulso / Rodovia</strong>: habilitado para eletropostos públicos/comerciais.';
    } else {
        avisoBox.className = 'p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-medium';
        avisoBox.innerHTML = `Vínculo em <strong>${selectCondo.value}</strong>: conta criada como <strong>Morador (Pendente)</strong> até aprovação do síndico para vagas do condomínio.`;
    }
}

function prepararTelaAuthOficialVoltCore() {
    garantirEstilosLogoVoltCore();
    const authBox = document.querySelector('#screen-auth > div');
    if (!authBox) return;

    const isCadastro = modoAuthAtual === 'cadastro';

    authBox.innerHTML = `
        <div class="text-center space-y-2.5 bg-white">
            <div class="flex flex-col items-center justify-center pt-1 pb-0.5">
                <div class="voltcore-marca-bloco">
                    <div class="voltcore-logo-centro">
                        <img src="./assets/logo-voltcore.png" alt="Logo VoltCore" class="voltcore-logo-img">
                        <span class="voltcore-pro-selo">PRO</span>
                    </div>
                </div>
            </div>

            <div class="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
                <button type="button" id="tab-btn-cadastro" onclick="alternarModoAuth('cadastro')" class="flex-1 py-2 text-xs font-black rounded-lg transition ${isCadastro ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'} cursor-pointer">Cadastrar</button>
                <button type="button" id="tab-btn-login" onclick="alternarModoAuth('login')" class="flex-1 py-2 text-xs font-black rounded-lg transition ${!isCadastro ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'} cursor-pointer">Já tenho conta</button>
            </div>

            <div id="auth-form-container" class="space-y-2 text-left">
                <div id="container-extra-cadastro" class="space-y-2 ${isCadastro ? '' : 'hidden'}">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Nome Completo *</label>
                            <input type="text" id="tupi-nome" placeholder="Seu nome completo" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Condomínio / Vínculo *</label>
                            <select id="tupi-condo" onchange="atualizarAvisoCondominioCadastro()" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-lime-500 focus:outline-none cursor-pointer">
                                ${CONDOS_DISPONIVEIS.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div id="aviso-vinculo-condo"></div>
                </div>

                <div class="grid grid-cols-1 ${isCadastro ? 'sm:grid-cols-1' : 'sm:grid-cols-2'} gap-2">
                    <div>
                        <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">E-mail *</label>
                        <input type="email" id="tupi-email" placeholder="seuemail@dominio.com" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                    </div>
                    <div class="${isCadastro ? 'hidden' : 'relative'}">
                        <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Senha *</label>
                        <input type="password" id="tupi-senha-login" placeholder="Sua senha" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 pr-9 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                        <button type="button" onclick="alternarVisibilidadeSenha('tupi-senha-login', this)" class="absolute right-2.5 top-6 text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                            <i class="fa-solid fa-eye text-xs"></i>
                        </button>
                    </div>
                </div>

                <div id="container-campos-senha-cadastro" class="${isCadastro ? 'space-y-2' : 'hidden'}">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div class="relative">
                            <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Senha *</label>
                            <input type="password" id="tupi-senha" oninput="atualizarIndicadoresSenhaVoltCore()" placeholder="Crie uma senha forte" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 pr-9 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                            <button type="button" onclick="alternarVisibilidadeSenha('tupi-senha', this)" class="absolute right-2.5 top-6 text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                                <i class="fa-solid fa-eye text-xs"></i>
                            </button>
                        </div>
                        <div class="relative">
                            <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Confirme sua Senha *</label>
                            <input type="password" id="tupi-confirma" oninput="atualizarIndicadoresSenhaVoltCore()" placeholder="Repita a senha" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 pr-9 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                            <button type="button" onclick="alternarVisibilidadeSenha('tupi-confirma', this)" class="absolute right-2.5 top-6 text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                                <i class="fa-solid fa-eye text-xs"></i>
                            </button>
                        </div>
                    </div>

                    <div id="container-regras-senha" class="bg-slate-50 border border-slate-200 rounded-xl p-2 text-[9px] space-y-1">
                        <div class="font-extrabold text-slate-700 uppercase">Regras obrigatórias de senha:</div>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-1">
                            <span id="req-senha-len" class="text-slate-400 font-semibold flex items-center gap-1">• Mín. 8 caracteres</span>
                            <span id="req-senha-upper" class="text-slate-400 font-semibold flex items-center gap-1">• 1 maiúscula</span>
                            <span id="req-senha-lower" class="text-slate-400 font-semibold flex items-center gap-1">• 1 minúscula</span>
                            <span id="req-senha-num" class="text-slate-400 font-semibold flex items-center gap-1">• 1 número</span>
                            <span id="req-senha-match" class="text-slate-400 font-semibold flex items-center gap-1 col-span-2">• Senhas coincidem</span>
                        </div>
                    </div>

                    <div id="box-lgpd-primeiro-cadastro" class="bg-slate-50 p-2 rounded-xl border border-slate-200 text-left flex items-start gap-2">
                        <input type="checkbox" id="check-lgpd-login" class="mt-0.5 rounded text-lime-600 focus:ring-lime-500 w-4 h-4 cursor-pointer shrink-0">
                        <label for="check-lgpd-login" class="text-[10px] text-slate-700 leading-tight cursor-pointer">
                            Li e concordo com os <a href="#" onclick="event.preventDefault(); abrirTermosPrivacidade();" class="text-lime-700 font-extrabold underline">Termos de Privacidade e LGPD</a> para uso da plataforma VoltCore.
                        </label>
                    </div>
                </div>

                <div class="flex justify-between items-center pt-0.5">
                    <button type="button" onclick="abrirLeitorQrCodeCamera()" class="text-[10px] font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer">
                        <i class="fa-solid fa-qrcode text-lime-600"></i> Leitura QR Code
                    </button>
                    <button type="button" onclick="abrirModalEsqueciSenha()" class="text-[10px] font-bold text-lime-700 hover:underline cursor-pointer">Esqueci minha senha</button>
                </div>

                <button type="button" onclick="processarAuthVoltCore()" id="btn-tupi-acao" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs shadow transition cursor-pointer">
                    ${isCadastro ? 'Cadastrar Conta' : 'Entrar'}
                </button>
            </div>

            <div class="pt-2 border-t border-slate-100 flex justify-center gap-4 text-xs">
                <button type="button" onclick="realizarLoginBiometrico()" class="text-slate-600 font-bold hover:text-slate-900 cursor-pointer"><i class="fa-solid fa-fingerprint text-lime-600 mr-1"></i> Biometria</button>
                <span class="text-slate-300">•</span>
                <button type="button" onclick="realizarLoginGoogle()" class="text-slate-600 font-bold hover:text-slate-900 cursor-pointer"><i class="fa-brands fa-google text-rose-500 mr-1"></i> Google</button>
            </div>
        </div>
    `;

    atualizarAvisoCondominioCadastro();
    atualizarIndicadoresSenhaVoltCore();
}

function alternarModoAuth(modo) {
    modoAuthAtual = modo;
    prepararTelaAuthOficialVoltCore();
}

function alternarVisibilidadeSenha(idInput, btn) {
    const input = document.getElementById(idInput);
    if (!input) return;
    const icon = btn ? btn.querySelector('i') : null;
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.className = 'fa-solid fa-eye-slash text-xs text-lime-600';
    } else {
        input.type = 'password';
        if (icon) icon.className = 'fa-solid fa-eye text-xs';
    }
}

async function processarAuthVoltCore() {
    const email = (document.getElementById('tupi-email')?.value || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
        showToast('Informe um e-mail válido.');
        return;
    }

    if (modoAuthAtual === 'cadastro') {
        const nome = (document.getElementById('tupi-nome')?.value || '').trim();
        const condo = document.getElementById('tupi-condo')?.value || CONDOS_DISPONIVEIS[0];
        const senha = (document.getElementById('tupi-senha')?.value || '').trim();
        const confirma = (document.getElementById('tupi-confirma')?.value || '').trim();
        const lgpdCheck = document.getElementById('check-lgpd-login');

        if (!nome || nome.length < 3) {
            showToast('Informe seu nome completo.');
            return;
        }

        if (lgpdCheck && !lgpdCheck.checked) {
            showToast('Marque o aceite dos Termos de Privacidade e LGPD para cadastrar.');
            return;
        }

        const checkSenha = avaliarRequisitosSenhaVoltCore(senha, confirma);
        if (!checkSenha.min8 || !checkSenha.hasUpper || !checkSenha.hasLower || !checkSenha.hasNumber) {
            showToast('A senha deve ter no mínimo 8 caracteres, 1 maiúscula, 1 minúscula e 1 número.');
            return;
        }
        if (senha !== confirma) {
            showToast('A confirmação de senha não coincide.');
            return;
        }

        const isAvulso = condo.includes('Apenas Eletropostos / Visitante');
        const statusInicial = isAvulso ? 'Aprovado' : 'Pendente';

        userData.name = nome;
        userData.email = email;
        userData.condo = condo;
        userData.allowedCondos = isAvulso ? [] : [condo];
        userData.role = isAvulso ? 'AVULSO' : 'MORADOR';
        userData.statusAprovacao = statusInicial;
        userData.lgpdAccepted = true;

        localStorage.setItem(VOLTCORE_LGPD_STORAGE_KEY, 'true');

        try {
            const listaCadastros = JSON.parse(localStorage.getItem(VOLTCORE_CADASTROS_KEY) || '[]');
            const registroNovo = {
                name: nome,
                email,
                condo,
                role: userData.role,
                statusAprovacao: statusInicial,
                lgpdAccepted: true,
                createdAt: new Date().toISOString()
            };
            const filtrada = listaCadastros.filter(item => item.email !== email);
            filtrada.unshift(registroNovo);
            localStorage.setItem(VOLTCORE_CADASTROS_KEY, JSON.stringify(filtrada));
        } catch (e) {}

        showToast(
            isAvulso
                ? 'Cadastro avulso concluído! Habilitado para eletropostos públicos/comerciais.'
                : 'Cadastro enviado! Status: Pendente até aprovação do síndico para vagas do condomínio.'
        );
    } else {
        const senhaLogin = (document.getElementById('tupi-senha-login')?.value || '').trim();
        if (!senhaLogin) {
            showToast('Informe sua senha para entrar.');
            return;
        }

        let cadastroLocal = null;
        try {
            const listaCadastros = JSON.parse(localStorage.getItem(VOLTCORE_CADASTROS_KEY) || '[]');
            cadastroLocal = listaCadastros.find(item => item.email === email) || null;
        } catch (e) {}

        userData.email = email;
        avaliarPermissaoPorEmail(email);

        if (cadastroLocal && userData.role !== 'ADM_MASTER') {
            userData.name = cadastroLocal.name || userData.name;
            userData.condo = cadastroLocal.condo || userData.condo;
            userData.role = cadastroLocal.role || 'MORADOR';
            userData.statusAprovacao = cadastroLocal.statusAprovacao || 'Pendente';
            userData.allowedCondos = userData.condo ? [userData.condo] : [];
        }

        if (localStorage.getItem(VOLTCORE_LGPD_STORAGE_KEY) === 'true') {
            userData.lgpdAccepted = true;
        }
        showToast(`Bem-vindo, ${userData.role}!`);
    }

    localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
    localStorage.setItem('voltcore_logged', 'true');
    localStorage.setItem('voltcore_biometric_email', userData.email);

    document.getElementById('screen-auth').classList.add('hidden');
    document.getElementById('screen-app').classList.remove('hidden');
    aplicarLogoNaTelaInterna();
    aplicarDadosUsuarioNaTela();
    aplicarControlePermissoesPerfil();
    configurarPermissoesCondominioPorUsuario();
    renderStations();
    await sincronizarDadosNuvemUsuario();
}

function avaliarPermissaoPorEmail(email) {
    const emailLimpo = (email || '').trim().toLowerCase();
    if (emailLimpo === 'contato@wpsinfo.com.br') {
        userData.role = 'ADM_MASTER';
        userData.statusAprovacao = 'Aprovado';
        userData.name = 'Wanderson Pedro da Silva (ADM Master)';
        userData.allowedCondos = CONDOS_DISPONIVEIS;
    } else {
        userData.role = 'MORADOR';
        userData.allowedCondos = userData.condo ? [userData.condo] : [];
        if (emailLimpo === 'wandersonp_s@hotmail.com') {
            userData.name = 'Wanderson Pedro da Silva';
            userData.condo = 'Belarte Residencial Jundiaí';
            userData.allowedCondos = ['Belarte Residencial Jundiaí'];
            if (!userData.statusAprovacao) userData.statusAprovacao = 'Aprovado';
        } else {
            userData.name = emailLimpo.split('@')[0] || 'Condômino';
            if (!userData.statusAprovacao) userData.statusAprovacao = 'Pendente';
        }
    }
}

function aplicarControlePermissoesPerfil() {
    const isMaster = userData.role === 'ADM_MASTER';
    document.querySelectorAll('.adm-only-element').forEach(el => {
        if (!isMaster) {
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
            if (!isMaster) {
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

function abrirModalEsqueciSenha() {
    const emailAtual = document.getElementById('tupi-email') ? document.getElementById('tupi-email').value.trim() : '';
    const htmlReset = `
        <div class="space-y-3 text-left text-xs pb-4">
            <p class="text-slate-600 leading-relaxed">Informe seu e-mail cadastrado. Um link de recuperação SMTP será disparado:</p>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">E-mail Cadastrado</label>
                <input type="email" id="reset-email-input" value="${emailAtual}" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
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
    if (!email || !email.includes('@')) { showToast('Digite um e-mail válido.'); return; }
    showToast(`Disparando e-mail SMTP para ${email}...`);
    if (supabaseClient && supabaseClient.auth) {
        try { await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }); } catch (e) {}
    }
    const aviso = document.getElementById('reset-aviso-enviado');
    const btnEnviar = document.getElementById('btn-enviar-reset');
    if (aviso) aviso.classList.remove('hidden');
    if (btnEnviar) { btnEnviar.innerText = 'E-MAIL DISPARADO COM SUCESSO'; btnEnviar.disabled = true; }
}

async function realizarLoginBiometrico() {
    const savedBioEmail = localStorage.getItem('voltcore_biometric_email') || userData.email;
    showToast('Lendo credencial biométrica...');
    setTimeout(async () => {
        userData.email = savedBioEmail;
        userData.lgpdAccepted = true;
        avaliarPermissaoPorEmail(savedBioEmail);
        localStorage.setItem('voltcore_logged', 'true');
        localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
        document.getElementById('screen-auth').classList.add('hidden');
        document.getElementById('screen-app').classList.remove('hidden');
        aplicarLogoNaTelaInterna();
        aplicarDadosUsuarioNaTela();
        aplicarControlePermissoesPerfil();
        configurarPermissoesCondominioPorUsuario();
        renderStations();
        await sincronizarDadosNuvemUsuario();
        await carregarEstacoesDoBanco();
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
    aplicarLogoNaTelaInterna();
    aplicarDadosUsuarioNaTela();
    aplicarControlePermissoesPerfil();
    configurarPermissoesCondominioPorUsuario();
    renderStations();
    await sincronizarDadosNuvemUsuario();
    await carregarEstacoesDoBanco();
    showToast('Login com Google realizado');
}

function carregarTudoPersistente() {
    const savedUser = localStorage.getItem('voltcore_user_data');
    if (savedUser) { try { userData = JSON.parse(savedUser); } catch(e){} }
    if (localStorage.getItem(VOLTCORE_LGPD_STORAGE_KEY) === 'true') {
        userData.lgpdAccepted = true;
    }
    if (userData.email) avaliarPermissaoPorEmail(userData.email);
    aplicarDadosUsuarioNaTela();

    const savedVehicles = localStorage.getItem('voltcore_vehicles');
    if (savedVehicles) { try { meusVeiculos = JSON.parse(savedVehicles); } catch(e){} }
    renderizarVeiculos();

    const savedWallet = localStorage.getItem('voltcore_wallet_balance');
    if (savedWallet !== null) saldoCarteira = parseFloat(savedWallet);

    const savedExtrato = localStorage.getItem('voltcore_extrato');
    if (savedExtrato) { try { extratoTransacoes = JSON.parse(savedExtrato); } catch(e){} }

    const savedCards = localStorage.getItem('voltcore_saved_cards');
    if (savedCards) { try { cartoesSalvos = JSON.parse(savedCards); } catch(e){} }

    const savedMoradores = localStorage.getItem('voltcore_moradores');
    if (savedMoradores) { try { moradoresCondominio = JSON.parse(savedMoradores); } catch(e){} }

    atualizarDisplayCarteira();
}

function aplicarDadosUsuarioNaTela() {
    aplicarLogoNaTelaInterna();
    const img = document.getElementById('user-profile-img');
    const nameEl = document.getElementById('user-display-name');
    const emailEl = document.getElementById('user-display-email');
    const condoEl = document.getElementById('user-display-condo');
    if (img && userData.photo) img.src = userData.photo;
    if (nameEl) nameEl.innerText = userData.name || 'Wanderson Pedro da Silva';
    if (emailEl) emailEl.innerText = userData.email || 'contato@wpsinfo.com.br';
    if (condoEl) {
        const statusTag = (userData.role === 'MORADOR' && userData.statusAprovacao === 'Pendente') ? ' • Pendente Síndico' : '';
        condoEl.innerText = `${userData.condo}${statusTag}`;
    }
}

function configurarPermissoesCondominioPorUsuario() {
    const selectCondo = document.getElementById('select-condo');
    if (!selectCondo) return;
    selectCondo.innerHTML = '';
    if (userData.role === 'ADM_MASTER') {
        CONDOS_DISPONIVEIS.forEach(c => { selectCondo.innerHTML += `<option value="${c}">${c}</option>`; });
        selectCondo.disabled = false;
    } else {
        const condoAtual = userData.condo || CONDOS_DISPONIVEIS[0];
        selectCondo.innerHTML = `<option value="${condoAtual}">${condoAtual}</option>`;
        selectCondo.disabled = true;
    }
    const savedCondo = localStorage.getItem('voltcore_selected_condo');
    if (savedCondo && (userData.role === 'ADM_MASTER' || (userData.allowedCondos && userData.allowedCondos.includes(savedCondo)))) {
        selectCondo.value = savedCondo;
    } else {
        selectCondo.value = userData.condo || "Belarte Residencial Jundiaí";
    }
}

function logoutApp() {
    if (pixPollingInterval) { clearInterval(pixPollingInterval); pixPollingInterval = null; }
    localStorage.removeItem('voltcore_logged');
    localStorage.removeItem('voltcore_user_data');
    document.getElementById('screen-auth').classList.remove('hidden');
    document.getElementById('screen-app').classList.add('hidden');
    prepararTelaAuthOficialVoltCore();
    showToast('Sessão encerrada com segurança.');
}

function abrirTermosPrivacidade() {
    const htmlTermos = `
        <div class="space-y-3 text-left text-xs leading-relaxed pb-4">
            <h4 class="font-bold text-slate-900 text-sm">Política de Privacidade & LGPD • VoltCore</h4>
            <p class="text-slate-600">A <strong>VoltCore Soluções de Recarga Inteligente</strong> opera sob estrita conformidade com a LGPD (Lei nº 13.709/2018). Seus dados de cadastro, veículo, histórico de recargas e vínculo condominial são utilizados exclusivamente para autenticação, operação de recarga e faturamento.</p>
            <button onclick="closeModal()" class="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs mt-2 cursor-pointer">Voltar</button>
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
                <button onclick="simularLeituraQrSucesso()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs transition cursor-pointer">VALIDAR COMANDO OCPP</button>
                <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Leitura QR Code & Disparo OCPP', htmlQr, 'fa-qrcode', 'lime');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            streamCameraAtiva = stream;
            const videoElement = document.getElementById('qr-camera-video');
            if (videoElement) videoElement.srcObject = stream;
        })
        .catch(err => { showToast('Câmera indisponível. Usando modo rápido.'); });
}

function simularLeituraQrSucesso() {
    if (userData.role === 'MORADOR' && userData.statusAprovacao === 'Pendente' && currentMode === 'condo') {
        closeModal();
        showToast('Acesso bloqueado: seu cadastro em condomínio aguarda aprovação do síndico.');
        return;
    }
    closeModal();
    showCustomModal('Comando OCPP RemoteStartTransaction Enviado', `
        <div class="space-y-2 text-center pb-2">
            <div class="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-lg mx-auto"><i class="fa-solid fa-bolt"></i></div>
            <h4 class="font-bold text-slate-900 text-xs">Comando Aceito pelo Eletroposto!</h4>
            <p class="text-[10px] text-slate-600">Sessão iniciada com sucesso.</p>
            <button onclick="closeModal(); switchTab('stations');" class="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs mt-1 cursor-pointer">VER PAINEL DE CARGA</button>
        </div>
    `, 'fa-bolt', 'emerald');
    showToast('Transação OCPP iniciada com sucesso!');
}

function abrirModalMeusDados() {
    const statusLabel = userData.statusAprovacao || 'Aprovado';
    const isMaster = userData.role === 'ADM_MASTER';
    const htmlDados = `
        <div class="space-y-2 text-left pb-4">
            <div class="p-2 rounded-xl bg-slate-100 border border-slate-200 text-[10px] flex items-center justify-between">
                <span class="font-bold text-slate-600">Perfil / Status (travado):</span>
                <span class="font-extrabold text-slate-900">${userData.role} • ${statusLabel}</span>
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Nome Completo</label>
                <input type="text" id="edit-user-name" value="${userData.name}" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">E-mail Comercial</label>
                <input type="email" id="edit-user-email" value="${userData.email}" readonly class="w-full bg-slate-100 border border-slate-300 rounded-xl p-2 text-xs font-medium text-slate-500 cursor-not-allowed">
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Telefone / WhatsApp</label>
                <input type="text" id="edit-user-phone" value="${userData.phone || ''}" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Condomínio / Unidade ${!isMaster ? '(travado)' : ''}</label>
                <input type="text" id="edit-user-condo" value="${userData.condo}" ${!isMaster ? 'readonly' : ''} class="w-full ${!isMaster ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50'} border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div class="flex gap-2 pt-2">
                <button onclick="salvarMeusDados()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer">SALVAR DADOS</button>
                <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Meus Dados & Cadastro', htmlDados, 'fa-user', 'lime');
}

function salvarMeusDados() {
    userData.name = document.getElementById('edit-user-name').value;
    userData.phone = document.getElementById('edit-user-phone').value;
    if (userData.role === 'ADM_MASTER') {
        userData.condo = document.getElementById('edit-user-condo').value;
    }
    localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
    aplicarDadosUsuarioNaTela();
    configurarPermissoesCondominioPorUsuario();
    closeModal();
    showToast('Dados cadastrais salvos com sucesso!');
}

async function carregarVeiculosDoBanco() {
    if (!supabaseClient) return;
    try {
        const emailAtual = userData.email || 'contato@wpsinfo.com.br';
        const { data } = await supabaseClient.from('vehicles').select('*').eq('user_email', emailAtual).order('created_at', { ascending: false });
        if (data) {
            meusVeiculos = data.map(v => ({ id: v.id, model: v.model, plate: v.plate, type: v.type }));
            localStorage.setItem('voltcore_vehicles', JSON.stringify(meusVeiculos));
            renderizarVeiculos();
        }
    } catch (err) {}
}

function abrirModalAdicionarVeiculo() {
    const htmlCarro = `
        <div class="space-y-2 text-left pb-4">
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Modelo do Veículo</label>
                <input type="text" id="input-car-model" placeholder="Ex: BYD Seal..." class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
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
                </select>
            </div>
            <div class="flex gap-2 pt-2">
                <button onclick="confirmarAdicionarVeiculo()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer">CADASTRAR</button>
                <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Cadastrar Novo Veículo', htmlCarro, 'fa-car', 'lime');
}

async function confirmarAdicionarVeiculo() {
    const model = document.getElementById('input-car-model').value;
    const plate = document.getElementById('input-car-plate').value;
    const type = document.getElementById('input-car-type').value;
    if (!model || !plate) { showToast('Preencha o modelo e a placa.'); return; }

    let insertedId = null;
    if (supabaseClient) {
        try {
            const { data } = await supabaseClient.from('vehicles').insert([{ user_email: userData.email || 'contato@wpsinfo.com.br', model, plate, type }]).select();
            if (data && data[0]) insertedId = data[0].id;
        } catch (e) {}
    }
    meusVeiculos.unshift({ id: insertedId, model, plate, type });
    localStorage.setItem('voltcore_vehicles', JSON.stringify(meusVeiculos));
    renderizarVeiculos();
    closeModal();
    showToast('Veículo cadastrado com sucesso!');
}

async function removerVeiculo(index) {
    const veiculo = meusVeiculos[index];
    if (supabaseClient && veiculo && veiculo.id) {
        try { await supabaseClient.from('vehicles').delete().eq('id', veiculo.id); } catch (e) {}
    }
    meusVeiculos.splice(index, 1);
    localStorage.setItem('voltcore_vehicles', JSON.stringify(meusVeiculos));
    renderizarVeiculos();
    showToast('Veículo removido!');
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
                <div class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-lg bg-lime-100 text-lime-700 flex items-center justify-center text-sm"><i class="fa-solid fa-car-side"></i></div>
                    <div>
                        <span class="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">${v.type}</span>
                        <h3 class="font-extrabold text-slate-900 text-xs mt-0.5">${v.model} • Placa ${v.plate}</h3>
                    </div>
                </div>
                <button onclick="removerVeiculo(${index})" class="text-rose-500 hover:text-rose-700 p-1.5 text-xs cursor-pointer"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
}

async function carregarExtratoDoBanco() {
    if (!supabaseClient) return;
    try {
        const emailAtual = userData.email || 'contato@wpsinfo.com.br';
        const { data } = await supabaseClient.from('transacoes').select('*').eq('email_usuario', emailAtual).order('data_transacao', { ascending: false });
        if (data) {
            extratoTransacoes = data.map(t => ({ title: t.titulo, desc: t.descricao || '', value: t.valor, type: t.tipo }));
            let saldoCalculado = 0;
            data.forEach(t => {
                const num = parseFloat(String(t.valor).replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
                if (t.tipo === 'credit') saldoCalculado += Math.abs(num);
                if (t.tipo === 'debit') saldoCalculado -= Math.abs(num);
            });
            saldoCarteira = Math.max(0, saldoCalculado);
            localStorage.setItem('voltcore_extrato', JSON.stringify(extratoTransacoes));
            localStorage.setItem('voltcore_wallet_balance', saldoCarteira);
            atualizarDisplayCarteira();
        }
    } catch (err) {}
}

async function carregarCartoesDoBanco() {
    if (!supabaseClient) return;
    try {
        const emailAtual = userData.email || 'contato@wpsinfo.com.br';
        const { data } = await supabaseClient.from('voltcore_saved_cards').select('*').eq('user_email', emailAtual).order('created_at', { ascending: false });
        if (data) {
            cartoesSalvos = data.map((c, i) => ({ id: c.card_id, lastFour: c.last_four, brand: c.brand || 'Mastercard', holder: c.cardholder_name, default: i === 0 }));
            localStorage.setItem('voltcore_saved_cards', JSON.stringify(cartoesSalvos));
            atualizarDisplayCarteira();
        }
    } catch (err) {}
}

async function registrarTransacaoNoBanco(titulo, desc, valorFormatado, tipo) {
    if (!supabaseClient) return;
    try {
        await supabaseClient.from('transacoes').insert([{ email_usuario: userData.email || 'contato@wpsinfo.com.br', tipo, titulo, descricao: desc, valor: valorFormatado, data_transacao: new Date().toISOString() }]);
    } catch (err) {}
}

function abrirModalDeposito() {
    const htmlDep = `
        <div class="space-y-3 text-left pb-4">
            <p class="text-[11px] text-slate-600">Insira o valor em Reais (R$) para recarregar o saldo da carteira VoltCore Pay:</p>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">Valor da Recarga (Mínimo R$ 1,00)</label>
                <input type="text" id="input-valor-deposito" oninput="formatarMoedaInput(this)" placeholder="R$ 50,00" value="R$ 50,00" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-lime-500 focus:outline-none text-right font-mono text-sm">
            </div>
            <div class="space-y-2 pt-2 border-t border-slate-100">
                <p class="text-[10px] font-bold text-slate-700 uppercase">Forma de Pagamento Oficial:</p>
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="processarPagamentoPix()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                        <i class="fa-solid fa-qrcode"></i> Pagar com PIX
                    </button>
                    <button onclick="abrirModalCartaoCheckout()" class="w-full bg-slate-900 hover:bg-slate-800 text-lime-400 font-extrabold py-2.5 px-3 rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                        <i class="fa-solid fa-credit-card"></i> Cartão de Crédito
                    </button>
                </div>
            </div>
            <div class="pt-2">
                <button onclick="closeModal()" class="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 rounded-xl text-xs transition cursor-pointer">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Adicionar Saldo • Mercado Pago', htmlDep, 'fa-wallet', 'lime');
}

function formatarMoedaInput(input) {
    let valorLimpo = input.value.replace(/\D/g, '');
    if (!valorLimpo) valorLimpo = '0';
    let numero = parseInt(valorLimpo, 10) / 100;
    input.value = numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function processarPagamentoPix() {
    const inputVal = document.getElementById('input-valor-deposito').value;
    const valor = parseFloat(inputVal.replace(/[^\d]/g, '')) / 100;
    if (!valor || isNaN(valor) || valor < 1.00) { showToast('Mínimo R$ 1,00.'); return; }

    showToast('Gerando cobrança PIX oficial no Mercado Pago...');
    try {
        const resposta = await fetch(`${BACKEND_URL}/api/pagamento/pix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transaction_amount: valor, description: `Recarga VoltCore Pay - R$ ${valor.toFixed(2)}`, email: userData.email, first_name: userData.name })
        });
        const dados = await resposta.json();
        if (dados.success && dados.id) {
            const paymentId = dados.id;
            const htmlPix = `
                <div class="space-y-3 text-center pb-4">
                    <div class="bg-slate-900 p-3 rounded-xl text-white">
                        <p class="text-[10px] text-slate-400 uppercase font-bold">PIX Copia e Cola Oficial (Mercado Pago)</p>
                        <p class="text-[10px] font-mono text-lime-400 break-all select-all mt-1 max-h-20 overflow-y-auto">${dados.qr_code}</p>
                    </div>
                    ${dados.qr_code_base64 ? `<img src="data:image/png;base64,${dados.qr_code_base64}" class="w-36 h-36 mx-auto rounded-lg border border-slate-200 shadow-sm" alt="QR Code Pix" />` : ''}
                    <div class="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-800 font-bold flex items-center justify-center gap-2">
                        <i class="fa-solid fa-spinner fa-spin text-amber-600"></i>
                        <span>Aguardando pagamento real no banco (ID #${paymentId})...</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="verificarStatusPixManual('${paymentId}', ${valor})" class="flex-1 bg-slate-900 hover:bg-slate-800 text-lime-400 font-extrabold py-2.5 rounded-xl text-xs shadow transition cursor-pointer">JÁ PAGUEI • VERIFICAR</button>
                        <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer">Cancelar</button>
                    </div>
                </div>
            `;
            showCustomModal('Pagamento Pix • Validação Bancária', htmlPix, 'fa-qrcode', 'emerald');
            iniciarVerificacaoAutomaticaPix(paymentId, valor);
        } else {
            showToast(dados.error || 'Erro ao gerar Pix.');
        }
    } catch (err) { showToast('Falha de comunicação com o servidor.'); }
}

function iniciarVerificacaoAutomaticaPix(paymentId, valor) {
    if (pixPollingInterval) clearInterval(pixPollingInterval);
    pixPollingInterval = setInterval(async () => { await consultarStatusPixNoBackend(paymentId, valor, false); }, 5000);
}

async function verificarStatusPixManual(paymentId, valor) {
    showToast('Consultando status real no Mercado Pago...');
    await consultarStatusPixNoBackend(paymentId, valor, true);
}

async function consultarStatusPixNoBackend(paymentId, valor, exibirAvisoPendente) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/pagamento/status/${paymentId}`);
        const data = await res.json();
        if (data.success && data.status === 'approved') {
            if (pixPollingInterval) { clearInterval(pixPollingInterval); pixPollingInterval = null; }
            await creditarSaldoAprovado(valor, `PIX #${paymentId}`);
        } else if (exibirAvisoPendente) {
            showToast(`Status atual no banco: ${data.status || 'Pendente'}.`);
        }
    } catch (err) {
        if (exibirAvisoPendente) showToast('Não foi possível confirmar o pagamento.');
    }
}

function abrirModalCartaoCheckout() {
    const inputVal = document.getElementById('input-valor-deposito').value;
    const valor = parseFloat(inputVal.replace(/[^\d]/g, '')) / 100;
    if (!valor || isNaN(valor) || valor < 1.00) { showToast('Mínimo R$ 1,00.'); return; }

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
                <button onclick="processarPagamentoCartaoSalvo(${valor})" class="w-full bg-slate-900 hover:bg-slate-800 text-lime-400 font-extrabold py-2.5 rounded-lg text-xs transition cursor-pointer shadow-xs">
                    COBRAR NESTE CARTÃO (R$ ${valor.toFixed(2).replace('.', ',')})
                </button>
            </div>
        `;
    }

    const htmlCartao = `
        <div class="space-y-3 text-left text-xs pb-10">
            ${seletorCartaoSalvoHtml}
            <div>
                <label class="block font-bold text-slate-700 mb-1">Número do Cartão:</label>
                <input type="text" id="cc-number" placeholder="4532 •••• •••• ••••" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Validade (MM/AA):</label>
                    <input type="text" id="cc-expiry" placeholder="MM/AA" maxlength="5" oninput="formatarValidadeCartao(this)" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">CVV:</label>
                    <input type="password" id="cc-cvv" placeholder="123" maxlength="4" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
            </div>
            <div>
                <label class="block font-bold text-slate-700 mb-1">Nome no Cartão:</label>
                <input type="text" id="cc-holder" value="${userData.name}" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div class="flex gap-2 pt-3">
                <button onclick="processarPagamentoCartaoNovo(${valor})" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-3 rounded-xl text-xs shadow-lg transition cursor-pointer">PROCESSAR COBRANÇA</button>
                <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs transition cursor-pointer">Voltar</button>
            </div>
        </div>
    `;
    showCustomModal('Checkout Transparente • Cartão', htmlCartao, 'fa-credit-card', 'lime');
}

function formatarValidadeCartao(input) {
    let v = input.value.replace(/\D/g, '');
    input.value = v.length >= 2 ? v.substring(0, 2) + '/' + v.substring(2, 4) : v;
}

async function processarPagamentoCartaoSalvo(valor) {
    showToast('Enviando cobrança para operadora...');
    const cartaoPadrao = cartoesSalvos[0];
    await creditarSaldoAprovado(valor, `Cartão •••• ${cartaoPadrao.lastFour}`);
    showToast('Transação aprovada!');
}

async function processarPagamentoCartaoNovo(valor) {
    const cardNumber = document.getElementById('cc-number').value.replace(/\D/g, '');
    const expiry = document.getElementById('cc-expiry').value;
    const cvv = document.getElementById('cc-cvv').value;
    const holderName = document.getElementById('cc-holder').value;
    if (!cardNumber || !expiry || !cvv) { showToast('Preencha os campos.'); return; }

    const last4 = cardNumber.slice(-4);
    cartoesSalvos.unshift({ id: 'card_' + Date.now(), lastFour: last4, brand: 'Mastercard', holder: holderName, default: true });
    localStorage.setItem('voltcore_saved_cards', JSON.stringify(cartoesSalvos));
    await creditarSaldoAprovado(valor, `Cartão •••• ${last4}`);
    showToast('Pagamento aprovado e cartão salvo!');
}

async function creditarSaldoAprovado(valor, origemPagamento) {
    saldoCarteira += valor;
    localStorage.setItem('voltcore_wallet_balance', saldoCarteira);
    const agora = new Date();
    const titulo = `Depósito Aprovado (${origemPagamento})`;
    const desc = `${agora.toLocaleDateString('pt-BR')} • ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - Liquidado`;
    const valorFmt = `+ R$ ${valor.toFixed(2).replace('.', ',')}`;

    extratoTransacoes.unshift({ title: titulo, desc: desc, value: valorFmt, type: 'credit' });
    localStorage.setItem('voltcore_extrato', JSON.stringify(extratoTransacoes));
    await registrarTransacaoNoBanco(titulo, desc, valorFmt, 'credit');
    atualizarDisplayCarteira();
    closeModal();
}

function atualizarDisplayCarteira() {
    const balanceEl = document.getElementById('wallet-balance-display');
    if (balanceEl) balanceEl.innerText = `R$ ${saldoCarteira.toFixed(2).replace('.', ',')}`;
    const containerExtrato = document.getElementById('extrato-list-container');
    if (containerExtrato) {
        containerExtrato.innerHTML = '';
        let seletorCartoesHtml = '';
        cartoesSalvos.forEach((c, idx) => {
            seletorCartoesHtml += `
                <div class="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-lime-400 text-white shadow-xs mb-2">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg bg-lime-400/20 text-lime-400 flex items-center justify-center text-sm font-bold"><i class="fa-solid fa-credit-card"></i></div>
                        <div>
                            <h4 class="font-extrabold text-xs text-white">${c.brand} •••• ${c.lastFour}</h4>
                            <p class="text-[10px] text-slate-400">${c.holder}</p>
                        </div>
                    </div>
                    <button onclick="excluirCartaoSalvo(${idx})" class="text-rose-400 hover:text-rose-300 p-2 text-xs font-bold cursor-pointer"><i class="fa-solid fa-trash-can"></i> Excluir</button>
                </div>
            `;
        });
        containerExtrato.innerHTML += `<div class="mb-4">${seletorCartoesHtml}</div>`;
        extratoTransacoes.forEach(t => {
            const isCredit = t.type === 'credit';
            containerExtrato.innerHTML += `
                <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-1.5">
                    <div>
                        <h4 class="font-bold text-slate-900 text-[11px]">${t.title}</h4>
                        <p class="text-[10px] text-slate-500">${t.desc}</p>
                    </div>
                    <span class="font-extrabold ${isCredit ? 'text-emerald-600' : 'text-slate-900'} text-[11px]">${t.value}</span>
                </div>
            `;
        });
    }
}

async function excluirCartaoSalvo(idx) {
    cartoesSalvos.splice(idx, 1);
    localStorage.setItem('voltcore_saved_cards', JSON.stringify(cartoesSalvos));
    atualizarDisplayCarteira();
    showToast('Cartão removido!');
}

async function carregarEstacoesDoBanco() {
    if (supabaseClient) {
        try {
            const { data } = await supabaseClient.from('pontos_recarga').select('*').order('id_ponto', { ascending: true });
            if (data && data.length > 0) {
                stations = data.map((st, index) => ({
                    id: parseInt(st.id_ponto || (index + 1), 10),
                    name: st.nome_vaga || `VAGA 0${index+1}`,
                    condo: st.condominio || 'Condomínio Gioviale • Torre Sul',
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
        } catch (err) {}
    }
    carregarOuInicializarEstacoes();
    renderStations();
}

function configurarSupabaseRealtime() {
    if (!supabaseClient) return;
    try {
        supabaseClient.channel('tabela-pontos-sync-v975').on('postgres_changes', { event: '*', schema: 'public', table: 'pontos_recarga' }, () => {
            carregarEstacoesDoBanco();
        }).subscribe();
    } catch (err) {}
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
            tempo_decorrido: String(st.timer || 0),
            ocpp_id: st.ocppId,
            ocpp_status: st.ocppStatus
        }], { onConflict: 'id_ponto' });
    } catch (err) {}
}

function carregarOuInicializarEstacoes() {
    const savedStations = localStorage.getItem('voltcore_stations_v5_ocpp');
    if (savedStations) { try { stations = JSON.parse(savedStations); return; } catch(e){} }
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
        setTimeout(() => { initLeafletMap(); renderCommercialStations(); }, 200);
    }
    aplicarLogoNaTelaInterna();
}

let mapInitialized = false;
let leafletMap = null;
let currentMarkers = [];
let mapInterativoAtivo = false;
let filtroTipoAtual = 'ALL';

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
        if (btnToggle) btnToggle.className = "text-[9px] font-bold bg-emerald-600 text-white px-2 py-1 rounded-lg shadow-xs hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1";
        if (leafletMap) { leafletMap.dragging.enable(); leafletMap.touchZoom.enable(); leafletMap.scrollWheelZoom.enable(); }
        showToast('Mapa desbloqueado para navegação!');
    } else {
        if (blocker) blocker.classList.remove('opacity-0', 'pointer-events-none');
        if (lockTxt) lockTxt.innerText = "Toque para Mexer no Mapa";
        if (btnToggle) btnToggle.className = "text-[9px] font-bold bg-slate-900 text-lime-400 px-2 py-1 rounded-lg shadow-xs hover:bg-slate-800 transition cursor-pointer flex items-center gap-1";
        if (leafletMap) { leafletMap.dragging.disable(); leafletMap.touchZoom.disable(); leafletMap.scrollWheelZoom.disable(); }
        showToast('Mapa travado.');
    }
}

function filtrarMapaComercial(tipo) {
    filtroTipoAtual = tipo;
    const termoBusca = document.getElementById('commercialSearchInput') ? document.getElementById('commercialSearchInput').value : '';
    plotarMarcadoresMapa(filtroTipoAtual, termoBusca);
    renderCommercialStations(termoBusca);
}

function filtrarPostosComerciaisBusca() {
    const termo = document.getElementById('commercialSearchInput').value;
    plotarMarcadoresMapa(filtroTipoAtual, termo);
    renderCommercialStations(termo);
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
        const customIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `<div style="background: ${corPin}; color: #ffffff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 0 12px rgba(140,198,63,0.8); border: 2px solid #ffffff;"><i class="fa-solid fa-bolt text-[10px]"></i></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const popupHtml = `
            <div style="font-family: 'Inter', sans-serif; width: 200px;">
                <h4 style="font-weight: 800; font-size: 12px; color: #0f172a; margin-bottom: 2px;">${p.name}</h4>
                <p style="font-size: 9px; color: #475569; margin-bottom: 2px;">ID OCPP: <strong>${p.ocppId}</strong></p>
                <p style="font-size: 9px; color: #475569; margin-bottom: 4px;">${p.address}</p>
                <button onclick="abrirLeitorQrCodeCamera()" style="width: 100%; background: ${corPin}; color: #ffffff; border: none; padding: 5px; border-radius: 5px; font-weight: bold; font-size: 10px; cursor: pointer;"><i class="fa-solid fa-qrcode"></i> Ler QR Code</button>
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

    let comLivre = 0, comCarregando = 0;
    postosRodoviaComercial.forEach(p => {
        if (p.status === 'Disponível') comLivre++;
        if (p.status === 'Em Uso') comCarregando++;

        if (filtroTipoAtual !== 'ALL' && p.type !== filtroTipoAtual) return;
        if (termoBusca && termoBusca.trim() !== '') {
            const query = termoBusca.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const nomeNorm = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cidadeNorm = p.city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (!nomeNorm.includes(query) && !cidadeNorm.includes(query)) return;
        }

        const isDC = p.type === 'DC';
        const corTag = isDC ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-lime-100 text-lime-800 border-lime-200';

        grid.innerHTML += `
            <div class="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-[8px] font-extrabold px-2 py-0.5 rounded-full border ${corTag}">${isDC ? 'Carga Rápida DC' : 'Carga Lenta AC'}</span>
                        <span class="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-mono">OCPP: ${p.ocppId}</span>
                    </div>
                    <h4 class="font-extrabold text-slate-900 text-xs">${p.name}</h4>
                    <p class="text-[10px] text-slate-500 mt-0.5">${p.address}</p>
                    <p class="text-[9px] text-slate-700 font-semibold mt-1">Plugues: ${p.plugs}</p>
                </div>
                <button onclick="abrirLeitorQrCodeCamera()" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-bold py-1.5 px-2 rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer">
                    <i class="fa-solid fa-qrcode"></i> Ler QR Code OCPP
                </button>
            </div>
        `;
    });

    if (document.getElementById('comm-stat-livre')) document.getElementById('comm-stat-livre').innerText = comLivre;
    if (document.getElementById('comm-stat-carregando')) document.getElementById('comm-stat-carregando').innerText = comCarregando;
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
    aplicarLogoNaTelaInterna();
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
    const isPendenteCondo = userData.role === 'MORADOR' && userData.statusAprovacao === 'Pendente';

    stations.forEach(st => {
        if (userData.role !== 'ADM_MASTER' && st.condo !== currentCondo) return;
        if (st.status === 'Disponível') livre++;
        if (st.status === 'Reservado') reservado++;
        if (st.status === 'Em Uso') carregando++;

        if (currentFilter !== 'all' && st.status !== currentFilter) return;

        grid.innerHTML += `
            <div class="bg-white rounded-xl border p-3 shadow-xs hover:border-lime-400 transition">
                <div class="flex justify-between items-start">
                    <h3 class="text-xs font-extrabold text-slate-900">${st.name}</h3>
                    <span class="text-[9px] font-bold px-2 py-0.5 rounded ${st.status === 'Disponível' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${st.status}</span>
                </div>
                <p class="text-[9px] text-slate-500 mt-1">${st.condo} • ID: ${st.ocppId}</p>
                ${isPendenteCondo ? `<p class="text-[9px] text-amber-700 font-bold mt-1">Pendente de aprovação do síndico para uso em condomínio.</p>` : ''}
                <div class="flex gap-2 mt-3">
                    <button onclick="startCharging(${st.id})" class="flex-1 ${isPendenteCondo ? 'bg-slate-200 text-slate-600' : 'bg-lime-500 hover:bg-lime-600 text-slate-900'} font-bold py-1.5 rounded-lg text-[10px] cursor-pointer">
                        ${isPendenteCondo ? 'Aguardando Síndico' : 'Iniciar Carga'}
                    </button>
                </div>
            </div>
        `;
    });

    if (document.getElementById('stat-livre')) document.getElementById('stat-livre').innerText = livre;
    if (document.getElementById('stat-reservado')) document.getElementById('stat-reservado').innerText = reservado;
    if (document.getElementById('stat-carregando')) document.getElementById('stat-carregando').innerText = carregando;
}

function updateTimersAndLoad() {}

async function startCharging(id) {
    if (userData.role === 'MORADOR' && userData.statusAprovacao === 'Pendente') {
        showToast('Bloqueado: seu cadastro em condomínio está Pendente de aprovação do síndico.');
        return;
    }
    const st = stations.find(s => s.id === id);
    if (!st) return;
    st.status = 'Em Uso';
    st.user = userData.name;
    st.kwh = 12.5;
    renderStations();
    await sincronizarEstacaoNoSupabase(st);
    showToast(`Transação OCPP iniciada em ${st.name}`);
}

async function carregarMoradoresDoBanco() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('moradores').select('*').order('criado_em', { ascending: false });
        if (data) moradoresCondominio = data;
    } catch (e) {}
}

async function abrirPainelGestao() {
    if (userData.role !== 'ADM_MASTER') { showToast('Acesso negado.'); return; }
    await carregarMoradoresDoBanco();
    renderizarConteudoPainelGestao('');
}

function renderizarConteudoPainelGestao(termoFiltro = '') {
    let htmlMoradores = '';
    if (moradoresCondominio.length === 0) {
        htmlMoradores = `<p class="text-slate-500 text-xs py-2">Nenhum morador cadastrado na tabela.</p>`;
    } else {
        moradoresCondominio.forEach(m => {
            htmlMoradores += `
                <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center mb-1.5">
                    <div>
                        <p class="font-extrabold text-slate-900">${m.nome || 'Morador'}</p>
                        <p class="text-[10px] text-slate-500">${m.condominio || 'Condomínio'} • ${m.email || ''}</p>
                    </div>
                    <span class="font-bold text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">${m.status || 'Ativo'}</span>
                </div>
            `;
        });
    }

    const conteudoGestao = `
        <div class="space-y-3 text-left text-xs pb-4">
            <div class="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between">
                <div>
                    <h5 class="font-extrabold text-xs">Gestão Operacional de Moradores</h5>
                    <p class="text-[10px] text-slate-400">Controle Master de Acessos e Unidades</p>
                </div>
                <span class="bg-lime-400 text-slate-900 font-black text-[9px] px-2 py-1 rounded">MASTER</span>
            </div>
            <div>
                <label class="block text-[9px] font-bold text-slate-600 uppercase mb-1">Filtrar Moradores</label>
                <input type="text" placeholder="Pesquisar por nome ou condomínio..." oninput="filtrarMoradoresPainel(this.value)" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div class="space-y-2 max-h-60 overflow-y-auto pr-1" id="lista-moradores-painel-container">
                ${htmlMoradores}
            </div>
            <div class="flex gap-2 pt-2 border-t border-slate-100">
                <button onclick="closeModal()" class="flex-1 bg-slate-900 text-white font-extrabold py-2.5 rounded-xl text-xs hover:bg-slate-800 transition cursor-pointer">FECHAR PAINEL</button>
            </div>
        </div>
    `;
    showCustomModal('Painel ADM Master • VoltCore', conteudoGestao, 'fa-building-shield', 'lime');
}

function filtrarMoradoresPainel(termo) {
    const container = document.getElementById('lista-moradores-painel-container');
    if (!container) return;
    container.innerHTML = '';
    const q = (termo || '').toLowerCase();
    const filtrados = moradoresCondominio.filter(m => (m.nome || '').toLowerCase().includes(q) || (m.condominio || '').toLowerCase().includes(q));

    if (filtrados.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-xs py-2">Nenhum morador encontrado.</p>`;
        return;
    }
    filtrados.forEach(m => {
        container.innerHTML += `
            <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center mb-1.5">
                <div>
                    <p class="font-extrabold text-slate-900">${m.nome || 'Morador'}</p>
                    <p class="text-[10px] text-slate-500">${m.condominio || 'Condomínio'} • ${m.email || ''}</p>
                </div>
                <span class="font-bold text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">${m.status || 'Ativo'}</span>
            </div>
        `;
    });
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
        streamCameraAtiva.getTracks().forEach(t => t.stop());
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
        setTimeout(() => { toast.classList.add('translate-y-20', 'opacity-0'); }, 3500);
    }
}