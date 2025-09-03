// Estado do jogo
let gameState = {
    usuario: null,
    saldo: 0,
    raspadinhasGratis: 0,
    raspadinhasUsadas: 0,
    primeiroDeposito: false,
    raspadinhaAtiva: false,
    canvas: null,
    ctx: null,
    isRaspando: false,
    premioAtual: 0,
    simbolosAtuais: []
};

// Elementos DOM
const elements = {
    cadastroOverlay: document.getElementById('cadastro-overlay'),
    cadastroForm: document.getElementById('cadastro-form'),
    btnRaspar: document.getElementById('btn-raspar'),
    btnNovaRaspadinha: document.getElementById('btn-nova-raspadinha'),
    raspadinha: document.getElementById('raspadinha'),
    raspadinhaCanvas: document.getElementById('raspadinha-canvas'),
    raspadinhaResultado: document.getElementById('raspadinha-resultado'),
    saldoAtual: document.getElementById('saldo-atual'),
    raspadinhasCount: document.getElementById('raspadinhas-count'),
    raspadinhasInfo: document.getElementById('raspadinhas-info'),
    raspadinhasTitle: document.getElementById('raspadinhas-title'),
    raspadinhasSubtitle: document.getElementById('raspadinhas-subtitle'),
    raspadinhaContainer: document.getElementById('raspadinha-gratis-container'),
    raspadinhasGratisInfo: document.getElementById('raspadinhas-gratis-info'),
    raspadinhasPremiosInfo: document.getElementById('raspadinhas-premios-info'),
    resultadoModal: document.getElementById('resultado-modal'),
    resultadoTitulo: document.getElementById('resultado-titulo'),
    resultadoDescricao: document.getElementById('resultado-descricao'),
    resultadoIcon: document.getElementById('resultado-icon'),
    premioValor: document.getElementById('premio-valor'),
    premioDisplay: document.getElementById('premio-display'),
    novoSaldo: document.getElementById('novo-saldo'),
    raspadinhasRestantesModal: document.getElementById('raspadinhas-restantes-modal'),
    raspadinhasRestantesCount: document.getElementById('raspadinhas-restantes-count'),
    btnContinuar: document.getElementById('btn-continuar'),
    toastContainer: document.getElementById('toast-container'),
    simbolo1: document.getElementById('simbolo-1'),
    simbolo2: document.getElementById('simbolo-2'),
    simbolo3: document.getElementById('simbolo-3'),
    resultadoPremioText: document.getElementById('resultado-premio-text')
};

// Configurações da raspadinha
const raspadinhaConfig = {
    premios: [
        { valor: 0, simbolos: ['❌', '💔', '😞'], peso: 50 },
        { valor: 25, simbolos: ['💰', '💰', '💰'], peso: 25 },
        { valor: 50, simbolos: ['💎', '💎', '💎'], peso: 15 },
        { valor: 75, simbolos: ['🎯', '🎯', '🎯'], peso: 10 }
    ],
    simbolosDisponiveis: ['💰', '💎', '🎯', '⭐', '🔥', '💸', '🏆', '🎁', '❌', '💔', '😞'],
    areaRaspagem: 0.6 // 60% da área precisa ser raspada para revelar o resultado
};

// Sons do jogo
const sons = {
    raspagem: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'),
    vitoria: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'),
    derrota: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
};

// Configurar volume dos sons
Object.values(sons).forEach(som => {
    som.volume = 0.3;
});

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('App iniciado');
    
    // Garantir que os elementos existam antes de continuar
    setTimeout(() => {
        carregarEstadoJogo();
        inicializarEventListeners();
        inicializarCanvas();
        atualizarInterface();
        criarParticulas();
        
        // Garantir estado inicial correto dos botões
        if (elements.btnRaspar && elements.btnNovaRaspadinha) {
            elements.btnRaspar.classList.remove('hidden');
            elements.btnNovaRaspadinha.classList.add('hidden');
            console.log('Estado inicial dos botões configurado');
        }
    }, 100);
});

// Carregar estado do jogo do localStorage
function carregarEstadoJogo() {
    const estadoSalvo = localStorage.getItem('raspadinhaUser');
    if (estadoSalvo) {
        gameState = { ...gameState, ...JSON.parse(estadoSalvo) };
        console.log('Estado carregado:', gameState);
    }
}

