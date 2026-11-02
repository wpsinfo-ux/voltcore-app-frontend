const SUPABASE_URL = 'https://eoqfuawvljotvyfrcbj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_l0JQ_niTmthXhm09X60uAg_pi4ds';
let supabaseClient = null;

if (window.supabase && SUPABASE_URL) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let stations = [];
let userData = {
    name: "Wanderson Pedro da Silva",
    email: "contato@wpsinfo.com.br",
    phone: "(11) 94461-4162",
    condo: "Condomínio Gioviale & Eletropostos Rodovia",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
};
let meusVeiculos = [
    { model: 'BYD Seal', plate: 'ABC-1D23', type: '100% Elétrico (CCS2)' }
];
let saldoCarteira = 684.50;
let extratoTransacoes = [
    { title: 'Depósito PIX Confirmado', desc: '28/10/2026 • 03:48 PM - Recarga de Saldo na Carteira VoltCore Pay', value: '+ R$ 500,00', type: 'credit' }
];

let moradoresCondominio = [
    { nome: 'Wanderson Pedro da Silva', condo: 'Condomínio Gioviale', bloco: 'Torre Sul', unidade: 'Apto 101', endereco: 'Rua das Palmeiras, 300', vaga: 'Vaga 01', veiculo: 'BYD Seal (CCS2)', placa: 'ABC-1D23', status: 'Ativo', data: '26/10/2026', horaInicio: '12:00 PM', horaFim: '12:42 PM', duracao: '42 min', kwh: '14.2 kWh', ociosidade: 'Sim (R$ 5,00)', valor: 'R$ 18,96' },
    { nome: 'Jose Bronzeri', condo: 'Condomínio Gioviale', bloco: 'Torre Norte', unidade: 'Apto 202', endereco: 'Rua das Palmeiras, 300', vaga: 'Vaga 02', veiculo: 'Volvo XC40', placa: 'XYZ-9W88', status: 'Ativo', data: '27/10/2026', horaInicio: '02:30 PM', horaFim: '03:20 PM', duracao: '50 min', kwh: '18.0 kWh', ociosidade: 'Não', valor: 'R$ 24,10' },
    { nome: 'Ana Souza', condo: 'Complexo Atmosfera', bloco: 'Bloco A', unidade: 'Apto 42', endereco: 'Av. Jundiaí, 1500', vaga: 'Vaga B-12', veiculo: 'Nissan Leaf', placa: 'DEF-4E56', status: 'Inativo', data: '28/10/2026', horaInicio: '09:15 AM', horaFim: '09:45 AM', duracao: '30 min', kwh: '10.5 kWh', ociosidade: 'Não', valor: 'R$ 14,88' }
];

window.onload = function() {
    carregarTudoPersistente();
    carregarEstacoesDoBanco();
    setInterval(updateTimersAndLoad, 1000);
};

function carregarTudoPersistente() {
    const savedUser = localStorage.getItem('voltcore_user_data');
    if (savedUser) { try { userData = JSON.parse(savedUser); } catch(e){} }
    aplicarDadosUsuarioNaTela();
    
    const savedVehicles = localStorage.getItem('voltcore_vehicles');
    if (savedVehicles) { 
        try { meusVeiculos = JSON.parse(savedVehicles); } catch(e){} 
    } else {
        localStorage.setItem('voltcore_vehicles', JSON.stringify(meusVeiculos));
    }
    renderizarVeiculos();

    const savedWallet = localStorage.getItem('voltcore_wallet_balance');
    if (savedWallet !== null) { saldoCarteira = parseFloat(savedWallet); }
    
    const savedExtrato = localStorage.getItem('voltcore_extrato');
    if (savedExtrato) { try { extratoTransacoes = JSON.parse(savedExtrato); } catch(e){} }

    const savedMoradores = localStorage.getItem('voltcore_moradores');
    if (savedMoradores) { try { moradoresCondominio = JSON.parse(savedMoradores); } catch(e){} }

    atualizarDisplayCarteira();
}

function aplicarDadosUsuarioNaTela() {
    const img = document.getElementById('user-profile-img');
    const nameEl = document.getElementById('user-display-name');
    const emailEl = document.getElementById('user-display-email');
    const condoEl = document.getElementById('user-display-condo');
    
    if (img && userData.photo) img.src = userData.photo;
    if (nameEl) nameEl.innerText = userData.name;
    if (emailEl) emailEl.innerText = userData.email;
    if (condoEl) condoEl.innerText = userData.condo;
}

function alternarModoEmail() {
    const form = document.getElementById('auth-email-form');
    if (form) form.classList.toggle('hidden');
}

function realizarLogin() {
    const screenAuth = document.getElementById('screen-auth');
    const screenApp = document.getElementById('screen-app');
    if (screenAuth) screenAuth.classList.add('hidden');
    if (screenApp) screenApp.classList.remove('hidden');
    renderStations();
    showToast('Bem-vindo ao VoltCore PRO, ' + userData.name + '!');
}

