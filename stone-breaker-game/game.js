// Initialize game variables
let score = 0;
let upgradeSystem = null; // Will hold the upgrade system
let boulderSystem = null; // Will hold the boulder system
let lastStoneBreakTime = Date.now(); // Track time between breaks for idle mechanics

// Ramayana theme colors
const stoneColors = [
    '#FF7722', // Saffron (sacred color)
    '#8B0000', // Maroon (representing strength)
    '#D4AF37', // Gold (divine element)
    '#654321', // Brown (earth element)
    '#B87333'  // Copper (traditional metal)
];

// Special stone types with Ramayana significance
const specialStoneTypes = {
    hanuman: { // Strength stones - harder to break but give more points
        color: '#FF4500', // Orange-red
        density: 0.008,
        restitution: 0.6,
        scoreMultiplier: 2,
        breakable: true,
        spawnChance: 0.15 // 15% chance
    },
    vanar: { // Monkey army stones - break into more fragments
        color: '#CD853F', // Golden brown
        density: 0.005,
        restitution: 0.7,
        fragmentMultiplier: 2,
        breakable: true,
        spawnChance: 0.2 // 20% chance
    },
    rama: { // Divine stones - golden with special effects
        color: '#FFD700', // Gold
        density: 0.005,
        restitution: 0.8,
        scoreMultiplier: 3,
        breakable: true,
        glowEffect: true,
        spawnChance: 0.1 // 10% chance (rare)
    },
    nal: { // Builder stones - better for bridge building
        color: '#6B8E23', // Olive green
        density: 0.006,
        friction: 0.8, // Higher friction for better bridge building
        bridgeValueMultiplier: 1.5,
        breakable: true,
        spawnChance: 0.25 // 25% chance
    }
};

const particleColors = ['#FF7722', '#FFD700', '#8B0000', '#FFA500', '#B87333'];

// Bridge building variables
let bridgeProgress = 0;
let waterLevel = 0; // Will be set based on screen height
let leftShoreX = 0;
let rightShoreX = 0;
let bridgeParts = []; // To track stones that form the bridge
let joinedStoneBodies = new Set(); // Keep track of which stones are part of the bridge

// Ocean rendering variables
let oceanHeight = 0.3; // Ocean takes 30% of the canvas height
let oceanY = 0; // Will be set based on screen height
let waveAmplitude = 5; // Wave height in pixels
let waveFrequency = 0.02; // Wave frequency
let waveSpeed = 0.05; // Wave animation speed
let waveOffset = 0; // For wave animation

// Game state variables
let gameRunning = false;
let gameInitialized = false;
let runner = null; // Will hold the Matter.js runner

// Stone size categories (based on approximate size in pixels)
const stoneSizes = {
    large: { min: 45, max: 60 },
    medium: { min: 25, max: 35 },
    small: { min: 10, max: 15 }
};

// Helper function to darken a color (for wet stones)
function darkenColor(hexColor, percent) {
    // Convert hex to RGB first
    let r = parseInt(hexColor.slice(1, 3), 16);
    let g = parseInt(hexColor.slice(3, 5), 16);
    let b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate new darker values
    r = Math.max(0, Math.floor(r * (100 - percent) / 100));
    g = Math.max(0, Math.floor(g * (100 - percent) / 100));
    b = Math.max(0, Math.floor(b * (100 - percent) / 100));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Predefined shapes for stones (vertices for polygons)
const stoneShapes = {
    // Rectangular/square-like shapes with random variations
    rectangle: (size) => {
        const width = size * (0.8 + Math.random() * 0.4);
        const height = size * (0.8 + Math.random() * 0.4);
        return [
            { x: -width/2, y: -height/2 },
            { x: width/2, y: -height/2 },
            { x: width/2, y: height/2 },
            { x: -width/2, y: height/2 }
        ];
    },
    // L-shaped blocks
    lShape: (size) => {
        const scale = size * 0.8;
        return [
            { x: -scale/2, y: -scale/2 },
            { x: scale/2, y: -scale/2 },
            { x: scale/2, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: scale/2 },
            { x: -scale/2, y: scale/2 }
        ];
    },
    // Triangular blocks
    triangle: (size) => {
        const scale = size * 0.9;
        return [
            { x: -scale/2, y: scale/2 },
            { x: 0, y: -scale/2 },
            { x: scale/2, y: scale/2 }
        ];
    },
    // Hexagonal blocks
    hexagon: (size) => {
        const scale = size * 0.6;
        const vertices = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            vertices.push({
                x: scale * Math.cos(angle),
                y: scale * Math.sin(angle)
            });
        }
        return vertices;
    },
    // Trapezoid shape
    trapezoid: (size) => {
        const scale = size * 0.8;
        const topWidth = scale * (0.5 + Math.random() * 0.3);
        return [
            { x: -scale/2, y: scale/2 },
            { x: scale/2, y: scale/2 },
            { x: topWidth, y: -scale/2 },
            { x: -topWidth, y: -scale/2 }
        ];
    }
};

// Function to add random irregularity to shapes
function addIrregularity(vertices, amount) {
    return vertices.map(vertex => {
        return {
            x: vertex.x + (Math.random() - 0.5) * amount,
            y: vertex.y + (Math.random() - 0.5) * amount
        };
    });
}

// Get a random shape type
function getRandomShapeType() {
    const shapes = Object.keys(stoneShapes);
    return shapes[Math.floor(Math.random() * shapes.length)];
}

// Matter.js module aliases
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Composite = Matter.Composite,
      Events = Matter.Events,
      
      // Make Matter objects available for external systems
      World = Matter.World,
      Mouse = Matter.Mouse,
      Query = Matter.Query,
      Constraint = Matter.Constraint,
      MouseConstraint = Matter.MouseConstraint;

// Create engine and runner (no gravity initially for floating stones)
const engine = Engine.create({
    gravity: { x: 0, y: 0 }
});
const world = engine.world;

// We'll manually apply gravity only to broken stones

// Get window dimensions for full-screen canvas
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;
const hudHeight = 60; // HUD bar height in pixels
const gameAreaHeight = windowHeight - hudHeight; // Actual game area height

// Create renderer
const render = Render.create({
    element: document.getElementById('game-canvas'),
    engine: engine,
    options: {
        width: windowWidth,
        height: windowHeight,
        wireframes: false,
        background: 'transparent',
        showAngleIndicator: false
    }
});

// Create a custom render event to draw the ocean
Events.on(render, 'afterRender', function() {
    const ctx = render.context;
    const canvas = render.canvas;
    
    // Update wave animation
    waveOffset += waveSpeed;
    if (waveOffset > 1000) waveOffset = 0;
    
    // Calculate ocean position (30% from bottom of screen)
    oceanY = windowHeight * (1 - oceanHeight);
    waterLevel = oceanY;
    
    // Create ocean gradient
    const oceanGradient = ctx.createLinearGradient(0, oceanY, 0, windowHeight);
    oceanGradient.addColorStop(0, 'rgba(0, 120, 255, 0.8)');   // Lighter blue at top
    oceanGradient.addColorStop(0.5, 'rgba(0, 80, 155, 0.9)');  // Medium blue in middle
    oceanGradient.addColorStop(1, 'rgba(0, 40, 100, 1)');      // Deep blue at bottom
    
    // Draw the main ocean body
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, oceanY, canvas.width, canvas.height - oceanY);
    
    // Draw waves at the top of the ocean
    ctx.beginPath();
    ctx.moveTo(0, oceanY);
    
    // Create wave pattern
    for (let x = 0; x < canvas.width; x += 10) {
        const y = oceanY + Math.sin((x * waveFrequency) + waveOffset) * waveAmplitude;
        ctx.lineTo(x, y);
    }
    
    // Complete the wave pattern
    ctx.lineTo(canvas.width, oceanY);
    ctx.lineTo(canvas.width, oceanY - 10);
    ctx.lineTo(0, oceanY - 10);
    ctx.closePath();
    
    // Fill the wave with a lighter blue
    ctx.fillStyle = 'rgba(100, 180, 255, 0.5)';
    ctx.fill();
    
    // Draw the shores on left and right
    const shoreWidth = canvas.width * 0.08; // 8% of screen width
    
    // Left shore
    leftShoreX = shoreWidth;
    ctx.fillStyle = '#d2b48c'; // Sandy color
    ctx.beginPath();
    ctx.moveTo(0, oceanY - 20);        // Start above water line
    ctx.lineTo(shoreWidth, oceanY);    // Slope to water
    ctx.lineTo(0, oceanY);            // Back to left edge at water level
    ctx.lineTo(0, canvas.height);     // Down to bottom left
    ctx.lineTo(shoreWidth, canvas.height); // To bottom right of shore
    ctx.closePath();
    ctx.fill();
    
    // Right shore
    rightShoreX = canvas.width - shoreWidth;
    ctx.beginPath();
    ctx.moveTo(canvas.width, oceanY - 20);          // Start above water line on right
    ctx.lineTo(canvas.width - shoreWidth, oceanY);  // Slope to water
    ctx.lineTo(canvas.width, oceanY);              // Back to right edge
    ctx.lineTo(canvas.width, canvas.height);       // Down to bottom right
    ctx.lineTo(canvas.width - shoreWidth, canvas.height); // To bottom left of shore
    ctx.closePath();
    ctx.fill();
    
    // Calculate bridge max length for progress tracking
    bridgeMaxLength = rightShoreX - leftShoreX;
});