// Salvar estado do jogo no localStorage
function salvarEstadoJogo() {
    const estadoParaSalvar = { ...gameState };
    delete estadoParaSalvar.raspadinhaAtiva;
    delete estadoParaSalvar.canvas;
    delete estadoParaSalvar.ctx;
    delete estadoParaSalvar.isRaspando;
    localStorage.setItem('raspadinhaUser', JSON.stringify(estadoParaSalvar));
}

// Inicializar canvas da raspadinha
function inicializarCanvas() {
    gameState.canvas = elements.raspadinhaCanvas;
    gameState.ctx = gameState.canvas.getContext('2d');
    
    if (!gameState.canvas || !gameState.ctx) {
        console.error('Canvas não encontrado');
        return;
    }
    
    // Configurar canvas
    gameState.ctx.globalCompositeOperation = 'source-over';
    resetarRaspadinha();
}

// Resetar raspadinha para novo jogo
function resetarRaspadinha() {
    if (!gameState.ctx || !gameState.canvas) return;
    
    // Limpar canvas
    gameState.ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // Criar camada de raspagem (cinza metálico)
    const gradient = gameState.ctx.createLinearGradient(0, 0, gameState.canvas.width, gameState.canvas.height);
    gradient.addColorStop(0, '#c0c0c0');
    gradient.addColorStop(0.5, '#a8a8a8');
    gradient.addColorStop(1, '#808080');
    
    gameState.ctx.fillStyle = gradient;
    gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // Adicionar textura de raspadinha
    gameState.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * gameState.canvas.width;
        const y = Math.random() * gameState.canvas.height;
        gameState.ctx.fillRect(x, y, 2, 2);
    }
    
    // Adicionar texto "RASPE AQUI"
    gameState.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    gameState.ctx.font = 'bold 24px Arial';
    gameState.ctx.textAlign = 'center';
    gameState.ctx.fillText('RASPE AQUI', gameState.canvas.width / 2, gameState.canvas.height / 2);
    
    // Gerar novo resultado
    gerarResultadoRaspadinha();
    
    // Resetar estado
    gameState.isRaspando = false;
    gameState.raspadinhaAtiva = false;
}

// Gerar resultado da raspadinha
function gerarResultadoRaspadinha() {
    // Determinar prêmio baseado no número de raspadinhas usadas
    let premioGarantido = null;
    if (gameState.raspadinhasUsadas === 1) { // Segunda raspadinha (índice 1 = segunda raspadinha)
        premioGarantido = 75; // Garantir R$ 75,00 na segunda raspadinha
    }
    
    let premioEscolhido;
    if (premioGarantido !== null) {
        premioEscolhido = raspadinhaConfig.premios.find(p => p.valor === premioGarantido);
        if (!premioEscolhido) {
            premioEscolhido = raspadinhaConfig.premios[0]; // Fallback para sem prêmio
        }
    } else {
        // Para todas as outras raspadinhas (exceto a segunda), sempre perder
        premioEscolhido = raspadinhaConfig.premios[0]; // Sem prêmio
    }
    
    gameState.premioAtual = premioEscolhido.valor;
    gameState.simbolosAtuais = [...premioEscolhido.simbolos];
    
    // Atualizar elementos do resultado
    if (elements.simbolo1) elements.simbolo1.textContent = gameState.simbolosAtuais[0];
    if (elements.simbolo2) elements.simbolo2.textContent = gameState.simbolosAtuais[1];
    if (elements.simbolo3) elements.simbolo3.textContent = gameState.simbolosAtuais[2];
    if (elements.resultadoPremioText) {
        elements.resultadoPremioText.textContent = gameState.premioAtual > 0 ? `R$ ${gameState.premioAtual.toFixed(2).replace('.', ',')}` : 'Tente novamente!';
    }
    
    console.log('Resultado gerado:', { premio: gameState.premioAtual, simbolos: gameState.simbolosAtuais });
}

