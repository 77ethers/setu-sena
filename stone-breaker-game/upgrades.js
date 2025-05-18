// Upgrades System for Stone Breaker Game

class UpgradeSystem {
    constructor(gameRef) {
        this.game = gameRef;
        this.stoneBrokenCount = 0;           // Total stones broken (lifetime)
        this.autoBreakCount = 0;            // Current auto-break stones per second
        this.autoBreakInterval = null;      // Tracks the auto-break interval
        this.clickPower = 1;                // How many breaks per manual click
        this.passiveIncome = 0;             // Passive score per second
        this.currency = 0;                  // Separate upgrade currency (shards)
        this.lastAutoBreakTime = Date.now();
        
        // Configure upgrades with costs that increase exponentially
        this.upgrades = {
            clickPower: {
                name: "Hanuman's Strength",
                description: "Increases the power of your clicks",
                baseCost: 10,
                costMultiplier: 1.5,
                level: 0,
                maxLevel: 20,
                effect: 1, // +1 break per click per level
                getEffect: (level) => level,
                getCost: (level) => Math.floor(this.upgrades.clickPower.baseCost * Math.pow(this.upgrades.clickPower.costMultiplier, level))
            },
            autoBreakSpeed: {
                name: "Vanara Army",
                description: "Automatically breaks stones over time",
                baseCost: 25,
                costMultiplier: 1.8,
                level: 0,
                maxLevel: 20,
                effect: 0.2, // +0.2 breaks/sec per level
                getEffect: (level) => level * 0.2,
                getCost: (level) => Math.floor(this.upgrades.autoBreakSpeed.baseCost * Math.pow(this.upgrades.autoBreakSpeed.costMultiplier, level))
            },
            passiveIncome: {
                name: "Divine Blessings",
                description: "Generate score over time",
                baseCost: 50,
                costMultiplier: 2,
                level: 0,
                maxLevel: 15,
                effect: 1, // +1 score/sec per level
                getEffect: (level) => level,
                getCost: (level) => Math.floor(this.upgrades.passiveIncome.baseCost * Math.pow(this.upgrades.passiveIncome.costMultiplier, level))
            },
            criticalChance: {
                name: "Rama's Precision",
                description: "Chance to break stones in one hit",
                baseCost: 75,
                costMultiplier: 1.7,
                level: 0,
                maxLevel: 10,
                effect: 5, // +5% chance per level
                getEffect: (level) => level * 5,
                getCost: (level) => Math.floor(this.upgrades.criticalChance.baseCost * Math.pow(this.upgrades.criticalChance.costMultiplier, level))
            },
            shardBoost: {
                name: "Magical Gems",
                description: "Increases shard drops from stones",
                baseCost: 40,
                costMultiplier: 1.6,
                level: 0,
                maxLevel: 15,
                effect: 0.1, // +10% shard drops per level
                getEffect: (level) => 1 + (level * 0.1),
                getCost: (level) => Math.floor(this.upgrades.shardBoost.baseCost * Math.pow(this.upgrades.shardBoost.costMultiplier, level))
            }
        };
        
        // Initialize upgrade panel in UI
        this.initUpgradePanel();
        
        // Start passive systems
        this.startPassiveSystems();
    }
    
    // Initialize the upgrade panel in the UI
    initUpgradePanel() {
        const upgradePanel = document.createElement('div');
        upgradePanel.id = 'upgrade-panel';
        upgradePanel.className = 'upgrade-panel';
        upgradePanel.innerHTML = `
            <div class="upgrade-header">
                <h3>Upgrades</h3>
                <div class="currency-display">
                    <span class="gem-icon">💎</span>
                    <span id="currency-amount">0</span> Shards
                </div>
                <div class="stats-display">
                    <div><i class="fas fa-hand-pointer"></i> Click Power: <span id="click-power">1</span></div>
                    <div><i class="fas fa-bolt"></i> Auto Breaks: <span id="auto-break-rate">0</span>/sec</div>
                    <div><i class="fas fa-chart-line"></i> Passive Score: <span id="passive-income">0</span>/sec</div>
                    <div><i class="fas fa-crosshairs"></i> Critical: <span id="critical-chance">0</span>%</div>
                </div>
                <button id="toggle-upgrades" class="toggle-button"><i class="fas fa-chevron-down"></i></button>
            </div>
            <div class="upgrade-list">
                <!-- Upgrades will be generated here -->
            </div>
        `;
        
        document.body.appendChild(upgradePanel);
        
        // Add toggle functionality
        const toggleBtn = document.getElementById('toggle-upgrades');
        const upgradeList = document.querySelector('.upgrade-list');
        
        toggleBtn.addEventListener('click', () => {
            upgradeList.classList.toggle('collapsed');
            toggleBtn.querySelector('i').classList.toggle('fa-chevron-down');
            toggleBtn.querySelector('i').classList.toggle('fa-chevron-up');
        });
        
        // Generate upgrade buttons
        this.renderUpgrades();
    }
    