function logoutApp() {
    const screenAuth = document.getElementById('screen-auth');
    const screenApp = document.getElementById('screen-app');
    if (screenAuth) screenAuth.classList.remove('hidden');
    if (screenApp) screenApp.classList.add('hidden');
}

function abrirTermosPrivacidade() {
    const htmlTermos = `
        <div class="space-y-3 text-left text-xs leading-relaxed">
            <h4 class="font-bold text-slate-900 text-sm">Política de Privacidade & LGPD • VoltCore</h4>
            <p class="text-slate-600">A <strong>VoltCore Soluções de Recarga Inteligente</strong> está comprometida com a proteção da privacidade e dos dados pessoais de seus usuários em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e normas técnicas ABNT aplicáveis.</p>
            <p class="text-slate-600"><strong>1. Coleta de Dados:</strong> Coletamos dados cadastrais (nome, e-mail, telefone, unidade residencial e veículos cadastrados) estritamente necessários para a gestão de recargas, controle de ociosidade e prestação de contas aos condomínios.</p>
            <p class="text-slate-600"><strong>2. Segurança da Informação:</strong> Seus dados de transações e acesso são armazenados em ambiente seguro com criptografia avançada e protocolos de auditoria ativa (SDI).</p>
            <p class="text-slate-600"><strong>3. Direitos do Titular:</strong> O usuário pode solicitar a qualquer momento a atualização ou exclusão de seus dados diretamente através do suporte técnico autorizado.</p>
            <button onclick="closeModal()" class="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs mt-2 cursor-pointer pointer-events-auto">LI E CONCORDO</button>
        </div>
    `;
    showCustomModal('Termos de Privacidade & LGPD', htmlTermos, 'fa-shield-halved', 'lime');
}

let streamCameraAtiva = null;
function abrirLeitorQrCodeCamera() {
    const htmlQr = `
        <div class="space-y-3 text-center">
            <div class="relative w-full h-52 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border-2 border-lime-400">
                <video id="qr-camera-video" autoplay playsinline class="w-full h-full object-cover"></video>
                <div class="absolute inset-0 border-4 border-lime-400/50 rounded-xl m-8 pointer-events-none flex items-center justify-center">
                    <span class="bg-slate-900/80 text-lime-400 text-[10px] font-extrabold px-3 py-1 rounded-full">Aponte para o QR Code do Eletroposto</span>
                </div>
            </div>
            <p class="text-[10px] text-slate-500">Câmera ativa para escanear o código do carregador ou totem.</p>
            <div class="flex gap-2">
                <button onclick="simularLeituraQrSucesso()" class="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs transition cursor-pointer pointer-events-auto">VALIDAR LEITURA</button>
                <button onclick="closeModal()" class="bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer pointer-events-auto">FECHAR</button>
            </div>
        </div>
    `;
    showCustomModal('Leitura de QR Code (Câmera Ativa)', htmlQr, 'fa-qrcode', 'lime');
    
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
    showCustomModal('Recarga Liberada', `
        <div class="space-y-2 text-center">
            <div class="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-lg mx-auto"><i class="fa-solid fa-bolt"></i></div>
            <h4 class="font-bold text-slate-900 text-xs">Dispositivo Validado com Sucesso!</h4>
            <p class="text-[10px] text-slate-600">Comunicação estabelecida com o eletroposto. O veículo está pronto para carregar com total segurança.</p>
            <button onclick="closeModal(); switchTab('stations');" class="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs mt-1 cursor-pointer pointer-events-auto">VER PAINEL DE CARGA</button>
        </div>
    `, 'fa-bolt', 'emerald');
    showToast('QR Code validado! Sessão de recarga iniciada.');
}

function abrirPlanejarViagem() {
    const htmlViagem = `
        <div class="space-y-3 text-left text-xs">
            <div>
                <label class="block font-bold text-slate-700 mb-1">Destino da Viagem (Cidade / Estabelecimento):</label>
                <input type="text" id="input-destino-viagem" placeholder="Ex: Sorocaba, Foz do Iguaçu, Uberaba..." class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div>
                <label class="block font-bold text-slate-700 mb-1">Autonomia Atual do Veículo (%):</label>
                <input type="number" id="input-autonomia-viagem" value="80" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div id="resultado-calculo-viagem" class="hidden p-3 bg-lime-50 rounded-xl border border-lime-200 space-y-1">
                <p class="text-[10px] text-lime-900 font-bold"><i class="fa-solid fa-route"></i> Rota Calculada VoltCore:</p>
                <p id="texto-rota-calculada" class="text-[10px] text-lime-700 font-medium"></p>
            </div>
            <button onclick="executarPlanejamentoViagem()" class="w-full bg-slate-900 text-white font-extrabold py-2.5 rounded-xl text-xs transition cursor-pointer pointer-events-auto">CALCULAR ROTAS & PARADAS</button>
        </div>
    `;
    showCustomModal('Planejar Viagem de Longa Distância', htmlViagem, 'fa-route', 'lime');
}