// Run the renderer
Render.run(render);

// Create runner
runner = Runner.create();
Runner.run(runner, engine);

// Add mouse control
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false
        }
    }
});

Composite.add(world, mouseConstraint);
render.mouse = mouse;

// Create walls to keep stones inside the canvas
const wallOptions = { 
    isStatic: true,
    render: { 
        visible: false 
    }
};

// Calculate and set water level based on screen height
waterLevel = windowHeight * 0.75; // 75% from the top of the screen

// Set shore positions
leftShoreX = windowWidth * 0.08; // 8% from the left edge
rightShoreX = windowWidth * 0.92; // 8% from the right edge

// Create boundaries (walls and ceiling)
Composite.add(world, [
    // Left wall
    Bodies.rectangle(-50, gameAreaHeight / 2 + hudHeight, 100, gameAreaHeight + 100, wallOptions),
    // Right wall
    Bodies.rectangle(windowWidth + 50, gameAreaHeight / 2 + hudHeight, 100, gameAreaHeight + 100, wallOptions),
    // Ceiling (just below HUD, to prevent stones from going into HUD area)
    Bodies.rectangle(windowWidth / 2, hudHeight, windowWidth, 1, {
        isStatic: true,
        render: { fillStyle: 'transparent', visible: false }, // Invisible barrier
        label: 'ceiling',
        collisionFilter: { group: 0, category: 0x0001, mask: 0xFFFFFFFF }
    })
]);

// Calculate ocean position (30% from bottom of screen, but adjusted for HUD height)
waterLevel = hudHeight + (gameAreaHeight * (1 - oceanHeight));

// Calculate shore positions - adjusted for game area
leftShoreX = windowWidth * 0.08; // 8% of screen width
rightShoreX = windowWidth - leftShoreX;

// Add water sensor to detect objects entering water - make it much thicker to ensure detection
const waterSurface = Bodies.rectangle(
    windowWidth / 2, 
    waterLevel, 
    windowWidth - 2 * leftShoreX, // Width between shores
    40, // Thicker sensor area to ensure detection
    {
        isStatic: true,
        isSensor: true, // Allow objects to pass through but detect collisions
        render: { visible: false },
        label: 'water-surface'
    }
);

// Add a visible but non-collidable bottom barrier
const bottomBarrier = Bodies.rectangle(
    windowWidth / 2,
    windowHeight + 500, // Far below the screen
    windowWidth + 100,
    1000, // Very tall
    {
        isStatic: true,
        isSensor: false, // This one should block things
        render: { visible: false },
        label: 'bottom-barrier'
    }
);
// Add both water surface and bottom barrier to world
Composite.add(world, [waterSurface, bottomBarrier]);

// Function to create a stone with specified size, position, and velocity
function createStone(options = {}) {
    // Default options
    options = {
        size: 'large',  // large, medium, or small
        specialType: null, // hanuman, vanar, rama, or nal (or null for normal stone)
        position: { 
            x: Math.random() * (render.options.width * 0.8) + (render.options.width * 0.1), 
            y: hudHeight + 50 + (Math.random() * 50) // Start well below the HUD area
        },
        velocity: {
            x: (Math.random() - 0.5) * 0.5,
            y: (Math.random() - 0.5) * 0.2 // Very minimal vertical movement
        },
        angle: 0, // Initial angle
        angularVelocity: 0, // Initial spin
        ...options  // Overwrite defaults with provided options
    };
    
    // Make sure position is valid (safety check)
    if (options.position.y > waterLevel - 100) {
        options.position.y = hudHeight + 50; // Fallback to safe position if too close to water
    }
    
    const isBroken = options.isBroken || false; // New flag to track if stone has been broken
    
    // Determine size based on category
    const sizeRange = stoneSizes[options.size];
    const sizeValue = Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min;
    
    // Generate random color
    const colorIndex = Math.floor(Math.random() * stoneColors.length);
    
    // Get a random shape type and generate vertices
    const shapeType = options.shapeType || getRandomShapeType();
    let vertices = stoneShapes[shapeType](sizeValue);
    
    // Add some irregularity to make shapes more interesting
    // For small stones, add less irregularity to keep them recognizable
    const irregularityAmount = options.size === 'small' ? sizeValue * 0.1 : sizeValue * 0.15;
    vertices = addIrregularity(vertices, irregularityAmount);
    
    // Create the base stone body
    const body = Bodies.fromVertices(
        options.position.x,
        options.position.y,
        [vertices],
        {
            restitution: 0.4,
            friction: 0.01,
            frictionAir: 0.001,
            angle: Math.random() * Math.PI * 2,
            render: {
                fillStyle: stoneColors[colorIndex],
                strokeStyle: '#2c3e50',
                lineWidth: 2
            }
        }
    );
    
    // Add custom properties
    body.stoneCategory = options.size;
    body.shapeType = shapeType;
    body.isBroken = isBroken;
    body.inWater = false;
    body.originalColor = stoneColors[colorIndex];
    
    // Special floating physics for unbroken stones to give the proper Ram Setu stone floating effect
    if (!isBroken) {
        // Make unbroken stones float with very low friction
        body.frictionAir = 0.02;     // Higher air friction to give floating effect
        body.friction = 0.1;         // Lower surface friction
        body.restitution = 0.7;      // More bouncy
        body.timeScale = 0.7;        // Slow down physics for floating effect
        
        // Force that will periodically be applied to create gentle floating movement
        body.floatForce = {
            x: (Math.random() - 0.5) * 0.0001,
            y: (Math.random() - 0.5) * 0.0001
        };
    }
    body.isPartOfBridge = false;
    
    // Add special stone properties if provided
    if (options.specialType && specialStoneTypes[options.specialType]) {
        body.specialType = options.specialType;
        body.scoreMultiplier = specialStoneTypes[options.specialType].scoreMultiplier || 1;
        body.fragmentMultiplier = specialStoneTypes[options.specialType].fragmentMultiplier || 1;
        body.bridgeValueMultiplier = specialStoneTypes[options.specialType].bridgeValueMultiplier || 1;
        
        // Update the render properties for special stones
        body.render.fillStyle = specialStoneTypes[options.specialType].color;
        if (specialStoneTypes[options.specialType].glowEffect) {
            body.render.lineWidth = 2;
            body.render.strokeStyle = '#FFFF00';
        }
    }

    // Set initial velocity
    Body.setVelocity(body, options.velocity);
    
    // Override the vertices with our custom shape
    Body.setVertices(body, vertices);
    
    // Apply initial velocity and rotation if provided
    if (options.angle) {
        Body.setAngle(body, options.angle);
    }
    
    if (options.angularVelocity) {
        Body.setAngularVelocity(body, options.angularVelocity);
    }
    
    // Add some random forces for more natural movement
    if (!isBroken) {
        // Only apply random forces to floating stones (not broken ones)
        const forceMagnitude = 0.005 * body.mass;
        Body.applyForce(body, body.position, {
            x: (Math.random() - 0.5) * forceMagnitude,
            y: (Math.random() - 0.5) * forceMagnitude
        });
    }

    return body;
}

