// Initialize game variables
let score = 0;
const stoneColors = ['#7f8c8d', '#95a5a6', '#bdc3c7', '#34495e', '#7f8c8d'];
const particleColors = ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db'];

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

// Add walls to prevent stones from leaving the screen
Composite.add(world, [
    // Top wall
    Bodies.rectangle(windowWidth / 2, -50, windowWidth + 100, 100, wallOptions),
    // Bottom wall (below water)
    Bodies.rectangle(windowWidth / 2, windowHeight + 50, windowWidth + 100, 100, wallOptions),
    // Left wall
    Bodies.rectangle(-50, windowHeight / 2, 100, windowHeight + 100, wallOptions),
    // Right wall
    Bodies.rectangle(windowWidth + 50, windowHeight / 2, 100, windowHeight + 100, wallOptions)
]);

// Calculate ocean position (30% from bottom of screen)
waterLevel = windowHeight * (1 - oceanHeight);

// Calculate shore positions - these are now managed in the render event
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
    // Default values
    const size = options.size || 'large';
    
    // Calculate safe area for stone creation (above water)
    const safeWaterY = waterLevel || windowHeight * (1 - oceanHeight);
    const topMargin = 80; // Keep stones away from top edge
    
    // Position stones only in the top area, above water
    const position = options.position || { 
        x: Math.random() * (windowWidth * 0.7) + (windowWidth * 0.15), // Keep away from edges
        y: Math.random() * (safeWaterY * 0.5) + topMargin // Only top half of air space
    };
    
    // Make sure position is valid
    if (!options.position && position.y > safeWaterY - 100) {
        position.y = safeWaterY * 0.3; // Fallback to safe position if too close to water
    }
    
    const velocity = options.velocity || { x: 0, y: 0 };
    const isBroken = options.isBroken || false; // New flag to track if stone has been broken
    
    // Determine size based on category
    const sizeRange = stoneSizes[size];
    const sizeValue = Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min;
    
    // Generate random color
    const colorIndex = Math.floor(Math.random() * stoneColors.length);
    
    // Get a random shape type and generate vertices
    const shapeType = options.shapeType || getRandomShapeType();
    let vertices = stoneShapes[shapeType](sizeValue);
    
    // Add some irregularity to make shapes more interesting
    // For small stones, add less irregularity to keep them recognizable
    const irregularityAmount = size === 'small' ? sizeValue * 0.1 : sizeValue * 0.15;
    vertices = addIrregularity(vertices, irregularityAmount);
    
    // Create the base stone body
    const stone = Bodies.polygon(position.x, position.y, vertices.length, sizeValue, {
        restitution: 0.4,
        friction: 0.01,
        frictionAir: 0.001,
        angle: Math.random() * Math.PI * 2,
        render: {
            fillStyle: stoneColors[colorIndex],
            strokeStyle: '#2c3e50',
            lineWidth: 2
        }
    });
    
    // Add custom properties
    stone.stoneCategory = size;
    stone.shapeType = shapeType;
    stone.isBroken = isBroken;
    stone.inWater = false;
    stone.originalColor = stoneColors[colorIndex];
    stone.isPartOfBridge = false;
    
    // Override the vertices with our custom shape
    Body.setVertices(stone, vertices);
    
    // Apply initial velocity if provided
    if (velocity.x !== 0 || velocity.y !== 0) {
        Body.setVelocity(stone, velocity);
    } else if (!isBroken) {
        // Only apply random forces to floating stones (not broken ones)
        const forceMagnitude = 0.005 * stone.mass;
        Body.applyForce(stone, stone.position, {
            x: (Math.random() - 0.5) * forceMagnitude,
            y: (Math.random() - 0.5) * forceMagnitude
        });
    }
    
    return stone;
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
    
    // Create particles for visual effect
    const particles = createStoneParticles(position, stoneSize / 2, color);
    Composite.add(world, particles);
    
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
    
    updateScore(pointValue);
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
    
    stoneGenerationInterval = setInterval(() => {
        // Count actual floating stones (not particles, not broken stones)
        const floatingStoneCount = Composite.allBodies(world).filter(body => {
            return !body.isStatic && !body.hasOwnProperty('lifespan') && !body.isBroken;
        }).length;
        
        if (floatingStoneCount < 8 && bridgeProgress < 90) { // Add stones until bridge is almost complete
            const sizes = ['large', 'medium'];
            const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
            
            Composite.add(world, createStone({ size: randomSize }));
        }
    }, 3000);
}

// Initialize game with stones scaled to screen size
function initGame() {
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
        
        // Only process the first (closest) valid body
        let processed = false;
        for (let body of clickedBodies) {
            // Skip if already processed a body or if it's not a block
            if (processed) break;
            
            // Log body details to help debug
            logBodyDetails(body);
            
            // Check if it's a stone (not a wall or a particle)
            if (!body.isStatic && body.stoneCategory) {
                console.log('Breaking stone:', body.stoneCategory);
                
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

// Expose functions to window for UI integration
window.startGameEngine = startGameEngine;
window.pauseGameEngine = pauseGameEngine;
window.resumeGameEngine = resumeGameEngine;
window.restartGameEngine = restartGameEngine;
