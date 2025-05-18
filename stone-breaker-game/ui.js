// UI and Game State Management for Stone Breaker Game

class UIManager {
    constructor() {
        this.gameState = 'start'; // start, playing, paused, victory
        this.isMobile = false;
        this.spawnButtonCooldown = false; // Track cooldown state for spawn button
        this.spawnCooldownTimer = null; // Timer for cooldown
        
        // Cache DOM elements
        this.elements = {};
        
        // Initialize when document is ready
        document.addEventListener('DOMContentLoaded', () => this.initialize());
    }
    
    initialize() {
        // Check if mobile device
        this.checkMobile();
        
        // Cache DOM elements
        this.cacheElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize water animation
        this.addWaterWaves();
        
        // Show start screen
        this.showStartScreen();
    }
    
    cacheElements() {
        // Main screens
        this.elements.startScreen = document.getElementById('start-screen');
        this.elements.pauseScreen = document.getElementById('pause-screen');
        this.elements.victoryScreen = document.getElementById('victory-screen');
        
        // Buttons
        this.elements.startButton = document.getElementById('start-button');
        this.elements.resumeButton = document.getElementById('resume-button');
        this.elements.restartButton = document.getElementById('restart-button');
        this.elements.playAgainButton = document.getElementById('play-again-button');
        this.elements.pauseGameButton = document.getElementById('pause-game');
        this.elements.muteToggleButton = document.getElementById('mute-toggle');
        this.elements.muteIcon = this.elements.muteToggleButton.querySelector('i');
        this.elements.spawnStonesButton = document.getElementById('spawn-stones');
        
        // Mini Instructions Elements
        this.elements.showInstructionsButton = document.getElementById('show-instructions');
        this.elements.closeInstructionsButton = document.getElementById('close-instructions');
        this.elements.miniInstructions = document.querySelector('.mini-instructions');
        
        // Game info elements
        this.elements.scoreDisplay = document.getElementById('score');
        this.elements.finalScoreDisplay = document.getElementById('final-score');
        this.elements.bridgeCompletionDisplay = document.getElementById('bridge-completion');
        
        // Mobile controls
        this.elements.mobileControls = document.querySelector('.mobile-controls');
        this.elements.mobileLeftButton = document.getElementById('mobile-left');
        this.elements.mobileRightButton = document.getElementById('mobile-right');
    }
    
    setupEventListeners() {
        // Start button
        this.elements.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        // Pause/Resume buttons
        this.elements.pauseGameButton.addEventListener('click', () => {
            this.pauseGame();
        });
        
        this.elements.resumeButton.addEventListener('click', () => {
            this.resumeGame();
        });
        
        // Restart/Play Again buttons
        this.elements.restartButton.addEventListener('click', () => {
            this.restartGame();
        });
        
        this.elements.playAgainButton.addEventListener('click', () => {
            this.restartGame();
        });
        
        // Mute toggle
        this.elements.muteToggleButton.addEventListener('click', () => {
            this.toggleMute();
        });
        
        // Spawn Stones button
        if (this.elements.spawnStonesButton) {
            this.elements.spawnStonesButton.addEventListener('click', () => {
                this.spawnStones();
            });
        }
        
        // Mini Instructions toggle
        if (this.elements.showInstructionsButton) {
            this.elements.showInstructionsButton.addEventListener('click', () => {
                this.showMiniInstructions();
            });
        }
        
        if (this.elements.closeInstructionsButton) {
            this.elements.closeInstructionsButton.addEventListener('click', () => {
                this.hideMiniInstructions();
            });
        }
        
        // Mobile controls
        if (this.isMobile) {
            this.elements.mobileLeftButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.triggerKeyAction('ArrowLeft');
            });
            