// Function to create stone particles when a stone breaks
function createStoneParticles(position, size, color) {
    const particles = [];
    const particleCount = Math.floor(size * 1.5); // More particles for larger stones
    
    // Create some small polygon fragments that look like broken pieces
    const fragmentCount = Math.min(5, Math.floor(size / 10));
    for (let i = 0; i < fragmentCount; i++) {
        // Create small irregular polygons as fragments
        const fragmentSize = Math.random() * (size * 0.3) + (size * 0.1);
        const vertexCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 vertices
        
        // Generate random vertices for the fragment
        const vertices = [];
        for (let j = 0; j < vertexCount; j++) {
            const angle = (Math.PI * 2 / vertexCount) * j;
            const radius = fragmentSize * (0.7 + Math.random() * 0.3);
            vertices.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        
        // Calculate position with some offset from the center
        const angleOffset = Math.random() * Math.PI * 2;
        const distance = size * 0.4 * Math.random();
        const fragmentX = position.x + Math.cos(angleOffset) * distance;
        const fragmentY = position.y + Math.sin(angleOffset) * distance;
        
        // Create the fragment body as a simple polygon instead of fromVertices for better compatibility
        const fragment = Bodies.polygon(fragmentX, fragmentY, vertexCount, fragmentSize / 2, {
            render: {
                fillStyle: color,
                strokeStyle: '#2c3e50',
                lineWidth: 1
            },
            restitution: 0.6,
            friction: 0.05,
            frictionAir: 0.02,
            lifespan: 100
        });
        
        // Apply explosion force
        const forceMagnitude = 0.02 * fragment.mass;
        Body.applyForce(fragment, fragment.position, {
            x: Math.cos(angleOffset) * forceMagnitude,
            y: Math.sin(angleOffset) * forceMagnitude
        });
        
        particles.push(fragment);
    }
    
    // Add dust/small particle effects
    const dustCount = Math.floor(size * 1.2);
    for (let i = 0; i < dustCount; i++) {
        // Varied particle sizes for more natural effects
        const particleRadius = Math.random() * 3 + 1.5;
        const particleColorIndex = Math.floor(Math.random() * particleColors.length);
        
        // Create particles with slightly varied positions
        const angleOffset = (Math.PI * 2) * (i / dustCount);
        const distanceFromCenter = Math.random() * (size * 0.8);
        
        const particle = Bodies.circle(
            position.x + Math.cos(angleOffset) * distanceFromCenter,
            position.y + Math.sin(angleOffset) * distanceFromCenter,
            particleRadius,
            {
                restitution: 0.8,
                friction: 0.001,
                frictionAir: 0.03,
                lifespan: 100, // Slightly shorter lifetime for dust
                render: {
                    fillStyle: i % 5 === 0 ? color : particleColors[particleColorIndex], // Some particles keep original stone color
                    opacity: Math.random() * 0.6 + 0.4, // Varied opacity
                    lineWidth: 0.5,
                    strokeStyle: '#ffffff'
                }
            }
        );
        
        // Add explosion force with varied strength
        const forceMagnitude = (0.01 + Math.random() * 0.01) * particle.mass;
        const angle = angleOffset + (Math.random() - 0.5) * 0.8; // Add some randomness to the angle
        Body.applyForce(particle, particle.position, {
            x: Math.cos(angle) * forceMagnitude,
            y: Math.sin(angle) * forceMagnitude
        });
        
        particles.push(particle);
    }
    
    return particles;
}

// Function to break a stone into smaller stones
function breakStone(stone) {
    // Don't break stones that are already broken or part of the bridge
    if (stone.isBroken || stone.isPartOfBridge) return;
    
    // Track when this stone was broken for pacing
    const now = Date.now();
    lastStoneBreakTime = now;
    
    // Mark as broken
    stone.isBroken = true;
    
    // Apply physics changes for broken stones
    stone.timeScale = 1.0; // Return to normal physics time scale
    stone.frictionAir = 0.001; // Lower air friction for falling
    stone.friction = 0.8; // Higher surface friction for stability in bridge
    stone.restitution = 0.3; // Less bouncy when broken
    
    const position = stone.position;
    const color = stone.render.fillStyle;
    const category = stone.stoneCategory;
    const shapeType = stone.shapeType;
    
    // Estimate the stone size from its bounds for particle effects
    const bounds = stone.bounds;
    const stoneSize = Math.max(
        bounds.max.x - bounds.min.x,
        bounds.max.y - bounds.min.y
    );
    
    // Check for critical break from upgrade system
    let isCriticalBreak = false;
    if (upgradeSystem) {
        isCriticalBreak = upgradeSystem.checkCriticalBreak();
        
        // Visual effect for critical break
        if (isCriticalBreak) {
            createCriticalEffect(position);
        }
    }
    
    // Create particles for visual effect
    const particles = createStoneParticles(position, stoneSize / 2, color);
    Composite.add(world, particles);
    
    // Play break sound with variation based on stone size
    if (window.audioManager) {
        let pitch = 0.8;
        if (category === 'small') pitch += 0.4;
        else if (category === 'medium') pitch += 0.2;
        
        if (stone.specialType === 'hanuman') {
            window.audioManager.playSound('breakHanuman');
        } else if (stone.specialType === 'rama') {
            window.audioManager.playSound('breakRama');
        } else {
            window.audioManager.playSound('stoneBreak', 1.0, pitch);
        }
    }
    
    // Add shards (upgrade currency) when stone is broken
    if (upgradeSystem) {
        let shardAmount = 0;
        if (category === 'large') {
            shardAmount = 3;
        } else if (category === 'medium') {
            shardAmount = 2;
        } else {
            shardAmount = 1;
        }
        
        // Bonus shards for special stones
        if (stone.specialType) {
            shardAmount *= 2;
        }
        
        // If critical break, double shards
        if (isCriticalBreak) {
            shardAmount *= 2;
        }
        
        const actualShards = upgradeSystem.addCurrency(shardAmount);
        
        // Show shard gain notification if it wasn't an auto-break
        if (!stone.autoBreak) {
            showNotification(
                position.x, 
                position.y - 30, 
                `+${actualShards} 💎`, 
                isCriticalBreak ? 'critical' : 'shard'
            );
        }
    }
    
    // Create smaller stones based on the current stone's category
    if (category === 'large') {
        // Large stone breaks into 3 medium stones
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const velocity = {
                x: Math.cos(angle) * 2,
                y: 5 // Strong downward velocity to make it fall quickly
            };
            
            const newStone = createStone({
                size: 'medium',
                shapeType: shapeType,
                position: {
                    x: position.x + Math.cos(angle) * (stoneSize / 4),
                    y: position.y + Math.sin(angle) * (stoneSize / 4)
                },
                velocity: velocity,
                isBroken: true // Mark as broken so it falls
            });
            
            Composite.add(world, newStone);
        }
    } else if (category === 'medium') {
        // Medium stone breaks into 2 small stones
        for (let i = 0; i < 2; i++) {
            const angle = (Math.PI * i);
            const velocity = {
                x: Math.cos(angle) * 1.5,
                y: 5 // Strong downward velocity to make it fall quickly
            };
            
            const newStone = createStone({
                size: 'small',
                shapeType: shapeType,
                position: {
                    x: position.x + Math.cos(angle) * (stoneSize / 4),
                    y: position.y + Math.sin(angle) * (stoneSize / 4)
                },
                velocity: velocity,
                isBroken: true // Mark as broken so it falls
            });
            
            Composite.add(world, newStone);
        }
    }
    
    // Remove the original stone
    Composite.remove(world, stone);
    
    // Increase score based on stone size
    let pointValue = 0;
    if (category === 'large') pointValue = 10;
    else if (category === 'medium') pointValue = 20;
    else if (category === 'small') pointValue = 30; // Bonus for breaking the smallest stones
    
    // Apply special stone score multiplier
    if (stone.specialType && specialStoneTypes[stone.specialType].scoreMultiplier) {
        pointValue *= specialStoneTypes[stone.specialType].scoreMultiplier;
    }
    
    // Apply critical break multiplier (2x points)
    if (isCriticalBreak) {
        pointValue *= 2;
    }
    
    // Update score
    updateScore(pointValue);
    
    // Show score notification for manual clicks (not auto-breaks)
    if (!stone.autoBreak && gameRunning) {
        showNotification(
            position.x, 
            position.y - 15, 
            `+${pointValue}`, 
            isCriticalBreak ? 'critical' : ''
        );
    }
}

// Update the bridge completion percentage
function updateBridgeCompletion() {
    const totalWidth = rightShoreX - leftShoreX;
    let coveredPositions = new Set();
    
    // Get all bridge bodies
    const bridgeBodies = Composite.allBodies(world).filter(body => body.isPartOfBridge);
    
    // For each body, mark its position as covered
    bridgeBodies.forEach(body => {
        const position = Math.floor((body.position.x - leftShoreX) / 10) * 10;
        coveredPositions.add(position);
    });
    
    // Calculate progress
    const bridgeWidth = coveredPositions.size * 10; // Each position covers roughly 10px
    const completionPercentage = Math.min(100, Math.floor((bridgeWidth / totalWidth) * 100));
    
    // Update the progress display
    const previousProgress = bridgeProgress;
    updateBridgeProgress(completionPercentage);
    
    // Play sound if progress increased
    if (completionPercentage > previousProgress && window.audioManager) {
        audioManager.play('bridgeProgress');
    }
    
    // Check if bridge is complete
    if (completionPercentage >= 90) {
        console.log('Bridge almost complete!');
        
        // Check if it's fully connected
        const leftmostStone = Math.min(...Array.from(coveredPositions));
        const rightmostStone = Math.max(...Array.from(coveredPositions));
        
        if (rightmostStone - leftmostStone > totalWidth * 0.8) {
            console.log('BRIDGE COMPLETE! Ram Setu is built!');
            
            // Show victory screen
            if (window.showVictory) {
                window.showVictory(score);
            }
        }
    }
}

