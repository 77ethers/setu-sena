// Boulder System - Special large stones that require multiple hits to break

class BoulderSystem {
    constructor(gameRef) {
        // Store direct references to needed game objects instead of the entire game reference
        this.world = window.world || (gameRef ? gameRef.world : null);
        this.updateScore = window.updateScore || (gameRef ? gameRef.updateScore : null);
        this.createStone = window.createStone || (gameRef ? gameRef.createStone : null);
        this.boulders = new Map(); // Maps boulder bodies to their data
        
        console.log('BoulderSystem initialized with world:', !!this.world);
        
        // Boulder types with Ramayana theme
        this.boulderTypes = {
            mountain: {
                name: "Mountain Boulder",
                color: "#8B4513", // Saddle brown
                minHits: 5,
                maxHits: 8,
                size: { min: 70, max: 90 }, // Larger than regular stones
                density: 0.01,
                restitution: 0.3,
                scoreReward: 80,
                shardReward: 15,
                spawnChance: 0.1, // 10% chance
                breakSound: 'heavyImpact',
                finalBreakSound: 'boulderBreak'
            },
            ravana: {
                name: "Ravana's Boulder",
                color: "#800000", // Maroon
                minHits: 8,
                maxHits: 12,
                size: { min: 85, max: 110 },
                density: 0.015,
                restitution: 0.2,
                scoreReward: 150,
                shardReward: 25,
                spawnChance: 0.05, // 5% chance (rarer)
                glowEffect: true,
                breakSound: 'heavyImpact',
                finalBreakSound: 'demonicRoar'
            },
            celestial: {
                name: "Divine Boulder",
                color: "#FFD700", // Gold
                minHits: 10,
                maxHits: 15,
                size: { min: 75, max: 95 },
                density: 0.012,
                restitution: 0.4,
                scoreReward: 200,
                shardReward: 40,
                spawnChance: 0.03, // 3% chance (very rare)
                glowEffect: true,
                breakSound: 'heavyImpact',
                finalBreakSound: 'divineBreak'
            }
        };
        
        // Initialize keyframes for visual effects if not already done
        this.initializeStyles();
    }
    
    // Initialize CSS for boulder effects
    initializeStyles() {
        if (!document.querySelector('#boulder-keyframes')) {
            const keyframes = document.createElement('style');
            keyframes.id = 'boulder-keyframes';
            keyframes.innerHTML = `
                @keyframes boulder-hit {
                    0% { transform: scale(1); filter: brightness(1); }
                    50% { transform: scale(1.1); filter: brightness(1.2); }
                    100% { transform: scale(1); filter: brightness(1); }
                }
                
                @keyframes boulder-glow {
                    0% { box-shadow: 0 0 10px 5px rgba(255, 215, 0, 0.5); }
                    50% { box-shadow: 0 0 20px 10px rgba(255, 215, 0, 0.7); }
                    100% { box-shadow: 0 0 10px 5px rgba(255, 215, 0, 0.5); }
                }
                
                .boulder-health-bar {
                    position: absolute;
                    height: 6px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 3px;
                    overflow: hidden;
                    transform: translateX(-50%);
                    pointer-events: none;
                }
                
                .boulder-health-fill {
                    height: 100%;
                    width: 100%;
                    background: linear-gradient(to right, #ff3300, #ff9900);
                    transform-origin: left;
                }
                
                .boulder-crack {
                    position: absolute;
                    pointer-events: none;
                    z-index: 50;
                }
            `;
            document.head.appendChild(keyframes);
        }
    }
    