// Inicializar event listeners
function inicializarEventListeners() {
    // Verificar se todos os elementos existem antes de adicionar event listeners
    if (!elements.btnRaspar || !elements.btnNovaRaspadinha) {
        console.error('Elementos de botão não encontrados');
        return;
    }
    
    // Botões de controle da raspadinha
    elements.btnRaspar.addEventListener('click', handleRasparClick);
    elements.btnNovaRaspadinha.addEventListener('click', handleNovaRaspadinhaClick);
    
    // Garantir que o botão nova raspadinha esteja inicialmente oculto
    elements.btnNovaRaspadinha.classList.add('hidden');
    
    // Eventos do canvas
    if (gameState.canvas) {
        // Mouse events
        gameState.canvas.addEventListener('mousedown', iniciarRaspagem);
        gameState.canvas.addEventListener('mousemove', continuarRaspagem);
        gameState.canvas.addEventListener('mouseup', pararRaspagem);
        gameState.canvas.addEventListener('mouseleave', pararRaspagem);
        
        // Touch events para mobile
        gameState.canvas.addEventListener('touchstart', iniciarRaspagemTouch);
        gameState.canvas.addEventListener('touchmove', continuarRaspagemTouch);
        gameState.canvas.addEventListener('touchend', pararRaspagem);
    }
    
    // Formulário de cadastro
    if (elements.cadastroForm) {
        elements.cadastroForm.addEventListener('submit', handleCadastro);
    }
    
    // Botão continuar do modal de resultado
    if (elements.btnContinuar) {
        elements.btnContinuar.addEventListener('click', fecharModalResultado);
    }
    
    // Fechar modal clicando no backdrop
    if (elements.cadastroOverlay) {
        elements.cadastroOverlay.addEventListener('click', function(e) {
            if (e.target === elements.cadastroOverlay) {
                fecharModalCadastro();
            }
        });
    }
    
    if (elements.resultadoModal) {
        elements.resultadoModal.addEventListener('click', function(e) {
            if (e.target === elements.resultadoModal) {
                fecharModalResultado();
            }
        });
    }
    
    // Botões das mesas pagas
    document.querySelectorAll('.mesa-card[data-valor]').forEach(mesa => {
        const btnJogar = mesa.querySelector('.btn-jogar');
        if (btnJogar) {
            btnJogar.addEventListener('click', () => {
                const valor = parseInt(mesa.dataset.valor);
                jogarMesaPaga(valor);
            });
        }
    });
}

// Handle click no botão raspar
function handleRasparClick() {
    if (gameState.raspadinhaAtiva) return;
    
    if (!gameState.usuario) {
        // Usuário não cadastrado, mostrar modal de cadastro
        mostrarModalCadastro();
    } else if (gameState.raspadinhasGratis > 0) {
        // Usuário tem raspadinhas grátis disponíveis
        iniciarRaspadinha();
    } else {
        // Sem raspadinhas grátis
        mostrarToast('Você não tem mais raspadinhas grátis disponíveis!', 'warning');
    }
}

// Handle click no botão nova raspadinha
function handleNovaRaspadinhaClick() {
    if (gameState.raspadinhasGratis > 0) {
        resetarRaspadinha();
        trocarBotoes(false); // Mostrar botão RASPAR
        mostrarToast('Nova raspadinha pronta!', 'info');
    } else {
        mostrarToast('Você não tem mais raspadinhas grátis disponíveis!', 'warning');
    }
}

// Iniciar raspadinha
function iniciarRaspadinha() {
    if (gameState.raspadinhasGratis <= 0 || gameState.raspadinhaAtiva) {
        return;
    }
    
    console.log('Iniciando raspadinha');
    
    gameState.raspadinhaAtiva = true;
    
    // Trocar botões
    trocarBotoes(true); // Mostrar botão NOVA RASPADINHA
    
    // Adicionar classes para animação
    const raspadinhaContainer = document.getElementById('raspadinha-gratis-container');
    const premiosInfo = document.getElementById('raspadinhas-premios-info');
    
    if (raspadinhaContainer) raspadinhaContainer.classList.add('ativa');
    if (premiosInfo) premiosInfo.classList.add('hidden');
    
    mostrarToast('Raspe a área cinza para revelar o resultado!', 'info');
}

// Trocar botões
function trocarBotoes(mostrarNova) {
    if (mostrarNova) {
        elements.btnRaspar.style.display = 'none';
        elements.btnRaspar.classList.add('hidden');
        
        elements.btnNovaRaspadinha.style.display = 'flex';
        elements.btnNovaRaspadinha.classList.remove('hidden');
    } else {
        elements.btnNovaRaspadinha.style.display = 'none';
        elements.btnNovaRaspadinha.classList.add('hidden');
        
        elements.btnRaspar.style.display = 'flex';
        elements.btnRaspar.classList.remove('hidden');
    }
}

