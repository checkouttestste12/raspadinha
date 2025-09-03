class Raspadinha {
    constructor() {
        this.grid = document.getElementById('grid');
        this.newGameBtn = document.getElementById('newGame');
        this.resultDiv = document.getElementById('result');
        this.gameCountSpan = document.getElementById('gameCount');
        
        this.values = [];
        this.scratchedBlocks = [];
        this.gameCount = parseInt(localStorage.getItem('gameCount') || '0');
        this.gameActive = true;
        
        this.prizeValues = [10, 25, 50, 100];
        
        this.init();
    }
    
    init() {
        this.updateGameCount();
        this.setupEventListeners();
        this.startNewGame();
    }
    
    setupEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        
        // Adicionar event listeners para cada bloco
        for (let i = 0; i < 9; i++) {
            const block = document.querySelector(`[data-index="${i}"]`);
            const cover = block.querySelector('.cover');
            cover.addEventListener('click', () => this.scratchBlock(i));
        }
    }
    
    startNewGame() {
        this.gameActive = true;
        this.scratchedBlocks = [];
        this.resultDiv.textContent = '';
        this.resultDiv.className = 'result';
        
        // Incrementar contador de jogos
        this.gameCount++;
        this.updateGameCount();
        localStorage.setItem('gameCount', this.gameCount.toString());
        
        // Gerar valores para os blocos
        this.generateValues();
        
        // Resetar interface
        this.resetBlocks();
    }
    
    generateValues() {
        // Se for a segunda raspada, garantir vitória de R$ 150,00
        if (this.gameCount === 2) {
            this.generateWinningValues(50); // 3 x R$ 50,00 = R$ 150,00
        } else {
            this.generateRandomValues();
        }
    }
    
    generateWinningValues(winningValue) {
        // Criar array com valores que garantem vitória
        this.values = new Array(9).fill(0);
        
        // Escolher uma linha, coluna ou diagonal aleatória para a vitória
        const winPatterns = [
            [0, 1, 2], // linha 1
            [3, 4, 5], // linha 2
            [6, 7, 8], // linha 3
            [0, 3, 6], // coluna 1
            [1, 4, 7], // coluna 2
            [2, 5, 8], // coluna 3
            [0, 4, 8], // diagonal principal
            [2, 4, 6]  // diagonal secundária
        ];
        
        const winPattern = winPatterns[Math.floor(Math.random() * winPatterns.length)];
        
        // Colocar o valor vencedor nas posições do padrão escolhido
        winPattern.forEach(index => {
            this.values[index] = winningValue;
        });
        
        // Preencher as outras posições com valores diferentes
        const otherValues = this.prizeValues.filter(v => v !== winningValue);
        for (let i = 0; i < 9; i++) {
            if (this.values[i] === 0) {
                this.values[i] = otherValues[Math.floor(Math.random() * otherValues.length)];
            }
        }
        
        this.updateValueDisplay();
    }
    
    generateRandomValues() {
        this.values = [];
        
        // Gerar valores aleatórios com baixa probabilidade de vitória
        for (let i = 0; i < 9; i++) {
            const randomValue = this.prizeValues[Math.floor(Math.random() * this.prizeValues.length)];
            this.values.push(randomValue);
        }
        
        // Verificar se acidentalmente criou uma vitória e embaralhar se necessário
        if (this.checkForWin().hasWin) {
            // Embaralhar para evitar vitória acidental (exceto na segunda jogada)
            this.shuffleValues();
        }
        
        this.updateValueDisplay();
    }
    
    shuffleValues() {
        // Embaralhar os valores para evitar padrões de vitória
        for (let i = this.values.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.values[i], this.values[j]] = [this.values[j], this.values[i]];
        }
        
        // Verificar novamente e repetir se ainda houver vitória
        if (this.checkForWin().hasWin) {
            this.generateRandomValues();
        }
    }
    
    updateValueDisplay() {
        for (let i = 0; i < 9; i++) {
            const valueElement = document.getElementById(`value-${i}`);
            valueElement.textContent = `R$ ${this.values[i]},00`;
        }
    }
    
    resetBlocks() {
        for (let i = 0; i < 9; i++) {
            const block = document.querySelector(`[data-index="${i}"]`);
            const cover = block.querySelector('.cover');
            const value = block.querySelector('.value');
            
            cover.classList.remove('scratched');
            value.classList.remove('winning');
        }
    }
    
    scratchBlock(index) {
        if (!this.gameActive || this.scratchedBlocks.includes(index)) {
            return;
        }
        
        const block = document.querySelector(`[data-index="${index}"]`);
        const cover = block.querySelector('.cover');
        
        // Animação de raspagem
        cover.classList.add('scratched');
        this.scratchedBlocks.push(index);
        
        // Verificar vitória após cada raspagem
        setTimeout(() => {
            this.checkGameStatus();
        }, 300);
    }
    
    checkGameStatus() {
        const winResult = this.checkForWin();
        
        if (winResult.hasWin) {
            this.handleWin(winResult);
        } else if (this.scratchedBlocks.length === 9) {
            this.handleLoss();
        }
    }
    
    checkForWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // linhas
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // colunas
            [0, 4, 8], [2, 4, 6] // diagonais
        ];
        
        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            
            // Verificar se todos os três blocos foram raspados
            if (this.scratchedBlocks.includes(a) && 
                this.scratchedBlocks.includes(b) && 
                this.scratchedBlocks.includes(c)) {
                
                // Verificar se os valores são iguais
                if (this.values[a] === this.values[b] && 
                    this.values[b] === this.values[c]) {
                    return {
                        hasWin: true,
                        pattern: pattern,
                        value: this.values[a],
                        prize: this.values[a] * 3
                    };
                }
            }
        }
        
        return { hasWin: false };
    }
    
    handleWin(winResult) {
        this.gameActive = false;
        
        // Destacar blocos vencedores
        winResult.pattern.forEach(index => {
            const valueElement = document.querySelector(`[data-index="${index}"] .value`);
            valueElement.classList.add('winning');
        });
        
        // Mostrar resultado
        this.resultDiv.textContent = `🎉 PARABÉNS! Você ganhou R$ ${winResult.prize},00! 🎉`;
        this.resultDiv.className = 'result winner';
        
        // Efeito sonoro simulado com vibração (se disponível)
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    }
    
    handleLoss() {
        this.gameActive = false;
        this.resultDiv.textContent = '😔 Que pena! Tente novamente na próxima raspadinha!';
        this.resultDiv.className = 'result loser';
    }
    
    updateGameCount() {
        this.gameCountSpan.textContent = this.gameCount;
        
        // Mostrar dica especial para a segunda jogada
        if (this.gameCount === 1) {
            const gameInfo = document.querySelector('.game-info');
            const specialTip = document.createElement('p');
            specialTip.style.color = '#d4a574';
            specialTip.style.fontWeight = 'bold';
            specialTip.textContent = '✨ Dica: A próxima raspadinha pode ser especial! ✨';
            gameInfo.appendChild(specialTip);
        }
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new Raspadinha();
});

// Adicionar alguns efeitos visuais extras
document.addEventListener('DOMContentLoaded', () => {
    // Efeito de partículas simples no fundo
    const container = document.querySelector('.container');
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.background = '#ffd700';
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.opacity = '0.7';
        particle.style.left = Math.random() * window.innerWidth + 'px';
        particle.style.top = '-10px';
        particle.style.zIndex = '-1';
        
        document.body.appendChild(particle);
        
        const animation = particle.animate([
            { transform: 'translateY(0px) rotate(0deg)', opacity: 0.7 },
            { transform: `translateY(${window.innerHeight + 20}px) rotate(360deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 3000 + 2000,
            easing: 'linear'
        });
        
        animation.onfinish = () => {
            particle.remove();
        };
    }
    
    // Criar partículas ocasionalmente
    setInterval(createParticle, 2000);
});