// Function to handle collisions (especially with water)
function handleCollisions(event) {
    const pairs = event.pairs;
    
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];

        // Check for stone hitting water surface
        if (pair.bodyA.label === 'water-surface' || pair.bodyB.label === 'water-surface') {
            const stone = pair.bodyA.label === 'water-surface' ? pair.bodyB : pair.bodyA;

            // Ignore if it's not a stone or already in water
            if (stone.isStatic || stone.hasOwnProperty('lifespan') || stone.inWater) continue;

            // Play splash sound if available
            if (window.audioManager) {
                audioManager.play('splash');
            }

            // Stone has hit water - let's make it float
            // Slow it down for more realistic water entry
            Body.setVelocity(stone, { x: stone.velocity.x * 0.7, y: stone.velocity.y * 0.3 });

            // Mark as in water
            stone.inWater = true;

            // Reduce density for buoyancy (makes it float better)
            stone.density = stone.density * 0.4; // Make it more buoyant than before

            // Apply a small upward impulse to help initial floating
            Body.applyForce(stone, stone.position, { x: 0, y: -0.05 });

            // Change appearance when wet
            if (stone.render && stone.render.fillStyle) {
                const originalColor = stone.originalColor || stone.render.fillStyle;

                // Store original color if not already stored
                if (!stone.originalColor) {
                    stone.originalColor = originalColor;
                }

                // Darken the color for wet appearance
                const wetColor = darkenColor(originalColor, 20);
                stone.render.fillStyle = wetColor;
            }

            // Apply immediate upward force to make stone float initially
            Body.setVelocity(stone, { x: stone.velocity.x * 0.5, y: -1 });
            
            // Reduce density more for better floating effect
            Body.setDensity(stone, stone.density * 0.3);

            // Apply improved buoyancy force - depends on how deep it is
            Events.on(engine, 'beforeUpdate', function buoyancy() {
                if (!stone || !stone.inWater || stone.isPartOfBridge) {
                    // Remove this listener if stone is no longer in water or is part of bridge
                    Events.off(engine, 'beforeUpdate', buoyancy);
                    return;
                }

                // If stone is below the viewport, push it back up
                if (stone.position.y > windowHeight + 50) {
                    Body.setPosition(stone, { x: stone.position.x, y: waterLevel + 10 });
                    Body.setVelocity(stone, { x: stone.velocity.x, y: -2 });
                }
                
                // Force stone to stay near water level for better visibility
                const targetY = waterLevel + 10; // Target position slightly below water surface
                const forceStrength = 0.05;
                
                // Apply force towards target position
                const distanceFromTarget = stone.position.y - targetY;
                const correctionForce = distanceFromTarget * forceStrength;
                
                Body.applyForce(stone, stone.position, { 
                    x: 0, 
                    y: -correctionForce // Negative to push upward when too deep
                });

                // Add some damping to simulate water resistance, but allow some horizontal movement
                Body.setVelocity(stone, {
                    x: stone.velocity.x * 0.98,
                    y: stone.velocity.y * 0.95
                });

                // Add gentle rocking motion to simulate waves
                const rockAngle = Math.sin(Date.now() * 0.002 + stone.id) * 0.001;
                Body.setAngularVelocity(stone, rockAngle);
            });

            // Check if it should join the bridge after a small delay
            if (stone.position.y >= waterLevel) {
                setTimeout(() => checkJoinBridge(stone), 500);
            }
        }

        // Check for collisions between stones in water for potential joining
        if (!pair.bodyA.isStatic && !pair.bodyB.isStatic && 
            pair.bodyA.inWater && pair.bodyB.inWater && 
            !pair.bodyA.isPartOfBridge && !pair.bodyB.isPartOfBridge) {
            
            // Make both part of the bridge
            joinStonesToBridge(pair.bodyA, pair.bodyB);
        }
    }
}

// Function to check if a stone can join the bridge
function checkJoinBridge(stone) {
    // Safety check - if stone no longer exists or is already part of bridge, skip
    if (!stone || !stone.position || stone.isPartOfBridge) return;
    
    // Force stones to remain visible in water area
    if (stone.position.y > windowHeight || stone.position.y < 0 || 
        stone.position.x < 0 || stone.position.x > windowWidth) {
        
        // Stone is off-screen, reposition it in visible water area
        Body.setPosition(stone, { 
            x: Math.max(leftShoreX + 100, Math.min(rightShoreX - 100, stone.position.x)),
            y: waterLevel + 20
        });
        Body.setVelocity(stone, { x: 0, y: 0 });
    }
    
    // Only stones close to water level can join
    if (Math.abs(stone.position.y - waterLevel) > 50) return;
    
    // Check if stone is in shallow water area near shores
    // Near left shore
    if (stone.position.x < leftShoreX + 80) {
        addStoneToShallowWater(stone);
        return;
    }
    
    // Near right shore
    if (stone.position.x > rightShoreX - 80) {
        addStoneToShallowWater(stone);
        return;
    }
    
    // Check if near other bridge stones
    for (let i = 0; i < bridgeParts.length; i++) {
        const bridgeStone = bridgeParts[i];
        // Skip if the bridge stone no longer exists
        if (!bridgeStone || !bridgeStone.position) continue;
        
        const dist = Math.sqrt(
            Math.pow(stone.position.x - bridgeStone.position.x, 2) + 
            Math.pow(stone.position.y - bridgeStone.position.y, 2)
        );
        
        if (dist < 50) { // Close enough to join
            joinStonesToBridge(stone, bridgeStone);
            return;
        }
    }
}

// Handle adding stones to the bridge
function addStoneToShallowWater(stone) {
    if (stone.position.y < waterLevel || stone.isPartOfBridge) return false;

    // Check if it's in shallow water zone (near the shores)
    const distanceFromLeft = Math.abs(stone.position.x - leftShoreX);
    const distanceFromRight = Math.abs(stone.position.x - rightShoreX);
    const shallowWaterZone = 40; // pixels from each shore

    if (distanceFromLeft < shallowWaterZone || distanceFromRight < shallowWaterZone) {
        console.log(`Stone entering shallow water zone!`);
        
        // Make it part of the bridge
        stone.isPartOfBridge = true;
        stone.isStatic = true; // Fix it in place
        
        // Add to our tracking set
        joinedStoneBodies.add(stone.id);
        
        // Play splash sound when stone joins the bridge
        if (window.audioManager) {
            audioManager.play('splash');
        }
        
        // Update bridge completion
        updateBridgeCompletion();
    }
}

// Function to join stones to the bridge
function joinStonesToBridge(stoneA, stoneB) {
    // We'll take a different approach to eliminate shaking
    // Instead of constraints, we'll create a compound body
    // by replacing both stones with a new combined stone
    
    // Get positions and properties
    const posA = stoneA.position;
    const posB = stoneB.position;
    const colorA = stoneA.render.fillStyle;
    const colorB = stoneB.render.fillStyle;
    
    // Calculate midpoint between stones
    const midX = (posA.x + posB.x) / 2;
    const midY = (posA.y + posB.y) / 2;
    
    // Create a visual connection line (non-physical)
    const connection = Bodies.rectangle(
        midX, 
        midY,
        Math.sqrt(Math.pow(posB.x - posA.x, 2) + Math.pow(posB.y - posA.y, 2)),
        5, // thickness
        {
            angle: Math.atan2(posB.y - posA.y, posB.x - posA.x),
            isStatic: true,
            isSensor: true,
            render: {
                fillStyle: '#F9E79F',
                strokeStyle: '#F9E79F',
                lineWidth: 1
            },
            label: 'bridge-connection'
        }
    );
    
    // Add both stones to the joined set if not already
    if (!stoneA.isPartOfBridge) {
        makeStonePartOfBridge(stoneA);
    }
    
    if (!stoneB.isPartOfBridge) {
        makeStonePartOfBridge(stoneB);
    }
    
    // Look for existing connection between these stones
    const existingConnection = Composite.allBodies(world).some(body => {
        return body.label === 'bridge-connection' &&
               body.stoneA === stoneA.id && body.stoneB === stoneB.id;
    });
    
    if (!existingConnection) {
        // Store references to linked stones
        connection.stoneA = stoneA.id;
        connection.stoneB = stoneB.id;
        
        // Add the visual connection to the world
        Composite.add(world, connection);
        
        console.log('Created static bridge connection between stones');
    }
    
    // Calculate bridge progress
    updateBridgeCompletion();
}