// Iniciar raspagem (mouse)
function iniciarRaspagem(e) {
    if (!gameState.raspadinhaAtiva) return;
    
    gameState.isRaspando = true;
    raspar(e.offsetX, e.offsetY);
}

// Continuar raspagem (mouse)
function continuarRaspagem(e) {
    if (!gameState.isRaspando || !gameState.raspadinhaAtiva) return;
    
    raspar(e.offsetX, e.offsetY);
}

// Parar raspagem
function pararRaspagem() {
    gameState.isRaspando = false;
}

// Iniciar raspagem (touch)
function iniciarRaspagemTouch(e) {
    e.preventDefault();
    if (!gameState.raspadinhaAtiva) return;
    
    gameState.isRaspando = true;
    const rect = gameState.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    raspar(x, y);
}

// Continuar raspagem (touch)
function continuarRaspagemTouch(e) {
    e.preventDefault();
    if (!gameState.isRaspando || !gameState.raspadinhaAtiva) return;
    
    const rect = gameState.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    raspar(x, y);
}

// Função de raspagem
function raspar(x, y) {
    if (!gameState.ctx) return;
    
    // Tocar som de raspagem
    sons.raspagem.currentTime = 0;
    sons.raspagem.play().catch(() => {});
    
    // Configurar para "apagar" a camada de raspagem
    gameState.ctx.globalCompositeOperation = 'destination-out';
    gameState.ctx.beginPath();
    gameState.ctx.arc(x, y, 20, 0, 2 * Math.PI);
    gameState.ctx.fill();
    
    // Verificar se área suficiente foi raspada
    verificarAreaRaspada();
}

// Verificar se área suficiente foi raspada
function verificarAreaRaspada() {
    if (!gameState.ctx || !gameState.canvas) return;
    
    const imageData = gameState.ctx.getImageData(0, 0, gameState.canvas.width, gameState.canvas.height);
    const pixels = imageData.data;
    let pixelsTransparentes = 0;
    let totalPixels = 0;
    
    // Contar pixels transparentes
    for (let i = 0; i < pixels.length; i += 4) {
        totalPixels++;
        if (pixels[i + 3] === 0) { // Canal alpha = 0 (transparente)
            pixelsTransparentes++;
        }
    }
    
    const porcentagemRaspada = pixelsTransparentes / totalPixels;
    
    // Se área suficiente foi raspada, revelar resultado
    if (porcentagemRaspada >= raspadinhaConfig.areaRaspagem) {
        revelarResultado();
    }
}

// Revelar resultado da raspadinha
function revelarResultado() {
    console.log('Revelando resultado da raspadinha');
    
    // Parar raspagem
    gameState.isRaspando = false;
    gameState.raspadinhaAtiva = false;
    
    // Limpar canvas completamente para mostrar o resultado
    gameState.ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // Mostrar resultado
    elements.raspadinhaResultado.style.opacity = '1';
    elements.raspadinhaResultado.style.transform = 'scale(1)';
    
    // Atualizar estado do jogo
    gameState.raspadinhasGratis--;
    gameState.raspadinhasUsadas++;
    gameState.saldo += gameState.premioAtual;
    
    // Salvar estado
    salvarEstadoJogo();
    
    // Remover classes de animação
    const raspadinhaContainer = document.getElementById('raspadinha-gratis-container');
    const premiosInfo = document.getElementById('raspadinhas-premios-info');
    
    if (raspadinhaContainer) raspadinhaContainer.classList.remove('ativa');
    if (premiosInfo) premiosInfo.classList.remove('hidden');
    
    // Atualizar interface
    atualizarInterface();
    
    // Mostrar modal de resultado após um delay
    setTimeout(() => {
        mostrarModalResultado(gameState.premioAtual);
    }, 1500);
    
    // Tocar som baseado no resultado
    if (gameState.premioAtual > 0) {
        sons.vitoria.currentTime = 0;
        sons.vitoria.play().catch(() => {});
        criarConfetes();
    } else {
        sons.derrota.currentTime = 0;
        sons.derrota.play().catch(() => {});
    }
}