    // Create a boulder of a specific type or random type
    createBoulder(options = {}) {
        // Safety check - make sure Matter.js is available
        if (!window.Matter || !this.world) {
            console.error('Cannot create boulder: Matter.js or world not available');
            return null;
        }
        
        // Determine boulder type
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
        
        const typeData = this.boulderTypes[boulderType];
        console.log('Creating boulder of type:', boulderType);
        
        // Determine boulder size
        const size = options.size || Math.random() * (typeData.size.max - typeData.size.min) + typeData.size.min;
        
        // Generate random shape vertices
        const vertices = this.generateBoulderShape(size, boulderType);
        
        // Determine position, defaulting to a random position if not specified
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const hudHeight = 60; // Height of the HUD bar
        
        const position = options.position || {
            x: Math.random() * windowWidth,
            y: hudHeight + Math.random() * (windowHeight * 0.3) // Spawn in top third of game area
        };
        
        // Create the boulder body - handle case where fromVertices might fail
        let boulder;
        try {
            boulder = Matter.Bodies.fromVertices(
                position.x,
                position.y,
                [vertices],
                {
                density: typeData.density,
                frictionAir: 0.002,
                friction: 0.1,
                restitution: typeData.restitution,
                render: {
                    fillStyle: typeData.color,
                    strokeStyle: '#000',
                    lineWidth: 1
                }
                }
            );
        } catch (error) {
            console.error('Failed to create boulder using fromVertices:', error);
            // Fallback to a simple circle or polygon if fromVertices fails
            boulder = Matter.Bodies.circle(
                position.x,
                position.y,
                size / 2,
                {
                    density: typeData.density,
                    frictionAir: 0.002,
                    friction: 0.1,
                    restitution: typeData.restitution,
                    render: {
                        fillStyle: typeData.color,
                        strokeStyle: '#000',
                        lineWidth: 1
                    }
                }
            );
        }
        
        // Generate random number of hits required within specified range
        const maxHits = Math.floor(Math.random() * (typeData.maxHits - typeData.minHits + 1)) + typeData.minHits;
        
        // Custom boulder properties
        boulder.label = 'boulder';
        boulder.isBoulder = true;
        boulder.boulderType = boulderType;
        boulder.breakable = true; // Can eventually be broken
        boulder.isPartOfBridge = false;
        boulder.floatForce = true; // Apply gentle floating
        
        // Store boulder data
        this.boulders.set(boulder.id, {
            body: boulder,
            type: boulderType,
            maxHits: maxHits,
            currentHits: 0,
            healthBar: this.createHealthBar(boulder),
            size: size,
            vertices: vertices,
            crackElements: []
        });
        
        return boulder;
    }
    
    // Generate boulder shape (more irregular than normal stones)
    generateBoulderShape(size, type) {
        let baseShape;
        const irregularity = 0.3; // Higher irregularity for boulders
        
        // Different base shapes depending on boulder type
        switch(type) {
            case 'ravana':
                // Ravana boulders have more angular, threatening shapes
                baseShape = this.generateAngularShape(size);
                break;
            case 'celestial':
                // Celestial boulders are more symmetrical and geometric
                baseShape = this.generateSymmetricalShape(size);
                break;
            case 'mountain':
            default:
                // Mountain boulders are more natural and irregular
                baseShape = this.generateIrregularShape(size);
                break;
        }
        
        // Add irregularity
        return this.addIrregularity(baseShape, irregularity * size);
    }
    
    // Generate different boulder shapes
    generateIrregularShape(size) {
        // Create a roughly circular shape with 8-12 vertices
        const vertices = [];
        const numVertices = 8 + Math.floor(Math.random() * 5);
        const radius = size / 2;
        
        for (let i = 0; i < numVertices; i++) {
            const angle = (Math.PI * 2 / numVertices) * i;
            const variableRadius = radius * (0.8 + Math.random() * 0.4); // 80-120% of radius
            vertices.push({
                x: Math.cos(angle) * variableRadius,
                y: Math.sin(angle) * variableRadius
            });
        }
        
        return vertices;
    }
    
