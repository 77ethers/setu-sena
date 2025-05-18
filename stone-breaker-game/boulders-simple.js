// Simplified Boulder System - Large stones that require multiple hits to break

class BoulderSystem {
    constructor() {
        // Store boulders and their data
        this.boulders = new Map();
        
        // Initialize boulder types with Ramayana theme
        this.initBoulderTypes();
        
        // Add styles for boulder effects
        this.addStyles();
        
        console.log('Simplified Boulder System initialized');
    }
    
    // Initialize boulder types
    initBoulderTypes() {
        this.boulderTypes = {
            mountain: {
                name: "Mountain Boulder",
                color: "#8B4513", // Saddle brown
                minHits: 5,
                maxHits: 8,
                baseSize: 80,
                scoreReward: 80,
                shardReward: 15,
                spawnChance: 0.1 // 10% chance
            },
            ravana: {
                name: "Ravana's Boulder",
                color: "#800000", // Maroon
                minHits: 8,
                maxHits: 12,
                baseSize: 95,
                scoreReward: 150,
                shardReward: 25,
                spawnChance: 0.05 // 5% chance (rarer)
            },
            celestial: {
                name: "Divine Boulder",
                color: "#FFD700", // Gold
                minHits: 10,
                maxHits: 15,
                baseSize: 85,
                scoreReward: 200,
                shardReward: 40,
                spawnChance: 0.03 // 3% chance (very rare)
            }
        };
    }
    