// Make a stone part of the bridge
function makeStonePartOfBridge(stone) {
    if (!stone.isPartOfBridge) {
        stone.isPartOfBridge = true;
        joinedStoneBodies.add(stone.id);
        
        // Make the stone nearly static to prevent all movement
        stone.isStatic = true;
        
        // Reset position to be exactly at water level
        Body.setPosition(stone, {
            x: stone.position.x,
            y: waterLevel + 10
        });
        
        // Reset to horizontal angle
        Body.setAngle(stone, 0);
        
        // Give a slight golden highlight to indicate it's part of the bridge
        stone.render.strokeStyle = '#F9E79F';
        stone.render.lineWidth = 3;
        
        // Update the stored bridge parts
        bridgeParts.push({
            id: stone.id,
            x: stone.position.x,
            size: stone.stoneCategory
        });
        
        console.log(`Stone added to bridge. Bridge now has ${bridgeParts.length} parts.`);
    }
}

// Update the bridge completion percentage
function updateBridgeCompletion() {
    const totalWidth = rightShoreX - leftShoreX;
    let coveredPositions = new Set();
    
    // Get all bridge bodies
    const bridgeBodies = Composite.allBodies(world).filter(body => body.isPartOfBridge);
    
    // For each body, mark its position as covered
    bridgeBodies.forEach(body => {
        const position = Math.floor((body.position.x - leftShoreX) / 10) * 10;
        coveredPositions.add(position);
    });
    
    // Calculate progress
    const bridgeWidth = coveredPositions.size * 10; // Each position covers roughly 10px
    const completionPercentage = Math.min(100, Math.floor((bridgeWidth / totalWidth) * 100));
    
    // Update the progress display
    const previousProgress = bridgeProgress;
    updateBridgeProgress(completionPercentage);
    
    // Play sound if progress increased
    if (completionPercentage > previousProgress && window.audioManager) {
        audioManager.play('bridgeProgress');
    }
    
    // Check if bridge is complete
    if (completionPercentage >= 90) {
        console.log('Bridge almost complete!');
        
        // Check if it's fully connected
        const leftmostStone = Math.min(...Array.from(coveredPositions));
        const rightmostStone = Math.max(...Array.from(coveredPositions));
        
        if (rightmostStone - leftmostStone > totalWidth * 0.8) {
            console.log('BRIDGE COMPLETE! Ram Setu is built!');
            
            // Show victory screen
            if (window.showVictory) {
                window.showVictory(score);
            }
        }
    }
}

// Update the bridge progress display
function updateBridgeProgress(percentage) {
    document.getElementById('bridge-completion').textContent = `${percentage}%`;
    bridgeProgress = percentage;
}

// Handle keyboard controls for shifting the bridge
function handleKeyDown(event) {
    // Get all bodies that are part of the bridge
    const bridgeBodies = Composite.allBodies(world).filter(body => body.isPartOfBridge);
    
    if (bridgeBodies.length === 0) return;
    
    let shiftX = 0;
    
    // A/Left Arrow = shift left, D/Right Arrow = shift right
    if (event.key === 'a' || event.key === 'ArrowLeft') {
        shiftX = -5;  // Larger movement for static bodies
    } else if (event.key === 'd' || event.key === 'ArrowRight') {
        shiftX = 5;   // Larger movement for static bodies
    } else {
        return; // Not a movement key
    }
    
    // Since stones are now static, we directly change their position instead of applying force
    bridgeBodies.forEach(body => {
        Body.setPosition(body, {
            x: body.position.x + shiftX,
            y: body.position.y
        });
    });
    
    // Also move all bridge connections
    const connections = Composite.allBodies(world).filter(body => body.label === 'bridge-connection');
    connections.forEach(connection => {
        Body.setPosition(connection, {
            x: connection.position.x + shiftX,
            y: connection.position.y
        });
    });
    
    // Update bridge completion after moving
    updateBridgeCompletion();
}

// ======================================================
// Game Engine Control Functions (for UI integration)
// ======================================================

// Start the game engine
function startGameEngine() {
    if (!gameInitialized) {
        // Initialize game on first start
        initGame();
        gameInitialized = true;
    }
    
    // Start the runner if it's not already running
    if (!gameRunning) {
        Runner.run(runner, engine);
        gameRunning = true;
        
        // Start periodic stone generation
        startStoneGeneration();
    }
}

// Pause the game engine
function pauseGameEngine() {
    if (gameRunning) {
        Runner.stop(runner);
        gameRunning = false;
    }
}

// Resume the game engine
function resumeGameEngine() {
    if (!gameRunning && gameInitialized) {
        Runner.run(runner, engine);
        gameRunning = true;
    }
}

// Restart the game engine
function restartGameEngine() {
    // Reset game state
    score = 0;
    bridgeProgress = 0;
    bridgeParts = [];
    joinedStoneBodies = new Set();
    
    // Clean up boulder system if it exists
    if (boulderSystem) {
        boulderSystem.cleanup();
    }
    
    // Clear all bodies except walls
    const bodies = Composite.allBodies(world);
    bodies.forEach(body => {
        if (!body.isStatic || body.label === 'bridge-connection') {
            Composite.remove(world, body);
        }
    });
    
    // Reinitialize game
    initGame();
    
    // Update UI
    if (window.updateScoreUI) {
        window.updateScoreUI(score);
    }
    
    if (window.updateBridgeProgressUI) {
        window.updateBridgeProgressUI(bridgeProgress);
    }
    
    // Start the runner if it's not already running
    if (!gameRunning) {
        Runner.run(runner, engine);
        gameRunning = true;
        
        // Restart periodic stone generation
        startStoneGeneration();
    }
}

// Enhanced stone generation with audioManager integration
let stoneGenerationInterval = null;

function startStoneGeneration() {
    // Clear any existing interval first
    if (stoneGenerationInterval) {
        clearInterval(stoneGenerationInterval);
    }
    
    // Track game progression to increase challenge and interest
    let progressionPhase = 0;
    let spawnRate = 3000; // Starting spawn rate in ms
    let maxFloatingStones = 8; // Initial max floating stones
    
    // Enhanced stone generation with varying patterns
    stoneGenerationInterval = setInterval(() => {
        // Count actual floating stones (not particles, not broken stones)
        const floatingStoneCount = Composite.allBodies(world).filter(body => {
            return !body.isStatic && !body.hasOwnProperty('lifespan') && !body.isBroken;
        }).length;
        
        // Update spawn button highlighting based on stone count
        updateSpawnButtonHighlight(floatingStoneCount, maxFloatingStones);
        
        // Check game progression to adapt difficulty
        if (bridgeProgress > 30 && progressionPhase === 0) {
            progressionPhase = 1;
            spawnRate = 2500; // Faster spawns
            maxFloatingStones = 10; // More simultaneous stones
            // Update the interval
            clearInterval(stoneGenerationInterval);
            startStoneGeneration();
            return;
        } else if (bridgeProgress > 60 && progressionPhase === 1) {
            progressionPhase = 2;
            spawnRate = 2000; // Even faster
            maxFloatingStones = 12; // Even more stones
            // Update the interval
            clearInterval(stoneGenerationInterval);
            startStoneGeneration();
            return;
        }
        
        if (floatingStoneCount < maxFloatingStones && bridgeProgress < 95) {
            // Determine if we should spawn a boulder instead of a regular stone
            // Chance increases with progression phase - much higher chances now
            const boulderChance = 0.15 + (progressionPhase * 0.1); // 15%, 25%, or 35% chance
            const spawnBoulder = boulderSystem && Math.random() < boulderChance;
            
            // Create spawn position with more variation
            const canvasWidth = render.options.width;
            const randomX = Math.random() * (canvasWidth * 0.8) + (canvasWidth * 0.1);
            const randomY = hudHeight + 50 + (Math.random() * 100); // Random height within the game area
            
            if (spawnBoulder) {
                // Create a boulder (requires multiple hits)
                console.log('Spawning boulder with new system...');
                try {
                    // Increase chances of special boulder types in later phases
                    let boulderType = null;
                    if (progressionPhase >= 2 && Math.random() < 0.4) {
                        boulderType = 'celestial'; // More divine boulders in late game
                    } else if (progressionPhase >= 1 && Math.random() < 0.3) {
                        boulderType = 'ravana'; // More ravana boulders in mid game
                    }
                    
                    const boulder = boulderSystem.createBoulder({
                        position: { x: randomX, y: randomY },
                        boulderType: boulderType
                    });
                    
                    // Safety check that a boulder was created
                    if (boulder) {
                        // Add the boulder to the world
                        Composite.add(world, boulder);
                        
                        // Play boulder appearance sound if audio manager exists
                        if (window.audioManager) {
                            window.audioManager.playSound('stoneAppear', 0.9, 0.7);
                        }
                        
                        console.log('Boulder spawned successfully');
                    } else {
                        console.warn('Boulder creation returned null');
                    }
                } catch (error) {
                    console.error('Error spawning boulder:', error);
                }
            } else {
                // Determine if we should spawn a special stone
                const rand = Math.random();
                let specialType = null;
                
                // Weighted selection of special stones based on their spawn chance
                let cumulativeChance = 0;
                for (const [type, props] of Object.entries(specialStoneTypes)) {
                    cumulativeChance += props.spawnChance;
                    if (rand < cumulativeChance) {
                        specialType = type;
                        break;
                    }
                }
                
                // Determine stone size with progression-based weighting
                let sizes = ['large', 'medium'];
                if (progressionPhase >= 1) {
                    // Add some small stones in later phases
                    sizes.push('medium', 'small');
                }
                if (progressionPhase >= 2) {
                    // Add even more variety in the final phase
                    sizes.push('small', 'small');
                }
                
                const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
                
                // Create the stone with special properties if applicable
                Composite.add(world, createStone({ 
                    size: randomSize,
                    specialType: specialType,
                    position: { x: spawnX, y: spawnY},
                    // Add a bit of initial rotation for more dynamic movement
                angle: Math.random() * Math.PI * 2,
                // Occasionally add some angular velocity for spinning stones
                angularVelocity: (Math.random() > 0.7) ? (Math.random() - 0.5) * 0.05 : 0
            }));
            
            // Special wave spawn pattern (every 5th spawn, create a wave of stones)
            if (stoneSpawnCount % 5 === 0 && progressionPhase >= 1) {
                // Spawn a row of 3-5 smaller stones in a pattern
                const numExtraStones = 2 + Math.floor(Math.random() * 3);
                const patternType = Math.floor(Math.random() * 3); // 0: horizontal, 1: arc, 2: v-shape
                
                setTimeout(() => {
                    for (let i = 0; i < numExtraStones; i++) {
                        let posX;
                        if (patternType === 0) { // Horizontal line
                            posX = canvasWidth * (0.3 + (i * 0.1));
                        } else if (patternType === 1) { // Arc pattern
                            const angle = (Math.PI / (numExtraStones + 1)) * (i + 1);
                            posX = (canvasWidth / 2) + (Math.sin(angle) * (canvasWidth / 4));
                        } else { // V-shape
                            const offset = (i - (numExtraStones / 2)) * (canvasWidth / 20);
                            posX = (canvasWidth / 2) + offset;
                        }
                        
                        Composite.add(world, createStone({
                            size: 'small',
                            position: { x: posX, y: -30 - (i * 20) }
                        }));
                    }
                }, 500); // Slight delay for the pattern
            }
            }
            
            stoneSpawnCount++;
        }
    }, spawnRate);
}