            this.elements.mobileRightButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.triggerKeyAction('ArrowRight');
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Pause game on Escape key
            if (e.key === 'Escape') {
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
        });
    }
    
    // Game state management
    startGame() {
        this.gameState = 'playing';
        this.elements.startScreen.classList.add('hidden');
        
        // Play background music
        if (window.audioManager) {
            audioManager.play('background');
        }
        
        // Tutorial removed - now using start menu instructions
        
        // Tell game.js to start (will be implemented there)
        if (window.startGameEngine) {
            window.startGameEngine();
        }
    }
    
    pauseGame() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'paused';
        this.elements.pauseScreen.classList.remove('hidden');
        
        // Pause the Matter.js engine
        if (window.pauseGameEngine) {
            window.pauseGameEngine();
        }
    }
    
    resumeGame() {
        if (this.gameState !== 'paused') return;
        
        this.gameState = 'playing';
        this.elements.pauseScreen.classList.add('hidden');
        
        // Resume the Matter.js engine
        if (window.resumeGameEngine) {
            window.resumeGameEngine();
        }
    }
    
    restartGame() {
        this.gameState = 'playing';
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.victoryScreen.classList.add('hidden');
        
        // Reset game state in game.js
        if (window.restartGameEngine) {
            window.restartGameEngine();
        }
    }
    
    showVictory(finalScore) {
        this.gameState = 'victory';
        this.elements.finalScoreDisplay.textContent = finalScore;
        this.elements.victoryScreen.classList.remove('hidden');
        
        // Play victory sound
        if (window.audioManager) {
            audioManager.play('victory');
        }
    }
    
    // UI helper methods
    showStartScreen() {
        this.gameState = 'start';
        this.elements.startScreen.classList.remove('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.victoryScreen.classList.add('hidden');
    }
    
    updateScore(newScore) {
        this.elements.scoreDisplay.textContent = newScore;
        
        // Add highlight animation
        this.elements.scoreDisplay.parentElement.classList.add('highlight');
        setTimeout(() => {
            this.elements.scoreDisplay.parentElement.classList.remove('highlight');
        }, 300);
    }
    
    updateBridgeProgress(percentage) {
        this.elements.bridgeCompletionDisplay.textContent = `${percentage}%`;
        
        // Add highlight animation for progress updates
        this.elements.bridgeCompletionDisplay.parentElement.classList.add('highlight');
        setTimeout(() => {
            this.elements.bridgeCompletionDisplay.parentElement.classList.remove('highlight');
        }, 300);
        
        // Check for victory condition
        if (percentage >= 100 && this.gameState === 'playing') {
            // Small delay for dramatic effect
            setTimeout(() => {
                this.showVictory(this.elements.scoreDisplay.textContent);
            }, 1000);
        }
    }
    
    toggleMute() {
        if (!window.audioManager) return;
        
        const isMuted = audioManager.toggleMute();
        
        // Update icon
        if (isMuted) {
            this.elements.muteIcon.className = 'fas fa-volume-mute';
        } else {
            this.elements.muteIcon.className = 'fas fa-volume-up';
        }
    }
    
    // Tutorial methods removed - now using start menu instructions
    
    // Mobile detection and handling
    checkMobile() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (this.isMobile) {
            document.body.classList.add('mobile');
            // Show mobile controls when game starts
            document.addEventListener('DOMContentLoaded', () => {
                const mobileControls = document.querySelector('.mobile-controls');
                if (mobileControls) {
                    mobileControls.classList.remove('hidden');
                }
            });
        }
    }
    
    triggerKeyAction(key) {
        // Create and dispatch a keyboard event
        const event = new KeyboardEvent('keydown', {
            key: key,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }
    
    // Mini Instructions methods
    showMiniInstructions() {
        if (this.elements.miniInstructions) {
            this.elements.miniInstructions.classList.remove('hidden');
            
            // Add animation
            this.elements.miniInstructions.style.transform = 'translateY(10px)';
            this.elements.miniInstructions.style.opacity = '0';
            
            // Trigger transition to final state
            setTimeout(() => {
                this.elements.miniInstructions.style.transform = 'translateY(0)';
                this.elements.miniInstructions.style.opacity = '1';
            }, 10);
        }
    }
    
    hideMiniInstructions() {
        if (this.elements.miniInstructions) {
            // Animate out
            this.elements.miniInstructions.style.transform = 'translateY(10px)';
            this.elements.miniInstructions.style.opacity = '0';
            
            // Hide after animation completes
            setTimeout(() => {
                this.elements.miniInstructions.classList.add('hidden');
            }, 300);
        }
    }
    
    // Visual effects
    addWaterWaves() {
        // This method is no longer used since we're drawing water directly in the canvas
        // but we'll keep it for compatibility
    }
    
    // Spawn stones when button is clicked
    spawnStones() {
        // Don't allow spawning if not in playing state or during cooldown
        if (this.gameState !== 'playing' || this.spawnButtonCooldown) {
            return;
        }
        
        // Call the game's stone wave spawn function
        if (window.spawnStoneWave) {
            window.spawnStoneWave();
            
            // Start cooldown
            this.startSpawnButtonCooldown();
        }
    }
    
    // Manage spawn button cooldown
    startSpawnButtonCooldown() {
        // Set cooldown state
        this.spawnButtonCooldown = true;
        
        if (!this.elements.spawnStonesButton) return;
        
        // Update button appearance
        this.elements.spawnStonesButton.disabled = true;
        this.elements.spawnStonesButton.classList.add('cooldown');
        
        // Add a visual indicator for the cooldown
        const cooldownOverlay = document.createElement('div');
        cooldownOverlay.className = 'cooldown-overlay';
        this.elements.spawnStonesButton.appendChild(cooldownOverlay);
        
        // Animate the cooldown (5 seconds)
        const cooldownDuration = 5000; // 5 seconds cooldown
        const startTime = Date.now();
        
        // Clear any existing cooldown timer
        if (this.spawnCooldownTimer) {
            clearInterval(this.spawnCooldownTimer);
        }
        
        // Update the cooldown animation
        this.spawnCooldownTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, cooldownDuration - elapsed);
            const progress = (remaining / cooldownDuration) * 100;
            
            // Update the overlay height to show progress
            if (cooldownOverlay && cooldownOverlay.parentNode) {
                cooldownOverlay.style.height = progress + '%';
            }
            
            // End cooldown when complete
            if (remaining <= 0) {
                clearInterval(this.spawnCooldownTimer);
                this.endSpawnButtonCooldown();
            }
        }, 50);
    }
    
    // End cooldown state
    endSpawnButtonCooldown() {
        this.spawnButtonCooldown = false;
        
        if (!this.elements.spawnStonesButton) return;
        
        // Remove cooldown styling
        this.elements.spawnStonesButton.disabled = false;
        this.elements.spawnStonesButton.classList.remove('cooldown');
        
        // Remove the cooldown overlay
        const cooldownOverlay = this.elements.spawnStonesButton.querySelector('.cooldown-overlay');
        if (cooldownOverlay) {
            cooldownOverlay.remove();
        }
        
        // Add a brief highlight effect
        this.elements.spawnStonesButton.classList.add('ready');
        setTimeout(() => {
            this.elements.spawnStonesButton.classList.remove('ready');
        }, 500);
    }
}

// Create global UI manager instance
const uiManager = new UIManager();

// Export functions for game.js to use
window.showVictory = (score) => uiManager.showVictory(score);
window.updateScoreUI = (score) => uiManager.updateScore(score);
window.updateBridgeProgressUI = (percentage) => uiManager.updateBridgeProgress(percentage);
window.startSpawnButtonCooldown = () => uiManager.startSpawnButtonCooldown();