    generateAngularShape(size) {
        // Create a more angular, intimidating shape
        const vertices = [];
        const numVertices = 6 + Math.floor(Math.random() * 4); // Fewer vertices for sharper angles
        const radius = size / 2;
        
        for (let i = 0; i < numVertices; i++) {
            const angle = (Math.PI * 2 / numVertices) * i;
            // More variation in radius to create sharper points
            const variableRadius = radius * (0.7 + Math.random() * 0.6); // 70-130% of radius
            vertices.push({
                x: Math.cos(angle) * variableRadius,
                y: Math.sin(angle) * variableRadius
            });
        }
        
        return vertices;
    }
    
    generateSymmetricalShape(size) {
        // Create a more symmetrical, divine-looking shape
        const vertices = [];
        const numVertices = 10 + Math.floor(Math.random() * 3); // More vertices for smoother shape
        const radius = size / 2;
        
        for (let i = 0; i < numVertices; i++) {
            const angle = (Math.PI * 2 / numVertices) * i;
            // Less variation for more symmetry
            const variableRadius = radius * (0.9 + Math.random() * 0.2); // 90-110% of radius
            vertices.push({
                x: Math.cos(angle) * variableRadius,
                y: Math.sin(angle) * variableRadius
            });
        }
        
        return vertices;
    }
    
    // Add irregularity to boulder shapes
    addIrregularity(vertices, amount) {
        return vertices.map(vertex => ({
            x: vertex.x + (Math.random() - 0.5) * amount,
            y: vertex.y + (Math.random() - 0.5) * amount
        }));
    }
    
    // Create health bar for boulder
    createHealthBar(boulder) {
        const boulderData = this.boulders.get(boulder.id);
        if (!boulderData) return null;
        
        const healthBar = document.createElement('div');
        healthBar.className = 'boulder-health-bar';
        healthBar.style.width = `${boulderData.size * 1.2}px`; // Slightly wider than boulder
        healthBar.style.left = `${boulder.position.x}px`;
        healthBar.style.top = `${boulder.position.y - boulderData.size/2 - 15}px`; // Position above boulder
        
        const healthFill = document.createElement('div');
        healthFill.className = 'boulder-health-fill';
        healthBar.appendChild(healthFill);
        
        document.body.appendChild(healthBar);
        return healthBar;
    }
    
    // Update health bar position and fill
    updateHealthBar(boulderId) {
        const boulderData = this.boulders.get(boulderId);
        if (!boulderData || !boulderData.healthBar) return;
        
        const boulder = boulderData.body;
        const healthPercentage = (boulderData.currentHits / boulderData.maxHits) * 100;
        
        // Update position
        boulderData.healthBar.style.left = `${boulder.position.x}px`;
        boulderData.healthBar.style.top = `${boulder.position.y - boulderData.size/2 - 15}px`;
        
        // Update fill width
        const healthFill = boulderData.healthBar.querySelector('.boulder-health-fill');
        healthFill.style.transform = `scaleX(${1 - (healthPercentage / 100)})`;
        
        // Change color as health decreases
        if (healthPercentage > 66) {
            healthFill.style.background = 'linear-gradient(to right, #ff3300, #ff9900)';
        } else if (healthPercentage > 33) {
            healthFill.style.background = 'linear-gradient(to right, #ff9900, #ffcc00)';
        } else {
            healthFill.style.background = 'linear-gradient(to right, #ffcc00, #ffff00)';
        }
    }
    
    // Hit a boulder
    hitBoulder(boulder, damageAmount = 1) {
        if (!boulder || !boulder.isBoulder) return false;
        
        const boulderData = this.boulders.get(boulder.id);
        if (!boulderData) return false;
        
        // Apply hit with damage amount (based on click power from upgrade system)
        boulderData.currentHits += damageAmount;
        
        // Update health bar
        this.updateHealthBar(boulder.id);
        
        // Create hit effect
        this.createHitEffect(boulder);
        
        // Add crack if at certain thresholds
        if (boulderData.currentHits % Math.ceil(boulderData.maxHits / 3) === 0) {
            this.addCrack(boulder);
        }
        
        // Play hit sound
        if (window.audioManager) {
            window.audioManager.playSound(this.boulderTypes[boulderData.type].breakSound || 'heavyImpact');
        }
        
        // Check if boulder should break
        if (boulderData.currentHits >= boulderData.maxHits) {
            this.breakBoulder(boulder);
            return true; // Boulder broke
        }
        
        return false; // Boulder not yet broken
    }
    