// Handle cadastro
function handleCadastro(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();
    
    if (!nome || !email || !senha) {
        mostrarToast('Por favor, preencha todos os campos!', 'error');
        return;
    }
    
    // Simular cadastro
    gameState.usuario = {
        nome: nome,
        email: email
    };
    gameState.raspadinhasGratis = 3;
    gameState.raspadinhasUsadas = 0;
    
    salvarEstadoJogo();
    fecharModalCadastro();
    atualizarInterface();
    
    mostrarToast(`Bem-vindo, ${nome}! Você recebeu 3 raspadinhas grátis!`, 'success');
}

// Mostrar modal de cadastro
function mostrarModalCadastro() {
    elements.cadastroOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Fechar modal de cadastro
function fecharModalCadastro() {
    elements.cadastroOverlay.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Mostrar modal de resultado
function mostrarModalResultado(premio) {
    // Configurar conteúdo do modal baseado no prêmio
    if (premio > 0) {
        elements.resultadoTitulo.textContent = 'Parabéns!';
        elements.resultadoDescricao.textContent = 'Você ganhou um prêmio!';
        elements.resultadoIcon.innerHTML = '<i class="fas fa-trophy"></i>';
        elements.resultadoIcon.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
    } else {
        elements.resultadoTitulo.textContent = 'Que pena!';
        elements.resultadoDescricao.textContent = 'Não foi desta vez, tente novamente!';
        elements.resultadoIcon.innerHTML = '<i class="fas fa-heart-broken"></i>';
        elements.resultadoIcon.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)';
    }
    
    // Atualizar valores
    elements.premioValor.textContent = `R$ ${premio.toFixed(2).replace('.', ',')}`;
    elements.novoSaldo.textContent = gameState.saldo.toFixed(2).replace('.', ',');
    elements.raspadinhasRestantesCount.textContent = gameState.raspadinhasGratis;
    
    if (gameState.raspadinhasGratis > 0) {
        elements.raspadinhasRestantesModal.style.display = 'flex';
    } else {
        elements.raspadinhasRestantesModal.style.display = 'none';
    }
    
    // Mostrar modal
    elements.resultadoModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Fechar modal de resultado
function fecharModalResultado() {
    elements.resultadoModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    // Resetar raspadinha para próximo jogo se houver raspadinhas restantes
    if (gameState.raspadinhasGratis > 0) {
        setTimeout(() => {
            resetarRaspadinha();
            trocarBotoes(false); // Mostrar botão RASPAR
        }, 500);
    }
}

// Atualizar interface
function atualizarInterface() {
    // Atualizar saldo
    elements.saldoAtual.textContent = gameState.saldo.toFixed(2).replace('.', ',');
    
    if (gameState.usuario && gameState.raspadinhasGratis > 0) {
        // Usuário logado com raspadinhas grátis
        elements.raspadinhasCount.textContent = gameState.raspadinhasGratis;
        elements.raspadinhasInfo.style.display = 'block';
        elements.raspadinhaContainer.style.display = 'block';
        elements.raspadinhasPremiosInfo.style.display = 'block';
        elements.btnRaspar.style.display = 'block';
        
        // Manter título e subtítulo originais
        elements.raspadinhasTitle.textContent = '3 Raspadinhas Grátis';
        elements.raspadinhasSubtitle.textContent = 'Cadastre-se e ganhe até R$ 75,00!';
        
    } else if (gameState.usuario && gameState.raspadinhasGratis === 0) {
        // Usuário logado sem raspadinhas grátis
        elements.raspadinhasInfo.style.display = 'none';
        elements.raspadinhaContainer.style.display = 'none';
        elements.raspadinhasPremiosInfo.style.display = 'none';
        elements.btnRaspar.style.display = 'none';
        elements.btnNovaRaspadinha.style.display = 'none';
        
        // Alterar para estado "sem raspadinhas grátis"
        elements.raspadinhasTitle.textContent = 'Sem mais raspadinhas grátis';
        elements.raspadinhasSubtitle.textContent = 'Experimente nossas mesas com apostas abaixo!';
        
        // Trocar ícone do tier
        const tierIcon = elements.raspadinhasGratisInfo.querySelector('.mesa-tier i');
        if (tierIcon) {
            tierIcon.className = 'fas fa-gift';
        }
        
    } else {
        // Usuário não logado
        elements.raspadinhasInfo.style.display = 'none';
        elements.raspadinhaContainer.style.display = 'block';
        elements.raspadinhasPremiosInfo.style.display = 'block';
        elements.btnRaspar.style.display = 'block';
        elements.btnNovaRaspadinha.style.display = 'none';
        
        // Manter título e subtítulo originais
        elements.raspadinhasTitle.textContent = '3 Raspadinhas Grátis';
        elements.raspadinhasSubtitle.textContent = 'Cadastre-se e ganhe até R$ 75,00!';
    }
}

// Jogar mesa paga
function jogarMesaPaga(valor) {
    if (gameState.saldo < valor) {
        mostrarToast('Saldo insuficiente! Faça um depósito.', 'warning');
        return;
    }
    
    mostrarToast(`Mesa R$ ${valor},00 em desenvolvimento!`, 'info');
}

// Mostrar toast notification
function mostrarToast(mensagem, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = mensagem;
    
    // Aplicar estilo baseado no tipo
    switch (tipo) {
        case 'success':
            toast.style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)';
            toast.style.color = '#0a0e27';
            break;
        case 'error':
            toast.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)';
            toast.style.color = '#ffffff';
            break;
        case 'warning':
            toast.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
            toast.style.color = '#0a0e27';
            break;
        default:
            toast.style.background = 'linear-gradient(135deg, #4ecdc4 0%, #26a69a 100%)';
            toast.style.color = '#ffffff';
    }
    
    // Estilo do toast
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.padding = '1rem 1.5rem';
    toast.style.borderRadius = '12px';
    toast.style.fontWeight = '600';
    toast.style.fontSize = '0.9rem';
    toast.style.zIndex = '10000';
    toast.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'transform 0.3s ease';
    
    elements.toastContainer.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover após 4 segundos
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Criar efeito de confetes
function criarConfetes() {
    const container = document.querySelector('.confetti-container');
    if (!container) return;
    
    // Limpar confetes existentes
    container.innerHTML = '';
    
    const cores = ['#ffd700', '#ff6b6b', '#4ecdc4', '#8a2be2', '#00ff88'];
    
    for (let i = 0; i < 50; i++) {
        const confete = document.createElement('div');
        confete.style.position = 'absolute';
        confete.style.width = '10px';
        confete.style.height = '10px';
        confete.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)];
        confete.style.left = Math.random() * 100 + '%';
        confete.style.top = '-10px';
        confete.style.borderRadius = '50%';
        confete.style.animation = `confettiFall ${2 + Math.random() * 3}s linear forwards`;
        confete.style.zIndex = '9999';
        
        container.appendChild(confete);
    }
    
    // Adicionar animação CSS se não existir
    if (!document.querySelector('#confetti-animation')) {
        const style = document.createElement('style');
        style.id = 'confetti-animation';
        style.textContent = `
            @keyframes confettiFall {
                to {
                    transform: translateY(500px) rotate(720deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Criar partículas de fundo
function criarParticulas() {
    const particlesContainer = document.getElementById('particles-bg');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 20; i++) {
        const particula = document.createElement('div');
        particula.style.position = 'absolute';
        particula.style.width = Math.random() * 4 + 2 + 'px';
        particula.style.height = particula.style.width;
        particula.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
        particula.style.borderRadius = '50%';
        particula.style.left = Math.random() * 100 + '%';
        particula.style.top = Math.random() * 100 + '%';
        particula.style.animation = `particleFloat ${10 + Math.random() * 20}s linear infinite`;
        particula.style.animationDelay = Math.random() * 10 + 's';
        
        particlesContainer.appendChild(particula);
    }
    
    // Adicionar animação CSS se não existir
    if (!document.querySelector('#particle-animation')) {
        const style = document.createElement('style');
        style.id = 'particle-animation';
        style.textContent = `
            @keyframes particleFloat {
                0% {
                    transform: translateY(0px) translateX(0px) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100vh) translateX(50px) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Função para resetar o jogo (para testes)
function resetarJogo() {
    gameState = {
        usuario: null,
        saldo: 0,
        raspadinhasGratis: 0,
        raspadinhasUsadas: 0,
        primeiroDeposito: false,
        raspadinhaAtiva: false,
        canvas: null,
        ctx: null,
        isRaspando: false,
        premioAtual: 0,
        simbolosAtuais: []
    };
    localStorage.removeItem('raspadinhaUser');
    atualizarInterface();
    location.reload();
}

// Expor função para console (desenvolvimento)
window.resetarJogo = resetarJogo;