    // Render all upgrade buttons
    renderUpgrades() {
        const upgradeList = document.querySelector('.upgrade-list');
        upgradeList.innerHTML = '';
        
        // Create button for each upgrade
        for (const [key, upgrade] of Object.entries(this.upgrades)) {
            const upgradeElement = document.createElement('div');
            upgradeElement.className = 'upgrade-item';
            
            const cost = upgrade.getCost(upgrade.level);
            const isMaxed = upgrade.level >= upgrade.maxLevel;
            const canAfford = this.currency >= cost;
            
            // Set appropriate classes
            if (isMaxed) upgradeElement.classList.add('maxed');
            else if (!canAfford) upgradeElement.classList.add('cannot-afford');
            
            upgradeElement.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-description">${upgrade.description}</div>
                    <div class="upgrade-effect">
                        Current: ${this.formatEffect(key, upgrade.getEffect(upgrade.level))}
                        ${!isMaxed ? `Next: ${this.formatEffect(key, upgrade.getEffect(upgrade.level + 1))}` : ''}
                    </div>
                </div>
                <div class="upgrade-action">
                    <div class="upgrade-level">Level ${upgrade.level}${isMaxed ? ' (MAX)' : `/${upgrade.maxLevel}`}</div>
                    ${!isMaxed ? `<button class="upgrade-button" data-upgrade="${key}" ${!canAfford ? 'disabled' : ''}>
                        <span class="gem-icon">💎</span> ${cost}
                    </button>` : ''}
                </div>
            `;
            
            upgradeList.appendChild(upgradeElement);
        }
        
        // Add event listeners to the buttons
        document.querySelectorAll('.upgrade-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const upgradeKey = e.currentTarget.dataset.upgrade;
                this.purchaseUpgrade(upgradeKey);
            });
        });
    }
    
    // Format the effect description based on upgrade type
    formatEffect(upgradeKey, value) {
        switch(upgradeKey) {
            case 'clickPower':
                return `${value} break${value !== 1 ? 's' : ''}/click`;
            case 'autoBreakSpeed':
                return `${value.toFixed(1)} stone${value !== 1 ? 's' : ''}/sec`;
            case 'passiveIncome':
                return `${value} score/sec`;
            case 'criticalChance':
                return `${value}% chance`;
            case 'shardBoost':
                return `${(value).toFixed(1)}x shards`;
            default:
                return value;
        }
    }
    
    // Purchase an upgrade
    purchaseUpgrade(upgradeKey) {
        const upgrade = this.upgrades[upgradeKey];
        const cost = upgrade.getCost(upgrade.level);
        
        // Check if player can afford the upgrade
        if (this.currency >= cost && upgrade.level < upgrade.maxLevel) {
            // Deduct currency
            this.currency -= cost;
            
            // Increase level
            upgrade.level++;
            
            // Apply effects
            this.applyUpgradeEffects();
            
            // Update UI
            this.updateUI();
            
            // Play purchase sound if available
            if (window.audioManager) {
                window.audioManager.playSound('upgrade');
            }
        }
    }
    
    // Apply all upgrade effects
    applyUpgradeEffects() {
        // Update click power
        this.clickPower = 1 + this.upgrades.clickPower.getEffect(this.upgrades.clickPower.level);
        
        // Update auto-break rate
        this.autoBreakCount = this.upgrades.autoBreakSpeed.getEffect(this.upgrades.autoBreakSpeed.level);
        
        // Update passive income
        this.passiveIncome = this.upgrades.passiveIncome.getEffect(this.upgrades.passiveIncome.level);
        
        // Start/update auto-break interval if needed
        this.updateAutoBreakSystem();
    }
    
    // Add currency (shards) from breaking stones
    addCurrency(amount) {
        // Apply shard boost multiplier
        const boostMultiplier = this.upgrades.shardBoost.getEffect(this.upgrades.shardBoost.level);
        const boostedAmount = Math.round(amount * boostMultiplier);
        
        this.currency += boostedAmount;
        this.updateUI();
        return boostedAmount;
    }
    
    // Update all UI elements related to upgrades
    updateUI() {
        // Update currency display
        document.getElementById('currency-amount').textContent = this.formatNumber(this.currency);
        
        // Update stats display
        document.getElementById('click-power').textContent = this.clickPower;
        document.getElementById('auto-break-rate').textContent = this.autoBreakCount.toFixed(1);
        document.getElementById('passive-income').textContent = this.passiveIncome;
        document.getElementById('critical-chance').textContent = 
            this.upgrades.criticalChance.getEffect(this.upgrades.criticalChance.level);
        
        // Re-render upgrade buttons (to update costs and affordability)
        this.renderUpgrades();
    }
    
    // Start all passive systems
    startPassiveSystems() {
        // Start auto-break system if level > 0
        this.updateAutoBreakSystem();
        
        // Start passive income system
        setInterval(() => {
            if (this.passiveIncome > 0 && this.game.gameRunning) {
                // Add passive score
                this.game.updateScore(this.passiveIncome);
            }
        }, 1000);
        
        // Update UI every second for stats
        setInterval(() => {
            if (this.game.gameRunning) {
                this.updateUI();
            }
        }, 1000);
    }
    
    // Update auto-break system based on current upgrade level
    updateAutoBreakSystem() {
        // If we already have an interval, clear it
        if (this.autoBreakInterval) {
            clearInterval(this.autoBreakInterval);
            this.autoBreakInterval = null;
        }
        
        // If auto-break level is greater than 0, start the interval
        if (this.autoBreakCount > 0) {
            // Calculate how many milliseconds per break
            const msPerBreak = 1000 / this.autoBreakCount;
            
            this.autoBreakInterval = setInterval(() => {
                if (this.game.gameRunning) {
                    this.performAutoBreak();
                }
            }, msPerBreak);
        }
    }
    
    // Perform an automatic stone break
    performAutoBreak() {
        // Find a random stone to break
        const allStones = this.findBreakableStones();
        
        if (allStones.length > 0) {
            // Pick a random stone
            const randomIndex = Math.floor(Math.random() * allStones.length);
            const targetStone = allStones[randomIndex];
            
            // Break it
            this.game.breakStone(targetStone);
            
            // Track for stats
            this.stoneBrokenCount++;
            
            // Visual feedback - create a small indicator
            this.createAutoBreakIndicator(targetStone.position.x, targetStone.position.y);
        }
    }
    
    // Find all breakable stones in the world
    findBreakableStones() {
        const bodies = Matter.Composite.allBodies(this.game.world);
        return bodies.filter(body => 
            !body.isStatic && 
            body.breakable !== false && 
            !body.isBroken && 
            !body.isPartOfBridge
        );
    }
    
    // Create a visual indicator when auto-breaking stones
    createAutoBreakIndicator(x, y) {
        // Create a small div element
        const indicator = document.createElement('div');
        indicator.className = 'auto-break-indicator';
        indicator.style.left = `${x}px`;
        indicator.style.top = `${y}px`;
        indicator.textContent = '⚒️';
        
        document.body.appendChild(indicator);
        
        // Animate and remove
        setTimeout(() => {
            indicator.style.opacity = '0';
            indicator.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                document.body.removeChild(indicator);
            }, 500);
        }, 10);
    }
    
    // Helper to format large numbers
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else {
            return num;
        }
    }
    
    // Check for critical break based on current critical chance
    checkCriticalBreak() {
        const critChance = this.upgrades.criticalChance.getEffect(this.upgrades.criticalChance.level);
        return Math.random() * 100 < critChance;
    }
}

// Add to window to make it globally accessible
window.UpgradeSystem = UpgradeSystem;
