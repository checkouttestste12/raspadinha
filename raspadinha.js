// Estado do jogo
let gameState = {
    usuario: null,
    saldo: 0,
    raspadasGratis: 0,
    raspadasUsadas: 0,
    primeiroDeposito: false,
    raspadinhAtiva: false,
    blocosRaspados: 0,
    valoresRaspadinha: [],
    premioAtual: 0
};

// Elementos DOM
const elements = {
    cadastroOverlay: document.getElementById('cadastro-overlay'),
    cadastroForm: document.getElementById('cadastro-form'),
    btnRaspar: document.getElementById('btn-raspar'),
    btnRevelar: document.getElementById('btn-revelar'),
    raspadinhaGrid: document.getElementById('raspadinha-grid'),
    saldoAtual: document.getElementById('saldo-atual'),
    raspadasCount: document.getElementById('raspadas-count'),
    raspadasInfo: document.getElementById('raspadas-info'),
    raspadasTitle: document.getElementById('raspadas-title'),
    raspadasSubtitle: document.getElementById('raspadas-subtitle'),
    raspadinhaContainer: document.getElementById('raspadinha-gratis-container'),
    raspadasGratisInfo: document.getElementById('raspadas-gratis-info'),
    raspadasPremiosInfo: document.getElementById('raspadas-premios-info'),
    resultadoModal: document.getElementById('resultado-modal'),
    resultadoTitulo: document.getElementById('resultado-titulo'),
    resultadoDescricao: document.getElementById('resultado-descricao'),
    resultadoIcon: document.getElementById('resultado-icon'),
    premioValor: document.getElementById('premio-valor'),
    premioDisplay: document.getElementById('premio-display'),
    novoSaldo: document.getElementById('novo-saldo'),
    raspadasRestantesModal: document.getElementById('raspadas-restantes-modal'),
    raspadasRestantesCount: document.getElementById('raspadas-restantes-count'),
    btnContinuar: document.getElementById('btn-continuar'),
    toastContainer: document.getElementById('toast-container')
};

// Configurações da raspadinha
const raspadinhaConfig = {
    valores: [10, 20, 50, 150, 0], // Valores possíveis (0 = vazio)
    valoresTexto: {
        10: 'R$ 10',
        20: 'R$ 20', 
        50: 'R$ 50',
        150: 'R$ 150',
        0: 'Vazio'
    },
    linhasVitoria: [
        // Horizontais
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        // Verticais
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        // Diagonais
        [0, 4, 8], [2, 4, 6]
    ]
};

// Sons do jogo
const sons = {
    raspar: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'),
    vitoria: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'),
    derrota: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
};

