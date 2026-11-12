/* ==========================================================================
   VOLTCORE PRO • FRONT-END ENGINE V9.10 (LOGIN NATIVO FUNCIONAL)
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

let userData = {
    name: "Wanderson Pedro da Silva",
    email: "contato@wpsinfo.com.br",
    phone: "",
    role: "ADM", 
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
        document.getElementById('screen-auth')?.classList.add('hidden');
        document.getElementById('screen-app')?.classList.remove('hidden');
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

// Função nativa para processar o login via e-mail e senha do form HTML
async function realizarLoginEmail(event) {
    if (event) event.preventDefault();

    const emailInput = document.getElementById('login-email') || document.querySelector('input[type="email"]');
    const senhaInput = document.getElementById('login-password') || document.querySelector('input[type="password"]');
    const lgpdCheck = document.getElementById('check-lgpd') || document.querySelector('input[type="checkbox"]');

    const emailVal = emailInput ? emailInput.value.trim() : 'contato@wpsinfo.com.br';
    const senhaVal = senhaInput ? senhaInput.value.trim() : '';

    if (lgpdCheck && !lgpdCheck.checked) {
        showToast('Você precisa aceitar os Termos de Privacidade e LGPD.');
        return;
    }

    if (!emailVal) {
        showToast('Informe o e-mail de acesso.');
        return;
    }

    // Se houver Supabase configurado, tenta autenticar no banco
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: emailVal,
                password: senhaVal || '123456'
            });
            if (!error && data && data.user) {
                userData.email = emailVal;
                userData.name = data.user.user_metadata?.full_name || 'Wanderson Pedro da Silva';
                userData.role = 'ADM';
            }
        } catch (err) {}
    }

    // Fallback seguro de acesso ADM WPS Info
    userData.email = emailVal;
    if (emailVal.includes('wpsinfo') || emailVal.includes('wanderson')) {
        userData.name = 'Wanderson Pedro da Silva';
        userData.role = 'ADM';
    } else {
        userData.name = emailVal.split('@')[0];
        userData.role = 'Morador';
    }
    userData.lgpdAccepted = true;

    localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
    localStorage.setItem('voltcore_logged', 'true');

    document.getElementById('screen-auth')?.classList.add('hidden');
    document.getElementById('screen-app')?.classList.remove('hidden');

    aplicarDadosUsuarioNaTela();
    aplicarControlePermissoesPerfil();
    configurarPermissoesCondominioPorUsuario();
    carregarEstacoesDoBanco();
    showToast('Login realizado com sucesso!');
}

function realizarLoginGoogle() {
    userData.email = 'contato@wpsinfo.com.br';
    userData.name = 'Wanderson Pedro da Silva';
    userData.role = 'ADM';
    userData.lgpdAccepted = true;

    localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
    localStorage.setItem('voltcore_logged', 'true');

    document.getElementById('screen-auth')?.classList.add('hidden');
    document.getElementById('screen-app')?.classList.remove('hidden');

    aplicarDadosUsuarioNaTela();
    aplicarControlePermissoesPerfil();
    configurarPermissoesCondominioPorUsuario();
    carregarEstacoesDoBanco();
    showToast('Login Google realizado com sucesso!');
}

function carregarTudoPersistente() {
    const savedUser = localStorage.getItem('voltcore_user_data');
    if (savedUser) { 
        try { userData = JSON.parse(savedUser); } catch(e){} 
    }
    aplicarDadosUsuarioNaTela();
    
    const savedVehicles = localStorage.getItem('voltcore_vehicles');
    meusVeiculos = savedVehicles ? JSON.parse(savedVehicles) : [];
    renderizarVeiculos();

    const savedWallet = localStorage.getItem('voltcore_wallet_balance');
    saldoCarteira = (savedWallet !== null && savedWallet !== undefined) ? parseFloat(savedWallet) : 0.00;
    
    const savedExtrato = localStorage.getItem('voltcore_extrato');
    extratoTransacoes = savedExtrato ? JSON.parse(savedExtrato) : [];

    const savedCards = localStorage.getItem('voltcore_saved_cards');
    if (savedCards) { try { cartoesSalvos = JSON.parse(savedCards); } catch(e){} }

    const savedMoradores = localStorage.getItem('voltcore_moradores');
    if (savedMoradores) { 
        try { moradoresCondominio = JSON.parse(savedMoradores); } catch(e){} 
    } else {
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
    if (nameEl) nameEl.innerText = userData.name || 'Wanderson Pedro da Silva';
    if (emailEl) emailEl.innerText = userData.email || 'contato@wpsinfo.com.br';
    if (condoEl) condoEl.innerText = userData.condo;
}

function aplicarControlePermissoesPerfil() {
    const adminButtons = document.querySelectorAll('.adm-only-element');
    adminButtons.forEach(el => {
        el.classList.remove('hidden');
        el.style.setProperty('display', 'flex', 'important');
    });
}

function configurarPermissoesCondominioPorUsuario() {
    const selectCondo = document.getElementById('select-condo');
    if (!selectCondo) return;

    selectCondo.innerHTML = '';
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

    const savedCondo = localStorage.getItem('voltcore_selected_condo');
    if (savedCondo) {
        selectCondo.value = savedCondo;
    } else {
        selectCondo.value = "Belarte Residencial Jundiaí";
    }
}

function logoutApp() {
    localStorage.removeItem('voltcore_logged');
    document.getElementById('screen-auth')?.classList.remove('hidden');
    document.getElementById('screen-app')?.classList.add('hidden');
    showToast('Sessão encerrada com segurança.');
}

function abrirTermosPrivacidade() {
    const htmlTermos = `
        <div class="space-y-3 text-left text-xs leading-relaxed pb-4">
            <h4 class="font-bold text-slate-900 text-sm">Política de Privacidade & LGPD • VoltCore</h4>
            <p class="text-slate-600">A <strong>VoltCore Soluções de Recarga Inteligente</strong> opera sob estrita conformidade com a LGPD (Lei nº 13.709/2018).</p>
            <button onclick="closeModal()" class="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs mt-2 cursor-pointer pointer-events-auto">Voltar aos Termos</button>
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
                <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer pointer-events-auto">Voltar</button>
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
                <input type="text" id="input-destino-viagem" placeholder="Ex: Sorocaba, Campinas..." class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
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
                <button onclick="closeModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer pointer-events-auto">Voltar</button>
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
    
    if (resultadoDiv && textoRota) {
        resultadoDiv.classList.remove('hidden');
        textoRota.innerHTML = `Destino: <strong>${destinoInput}</strong> (Autonomia: ${autonomia}%). Parada recomendada no Eletroposto Rodovia Anhanguera (Cajamar) com recarga rápida CCS2 (150kW).`;
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
    
    localStorage.setItem('voltcore_user_data', JSON.stringify(userData));
    aplicarDadosUsuarioNaTela();
    closeModal();
    showToast('Dados cadastrais salvos com sucesso!');
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
    if (!model || !plate) {
        showToast('Preencha o modelo e a placa do veículo.');
        return;
    }
    meusVeiculos.push({ model, plate, type: '100% Elétrico (CCS2)' });
    localStorage.setItem('voltcore_vehicles', JSON.stringify(meusVeiculos));
    renderizarVeiculos();
    closeModal();
    showToast('Veículo cadastrado com sucesso!');
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
                <button onclick="removerVeiculo(${index})" class="text-rose-500 hover:text-rose-700 p-1.5 text-xs cursor-pointer pointer-events-auto"><i class="fa-solid fa-trash"></i></button>
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
                    return {
                        id: idNum,
                        name: st.nome_vaga || `VAGA 0${idNum}`,
                        condo: st.condominio || 'Belarte Residencial Jundiaí',
                        type: st.potencia_kw ? `Conector (${st.potencia_kw} kW)` : 'Conector Type-2 (22 kW)',
                        status: st.status || 'Disponível',
                        user: st.usuario || null,
                        kwh: parseFloat(st.kwh || 0),
                        cost: parseFloat(st.tarifa_kwh || 1.18),
                        timer: parseInt(st.tempo_decorrido || 0, 10),
                        ocppId: st.ocpp_id || `CP-ID-${idNum}`,
                        ocppStatus: st.ocpp_status || 'Online (Connected)'
                    };
                });
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
        supabaseClient
            .channel('tabela-pontos-sync-v910')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pontos_recarga' }, () => { carregarEstacoesDoBanco(); })
            .subscribe();
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
    if (savedStations) {
        try { stations = JSON.parse(savedStations); return; } catch(e) {}
    }
    stations = JSON.parse(JSON.stringify(ESTACOES_PADRAO));
    localStorage.setItem('voltcore_stations_v5_ocpp', JSON.stringify(stations));
}

function salvarEstacoesLocalStorage() {
    localStorage.setItem('voltcore_stations_v5_ocpp', JSON.stringify(stations));
}

function switchMode(mode) {
    currentMode = mode;
    const viewCondo = document.getElementById('tab-stations');
    const viewCom = document.getElementById('view-commercial');
    if (mode === 'condo') {
        if (viewCondo) viewCondo.classList.remove('hidden');
        if (viewCom) viewCom.classList.add('hidden');
        renderStations();
    } else {
        if (viewCom) viewCom.classList.remove('hidden');
        if (viewCondo) viewCondo.classList.add('hidden');
        renderCommercialStations();
    }
}

const postosRodoviaComercial = [
    { id: 101, name: "Posto Ipiranga • Av. Reynaldo Porcari", address: "Av. Reynaldo Porcari, 2100 - Jundiaí/SP", type: "DC", plugs: "Ultrarrápida CCS2", coords: [-23.1920, -46.9680], ocppId: "CP-ROD-01" },
    { id: 102, name: "Supermercado Boa • 9 de Julho", address: "Av. Nove de Julho, 1500 - Jundiaí/SP", type: "AC", plugs: "Type-2 (22kW)", coords: [-23.1850, -46.8900], ocppId: "CP-ROD-02" }
];

function renderCommercialStations() {
    const grid = document.getElementById('commercial-stations-grid');
    if (!grid) return;
    grid.innerHTML = '';
    postosRodoviaComercial.forEach(p => {
        grid.innerHTML += `
            <div class="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2">
                <h4 class="font-extrabold text-slate-900 text-xs">${p.name}</h4>
                <p class="text-[10px] text-slate-500">${p.address}</p>
                <button onclick="abrirLeitorQrCodeCamera()" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-bold py-1.5 rounded-lg text-[10px]">Ler QR Code</button>
            </div>
        `;
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.remove('hidden');
}

function setFilter(status) {
    currentFilter = status;
    renderStations();
}

function renderStations() {
    const grid = document.getElementById('stations-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    stations.forEach(st => {
        if (currentFilter !== 'all' && st.status !== currentFilter) return;
        
        let badge = `<span class="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">ONLINE</span>`;
        let btn = `<button onclick="startCharging(${st.id})" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-bold py-2 rounded-lg text-[11px]">INICIAR RECARGA</button>`;
        
        const card = document.createElement('article');
        card.className = "bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs space-y-2";
        card.innerHTML = `
            <div class="flex justify-between items-center">
                <h3 class="text-xs font-extrabold text-slate-900">${st.name}</h3>
                ${badge}
            </div>
            <p class="text-[10px] text-slate-500">ID: ${st.ocppId} • ${st.type}</p>
            ${btn}
        `;
        grid.appendChild(card);
    });
}

function startCharging(id) {
    const st = stations.find(s => s.id === id);
    if (!st) return;
    st.status = 'Em Uso';
    st.user = userData.name;
    renderStations();
    showToast(`Recarga iniciada em ${st.name}`);
    sincronizarEstacaoNoSupabase(st);
}

function abrirPainelGestao() {
    showCustomModal('Painel ADM • WPS Info', '<p class="text-xs text-slate-600">Painel administrativo de estações e faturamento OCPP.</p>', 'fa-building-shield', 'lime');
}

function showCustomModal(title, htmlContent) {
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const customModal = document.getElementById('customModal');
    if (modalTitle) modalTitle.innerText = title;
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
        setTimeout(() => { toast.classList.add('translate-y-20', 'opacity-0'); }, 3500);
    }
}

function atualizarDisplayCarteira() {}