function executarPlanejamentoViagem() {
    const destinoInput = document.getElementById('input-destino-viagem').value || 'Destino';
    const autonomia = document.getElementById('input-autonomia-viagem').value || '80';
    const resultadoDiv = document.getElementById('resultado-calculo-viagem');
    const textoRota = document.getElementById('texto-rota-calculada');
    
    const destNorm = destinoInput.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const postoEncontrado = postosRodoviaComercial.find(p => p.city.toLowerCase() === destNorm || p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(destNorm));

    let recomendacao = "Parada recomendada no Eletroposto Rodovia Anhanguera (Cajamar) com recarga rápida CCS2 (150kW).";
    if (postoEncontrado) {
        recomendacao = `Parada otimizada em <strong>${postoEncontrado.name}</strong> (${postoEncontrado.address}). Equipado com ${postoEncontrado.plugs} (${postoEncontrado.hours}).`;
    }

    if (resultadoDiv && textoRota) {
        resultadoDiv.classList.remove('hidden');
        textoRota.innerHTML = `Destino: <strong>${destinoInput}</strong> (Autonomia: ${autonomia}%). ${recomendacao}`;
    }
    showToast(`Rota para ${destinoInput} calculada com sucesso!`);
}

function abrirModalMeusDados() {
    const htmlDados = `
        <div class="space-y-2 text-left">
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
            <button onclick="salvarMeusDados()" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer pointer-events-auto">SALVAR DADOS</button>
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
    closeModal();
    showToast('Dados cadastrais salvos com sucesso!');
}

function abrirModalEditarFoto() {
    const htmlFoto = `
        <div class="space-y-3 text-left text-xs">
            <p class="text-slate-600">Selecione uma imagem do seu dispositivo para atualizar o perfil:</p>
            <input type="file" id="input-arquivo-foto" accept="image/*" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium text-xs cursor-pointer pointer-events-auto">
            <button onclick="processarArquivoFoto()" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer pointer-events-auto">SALVAR FOTO DO DISPOSITIVO</button>
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
        <div class="space-y-2 text-left">
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
            <button onclick="confirmarAdicionarVeiculo()" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer pointer-events-auto">CADASTRAR VEÍCULOS</button>
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
        <div class="space-y-2 text-left">
            <p class="text-[11px] text-slate-600">Insira o valor em Reais (R$) para adicionar à carteira via PIX / Cartão:</p>
            <input type="text" id="input-valor-deposito" oninput="formatarMoedaInput(this)" placeholder="R$ 0,00" value="R$ 0,00" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-lime-500 focus:outline-none text-right font-mono text-sm">
            <button onclick="confirmarDepositoPix()" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer pointer-events-auto">GERAR PIX (COPIA E COLA)</button>
        </div>
    `;
    showCustomModal('Adicionar Saldos • Adquirente Pix / Cartão', htmlDep, 'fa-wallet', 'lime');
}

function formatarMoedaInput(input) {
    let valorLimpo = input.value.replace(/\D/g, '');
    if (!valorLimpo) valorLimpo = '0';
    let numero = parseInt(valorLimpo, 10) / 100;
    input.value = numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function confirmarDepositoPix() {
    const inputVal = document.getElementById('input-valor-deposito').value;
    const valorLimpo = inputVal.replace(/[^\d]/g, '');
    const valor = parseFloat(valorLimpo) / 100;

    if (!valor || isNaN(valor) || valor <= 0) {
        showToast('Informe um valor válido em reais.');
        return;
    }
    
    const htmlPix = `
        <div class="space-y-2.5 text-center">
            <div class="bg-slate-900 p-3 rounded-xl text-white">
                <p class="text-[10px] text-slate-400 uppercase font-bold">PIX Copia e Cola (Adquirente VoltCore Pay)</p>
                <p class="text-xs font-mono text-lime-400 font-bold mt-1">00020126580014br.gov.bcb.pix...[CHAVE_DINAMICA_${valor.toFixed(2)}]</p>
            </div>
            <p class="text-[10px] text-slate-600">Escaneie o QR Code no seu banco ou clique no botão abaixo para confirmar o crédito imediato de R$ ${valor.toFixed(2).replace('.', ',')}.</p>
            <button onclick="finalizarCreditoPix(${valor})" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow transition cursor-pointer pointer-events-auto">CONFIRMAR PAGAMENTO PIX</button>
        </div>
    `;
    showCustomModal('Pagamento Pix Instantâneo', htmlPix, 'fa-qrcode', 'emerald');
}

function finalizarCreditoPix(valor) {
    saldoCarteira += valor;
    localStorage.setItem('voltcore_wallet_balance', saldoCarteira);
    
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: true });

    const novoItemExtrato = {
        title: 'Depósito PIX Confirmado',
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
        extratoTransacoes.forEach(t => {
            const isCredit = t.type === 'credit';
            containerExtrato.innerHTML += `
                <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
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

function renderizarVeiculos() {
    const container = document.getElementById('vehicles-grid-container');
    if (!container) return;
    container.innerHTML = '';
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

// ----------------- INTEGRAÇÃO SÓLIDA COM SUPABASE & REALTIME -----------------
async function carregarEstacoesDoBanco() {
    if (!supabaseClient) {
        carregarFallbackLocal();
        return;
    }

    try {
        const { data, error } = await supabaseClient.from('stations').select('*').order('id', { ascending: true });
        if (error || !data || data.length === 0) {
            carregarFallbackLocal();
            await sincronizarEstadoInicialSupabase();
        } else {
            stations = data;
            renderStations();
            renderCommercialStations();
        }
    } catch (err) {
        console.error('Erro ao conectar Supabase, usando cache local:', err);
        carregarFallbackLocal();
    }

    // Ativar WebSocket Realtime para sincronização instantânea entre computador e celular
    if (supabaseClient && !window.supabaseRealtimeIniciado) {
        window.supabaseRealtimeIniciado = true;
        supabaseClient
            .channel('public:stations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stations' }, payload => {
                console.log('🔄 Sincronização em tempo real recebida:', payload);
                carregarEstacoesDoBanco();
            })
            .subscribe();
    }
}

async function sincronizarEstadoInicialSupabase() {
    if (!supabaseClient) return;
    for (const st of stations) {
        await supabaseClient.from('stations').upsert([st]);
    }
}

function carregarFallbackLocal() {
    const saved = localStorage.getItem('voltcore_stations_v2');
    if (saved) {
        try { stations = JSON.parse(saved); } catch(e){}
    } else {
        stations = [
            { id: 1, name: 'VAGA 01 / 2º SUBSOLO', condo: 'Condomínio Gioviale • Torre Sul', type: 'Conector Type-2 (22 kW)', status: 'Disponível', user: null, kwh: 0, cost: 0, timer: 0 },
            { id: 2, name: 'VAGA 02 / 1º SUBSOLO', condo: 'Condomínio Gioviale • Torre Sul', type: 'Conector CCS2 (7.4 kW)', status: 'Disponível', user: null, kwh: 0, cost: 0, timer: 0 },
            { id: 3, name: 'VAGA 03 / TÉRREO', condo: 'Condomínio Gioviale • Torre Sul', type: 'Conector Type-2 (11 kW)', status: 'Disponível', user: null, kwh: 0, cost: 0, timer: 0 },
            { id: 4, name: 'VAGA 01 / TORRE NORTE', condo: 'Condomínio Gioviale • Torre Norte', type: 'Conector CCS2 (22 kW)', status: 'Disponível', user: null, kwh: 0, cost: 0, timer: 0 },
            { id: 5, name: 'VAGA 02 / TORRE NORTE', condo: 'Condomínio Gioviale • Torre Norte', type: 'Conector Type-2 (11 kW)', status: 'Disponível', user: null, kwh: 0, cost: 0, timer: 0 },
            { id: 6, name: 'VAGA ATM-01 / COMPLEXO', condo: 'Complexo Atmosfera Residencial', type: 'Conector CCS2 (50 kW)', status: 'Disponível', user: null, kwh: 0, cost: 0, timer: 0 },
            { id: 7, name: 'VAGA ATM-02 / COMPLEXO', condo: 'Complexo Atmosfera Residencial', type: 'Conector Type-2 (22 kW)', status: 'Disponível', user: null, kwh: 0, cost: 0, timer: 0 },
            { id: 8, name: 'VAGA BEL-01 / JUNDIAÍ', condo: 'Belarte Residencial Jundiaí', type: 'Conector Type-2 (22 kW)', status: 'Disponível', user: null, kwh: 0, cost: 0, timer: 0 }
        ];
    }
    renderStations();
    renderCommercialStations();
}

async function persistirEstacaoServidor(st) {
    localStorage.setItem('voltcore_stations_v2', JSON.stringify(stations));
    if (supabaseClient) {
        const { error } = await supabaseClient.from('stations').upsert([st]);
        if (error) console.error('Erro ao atualizar estação no Supabase:', error);
    }
}

let currentFilter = 'all';
let mapInitialized = false;
let leafletMap = null;
let currentMarkers = [];
let mapInterativoAtivo = false;

function switchMode(mode) {
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
    { name: "Posto Ipiranga • Av. Reynaldo Porcari", address: "Av. Reynaldo Porcari, 2100 - Medeiros, Jundiaí/SP", city: "jundiai", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", coords: [-23.1920, -46.9680] },
    { name: "Supermercado Boa • Conveniência Jundiaí", address: "Av. Nove de Julho, 1500 - Jundiaí/SP", city: "jundiai", hours: "07h às 22h", type: "AC", plugs: "Carga Lenta Type-2 (22kW)", coords: [-23.1850, -46.8900] },
    { name: "Auto Posto Campinas • Rod. Dom Pedro", address: "Rod. Dom Pedro I, Km 134 - Campinas/SP", city: "campinas", hours: "06h às 22h", type: "AC", plugs: "Rápida Type-2 (22kW)", coords: [-22.9056, -47.0608] },
    { name: "Shopping Iguatemi Campinas • Estacionamento", address: "Av. Iguatemi, 777 - Campinas/SP", city: "campinas", hours: "10h às 22h", type: "DC", plugs: "Rápida CCS2 (50kW)", coords: [-22.8900, -47.0120] },
    { name: "Eletroposto Itatiba Central", address: "Praça da Bandeira, 88 - Centro, Itatiba/SP", city: "itatiba", hours: "24 horas", type: "DC", plugs: "Rápida CCS2 (50kW)", coords: [-23.0075, -46.8411] },
    { name: "Shell Rodovia Anhanguera (Cajamar)", address: "Rodovia Anhanguera, Km 38 - Cajamar/SP", city: "cajamar", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", coords: [-23.3550, -46.8770] },
    { name: "Eletroposto Jacareí Rodovia", address: "Rod. Presidente Dutra, Km 162 - Jacareí/SP", city: "jacarei", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", coords: [-23.3050, -45.9670] },
    { name: "Eletroposto Sorocaba Center", address: "Av. Washington Luiz, 500 - Sorocaba/SP", city: "sorocaba", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", coords: [-23.5015, -47.4582] },
    { name: "Supermercado Tauste • Sorocaba", address: "Av. General Carneiro, 1200 - Sorocaba/SP", city: "sorocaba", hours: "07h às 23h", type: "AC", plugs: "Carga Lenta Type-2 (22kW)", coords: [-23.5100, -47.4700] },
    { name: "Eletroposto Uberaba Rodovia", address: "BR-050, Km 172 - Uberaba/MG", city: "uberaba", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", coords: [-19.7479, -47.9392] },
    { name: "Eletroposto Valinhos Shopping", address: "Rod. Anhanguera, Km 119 - Valinhos/SP", city: "valinhos", hours: "08h às 22h", type: "AC", plugs: "Carga Lenta Type-2 (22kW)", coords: [-22.9785, -46.9942] },
    { name: "Eletroposto Vinhedo Plaza", address: "Estrada da Boiada, 500 - Vinhedo/SP", city: "vinhedo", hours: "24 horas", type: "AC", plugs: "Carga Lenta Type-2 (22kW)", coords: [-23.0305, -46.9750] },
    { name: "Eletroposto São José do Rio Preto", address: "Av. Alberto Andaló, 3000 - São José do Rio Preto/SP", city: "sao jose do rio preto", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", coords: [-20.8113, -49.3762] },
    { name: "Eletroposto Limeira Rodovia", address: "Rod. Anhanguera, Km 148 - Limeira/SP", city: "limeira", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", coords: [-22.5645, -47.4013] },
    { name: "Eletroposto Caieiras Centro", address: "Av. Pres. Kennedy, 200 - Caieiras/SP", city: "caieiras", hours: "24 horas", type: "AC", plugs: "Carga Lenta Type-2 (22kW)", coords: [-23.3644, -46.7420] },
    { name: "Eletroposto São Paulo (Paulista)", address: "Av. Paulista, 1000 - São Paulo/SP", city: "sao paulo", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (150kW)", coords: [-23.5614, -46.6565] },
    { name: "Eletroposto Foz do Iguaçu (Fronteira)", address: "Av. das Cataratas, 4000 - Foz do Iguaçu/PR", city: "foz do iguacu", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2 (200kW)", coords: [-25.5159, -54.5854] },
    { name: "Eletroposto Divisa Paraguai (Ciudad del Este)", address: "Zona Franca - Divisa Brasil/Paraguai", city: "paraguai", hours: "24 horas", type: "DC", plugs: "Ultrarrápida CCS2/GB/T (150kW)", coords: [-25.5097, -54.6111] }
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
    showToast('Exibindo eletropostos e conveniências mais próximas da sua localização.');
    plotarMarcadoresMapa('ALL', 'jundiai');
    renderCommercialStations('jundiai');
}

function abrirFiltrosAvancadosComercial() {
    const htmlFiltros = `
        <div class="space-y-2 text-left text-xs">
            <label class="block font-bold text-slate-700">Filtrar por Velocidade de Carga:</label>
            <div class="space-y-1.5">
                <button onclick="filtrarMapaComercial('DC'); closeModal();" class="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg font-bold text-slate-800">⚡ Carga Rápida DC (50kW a 150kW)</button>
                <button onclick="filtrarMapaComercial('AC'); closeModal();" class="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg font-bold text-slate-800">⚡ Carga Lenta AC (22kW)</button>
                <button onclick="filtrarMapaComercial('ALL'); closeModal();" class="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg font-bold text-slate-800">🌐 Mostrar Todos (Verde AC + Azul DC)</button>
            </div>
        </div>
    `;
    showCustomModal('Filtros Avançados de Eletropostos', htmlFiltros, 'fa-sliders', 'lime');
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
        const labelTipo = p.type === 'AC' ? '⚡ Carga Lenta (AC)' : '⚡ Carga Rápida (DC)';
        const customIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `<div style="background: ${corPin}; color: #ffffff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid #ffffff;"><i class="fa-solid fa-bolt text-[9px]"></i></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        const lat = p.coords[0];
        const lng = p.coords[1];
        const enderecoEncoded = encodeURIComponent(p.name + ' - ' + p.address);

        const popupHtml = `
            <div style="font-family: 'Inter', sans-serif; width: 200px;">
                <h4 style="font-weight: 800; font-size: 12px; color: #0f172a; margin-bottom: 2px;">${p.name}</h4>
                <p style="font-size: 9px; color: #475569; margin-bottom: 4px;"><i class="fa-solid fa-location-dot" style="color: ${corPin};"></i> ${p.address}</p>
                <div style="font-size: 9px; color: #334155; margin-bottom: 2px;"><strong>Tipo:</strong> <span style="color: ${corPin}; font-weight: bold;">${labelTipo}</span></div>
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
    postosRodoviaComercial.forEach(p => {
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
                        <span class="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Disponível 24h</span>
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

    if (totalRenderizados === 0) {
        grid.innerHTML = `<div class="col-span-full p-4 bg-white rounded-xl text-center text-xs text-slate-500 border border-slate-200">Nenhum eletroposto encontrado para os filtros selecionados.</div>`;
    }
}

function abrirSeletorGPS(lat, lng, enderecoEncoded) {
    const htmlGps = `
        <div class="space-y-3 text-left text-xs">
            <p class="text-slate-600 font-medium">Escolha o aplicativo de navegação desejado para traçar a rota até o eletroposto:</p>
            <div class="space-y-2">
                <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" onclick="closeModal()" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold p-3 rounded-xl flex items-center justify-between shadow transition cursor-pointer pointer-events-auto">
                    <span class="flex items-center gap-2"><i class="fa-brands fa-google text-lime-400 text-base"></i> Abrir com Google Maps</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-xs text-slate-400"></i>
                </a>
                <a href="https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank" onclick="closeModal()" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold p-3 rounded-xl flex items-center justify-between shadow transition cursor-pointer pointer-events-auto">
                    <span class="flex items-center gap-2"><i class="fa-brands fa-waze text-white text-base"></i> Abrir com Waze</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-xs text-sky-200"></i>
                </a>
            </div>
        </div>
    `;
    showCustomModal('Navegação GPS • Escolha o App', htmlGps, 'fa-route', 'lime');
}

function mudarCondominio() {
    renderStations();
    showToast(`Alternado para o local selecionado.`);
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
    buttons.forEach((btn, index) => {
        btn.className = "filter-btn flex-1 py-1 text-[9px] font-bold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition text-center cursor-pointer pointer-events-auto shadow-2xs";
        if ((status === 'all' && index === 0) || 
            (status === 'Disponível' && index === 1) || 
            (status === 'Reservado' && index === 2) || 
            (status === 'Em Uso' && index === 3)) {
            btn.className = "filter-btn flex-1 py-1 text-[9px] font-bold rounded-lg bg-lime-400 text-slate-900 transition text-center cursor-pointer pointer-events-auto shadow-2xs";
        }
    });
    renderStations();
}

function renderStations() {
    const grid = document.getElementById('stations-grid');
    if(!grid) return;
    grid.innerHTML = '';
    let livre = 0, reservado = 0, carregando = 0;
    const selectCondo = document.getElementById('select-condo');
    const currentCondo = selectCondo ? selectCondo.value : 'Condomínio Gioviale • Torre Sul';
    
    if (stations.length === 0) {
        carregarFallbackLocal();
    }

    stations.forEach(st => {
        if (st.condo !== currentCondo) return;
        if (st.status === 'Disponível') livre++;
        if (st.status === 'Reservado') reservado++;
        if (st.status === 'Em Uso') carregando++;
        if (currentFilter !== 'all' && st.status !== currentFilter) return;
        
        let badge = '', content = '', btn = '';
        if (st.status === 'Disponível') {
            badge = `<span class="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> DISPONÍVEL</span>`;
            content = `<div class="my-1.5 bg-slate-50 border border-slate-200/80 p-2 rounded-lg text-[10px] text-slate-600 flex items-center gap-1.5"><i class="fa-solid fa-circle-check text-emerald-500 text-xs"></i><span>Conecte o plugue e leia o QR Code ou reserve por 15 min.</span></div>`;
            btn = `<div class="flex gap-1.5"><button onclick="reserveSpot(${st.id})" class="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-2 rounded-lg text-[11px] transition flex items-center justify-center gap-1 cursor-pointer pointer-events-auto"><i class="fa-solid fa-bookmark"></i> Reservar</button><button onclick="abrirLeitorQrCodeCamera()" class="w-1/2 bg-lime-500 hover:bg-lime-600 text-slate-900 font-bold py-1.5 px-2 rounded-lg text-[11px] transition flex items-center justify-center gap-1 shadow-xs cursor-pointer pointer-events-auto"><i class="fa-solid fa-qrcode"></i> Ler QR</button></div>`;
        } else if (st.status === 'Reservado') {
            badge = `<span class="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> RESERVADO (15 MIN)</span>`;
            content = `<div class="my-1.5 bg-slate-50 border border-slate-200/80 p-2 rounded-lg text-[10px] text-slate-600"><p class="flex justify-between font-medium"><span>Morador:</span> <strong class="text-slate-800">${st.user || userData.name}</strong></p></div>`;
            btn = `<div class="flex gap-1.5"><button onclick="startCharging(${st.id})" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-bold py-2 px-3 rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 text-[11px] cursor-pointer pointer-events-auto"><i class="fa-solid fa-bolt"></i> INICIAR RECARGA</button><button onclick="cancelReservation(${st.id})" class="bg-slate-100 hover:bg-rose-50 text-slate-600 font-bold py-2 px-2 rounded-lg border border-slate-200 text-xs cursor-pointer pointer-events-auto" title="Cancelar"><i class="fa-solid fa-xmark"></i></button></div>`;
        } else {
            badge = `<span class="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> EM RECARGA</span>`;
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
                    <p class="text-[9px] text-slate-500">${st.type}</p>
                </div>
                <div class="text-right bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                    <p class="text-[7px] font-bold text-slate-400 uppercase leading-none mb-0.5">Tempo (h:m:s)</p>
                    <p id="timer-${st.id}" class="text-[11px] font-black text-slate-800">${formatTimer(st.timer || 0)}</p>
                </div>
            </div>
            ${content}
            ${btn}
        `;
        grid.appendChild(card);
    });
    if(document.getElementById('stat-livre')) document.getElementById('stat-livre').innerText = livre;
    if(document.getElementById('stat-reservado')) document.getElementById('stat-reservado').innerText = reservado;
    if(document.getElementById('stat-carregando')) document.getElementById('stat-carregando').innerText = carregando;
}

function formatTimer(sec) {
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
            if (st.timer > 0) { 
                st.timer--; 
                houveMudanca = true;
            } else { 
                st.status = 'Disponível'; 
                st.user = null; 
                st.timer = 0; 
                houveMudanca = true;
                persistirEstacaoServidor(st);
            }
        }
        if (st.status === 'Em Uso') {
            st.timer = (st.timer || 0) + 1;
            st.kwh = (st.kwh || 0) + 0.0035;
            houveMudanca = true;
        }
    });
    if (houveMudanca) {
        renderStations();
    }
}

async function reserveSpot(id) {
    const st = stations.find(s => s.id === id);
    if(!st) return;
    st.status = 'Reservado';
    st.user = userData.name;
    st.timer = 900;
    await persistirEstacaoServidor(st);
    renderStations();
    showToast(`Vaga ${st.name} reservada por 15 minutos!`);
}

async function startCharging(id) {
    const st = stations.find(s => s.id === id);
    if(!st) return;
    st.status = 'Em Uso';
    st.timer = 0;
    st.kwh = 1.0;
    await persistirEstacaoServidor(st);
    renderStations();
    showToast(`Recarga iniciada na ${st.name}!`);
}

async function stopCharging(id) {
    const st = stations.find(s => s.id === id);
    if(!st) return;
    const kWhConsumidos = st.kwh > 0 ? st.kwh : 14.2;
    const custoTotal = (kWhConsumidos * 1.18) + 2.20;

    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFim = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: true });

    const novoExtrato = {
        title: `${st.name} (${st.condo.split('•')[0].trim()})`,
        desc: `${dataFormatada} • 12:00 PM às ${horaFim} (${kWhConsumidos.toFixed(1)} kWh • Ociosidade inclusa)`,
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
    await persistirEstacaoServidor(st);
    renderStations();
    
    showToast(`Recarga finalizada! Total R$ ${custoTotal.toFixed(2)} registrado no extrato.`);
}

async function cancelReservation(id) {
    const st = stations.find(s => s.id === id);
    if(!st) return;
    st.status = 'Disponível';
    st.user = null;
    st.timer = 0;
    await persistirEstacaoServidor(st);
    renderStations();
    showToast(`Reserva cancelada.`);
}

function abrirPainelGestao() {
    let htmlMoradores = '';
    moradoresCondominio.forEach((m, idx) => {
        const isInativo = m.status === 'Inativo';
        htmlMoradores += `
            <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100">
                    <div>
                        <strong class="text-slate-900 text-sm font-extrabold">${m.nome}</strong> 
                        <span class="text-slate-500 font-medium ml-1">(${m.vaga} - ${m.unidade || 'Apto'})</span>
                        <div class="text-[11px] text-slate-500 mt-0.5"><i class="fa-solid fa-building text-lime-600 mr-1"></i> ${m.condo} (${m.bloco || 'Torre'}) • ${m.endereco || ''}</div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span class="font-extrabold text-emerald-700 text-xs bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">${m.valor}</span>
                        <span class="text-[10px] font-bold ${isInativo ? 'text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200' : 'text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200'}">${m.status}</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div class="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-0.5">
                        <p class="text-slate-700"><strong>Veículo:</strong> <span class="font-medium">${m.veiculo}</span></p>
                        <p class="text-slate-700"><strong>Placa:</strong> <span class="font-medium">${m.placa || 'N/D'}</span></p>
                    </div>
                    <div class="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-0.5">
                        <p class="text-slate-700"><strong>Última Recarga:</strong> <span class="font-medium">${m.data} • ${m.horaInicio || '12:00'} (${m.duracao || '42 min'})</span></p>
                        <p class="text-slate-700"><strong>Volume / Ociosidade:</strong> <span class="font-medium text-emerald-700">${m.kwh || '14.2 kWh'}</span> | <span class="text-amber-700 font-bold">${m.ociosidade || 'Não'}</span></p>
                    </div>
                </div>

                <div class="flex justify-between items-center pt-1">
                    <span class="text-[10px] text-slate-400 italic">Repasse transparente calculado para prestação de contas.</span>
                    <button onclick="alternarStatusMorador(${idx})" class="px-3 py-1.5 rounded-lg text-xs font-bold ${isInativo ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'} transition cursor-pointer pointer-events-auto">
                        ${isInativo ? 'Reativar Morador' : 'Inativar Morador'}
                    </button>
                </div>
            </div>
        `;
    });

    const conteudoGestao = `
        <div class="space-y-4 text-left text-xs">
            <div class="p-3.5 bg-slate-900 text-white rounded-xl shadow-md space-y-1">
                <h4 class="font-extrabold text-lime-400 text-sm flex items-center gap-1.5"><i class="fa-solid fa-building-shield"></i> Área do Síndico • Relatório & Gestão</h4>
                <p class="text-[11px] text-slate-300">Gestão completa de condôminos, endereços, veículos, ociosidade e repasses financeiros detalhados com total transparência.</p>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
                    <span class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Vagas Monitoradas</span>
                    <span class="text-sm font-black text-slate-900">5 Vagas Ativas na Rede SDI</span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
                    <span class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ociosidade Total Mês</span>
                    <span class="text-xs font-black text-emerald-600">R$ 112,50 <span class="text-[10px] text-slate-500 font-normal block sm:inline">(J. Bronzeri R$ 62,50 | Wanderson R$ 50,00)</span></span>
                </div>
            </div>

            <div class="space-y-2 pt-1">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-1 border-b border-slate-200">
                    <h5 class="text-xs font-bold text-slate-800 uppercase tracking-tight">Base de Condôminos & Extrato Consolidado</h5>
                    <button onclick="abrirModalCadastrarMorador()" class="bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-xs transition cursor-pointer pointer-events-auto flex items-center gap-1">
                        <i class="fa-solid fa-user-plus"></i> Novo Condômino
                    </button>
                </div>
                
                <div class="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                    ${htmlMoradores}
                </div>
            </div>
        </div>
    `;
    showCustomModal('Painel Administrativo do Síndico', conteudoGestao, 'fa-building-shield', 'lime');
}

function alternarStatusMorador(idx) {
    if (moradoresCondominio[idx].status === 'Ativo') {
        moradoresCondominio[idx].status = 'Inativo';
        showToast(`Morador ${moradoresCondominio[idx].nome} inativado.`);
    } else {
        moradoresCondominio[idx].status = 'Ativo';
        showToast(`Morador ${moradoresCondominio[idx].nome} reativado com sucesso!`);
    }
    localStorage.setItem('voltcore_moradores', JSON.stringify(moradoresCondominio));
    abrirPainelGestao();
}

function abrirModalCadastrarMorador() {
    const htmlForm = `
        <div class="space-y-3 text-left text-xs">
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
                    <input type="text" id="novo-morador-bloco" placeholder="Ex: Torre Sul" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Unidade / Apto:</label>
                    <input type="text" id="novo-morador-unidade" placeholder="Ex: Apto 101" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Vaga:</label>
                    <input type="text" id="novo-morador-vaga" placeholder="Ex: Vaga 04" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
            </div>
            <div>
                <label class="block font-bold text-slate-700 mb-1">Endereço Completo:</label>
                <input type="text" id="novo-morador-endereco" placeholder="Ex: Rua das Palmeiras, 300 - Jundiaí/SP" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Veículo / Modelo:</label>
                    <input type="text" id="novo-morador-veiculo" placeholder="Ex: Volvo XC40 (CCS2)" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Placa:</label>
                    <input type="text" id="novo-morador-placa" placeholder="Ex: ABC-1D23" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none">
                </div>
            </div>
            <button onclick="salvarNovoMorador()" class="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-extrabold py-2.5 rounded-xl text-xs transition cursor-pointer pointer-events-auto">CONFIRMAR CADASTRO DO CONDÔMINO</button>
        </div>
    `;
    showCustomModal('Cadastrar Novo Morador no Condomínio', htmlForm, 'fa-user-plus', 'lime');
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
// Subscricao Realtime Supabase para evitar disparidade de vagas
supabase.channel('public:pontos_recarga').on('postgres_changes', { event: '*', schema: 'public', table: 'pontos_recarga' }, () = carregarVagas(); }).subscribe();
try { supabase.channel('public:pontos_recarga').on('postgres_changes', { event: '*', schema: 'public', table: 'pontos_recarga' }, () = if(typeof carregarVagas === 'function') carregarVagas(); }).subscribe(); } catch(e) {} 