// Configurar volume dos sons
Object.values(sons).forEach(som => {
    som.volume = 0.3;
});

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('App da Raspadinha iniciado');
    
    setTimeout(() => {
        carregarEstadoJogo();
        inicializarEventListeners();
        atualizarInterface();
        criarParticulas();
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
    delete estadoParaSalvar.raspadinhAtiva;
    delete estadoParaSalvar.blocosRaspados;
    delete estadoParaSalvar.valoresRaspadinha;
    delete estadoParaSalvar.premioAtual;
    localStorage.setItem('raspadinhaUser', JSON.stringify(estadoParaSalvar));
}

// Inicializar event listeners
function inicializarEventListeners() {
    if (!elements.btnRaspar || !elements.btnRevelar) {
        console.error('Elementos de botão não encontrados');
        return;
    }
    
    // Botões de controle da raspadinha
    elements.btnRaspar.addEventListener('click', handleRasparClick);
    elements.btnRevelar.addEventListener('click', handleRevelarClick);
    
    // Garantir que o botão revelar esteja inicialmente oculto
    elements.btnRevelar.classList.add('hidden');
    
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
    if (gameState.raspadinhAtiva) return;
    
    if (!gameState.usuario) {
        // Usuário não cadastrado, mostrar modal de cadastro
        mostrarModalCadastro();
    } else if (gameState.raspadasGratis > 0) {
        // Usuário tem raspadas grátis disponíveis
        iniciarNovaRaspadinha();
    } else {
        // Sem raspadas grátis
        mostrarToast('Você não tem mais raspadas grátis disponíveis!', 'warning');
    }
}

// Handle click no botão revelar
function handleRevelarClick() {
    if (!gameState.raspadinhAtiva) return;
    
    revelarTodosOsBlocos();
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
    gameState.raspadasGratis = 3;
    gameState.raspadasUsadas = 0;
    
    salvarEstadoJogo();
    fecharModalCadastro();
    atualizarInterface();
    
    mostrarToast(`Bem-vindo, ${nome}! Você recebeu 3 raspadas grátis!`, 'success');
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

// Iniciar nova raspadinha
function iniciarNovaRaspadinha() {
    if (gameState.raspadasGratis <= 0 || gameState.raspadinhAtiva) {
        return;
    }
    
    console.log('Iniciando nova raspadinha');
    
    // Marcar como ativa
    gameState.raspadinhAtiva = true;
    gameState.blocosRaspados = 0;
    gameState.premioAtual = 0;
    
    // Gerar valores para a raspadinha
    gerarValoresRaspadinha();
    
    // Criar grid da raspadinha
    criarGridRaspadinha();
    
    // Atualizar interface dos botões
    elements.btnRaspar.classList.add('hidden');
    elements.btnRevelar.classList.remove('hidden');
    
    // Ocultar informações de prêmios durante o jogo
    if (elements.raspadasPremiosInfo) {
        elements.raspadasPremiosInfo.classList.add('hidden');
    }
    
    mostrarToast('Clique nos blocos para raspá-los!', 'info');
}

// Gerar valores para a raspadinha
function gerarValoresRaspadinha() {
    gameState.valoresRaspadinha = [];
    
    // Verificar se é a segunda raspada grátis (garantir prêmio de R$ 150,00)
    if (gameState.raspadasUsadas === 1) {
        // Segunda raspada - garantir vitória com R$ 150,00
        console.log('Segunda raspada - garantindo prêmio de R$ 150,00');
        
        // Escolher uma linha de vitória aleatória
        const linhaVitoria = raspadinhaConfig.linhasVitoria[Math.floor(Math.random() * raspadinhaConfig.linhasVitoria.length)];
        
        // Preencher com valores aleatórios primeiro
        for (let i = 0; i < 9; i++) {
            const valoresDisponiveis = [10, 20, 50, 0];
            gameState.valoresRaspadinha[i] = valoresDisponiveis[Math.floor(Math.random() * valoresDisponiveis.length)];
        }
        
        // Garantir que a linha de vitória tenha R$ 150,00
        linhaVitoria.forEach(posicao => {
            gameState.valoresRaspadinha[posicao] = 150;
        });
        
    } else {
        // Outras raspadas - gerar valores aleatórios (sem garantia de vitória)
        for (let i = 0; i < 9; i++) {
            // Para as outras raspadas, reduzir drasticamente a chance de vitória
            const valoresDisponiveis = [10, 20, 50, 0, 0, 0, 0]; // Mais chances de vazio
            gameState.valoresRaspadinha[i] = valoresDisponiveis[Math.floor(Math.random() * valoresDisponiveis.length)];
        }
    }
    
    console.log('Valores gerados:', gameState.valoresRaspadinha);
}

// Criar grid da raspadinha
function criarGridRaspadinha() {
    elements.raspadinhaGrid.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const bloco = document.createElement('div');
        bloco.className = 'raspadinha-bloco';
        bloco.dataset.index = i;
        bloco.dataset.valor = gameState.valoresRaspadinha[i];
        
        // Valor oculto (será revelado quando raspado)
        const valorOculto = document.createElement('div');
        valorOculto.className = 'valor-oculto';
        valorOculto.textContent = raspadinhaConfig.valoresTexto[gameState.valoresRaspadinha[i]];
        
        // Overlay que será removido quando raspado
        const overlay = document.createElement('div');
        overlay.className = 'bloco-overlay';
        overlay.innerHTML = '<i class="fas fa-question"></i>';
        
        bloco.appendChild(valorOculto);
        bloco.appendChild(overlay);
        
        // Event listener para raspar
        bloco.addEventListener('click', () => rasparBloco(i));
        
        elements.raspadinhaGrid.appendChild(bloco);
    }
}

// Raspar um bloco específico
function rasparBloco(index) {
    if (!gameState.raspadinhAtiva) return;
    
    const bloco = document.querySelector(`[data-index="${index}"]`);
    if (!bloco || bloco.classList.contains('raspado')) return;
    
    // Marcar como raspado
    bloco.classList.add('raspado');
    gameState.blocosRaspados++;
    
    // Tocar som de raspar
    sons.raspar.currentTime = 0;
    sons.raspar.play().catch(() => {});
    
    // Verificar se todos os blocos foram raspados
    if (gameState.blocosRaspados >= 9) {
        setTimeout(() => {
            verificarVitoria();
        }, 500);
    }
}

// Revelar todos os blocos
function revelarTodosOsBlocos() {
    if (!gameState.raspadinhAtiva) return;
    
    const blocos = document.querySelectorAll('.raspadinha-bloco:not(.raspado)');
    
    blocos.forEach((bloco, index) => {
        setTimeout(() => {
            bloco.classList.add('raspado');
            sons.raspar.currentTime = 0;
            sons.raspar.play().catch(() => {});
        }, index * 100);
    });
    
    gameState.blocosRaspados = 9;
    
    setTimeout(() => {
        verificarVitoria();
    }, blocos.length * 100 + 500);
}

// Verificar vitória
function verificarVitoria() {
    console.log('Verificando vitória...');
    
    let venceu = false;
    let linhaVencedora = null;
    let valorVencedor = 0;
    
    // Verificar cada linha de vitória
    for (const linha of raspadinhaConfig.linhasVitoria) {
        const valores = linha.map(pos => gameState.valoresRaspadinha[pos]);
        
        // Verificar se todos os valores são iguais e não são zero
        if (valores[0] !== 0 && valores[0] === valores[1] && valores[1] === valores[2]) {
            venceu = true;
            linhaVencedora = linha;
            valorVencedor = valores[0];
            break;
        }
    }
    
    if (venceu) {
        console.log(`Vitória! Linha: ${linhaVencedora}, Valor: R$ ${valorVencedor}`);
        
        // Destacar blocos vencedores
        linhaVencedora.forEach(pos => {
            const bloco = document.querySelector(`[data-index="${pos}"]`);
            if (bloco) {
                bloco.classList.add('vencedor');
            }
        });
        
        // Tocar som de vitória
        sons.vitoria.currentTime = 0;
        sons.vitoria.play().catch(() => {});
        
        // Atualizar saldo
        gameState.saldo += valorVencedor;
        gameState.premioAtual = valorVencedor;
        
        setTimeout(() => {
            mostrarResultado(true, valorVencedor);
        }, 1000);
        
    } else {
        console.log('Não houve vitória');
        
        // Tocar som de derrota
        sons.derrota.currentTime = 0;
        sons.derrota.play().catch(() => {});
        
        setTimeout(() => {
            mostrarResultado(false, 0);
        }, 1000);
    }
    
    // Finalizar raspadinha
    finalizarRaspadinha();
}

// Finalizar raspadinha
function finalizarRaspadinha() {
    gameState.raspadinhAtiva = false;
    gameState.raspadasGratis--;
    gameState.raspadasUsadas++;
    
    // Salvar estado
    salvarEstadoJogo();
    
    // Atualizar interface
    atualizarInterface();
}

// Mostrar resultado
function mostrarResultado(venceu, premio) {
    if (venceu) {
        elements.resultadoIcon.innerHTML = '<i class="fas fa-trophy"></i>';
        elements.resultadoIcon.style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)';
        elements.resultadoTitulo.textContent = 'Parabéns!';
        elements.resultadoDescricao.textContent = 'Você ganhou um prêmio incrível!';
        elements.premioValor.textContent = `R$ ${premio.toFixed(2).replace('.', ',')}`;
        elements.premioDisplay.style.display = 'block';
    } else {
        elements.resultadoIcon.innerHTML = '<i class="fas fa-times"></i>';
        elements.resultadoIcon.style.background = 'linear-gradient(135deg, #ff4757 0%, #ff3742 100%)';
        elements.resultadoTitulo.textContent = 'Que pena!';
        elements.resultadoDescricao.textContent = 'Não foi dessa vez, mas continue tentando!';
        elements.premioDisplay.style.display = 'none';
    }
    
    // Atualizar informações do modal
    elements.novoSaldo.textContent = gameState.saldo.toFixed(2).replace('.', ',');
    elements.raspadasRestantesCount.textContent = gameState.raspadasGratis;
    
    if (gameState.raspadasGratis <= 0) {
        elements.raspadasRestantesModal.style.display = 'none';
    }
    
    // Mostrar modal
    elements.resultadoModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Fechar modal de resultado
function fecharModalResultado() {
    elements.resultadoModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    // Limpar grid e restaurar interface
    elements.raspadinhaGrid.innerHTML = '';
    elements.btnRaspar.classList.remove('hidden');
    elements.btnRevelar.classList.add('hidden');
    
    // Mostrar informações de prêmios novamente
    if (elements.raspadasPremiosInfo) {
        elements.raspadasPremiosInfo.classList.remove('hidden');
    }
    
    // Verificar se ainda tem raspadas grátis
    if (gameState.raspadasGratis <= 0) {
        elements.raspadasTitle.textContent = 'Raspadas Esgotadas';
        elements.raspadasSubtitle.textContent = 'Faça um depósito para continuar jogando!';
        elements.btnRaspar.textContent = 'DEPOSITAR';
        elements.btnRaspar.onclick = () => mostrarToast('Funcionalidade de depósito em desenvolvimento!', 'info');
    }
}

// Jogar mesa paga
function jogarMesaPaga(valor) {
    if (gameState.saldo < valor) {
        mostrarToast('Saldo insuficiente para esta mesa!', 'error');
        return;
    }
    
    mostrarToast('Mesas pagas em desenvolvimento!', 'info');
}

// Atualizar interface
function atualizarInterface() {
    // Atualizar saldo
    if (elements.saldoAtual) {
        elements.saldoAtual.textContent = gameState.saldo.toFixed(2).replace('.', ',');
    }
    
    // Atualizar contador de raspadas
    if (elements.raspadasCount) {
        elements.raspadasCount.textContent = gameState.raspadasGratis;
    }
    
    // Mostrar/ocultar informações das raspadas
    if (gameState.usuario && gameState.raspadasGratis > 0) {
        if (elements.raspadasInfo) {
            elements.raspadasInfo.style.display = 'block';
        }
    } else if (gameState.usuario) {
        if (elements.raspadasInfo) {
            elements.raspadasInfo.style.display = 'none';
        }
    }
}

// Mostrar toast
function mostrarToast(mensagem, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensagem;
    
    elements.toastContainer.appendChild(toast);
    
    // Remover toast após 4 segundos
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Criar partículas de fundo
function criarParticulas() {
    const particlesContainer = document.getElementById('particles-bg');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 4 + 1 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = `rgba(255, 215, 0, ${Math.random() * 0.3 + 0.1})`;
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `particleFloat ${Math.random() * 10 + 10}s linear infinite`;
        particle.style.animationDelay = Math.random() * 10 + 's';
        
        particlesContainer.appendChild(particle);
    }
}

// Adicionar animação CSS para partículas
const style = document.createElement('style');
style.textContent = `
    @keyframes particleFloat {
        0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
    }
    
    @keyframes toastSlideOut {
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