// Track how many stones we've spawned for pattern generation
let stoneSpawnCount = 0;

// Initialize game with stones scaled to screen size
function initGame() {
    // Initialize the upgrade system if it doesn't exist yet
    if (!upgradeSystem) {
        // Set up global access to needed functions for idle mechanics
        window.breakStone = breakStone;
        window.updateScore = updateScore;
        window.world = world;
        
        upgradeSystem = new UpgradeSystem({
            updateScore: updateScore,
            breakStone: breakStone,
            world: world,
            gameRunning: gameRunning
        });
        window.upgradeSystem = upgradeSystem;
    }
    
    // Initialize the boulder system if it doesn't exist yet
    if (!boulderSystem) {
        // Make key game objects available globally for boulder system
        window.world = world;
        window.updateScore = updateScore;
        window.createStone = createStone;
        window.showNotification = showNotification;
        
        // Create boulder system with direct access to needed objects
        boulderSystem = new BoulderSystem();
        window.boulderSystem = boulderSystem;
        
        console.log('Multi-hit boulder system initialized');
    }
    
    // Make utility functions available globally
    window.showNotification = showNotification;
    
    // Scale number of stones based on screen size
    const screenArea = windowWidth * windowHeight;
    const baseArea = 800 * 600;
    const scaleFactor = Math.min(3, Math.max(1, screenArea / baseArea));
    
    // Start with larger stones
    const largeStoneCount = Math.floor(8 * scaleFactor);
    for (let i = 0; i < largeStoneCount; i++) {
        Composite.add(world, createStone({ size: 'large' }));
    }
    
    // Add medium ones too
    const mediumStoneCount = Math.floor(5 * scaleFactor);
    for (let i = 0; i < mediumStoneCount; i++) {
        Composite.add(world, createStone({ size: 'medium' }));
    }
    
    // Initialize bridge progress display
    updateBridgeProgress(0);
    
    // Add water physics collision detection
    Events.on(engine, 'collisionStart', handleCollisions);
    
    // Add keyboard controls for moving the bridge
    document.addEventListener('keydown', handleKeyDown);
    
    // Add mouse click event listener for stone breaking
    setupMouseClickHandler();
    
    console.log('Ram Setu Bridge Builder initialized with ' + largeStoneCount + ' large blocks and ' + mediumStoneCount + ' medium blocks');
}

// Debug function to check if a body was clicked
function logBodyDetails(body) {
    console.log('Clicked on body:', {
        id: body.id,
        isStatic: body.isStatic,
        stoneCategory: body.stoneCategory,
        hasLifespan: body.hasOwnProperty('lifespan'),
        bounds: body.bounds,
        position: body.position
    });
}

// Add event listener for mouse clicks on stones
function setupMouseClickHandler() {
    // Add mouse constraint to world if not already added
    if (!Composite.allConstraints(world).includes(mouseConstraint)) {
        Composite.add(world, mouseConstraint);
    }
    
    // Get click power for use with boulders or stones
    const getClickPower = () => upgradeSystem ? upgradeSystem.clickPower : 1;
    
    // Track if we clicked a stone/boulder in this click event
    let clickHandled = false;
    
    // Set up click handler
    Events.on(mouseConstraint, 'mousedown', (event) => {
        const mousePosition = event.mouse.position;
        
        // First try exact point detection
        let clickedBodies = Matter.Query.point(Composite.allBodies(world), mousePosition);
        
        // If no bodies found, try with a radius check (15px radius around click)
        if (clickedBodies.length === 0) {
            // Get all bodies in the world that aren't static walls and particles
            const allBodies = Composite.allBodies(world).filter(body => 
                !body.isStatic && !body.hasOwnProperty('lifespan')
            );
            
            // Check distance from click to each body's position
            const clickRadius = 15; // Radius to check around click (in pixels)
            
            clickedBodies = allBodies.filter(body => {
                // Check if click is within body bounds first (fast check)
                const bounds = body.bounds;
                if (mousePosition.x < bounds.min.x - clickRadius || 
                    mousePosition.x > bounds.max.x + clickRadius || 
                    mousePosition.y < bounds.min.y - clickRadius || 
                    mousePosition.y > bounds.max.y + clickRadius) {
                    return false;
                }
                
                // For bodies that pass the bounds check, do a more detailed check
                // Calculate distance from click to body center
                const dx = mousePosition.x - body.position.x;
                const dy = mousePosition.y - body.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Estimate body radius from bounds
                const bodySize = Math.max(
                    (bounds.max.x - bounds.min.x) / 2,
                    (bounds.max.y - bounds.min.y) / 2
                );
                
                return distance < bodySize + clickRadius;
            });
        }
        
        console.log('Mouse clicked at', mousePosition);
        console.log('Found ' + clickedBodies.length + ' bodies near click position');
        
        // Sort by distance to click if multiple bodies found, so we break the closest one
        if (clickedBodies.length > 1) {
            clickedBodies.sort((a, b) => {
                const distA = Matter.Vector.magnitude(Matter.Vector.sub(a.position, mousePosition));
                const distB = Matter.Vector.magnitude(Matter.Vector.sub(b.position, mousePosition));
                return distA - distB;
            });
        }
        
        // First try exact point detection
        const queryBodies = Query.point(Composite.allBodies(world), mousePosition);
        let processed = false;
        
        // Check if we clicked on a boulder first
        for (let body of queryBodies) {
            if (body.isBoulder && boulderSystem && !processed) {
                console.log('Boulder clicked');
                // Hit boulder with current click power
                const boulderBroken = boulderSystem.hitBoulder(body, getClickPower());
                processed = true;
                break;
            }
        }
        
        // Handle stone breaking or bridge part movement based on what was clicked
        if (queryBodies.length > 0) {
            // Sort from top to bottom (visually) to handle overlapping stones naturally
            queryBodies.sort((a, b) => a.position.y - b.position.y);
            
            for (const body of queryBodies) {
                if (processed) break;
                
                // Case 1: Boulder that needs multiple hits
                if (body.isBoulder && boulderSystem) {
                    // Apply damage to boulder based on click power
                    const boulderBroken = boulderSystem.hitBoulder(body, getClickPower());
                    processed = true;
                    
                    // If boulder fully broken, additional stone breaks from click power are handled in the boulder system
                    if (boulderBroken) break;
                }
                // Case 2: Breakable stone that's not part of the bridge
                else if (!body.isStatic && body.breakable !== false && !body.isPartOfBridge && !body.isBroken) {
                    // Apply click power to break multiple stones at once
                    const clickPower = getClickPower();
                    
                    // Break the directly clicked stone
                    breakStone(body);
                    
                    // Use remaining click power to break random stones (if clickPower > 1)
                    if (clickPower > 1) {
                        const breakableStones = Composite.allBodies(world).filter(b => 
                            !b.isStatic && !b.isBroken && !b.isPartOfBridge && 
                            b.breakable !== false && !b.isBoulder && b !== body
                        );
                        
                        // Break additional random stones based on remaining click power
                        for (let i = 1; i < clickPower && breakableStones.length > 0; i++) {
                            const randomIndex = Math.floor(Math.random() * breakableStones.length);
                            const randomStone = breakableStones[randomIndex];
                            
                            // Mark as auto-break to differentiate from manual breaks
                            randomStone.autoBreak = true;
                            
                            // Break with slight delay for visual effect
                            setTimeout(() => {
                                breakStone(randomStone);
                                // Unmark auto-break flag after processing
                                delete randomStone.autoBreak;
                            }, 100 * i);
                            
                            // Remove from array to prevent breaking the same stone twice
                            breakableStones.splice(randomIndex, 1);
                        }
                    }
                    
                    processed = true;
                }
                
                // Play sound effect
                if (window.audioManager) {
                    audioManager.play('stoneBreak');
                }
                
                // Break the stone into smaller ones
                breakStone(body);
                
                // Add a new stone occasionally
                if (Math.random() < 0.3) { // 30% chance of new stone
                    setTimeout(() => {
                        const stoneTypes = ['large', 'medium'];
                        const randomType = stoneTypes[Math.floor(Math.random() * stoneTypes.length)];
                        
                        Composite.add(world, createStone({ size: randomType }));
                    }, 2000);
                }
                
                processed = true;
            }
        }
    });
}

