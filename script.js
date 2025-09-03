class ScratchGame {
    constructor() {
        this.canvas = document.getElementById('scratchCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.symbolsGrid = document.getElementById('symbolsGrid');
        this.resultArea = document.getElementById('resultArea');
        this.balanceElement = document.getElementById('balance');
        this.attemptElement = document.getElementById('attempt-number');
        this.cardNumberElement = document.getElementById('cardNumber');
        
        this.isDrawing = false;
        this.currentAttempt = 1;
        this.balance = 0;
        this.cardNumber = 1;
        this.gameActive = true;
        this.scratchedPercentage = 0;
        this.minScratchPercentage = 90; // Porcentagem mínima para revelar resultado
        
        // Símbolos disponíveis e seus valores de prêmio
        this.symbols = ['💎', '🍀', '⭐', '💰', '🎯', '🔥', '⚡', '🎲', '🎊'];
        this.prizeValues = {
            '💎': 500,
            '🍀': 300,
            '⭐': 200,
            '💰': 150,
            '🎯': 100,
            '🔥': 75,
            '⚡': 50,
            '🎲': 25,
            '🎊': 10
        };
        
        this.currentSymbols = [];
        this.winningCombination = null;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.generateSymbols();
        this.bindEvents();
        this.updateDisplay();
    }
    
    setupCanvas() {
        // Configurar o canvas com a camada de raspagem
        this.ctx.fillStyle = '#c0c0c0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Adicionar textura de raspagem
        this.ctx.fillStyle = '#a0a0a0';
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.ctx.fillRect(x, y, 2, 2);
        }
        
        // Adicionar texto "RASPE AQUI"
        this.ctx.fillStyle = '#666';
        this.ctx.font = 'bold 24px Poppins';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('RASPE AQUI', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.font = '16px Poppins';
        this.ctx.fillText('Clique e arraste para raspar', this.canvas.width / 2, this.canvas.height / 2 + 10);
        
        // Configurar modo de composição para "apagar" ao desenhar
        this.ctx.globalCompositeOperation = 'destination-out';
    }
    
    generateSymbols() {
        this.currentSymbols = [];
        
        // Se for a segunda tentativa, garantir vitória com R$ 150,00
        if (this.currentAttempt === 2) {
            this.generateWinningCombination();
        } else {
            this.generateRandomSymbols();
        }
        
        // Atualizar os símbolos na interface
        this.updateSymbolsDisplay();
    }
    
    generateWinningCombination() {
        // Garantir vitória na segunda tentativa com símbolo de R$ 150,00 (💰)
        const winningSymbol = '💰';
        const grid = Array(3).fill().map(() => Array(3).fill(''));
        
        // Escolher uma linha, coluna ou diagonal aleatória para a vitória
        const winPatterns = [
            // Linhas
            [[0,0], [0,1], [0,2]],
            [[1,0], [1,1], [1,2]],
            [[2,0], [2,1], [2,2]],
            // Colunas
            [[0,0], [1,0], [2,0]],
            [[0,1], [1,1], [2,1]],
            [[0,2], [1,2], [2,2]],
            // Diagonais
            [[0,0], [1,1], [2,2]],
            [[0,2], [1,1], [2,0]]
        ];
        
        const selectedPattern = winPatterns[Math.floor(Math.random() * winPatterns.length)];
        this.winningCombination = selectedPattern;
        
        // Preencher a combinação vencedora
        selectedPattern.forEach(([row, col]) => {
            grid[row][col] = winningSymbol;
        });
        
        // Preencher o resto com símbolos aleatórios (diferentes do vencedor)
        const otherSymbols = this.symbols.filter(s => s !== winningSymbol);
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                if (grid[row][col] === '') {
                    grid[row][col] = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
                }
            }
        }
        
        this.currentSymbols = grid;
    }
    
    generateRandomSymbols() {
        // Gerar símbolos aleatórios (com baixa chance de vitória)
        const grid = Array(3).fill().map(() => Array(3).fill(''));
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                grid[row][col] = this.symbols[Math.floor(Math.random() * this.symbols.length)];
            }
        }
        
        // Verificar se há vitória acidental e ajustar se necessário
        const winResult = this.checkWin(grid);
        if (winResult.hasWin && Math.random() > 0.1) { // 90% de chance de remover vitória acidental
            // Alterar um símbolo da combinação vencedora
            const [row, col] = winResult.winningCells[0];
            const currentSymbol = grid[row][col];
            const differentSymbols = this.symbols.filter(s => s !== currentSymbol);
            grid[row][col] = differentSymbols[Math.floor(Math.random() * differentSymbols.length)];
        }
        
        this.currentSymbols = grid;
        this.winningCombination = winResult.hasWin ? winResult.winningCells : null;
    }
    
    updateSymbolsDisplay() {
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const symbolElement = document.getElementById(`symbol-${row}-${col}`);
                const symbol = this.currentSymbols[row][col];
                const prizeValue = this.prizeValues[symbol];
                
                // Exibir o valor do prêmio ao invés do símbolo
                symbolElement.textContent = `R$ ${prizeValue.toFixed(2).replace('.', ',')}`;
                symbolElement.parentElement.classList.remove('winning');
            }
        }
    }
    
    bindEvents() {
        // Eventos de mouse
        this.canvas.addEventListener('mousedown', (e) => this.startScratch(e));
        this.canvas.addEventListener('mousemove', (e) => this.scratch(e));
        this.canvas.addEventListener('mouseup', () => this.stopScratch());
        this.canvas.addEventListener('mouseleave', () => this.stopScratch());
        
        // Eventos de toque (mobile)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startScratch(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.scratch(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopScratch();
        });
        
        // Botões
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
    }
    
    startScratch(e) {
        if (!this.gameActive) return;
        this.isDrawing = true;
        this.scratch(e);
    }
    
    scratch(e) {
        if (!this.isDrawing || !this.gameActive) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        // Desenhar círculo para "apagar" a camada de raspagem
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Verificar porcentagem raspada
        this.checkScratchProgress();
    }
    
    stopScratch() {
        this.isDrawing = false;
    }
    
    checkScratchProgress() {
        // Calcular porcentagem raspada analisando pixels transparentes
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = imageData.data;
        let transparentPixels = 0;
        
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) { // Pixel transparente
                transparentPixels++;
            }
        }
        
        this.scratchedPercentage = (transparentPixels / (pixels.length / 4)) * 100;
        
        // Se raspou o suficiente, revelar resultado
        if (this.scratchedPercentage >= this.minScratchPercentage && this.gameActive) {
            this.revealResult();
        }
    }
    
    revealResult() {
        this.gameActive = false;
        
        // Remover completamente a camada de raspagem
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Verificar vitória
        const winResult = this.checkWin(this.currentSymbols);
        
        if (winResult.hasWin) {
            this.showWinResult(winResult);
        } else {
            this.showLoseResult();
        }
        
        // Mostrar área de resultado
        this.resultArea.style.display = 'block';
        this.resultArea.scrollIntoView({ behavior: 'smooth' });
    }
    
    checkWin(grid) {
        const winPatterns = [
            // Linhas
            [[0,0], [0,1], [0,2]],
            [[1,0], [1,1], [1,2]],
            [[2,0], [2,1], [2,2]],
            // Colunas
            [[0,0], [1,0], [2,0]],
            [[0,1], [1,1], [2,1]],
            [[0,2], [1,2], [2,2]],
            // Diagonais
            [[0,0], [1,1], [2,2]],
            [[0,2], [1,1], [2,0]]
        ];
        
        for (const pattern of winPatterns) {
            const [first, second, third] = pattern;
            const symbol1 = grid[first[0]][first[1]];
            const symbol2 = grid[second[0]][second[1]];
            const symbol3 = grid[third[0]][third[1]];
            
            if (symbol1 === symbol2 && symbol2 === symbol3) {
                return {
                    hasWin: true,
                    winningSymbol: symbol1,
                    winningCells: pattern,
                    prizeValue: this.prizeValues[symbol1] || 0
                };
            }
        }
        
        return { hasWin: false };
    }
    
    showWinResult(winResult) {
        const { winningSymbol, winningCells, prizeValue } = winResult;
        
        // Destacar células vencedoras
        winningCells.forEach(([row, col]) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('winning');
        });
        
        // Atualizar saldo
        this.balance += prizeValue;
        this.updateDisplay();
        
        // Mostrar resultado
        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        const winningLine = document.getElementById('winningLine');
        
        resultIcon.className = 'result-icon win';
        resultIcon.innerHTML = '<i class="fas fa-trophy"></i>';
        resultTitle.textContent = 'Parabéns!';
        resultMessage.textContent = `Você ganhou R$ ${prizeValue.toFixed(2).replace('.', ',')}!`;
        
        // Mostrar linha vencedora com valores ao invés de símbolos
        const winningValue = `R$ ${prizeValue.toFixed(2).replace('.', ',')}`;
        winningLine.innerHTML = `
            <span class="symbol">${winningValue}</span>
            <span class="symbol">${winningValue}</span>
            <span class="symbol">${winningValue}</span>
        `;
        
        // Efeitos sonoros simulados com vibração (se disponível)
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
        
        // Confetes animados
        this.createConfetti();
    }
    
    showLoseResult() {
        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        const winningLine = document.getElementById('winningLine');
        
        resultIcon.className = 'result-icon lose';
        resultIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
        resultTitle.textContent = 'Que pena!';
        resultMessage.textContent = 'Não foi desta vez. Tente novamente!';
        winningLine.innerHTML = '';
    }
    
    createConfetti() {
        // Criar efeito de confetes simples
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.position = 'fixed';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.top = '-10px';
                confetti.style.width = '10px';
                confetti.style.height = '10px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.borderRadius = '50%';
                confetti.style.pointerEvents = 'none';
                confetti.style.zIndex = '9999';
                confetti.style.animation = 'confettiFall 3s linear forwards';
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 3000);
            }, i * 50);
        }
    }
    
    newGame() {
        this.currentAttempt++;
        this.cardNumber++;
        this.gameActive = true;
        this.scratchedPercentage = 0;
        
        // Resetar canvas
        this.setupCanvas();
        
        // Gerar novos símbolos
        this.generateSymbols();
        
        // Esconder resultado
        this.resultArea.style.display = 'none';
        
        // Atualizar display
        this.updateDisplay();
        
        // Scroll para o topo do jogo
        document.querySelector('.scratch-card').scrollIntoView({ behavior: 'smooth' });
    }
    
    resetGame() {
        this.currentAttempt = 1;
        this.cardNumber = 1;
        this.balance = 0;
        this.newGame();
    }
    
    updateDisplay() {
        this.balanceElement.textContent = this.balance.toFixed(2).replace('.', ',');
        this.attemptElement.textContent = this.currentAttempt;
        this.cardNumberElement.textContent = this.cardNumber.toString().padStart(3, '0');
    }
}

// Adicionar animação de confetes ao CSS dinamicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes confettiFall {
        0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new ScratchGame();
});

// Adicionar suporte para redimensionamento da tela
window.addEventListener('resize', () => {
    // Ajustar canvas se necessário
    const canvas = document.getElementById('scratchCanvas');
    if (canvas && window.innerWidth <= 480) {
        canvas.width = 250;
        canvas.height = 187;
    } else if (canvas && window.innerWidth <= 768) {
        canvas.width = 300;
        canvas.height = 225;
    } else if (canvas) {
        canvas.width = 400;
        canvas.height = 300;
    }
});