    // Create visual hit effect
    createHitEffect(boulder) {
        // Flash the boulder briefly
        const body = boulder;
        const originalFill = body.render.fillStyle;
        const originalStroke = body.render.strokeStyle;
        
        // Flash white
        body.render.fillStyle = '#FFFFFF';
        body.render.strokeStyle = '#FFFFFF';
        
        // Restore original colors after a short delay
        setTimeout(() => {
            if (body && body.render) {
                body.render.fillStyle = originalFill;
                body.render.strokeStyle = originalStroke;
            }
        }, 100);
        
        // Create impact particles
        this.createImpactParticles(body.position);
    }
    
    // Create impact particles when boulder is hit but not broken
    createImpactParticles(position) {
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'boulder-impact-particle';
            particle.style.position = 'absolute';
            particle.style.width = '3px';
            particle.style.height = '3px';
            particle.style.backgroundColor = '#FFFFFF';
            particle.style.left = `${position.x}px`;
            particle.style.top = `${position.y}px`;
            particle.style.borderRadius = '50%';
            particle.style.zIndex = '90';
            particle.style.pointerEvents = 'none';
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 15;
            const finalX = position.x + Math.cos(angle) * distance;
            const finalY = position.y + Math.sin(angle) * distance;
            
            // Animation
            particle.animate([
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                { transform: `translate(${finalX - position.x}px, ${finalY - position.y}px) scale(0)`, opacity: 0 }
            ], {
                duration: 300 + Math.random() * 200,
                easing: 'ease-out'
            });
            
            document.body.appendChild(particle);
            
            // Remove after animation
            setTimeout(() => {
                if (document.body.contains(particle)) {
                    document.body.removeChild(particle);
                }
            }, 500);
        }
    }
    
    // Add crack to boulder
    addCrack(boulder) {
        const boulderData = this.boulders.get(boulder.id);
        if (!boulderData) return;
        
        // Create crack element
        const crack = document.createElement('div');
        crack.className = 'boulder-crack';
        
        // Random crack image
        const crackNumber = Math.floor(Math.random() * 3) + 1;
        crack.style.backgroundImage = `url('assets/crack${crackNumber}.png')`;
        crack.style.backgroundSize = 'contain';
        crack.style.backgroundRepeat = 'no-repeat';
        
        // Random size based on boulder size
        const crackSize = boulderData.size * (0.3 + Math.random() * 0.5);
        crack.style.width = `${crackSize}px`;
        crack.style.height = `${crackSize}px`;
        
        // Random position within boulder
        const offsetRange = boulderData.size * 0.3;
        const offsetX = (Math.random() - 0.5) * offsetRange;
        const offsetY = (Math.random() - 0.5) * offsetRange;
        crack.style.left = `${boulder.position.x + offsetX - crackSize/2}px`;
        crack.style.top = `${boulder.position.y + offsetY - crackSize/2}px`;
        
        // Random rotation
        crack.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        document.body.appendChild(crack);
        boulderData.crackElements.push(crack);
    }
    
    // Break a boulder completely
    breakBoulder(boulder) {
        if (!boulder || !boulder.id) {
            console.error('Invalid boulder passed to breakBoulder');
            return;
        }
        
        const boulderData = this.boulders.get(boulder.id);
        if (!boulderData) {
            console.error('No boulder data found for ID:', boulder.id);
            return;
        }
        
        // Play final break sound
        if (window.audioManager) {
            window.audioManager.playSound(this.boulderTypes[boulderData.type].finalBreakSound || 'boulderBreak');
        }
        
        // Remove health bar
        if (boulderData.healthBar && document.body.contains(boulderData.healthBar)) {
            document.body.removeChild(boulderData.healthBar);
        }
        
        // Remove all crack elements
        boulderData.crackElements.forEach(crack => {
            if (document.body.contains(crack)) {
                document.body.removeChild(crack);
            }
        });
        
        // Award score and shards
        const typeData = this.boulderTypes[boulderData.type];
        const scoreReward = typeData.scoreReward;
        const shardReward = typeData.shardReward;
        
        // Add score
        if (this.updateScore) {
            this.updateScore(scoreReward);
            
            // Show score notification
            if (window.showNotification) {
                window.showNotification(
                    boulder.position.x,
                    boulder.position.y - 30,
                    `+${scoreReward}`,
                    'boulder-break'
                );
            }
        } else if (window.updateScore) {
            window.updateScore(scoreReward);
        }
        
        // Add shards if upgrade system exists
        if (window.upgradeSystem) {
            const actualShards = window.upgradeSystem.addCurrency(shardReward);
            
            // Show shard notification
            if (window.showNotification) {
                window.showNotification(
                    boulder.position.x,
                    boulder.position.y - 60,
                    `+${actualShards} 💎`,
                    'shard'
                );
            }
        }
        
        // Create break particles with more impressive effect
        this.createBreakParticles(boulder, boulderData);
        
        // Create large stones from the boulder
        this.spawnStonesFromBoulder(boulder, boulderData);
        
        // Remove boulder from the world
        try {
            if (this.world) {
                Matter.Composite.remove(this.world, boulder);
            } else if (window.world) {
                Matter.Composite.remove(window.world, boulder);
            } else {
                console.error('Cannot remove boulder: world not available');
            }
        } catch (error) {
            console.error('Error removing boulder from world:', error);
        }
        
        // Remove from boulder tracking
        this.boulders.delete(boulder.id);
    }
    
    // Create more impressive particle effect for boulder break
    createBreakParticles(boulder, boulderData) {
        const position = boulder.position;
        const color = boulder.render.fillStyle;
        
        // Create a shockwave effect
        const shockwave = document.createElement('div');
        shockwave.style.position = 'absolute';
        shockwave.style.left = `${position.x}px`;
        shockwave.style.top = `${position.y}px`;
        shockwave.style.width = '20px';
        shockwave.style.height = '20px';
        shockwave.style.borderRadius = '50%';
        shockwave.style.background = 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)';
        shockwave.style.transform = 'translate(-50%, -50%)';
        shockwave.style.zIndex = '95';
        shockwave.style.pointerEvents = 'none';
        
        document.body.appendChild(shockwave);
        
        // Animate shockwave
        shockwave.animate([
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.8 },
            { transform: 'translate(-50%, -50%) scale(10)', opacity: 0 }
        ], {
            duration: 500,
            easing: 'ease-out'
        });
        
        // Remove after animation
        setTimeout(() => {
            if (document.body.contains(shockwave)) {
                document.body.removeChild(shockwave);
            }
        }, 500);
        
        // Create many particles
        const particleCount = 20 + Math.floor(boulderData.size / 10); // More particles for larger boulders
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.left = `${position.x}px`;
            particle.style.top = `${position.y}px`;
            particle.style.width = `${3 + Math.random() * 5}px`;
            particle.style.height = `${3 + Math.random() * 5}px`;
            particle.style.backgroundColor = color;
            particle.style.borderRadius = '50%';
            particle.style.transform = 'translate(-50%, -50%)';
            particle.style.zIndex = '90';
            particle.style.pointerEvents = 'none';
            
            // Random direction and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 60;
            const finalX = position.x + Math.cos(angle) * distance;
            const finalY = position.y + Math.sin(angle) * distance;
            
            // Gravity effect - particles fall down after explosion
            particle.animate([
                { transform: 'translate(-50%, -50%)', opacity: 1 },
                { transform: `translate(${Math.cos(angle) * distance * 0.5 - 50}%, ${Math.sin(angle) * distance * 0.5 - 50}%)`, opacity: 1, offset: 0.6 },
                { transform: `translate(${Math.cos(angle) * distance - 50}%, ${Math.sin(angle) * distance + 30 - 50}%)`, opacity: 0 }
            ], {
                duration: 800 + Math.random() * 400,
                easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)' // Bounce-like effect
            });
            
            document.body.appendChild(particle);
            
            // Remove after animation
            setTimeout(() => {
                if (document.body.contains(particle)) {
                    document.body.removeChild(particle);
                }
            }, 1200);
        }
    }
    
    // Spawn regular stones from broken boulder
    spawnStonesFromBoulder(boulder, boulderData) {
        // Number of stones based on boulder size
        const stoneCount = 3 + Math.floor(boulderData.size / 30);
        
        for (let i = 0; i < stoneCount; i++) {
            const createStoneFunc = this.createStone || window.createStone;
            const targetWorld = this.world || window.world;
            
            if (createStoneFunc && targetWorld) {
                // Determine velocity based on position in circle
                const angle = (Math.PI * 2 / stoneCount) * i;
                const velocity = {
                    x: Math.cos(angle) * 3,
                    y: Math.sin(angle) * 3 + 2 // Add downward bias
                };
                
                // Create large stone at boulder position with velocity
                try {
                    const stone = createStoneFunc({
                        size: 'large',
                        position: {
                            x: boulder.position.x + Math.cos(angle) * 10,
                            y: boulder.position.y + Math.sin(angle) * 10
                        },
                        velocity: velocity,
                        // Sometimes create special stones based on boulder type
                        specialType: this.getSpecialTypeFromBoulder(boulderData.type)
                    });
                    
                    // Add to world
                    Matter.Composite.add(targetWorld, stone);
                } catch (error) {
                    console.error('Error creating stone from boulder:', error);
                }
            } else {
                console.warn('Cannot spawn stones from boulder: createStone or world not available');
            }
        }
    }
    
    // Determine if boulder should spawn a special stone type
    getSpecialTypeFromBoulder(boulderType) {
        switch(boulderType) {
            case 'ravana':
                return Math.random() < 0.3 ? 'hanuman' : null; // 30% chance for Hanuman stone
            case 'celestial':
                return Math.random() < 0.4 ? 'rama' : null; // 40% chance for Rama stone
            case 'mountain':
            default:
                return Math.random() < 0.4 ? 'vanar' : null; // 40% chance for Vanar stone
        }
    }
    
    // Update boulder positions (for health bars and cracks)
    update() {
        this.boulders.forEach((data, id) => {
            this.updateHealthBar(id);
            
            // Update crack positions
            data.crackElements.forEach(crack => {
                const offsetX = parseFloat(crack.style.left) + parseFloat(crack.style.width)/2 - data.body.position.x;
                const offsetY = parseFloat(crack.style.top) + parseFloat(crack.style.height)/2 - data.body.position.y;
                
                crack.style.left = `${data.body.position.x + offsetX - parseFloat(crack.style.width)/2}px`;
                crack.style.top = `${data.body.position.y + offsetY - parseFloat(crack.style.height)/2}px`;
            });
        });
    }
    
    // Check if a body is a boulder
    isBoulder(body) {
        return body && body.isBoulder === true;
    }
    
    // Clean up all health bars and crack elements (for game restart)
    cleanup() {
        this.boulders.forEach((data) => {
            if (data.healthBar && document.body.contains(data.healthBar)) {
                document.body.removeChild(data.healthBar);
            }
            
            data.crackElements.forEach(crack => {
                if (document.body.contains(crack)) {
                    document.body.removeChild(crack);
                }
            });
        });
        
        this.boulders.clear();
    }
}

// Make available to window
window.BoulderSystem = BoulderSystem;