// Update functions to connect with UI
function updateBridgeProgress(percentage) {
    bridgeProgress = percentage;
    
    // Update UI through the UI manager
    if (window.updateBridgeProgressUI) {
        window.updateBridgeProgressUI(percentage);
    }
}

// Enhanced version that also plays sound effects
function updateScore(points) {
    score += points;
    
    // Update UI through the UI manager
    if (window.updateScoreUI) {
        window.updateScoreUI(score);
    }
}

// Create a custom render event to draw the ocean with Ramayana theme
Events.on(render, 'afterRender', function() {
    const ctx = render.context;
    const canvas = render.canvas;
    const currentTime = Date.now();
    
    // Calculate ocean position (30% from bottom of screen)
    oceanY = waterLevel;
    
    // Draw sacred water with rippling patterns
    SanatanOrnaments.drawSacredWater(ctx, 0, oceanY, canvas.width, canvas.height - oceanY, currentTime);
    
    // Create wavy pattern with more pronounced waves (Ram Setu theme)
    ctx.beginPath();
    ctx.moveTo(0, oceanY);
    
    for (let x = 0; x < canvas.width; x += 10) {
        const waveFactor = (Math.sin(x/300) + 1) * 0.5; // Creates varying wave sizes
        const y = oceanY + Math.sin((x * waveFrequency) + waveOffset) * (waveAmplitude + waveFactor * 3);
        ctx.lineTo(x, y);
    }
    
    // Complete the wave shape
    ctx.lineTo(canvas.width, oceanY);
    ctx.lineTo(canvas.width, oceanY - 10);
    ctx.lineTo(0, oceanY - 10);
    ctx.closePath();
    
    // Fill the wave with a golden hue
    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.fill();
    
    // Add Om symbols floating in water
    for (let i = 0; i < 3; i++) {
        const x = (canvas.width / 4) * (i + 1) + Math.sin(currentTime * 0.001 + i) * 30;
        const y = oceanY + 50 + Math.cos(currentTime * 0.0008 + i) * 15;
        SanatanOrnaments.omSymbol(ctx, x, y, 15, 'rgba(255, 255, 255, 0.15)');
    }
});



// Function to manually spawn a wave of stones (triggered by button)
function spawnStoneWave() {
    if (!gameRunning) return;
    
    // Create a cooler animation effect for the manual spawn
    const canvas = render.canvas;
    const canvasWidth = canvas.width;
    
    // Play a special sound effect
    if (window.audioManager) {
        audioManager.play('stoneBreak');
    }
    
    // Decide which pattern to use - for manual spawns, use more interesting patterns
    const patternTypes = [
        'arc',      // Arc of stones
        'v',        // V-formation (like birds)
        'circle',   // Circular formation
        'rain',     // Rain of stones
        'hanuman'   // Special Hanuman army pattern
    ];
    
    const selectedPattern = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    let numStones = 0;
    let specialStonesIncluded = false;
    
    // Different patterns have different numbers of stones and arrangements
    switch(selectedPattern) {
        case 'arc':
            numStones = 5 + Math.floor(Math.random() * 3);
            spawnArcPattern(numStones);
            break;
            
        case 'v':
            numStones = 5 + Math.floor(Math.random() * 4);
            spawnVPattern(numStones);
            break;
            
        case 'circle':
            numStones = 6 + Math.floor(Math.random() * 3);
            spawnCirclePattern(numStones);
            break;
            
        case 'rain':
            numStones = 8 + Math.floor(Math.random() * 5);
            spawnRainPattern(numStones);
            break;
            
        case 'hanuman': // Special themed pattern - Hanuman's army
            spawnHanumanArmyPattern();
            specialStonesIncluded = true;
            break;
    }
    
    // Cooldown the button to prevent spam (handled in UI.js)
    window.startSpawnButtonCooldown && window.startSpawnButtonCooldown();
}

// Spawn patterns for the spawn button
function spawnArcPattern(numStones) {
    const canvas = render.canvas;
    const canvasWidth = canvas.width;
    
    for (let i = 0; i < numStones; i++) {
        // Calculate position along an arc
        const angle = (Math.PI / (numStones + 1)) * (i + 1);
        const x = (canvasWidth / 2) + (Math.sin(angle) * (canvasWidth / 3));
        const y = hudHeight + 70 + (Math.cos(angle) * 50);
        
        // 30% chance of a special stone in manual spawns
        const specialType = Math.random() < 0.3 ? 
            Object.keys(specialStoneTypes)[Math.floor(Math.random() * Object.keys(specialStoneTypes).length)] : null;
            
        // Add with slight delay for visual effect
        setTimeout(() => {
            Composite.add(world, createStone({
                size: Math.random() < 0.7 ? 'medium' : 'large',
                position: { x, y },
                velocity: { x: (Math.random() - 0.5) * 3, y: 2 + Math.random() * 3 },
                specialType: specialType
            }));
        }, i * 100); // Stagger timing
    }
}

function spawnVPattern(numStones) {
    const canvas = render.canvas;
    const canvasWidth = canvas.width;
    const vWidth = canvasWidth * 0.4;
    
    for (let i = 0; i < numStones; i++) {
        // Calculate position in V formation
        const progress = i / (numStones - 1);
        let x;
        if (progress < 0.5) {
            // Left side of V
            x = (canvasWidth / 2) - vWidth * (0.5 - progress) * 2;
        } else {
            // Right side of V
            x = (canvasWidth / 2) + vWidth * (progress - 0.5) * 2;
        }
        
        // Y position gets lower as we move away from center
        const distFromCenter = Math.abs(progress - 0.5) * 2;
        const y = hudHeight + 70 + (distFromCenter * 50);
        
        const specialTypes = ['vanar', 'nal']; // More realistic for V-formation (like birds)
        const specialType = Math.random() < 0.3 ? 
            specialTypes[Math.floor(Math.random() * specialTypes.length)] : null;
            
        setTimeout(() => {
            Composite.add(world, createStone({
                size: 'medium',
                position: { x, y },
                velocity: { x: (Math.random() - 0.5), y: 3 + Math.random() * 2 },
                specialType: specialType
            }));
        }, i * 80);
    }
}

function spawnCirclePattern(numStones) {
    const canvas = render.canvas;
    const canvasWidth = canvas.width;
    const radius = canvasWidth * 0.15;
    
    for (let i = 0; i < numStones; i++) {
        // Calculate position in a circle
        const angle = (Math.PI * 2 / numStones) * i;
        const x = (canvasWidth / 2) + (Math.cos(angle) * radius);
        const y = hudHeight + 100 + (Math.sin(angle) * radius);
        
        // 50% chance of a special stone in circle formation (represents unity)
        const specialType = Math.random() < 0.5 ? 
            Object.keys(specialStoneTypes)[Math.floor(Math.random() * Object.keys(specialStoneTypes).length)] : null;
            
        setTimeout(() => {
            Composite.add(world, createStone({
                size: Math.random() < 0.6 ? 'medium' : 'small',
                position: { x, y },
                velocity: { 
                    x: (x - canvasWidth/2) * 0.01, // Slight outward velocity
                    y: 2 + Math.random() 
                },
                specialType: specialType
            }));
        }, i * 50);
    }
}

