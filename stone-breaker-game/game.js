// Initialize game variables
let score = 0;
const stoneColors = ['#7f8c8d', '#95a5a6', '#bdc3c7', '#34495e', '#7f8c8d'];
const particleColors = ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db'];

// Stone size categories (based on approximate size in pixels)
const stoneSizes = {
    large: { min: 45, max: 60 },
    medium: { min: 25, max: 35 },
    small: { min: 10, max: 15 }
};

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
      MouseConstraint = Matter.MouseConstraint;

// Create engine and runner
const engine = Engine.create({
    gravity: { x: 0, y: 0.05 }
});
const world = engine.world;

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

// Run the renderer
Render.run(render);

// Create runner
const runner = Runner.create();
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

// Add walls to contain stones within the window
Composite.add(world, [
    // Bottom wall
    Bodies.rectangle(windowWidth / 2, windowHeight + 10, windowWidth + 20, 20, wallOptions),
    // Left wall
    Bodies.rectangle(-10, windowHeight / 2, 20, windowHeight + 20, wallOptions),
    // Right wall
    Bodies.rectangle(windowWidth + 10, windowHeight / 2, 20, windowHeight + 20, wallOptions),
    // Top wall
    Bodies.rectangle(windowWidth / 2, -10, windowWidth + 20, 20, wallOptions)
]);

// Function to create a stone with specified size, position, and velocity
function createStone(options = {}) {
    // Default values
    const size = options.size || 'large';
    const position = options.position || { 
        x: Math.random() * (windowWidth * 0.8) + (windowWidth * 0.1), 
        y: Math.random() * (windowHeight * 0.3) + 50 
    };
    const velocity = options.velocity || { x: 0, y: 0 };
    
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
    
    // Create the base stone body first
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
    
    // Add custom properties for breaking logic
    stone.stoneCategory = size;
    stone.shapeType = shapeType;
    
    // Override the vertices with our custom shape
    Body.setVertices(stone, vertices);
    
    // Apply initial velocity if provided
    if (velocity.x !== 0 || velocity.y !== 0) {
        Body.setVelocity(stone, velocity);
    } else {
        // Apply a random force to make stones float differently
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
                y: Math.sin(angle) * 2
            };
            
            const newStone = createStone({
                size: 'medium',
                // Inherit the same shape type for consistent breaking
                shapeType: shapeType,
                position: {
                    x: position.x + Math.cos(angle) * (stoneSize / 4),
                    y: position.y + Math.sin(angle) * (stoneSize / 4)
                },
                velocity: velocity
            });
            
            Composite.add(world, newStone);
        }
    } else if (category === 'medium') {
        // Medium stone breaks into 2 small stones
        for (let i = 0; i < 2; i++) {
            const angle = (Math.PI * i);
            const velocity = {
                x: Math.cos(angle) * 1.5,
                y: Math.sin(angle) * 1.5
            };
            
            const newStone = createStone({
                size: 'small',
                // Inherit the same shape type for consistent breaking
                shapeType: shapeType,
                position: {
                    x: position.x + Math.cos(angle) * (stoneSize / 4),
                    y: position.y + Math.sin(angle) * (stoneSize / 4)
                },
                velocity: velocity
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
    
    score += pointValue;
    document.getElementById('score').textContent = score;
}

// Initialize game with stones scaled to screen size
function initGame() {
    // Scale number of stones based on screen size
    const screenArea = windowWidth * windowHeight;
    const baseArea = 800 * 600;
    const scaleFactor = Math.min(3, Math.max(1, screenArea / baseArea));
    
    // Start with larger stones
    const largeStoneCount = Math.floor(6 * scaleFactor);
    for (let i = 0; i < largeStoneCount; i++) {
        Composite.add(world, createStone({ size: 'large' }));
    }
    
    // Add medium ones too
    const mediumStoneCount = Math.floor(4 * scaleFactor);
    for (let i = 0; i < mediumStoneCount; i++) {
        Composite.add(world, createStone({ size: 'medium' }));
    }
    
    console.log('Game initialized with ' + largeStoneCount + ' large blocks and ' + mediumStoneCount + ' medium blocks');
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

// Add event listener for mouse clicks on stones with improved detection
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

// Add window resize handler to make the game responsive
window.addEventListener('resize', () => {
    // Update canvas dimensions
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    // Update renderer
    render.options.width = newWidth;
    render.options.height = newHeight;
    render.canvas.width = newWidth;
    render.canvas.height = newHeight;
    
    // Update walls
    Composite.clear(world, false, true);
    Composite.add(world, [
        Bodies.rectangle(newWidth / 2, newHeight + 10, newWidth + 20, 20, wallOptions),
        Bodies.rectangle(-10, newHeight / 2, 20, newHeight + 20, wallOptions),
        Bodies.rectangle(newWidth + 10, newHeight / 2, 20, newHeight + 20, wallOptions),
        Bodies.rectangle(newWidth / 2, -10, newWidth + 20, 20, wallOptions)
    ]);
    
    console.log('Window resized to ' + newWidth + 'x' + newHeight);
});

// Remove particles after their lifespan
Events.on(engine, 'afterUpdate', () => {
    const bodies = Composite.allBodies(world);
    
    for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        
        if (body.hasOwnProperty('lifespan')) {
            body.lifespan--;
            
            if (body.lifespan <= 0) {
                Composite.remove(world, body);
            }
        }
    }
});

// Initialize the game
initGame();

// Add periodic new stones
setInterval(() => {
    // Count actual stones (not particles or walls)
    const stoneCount = Composite.allBodies(world).filter(body => {
        return !body.isStatic && !body.hasOwnProperty('lifespan') && body.circleRadius > 5;
    }).length;
    
    if (stoneCount < 10) { // Keep a reasonable number of stones
        const sizes = ['large', 'medium'];
        const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
        
        Composite.add(world, createStone({ size: randomSize }));
    }
}, 5000);