    // Add CSS for boulder effects
    addStyles() {
        if (!document.getElementById('boulder-styles')) {
            const style = document.createElement('style');
            style.id = 'boulder-styles';
            style.textContent = `
                .health-bar {
                    position: absolute;
                    height: 6px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 3px;
                    overflow: hidden;
                    pointer-events: none;
                    z-index: 100;
                }
                
                .health-fill {
                    height: 100%;
                    background: linear-gradient(to right, #ff3300, #ff9900);
                    transform-origin: left;
                    transition: transform 0.2s;
                }
                
                .boulder-crack {
                    position: absolute;
                    pointer-events: none;
                    z-index: 101;
                }
                
                @keyframes hit-flash {
                    0% { opacity: 0.8; }
                    100% { opacity: 0; }
                }
                
                .hit-flash {
                    position: absolute;
                    background: white;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 102;
                    animation: hit-flash 0.3s ease-out forwards;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Create a boulder and add it to the world
    createBoulder(options = {}) {
        // Get a random boulder type or use specified type
        let boulderType;
        if (options.boulderType && this.boulderTypes[options.boulderType]) {
            boulderType = options.boulderType;
        } else {
            // Select random boulder type based on spawn chances
            const rand = Math.random();
            let cumulativeChance = 0;
            
            for (const [type, data] of Object.entries(this.boulderTypes)) {
                cumulativeChance += data.spawnChance;
                if (rand <= cumulativeChance) {
                    boulderType = type;
                    break;
                }
            }
            
            // Default to mountain if none selected
            if (!boulderType) boulderType = 'mountain';
        }
        
        // Get type data
        const typeData = this.boulderTypes[boulderType];
        
        // Generate random number of hits required
        const maxHits = Math.floor(Math.random() * (typeData.maxHits - typeData.minHits + 1)) + typeData.minHits;
        
        // Use simple circle for boulder shape
        const radius = typeData.baseSize / 2;
        const position = options.position || { 
            x: Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1, 
            y: 60 + Math.random() * 150
        };
        
        // Create the boulder body using Matter.js Circle
        const boulder = Matter.Bodies.circle(
            position.x,
            position.y,
            radius,
            {
                density: 0.01,
                frictionAir: 0.002,
                friction: 0.1,
                restitution: 0.3,
                render: {
                    fillStyle: typeData.color,
                    strokeStyle: '#000',
                    lineWidth: 1
                }
            }
        );
        
        // Set boulder properties
        boulder.label = 'boulder';
        boulder.isBoulder = true;
        boulder.boulderType = boulderType;
        boulder.breakable = true;
        boulder.isPartOfBridge = false;
        boulder.floatForce = true;
        
        // Store boulder data
        this.boulders.set(boulder.id, {
            body: boulder,
            type: boulderType,
            maxHits: maxHits,
            currentHits: 0,
            healthBar: this.createHealthBar(boulder, radius * 2, maxHits),
            cracks: []
        });
        
        // Ensure the boulder has a custom render function to appear as a stone
        if (window.Matter && window.Matter.Bodies) {
            console.log('Created boulder of type:', boulderType, 'requiring', maxHits, 'hits');
        } else {
            console.error('Matter.js not properly loaded!');
        }
        
        return boulder;
    }
    
    // Create health bar for boulder
    createHealthBar(boulder, size, maxHits) {
        const bar = document.createElement('div');
        bar.className = 'health-bar';
        bar.style.width = `${size * 1.2}px`;
        bar.style.left = `${boulder.position.x - size * 0.6}px`;
        bar.style.top = `${boulder.position.y - size/2 - 15}px`;
        
        const fill = document.createElement('div');
        fill.className = 'health-fill';
        bar.appendChild(fill);
        
        document.body.appendChild(bar);
        return bar;
    }
    
    // Update health bar position and fill
    updateHealthBar(boulderId) {
        const data = this.boulders.get(boulderId);
        if (!data || !data.healthBar) return;
        
        const boulder = data.body;
        const healthPercent = (data.currentHits / data.maxHits);
        
        // Update position
        data.healthBar.style.left = `${boulder.position.x - parseInt(data.healthBar.style.width) / 2}px`;
        data.healthBar.style.top = `${boulder.position.y - parseInt(data.healthBar.style.width) / 4 - 15}px`;
        
        // Update fill
        const fill = data.healthBar.querySelector('.health-fill');
        fill.style.transform = `scaleX(${1 - healthPercent})`;
        
        // Change color as health decreases
        if (healthPercent > 0.66) {
            fill.style.background = 'linear-gradient(to right, #ff3300, #ff9900)';
        } else if (healthPercent > 0.33) {
            fill.style.background = 'linear-gradient(to right, #ff9900, #ffcc00)';
        } else {
            fill.style.background = 'linear-gradient(to right, #ffcc00, #ffff00)';
        }
    }
    
    // Hit a boulder with damage
    hitBoulder(boulder, damageAmount = 1) {
        if (!boulder || !boulder.isBoulder) {
            console.warn('Not a boulder:', boulder);
            return false;
        }
        
        const data = this.boulders.get(boulder.id);
        if (!data) {
            console.warn('No data for boulder ID:', boulder.id);
            return false;
        }
        
        // Apply damage
        data.currentHits += damageAmount;
        
        // Update health bar
        this.updateHealthBar(boulder.id);
        
        // Create hit effect
        this.createHitEffect(boulder.position, data.body.circleRadius || 40);
        
        // Add crack at certain thresholds
        const hitThreshold = Math.ceil(data.maxHits / 3);
        if (data.currentHits % hitThreshold === 0) {
            this.addCrack(boulder);
        }
        
        // Play sound effect
        if (window.audioManager) {
            window.audioManager.playSound('stoneBreak', 0.7, 0.5);
        }
        
        // Check if boulder should break
        if (data.currentHits >= data.maxHits) {
            this.breakBoulder(boulder);
            return true;
        }
        
        return false;
    }
    
    // Create visual hit effect
    createHitEffect(position, size) {
        const flash = document.createElement('div');
        flash.className = 'hit-flash';
        flash.style.left = `${position.x - size}px`;
        flash.style.top = `${position.y - size}px`;
        flash.style.width = `${size * 2}px`;
        flash.style.height = `${size * 2}px`;
        
        document.body.appendChild(flash);
        
        // Remove after animation
        setTimeout(() => {
            if (document.body.contains(flash)) {
                document.body.removeChild(flash);
            }
        }, 300);
    }
    
    // Add crack to boulder
    addCrack(boulder) {
        const data = this.boulders.get(boulder.id);
        if (!data) return;
        
        const crack = document.createElement('div');
        crack.className = 'boulder-crack';
        crack.style.width = '30px';
        crack.style.height = '30px';
        crack.style.background = '#000';
        crack.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
        crack.style.opacity = '0.3';
        
        // Random position on boulder
        const radius = data.body.circleRadius || 40;
        const angle = Math.random() * Math.PI * 2;
        const distance = radius * 0.5;
        const x = boulder.position.x + Math.cos(angle) * distance;
        const y = boulder.position.y + Math.sin(angle) * distance;
        
        crack.style.left = `${x - 15}px`;
        crack.style.top = `${y - 15}px`;
        crack.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        document.body.appendChild(crack);
        data.cracks.push(crack);
    }
    
    // Break a boulder completely
    breakBoulder(boulder) {
        if (!boulder) return;
        
        const data = this.boulders.get(boulder.id);
        if (!data) return;
        
        // Give rewards
        const typeData = this.boulderTypes[data.type];
        
        // Add score
        if (window.updateScore) {
            window.updateScore(typeData.scoreReward);
            
            // Show score notification
            if (window.showNotification) {
                window.showNotification(boulder.position.x, boulder.position.y - 30, `+${typeData.scoreReward}`, '');
            }
        }
        
        // Add shards (upgrade currency)
        if (window.upgradeSystem) {
            const shardAmount = window.upgradeSystem.addCurrency(typeData.shardReward);
            
            // Show shard notification
            if (window.showNotification) {
                window.showNotification(boulder.position.x, boulder.position.y - 60, `+${shardAmount} 💎`, 'shard');
            }
        }
        
        // Create explosion effect
        this.createExplosionEffect(boulder.position, data.body.circleRadius || 40);
        
        // Spawn regular stones
        this.spawnStonesFromBoulder(boulder, data.type);
        
        // Cleanup
        this.cleanupBoulder(boulder.id);
        
        // Remove boulder from the world
        if (window.world) {
            Matter.Composite.remove(window.world, boulder);
        }
        
        // Remove from tracking
        this.boulders.delete(boulder.id);
    }
    
    // Create explosion effect
    createExplosionEffect(position, size) {
        // Create shockwave
        const shockwave = document.createElement('div');
        shockwave.className = 'hit-flash';
        shockwave.style.left = `${position.x - size * 2}px`;
        shockwave.style.top = `${position.y - size * 2}px`;
        shockwave.style.width = `${size * 4}px`;
        shockwave.style.height = `${size * 4}px`;
        shockwave.style.animation = 'hit-flash 0.6s ease-out forwards';
        
        document.body.appendChild(shockwave);
        
        // Remove after animation
        setTimeout(() => {
            if (document.body.contains(shockwave)) {
                document.body.removeChild(shockwave);
            }
        }, 600);
    }
    
    // Spawn regular stones from broken boulder
    spawnStonesFromBoulder(boulder, boulderType) {
        if (!window.createStone || !window.world) return;
        
        // Number of stones to spawn - significantly increased
        const stoneCount = 8 + Math.floor(Math.random() * 5); // 8-12 stones per boulder
        
        // Get special type based on boulder type
        let specialType = null;
        switch(boulderType) {
            case 'ravana':
                if (Math.random() < 0.3) specialType = 'hanuman';
                break;
            case 'celestial':
                if (Math.random() < 0.4) specialType = 'rama';
                break;
            default:
                if (Math.random() < 0.4) specialType = 'vanar';
        }
        
        // Create and add the stones with varied shapes and sizes
        for (let i = 0; i < stoneCount; i++) {
            // Calculate position in a circle
            const angle = (Math.PI * 2 / stoneCount) * i;
            
            // Vary stone sizes and shapes based on boulder type
            let size;
            // 60% large, 30% medium, 10% small for better game progression
            const sizeRoll = Math.random();
            if (sizeRoll < 0.6) size = 'large';
            else if (sizeRoll < 0.9) size = 'medium';
            else size = 'small';
            
            // Choose random shape type to match the game's polygon variety
            const possibleShapes = ['rectangle', 'triangle', 'hexagon', 'lShape', 'trapezoid'];
            const shapeType = possibleShapes[Math.floor(Math.random() * possibleShapes.length)];
            
            // More variance for celestial and ravana boulders
            let velocity = {
                x: Math.cos(angle) * (3 + Math.random() * 2),
                y: Math.sin(angle) * (3 + Math.random() * 2) + 2
            };
            
            // Create the stone with properties matching the original game's style
            const stone = window.createStone({
                size: size,
                shapeType: shapeType,
                position: {
                    x: boulder.position.x + Math.cos(angle) * 20,
                    y: boulder.position.y + Math.sin(angle) * 20
                },
                velocity: velocity,
                specialType: specialType,
                angle: Math.random() * Math.PI * 2 // Random rotation for more chaos
            });
            
            Matter.Composite.add(window.world, stone);
        }
    }
    
    // Clean up a boulder's visual elements
    cleanupBoulder(boulderId) {
        const data = this.boulders.get(boulderId);
        if (!data) return;
        
        // Remove health bar
        if (data.healthBar && document.body.contains(data.healthBar)) {
            document.body.removeChild(data.healthBar);
        }
        
        // Remove all cracks
        data.cracks.forEach(crack => {
            if (document.body.contains(crack)) {
                document.body.removeChild(crack);
            }
        });
    }
    
    // Update all boulder positions (for health bars and cracks)
    update() {
        this.boulders.forEach((data, id) => {
            if (!data.body || !data.body.position) return;
            
            this.updateHealthBar(id);
            
            // Update crack positions
            data.cracks.forEach(crack => {
                const offsetX = parseInt(crack.style.left) + 15 - data.body.position.x;
                const offsetY = parseInt(crack.style.top) + 15 - data.body.position.y;
                
                crack.style.left = `${data.body.position.x + offsetX - 15}px`;
                crack.style.top = `${data.body.position.y + offsetY - 15}px`;
            });
        });
    }
    
    // Clean up everything (for game restart)
    cleanup() {
        // Remove all visual elements
        this.boulders.forEach((data, id) => {
            this.cleanupBoulder(id);
        });
        
        // Clear the tracking map
        this.boulders.clear();
    }
}

// Make available globally
window.BoulderSystem = BoulderSystem;