function spawnRainPattern(numStones) {
    const canvas = render.canvas;
    const canvasWidth = canvas.width;
    
    for (let i = 0; i < numStones; i++) {
        // Random positions across the width of the screen
        const x = Math.random() * (canvasWidth * 0.8) + (canvasWidth * 0.1);
        const y = hudHeight + 70 + (Math.random() * 100); // Varied heights adjusted for HUD
        
        // Smaller chance of special stones in rain pattern (it's more chaotic)
        const specialType = Math.random() < 0.2 ? 
            Object.keys(specialStoneTypes)[Math.floor(Math.random() * Object.keys(specialStoneTypes).length)] : null;
            
        setTimeout(() => {
            Composite.add(world, createStone({
                size: Math.random() < 0.5 ? 'small' : 'medium',
                position: { x, y },
                velocity: { x: (Math.random() - 0.5) * 2, y: 3 + Math.random() * 4 },
                specialType: specialType
            }));
        }, Math.random() * 800); // Random timing for rain effect
    }
}

function spawnHanumanArmyPattern() {
    const canvas = render.canvas;
    const canvasWidth = canvas.width;
    
    // This is a special themed pattern representing Hanuman's army of monkeys
    // Create a line of predominantly special stones (hanuman and vanar types)
    
    const numStones = 7; // Fixed for this special pattern
    const specialTypes = ['hanuman', 'vanar']; // Themed stones for this pattern
    
    // First create a Hanuman stone at the front (center)
    setTimeout(() => {
        Composite.add(world, createStone({
            size: 'large',
            position: { x: canvasWidth / 2, y: hudHeight + 80 },
            velocity: { x: 0, y: 4 },
            specialType: 'hanuman'
        }));
    }, 0);
    
    // Then create the monkey army in a V behind him
    for (let i = 0; i < numStones-1; i++) {
        const side = i % 2; // 0 for left, 1 for right
        const row = Math.floor(i / 2) + 1;
        
        const x = (canvasWidth / 2) + (side === 0 ? -1 : 1) * (row * 50);
        const y = hudHeight + 80 + (row * 60);
        
        // Alternating special types for variety
        const specialType = specialTypes[i % 2];
        
        setTimeout(() => {
            Composite.add(world, createStone({
                size: 'medium',
                position: { x, y },
                velocity: { x: (side === 0 ? -0.5 : 0.5), y: 3 + Math.random() * 2 },
                specialType: specialType
            }));
        }, 150 + i * 100);
    }
    
    // Add one Rama stone at the back (representing Lord Rama guiding)
    setTimeout(() => {
        Composite.add(world, createStone({
            size: 'medium',
            position: { x: canvasWidth / 2, y: hudHeight + 300 },
            velocity: { x: 0, y: 2 },
            specialType: 'rama'
        }));
    }, 1000);
}

// Add gentle floating animation and update systems
Events.on(engine, 'beforeUpdate', function() {
    // Only update if game is running
    if (!gameRunning) return;
    
    // Update boulder system if it exists (health bars, cracks, etc.)
    if (boulderSystem) {
        boulderSystem.update();
    }
    
    // Get all bodies and filter for unbroken stones
    const bodies = Composite.allBodies(world);
    bodies.forEach(body => {
        if (!body.isStatic && !body.isBroken && !body.inWater && body.floatForce) {
            // Create gentle floating motion like in Ramayana paintings
            const time = Date.now() * 0.001; // Convert to seconds for gentler animation
            const floatX = Math.sin(time + body.id * 0.3) * 0.0001;
            const floatY = Math.cos(time + body.id * 0.7) * 0.0001;
            
            // Apply a very gentle buoyant force
            Body.applyForce(body, body.position, {
                x: floatX,
                y: floatY - 0.0001 // Slight upward bias to counter any gravity effects
            });
            
            // Add slight rotation for more interesting movement
            if (Math.random() < 0.05) { // Only occasionally adjust rotation
                Body.setAngularVelocity(body, body.angularVelocity + (Math.random() - 0.5) * 0.001);
            }
        }
    });
});

// Add physics effects when stones break
Events.on(engine, 'afterUpdate', function() {
    // Apply gravity only to broken stones to simulate them falling
    const allBodies = Composite.allBodies(world);
    allBodies.forEach(body => {
        if (!body.isStatic && body.isBroken && !body.isPartOfBridge) {
            // Apply gravity to broken stones for Ram Setu bridge building theme
            const gravity = 0.001 * body.mass;
            Body.applyForce(body, body.position, {
                x: 0,
                y: gravity * 0.5 // Gentle gravity for broken stones
            });
        }
    });
});

// Function to highlight the spawn button when stones are running low
function updateSpawnButtonHighlight(currentStoneCount, maxStones) {
    // Only proceed if the UI element exists
    const spawnButton = document.getElementById('spawn-stones');
    if (!spawnButton) return;
    
    // Calculate stone threshold - highlight when less than 30% of max stones remain
    const lowStoneThreshold = Math.floor(maxStones * 0.3);
    
    // Check if the button is on cooldown - we don't want to highlight if it's unusable
    const isCooldown = spawnButton.classList.contains('cooldown');
    
    if (currentStoneCount <= lowStoneThreshold && !isCooldown) {
        // Add pulsing highlight effect
        spawnButton.classList.add('low-stones');
        
        // Add subtle animation to draw attention
        // If this is the first time we're adding the class, play the animation
        if (!spawnButton.classList.contains('highlighted-animation')) {
            spawnButton.classList.add('highlighted-animation');
            
            // Remove the animation class after animation completes to allow re-triggering
            setTimeout(() => {
                spawnButton.classList.remove('highlighted-animation');
            }, 1000); // Animation duration
        }
    } else {
        // Remove highlight when enough stones are present
        spawnButton.classList.remove('low-stones');
    }
}

// Expose functions to window for UI integration
window.startGameEngine = startGameEngine;
window.pauseGameEngine = pauseGameEngine;
window.resumeGameEngine = resumeGameEngine;
window.restartGameEngine = restartGameEngine;
window.spawnStoneWave = spawnStoneWave; // Expose the new spawn function
window.breakStone = breakStone; // Expose breakStone for upgrade system

// Function to create visual effect for critical breaks
function createCriticalEffect(position) {
    // Create a flash effect
    const flash = document.createElement('div');
    flash.className = 'critical-flash';
    flash.style.left = `${position.x}px`;
    flash.style.top = `${position.y}px`;
    flash.style.width = '80px';
    flash.style.height = '80px';
    flash.style.position = 'absolute';
    flash.style.borderRadius = '50%';
    flash.style.background = 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,69,0,0) 70%)';
    flash.style.transform = 'translate(-50%, -50%)';
    flash.style.zIndex = '100';
    flash.style.pointerEvents = 'none';
    flash.style.animation = 'critical-pulse 0.6s ease-out';
    
    // Add keyframes for the animation
    if (!document.querySelector('#critical-keyframes')) {
        const keyframes = document.createElement('style');
        keyframes.id = 'critical-keyframes';
        keyframes.innerHTML = `
            @keyframes critical-pulse {
                0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0.9; }
                100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(keyframes);
    }
    
    document.body.appendChild(flash);
    
    // Remove after animation completes
    setTimeout(() => {
        if (document.body.contains(flash)) {
            document.body.removeChild(flash);
        }
    }, 600);
}

// Function to show pop-up notification
function showNotification(x, y, text, className = '') {
    const notification = document.createElement('div');
    notification.className = `notification ${className}`;
    notification.style.left = `${x}px`;
    notification.style.top = `${y}px`;
    notification.textContent = text;
    
    document.body.appendChild(notification);
    
    // Animate
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-40px)';
            
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 800);
    }, 10);
}

// Function to create click ripple effect
function createClickEffect(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.position = 'absolute';
    ripple.style.width = '10px';
    ripple.style.height = '10px';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.6)';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.zIndex = '90';
    ripple.style.pointerEvents = 'none';
    ripple.style.animation = 'ripple 0.4s linear';
    
    // Add keyframes for the animation if not already added
    if (!document.querySelector('#ripple-keyframes')) {
        const keyframes = document.createElement('style');
        keyframes.id = 'ripple-keyframes';
        keyframes.innerHTML = `
            @keyframes ripple {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
            }
        `;
        document.head.appendChild(keyframes);
    }
    
    document.body.appendChild(ripple);
    
    // Remove after animation completes
    setTimeout(() => {
        if (document.body.contains(ripple)) {
            document.body.removeChild(ripple);
        }
    }, 400);
}
