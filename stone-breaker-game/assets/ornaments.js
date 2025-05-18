/**
 * Ramayana/Sanatan Dharma ornamental elements for the game
 * This file provides functions to draw traditional decorative elements
 */

const SanatanOrnaments = {
    // Common ornamental elements
    lotusFlower: function(ctx, x, y, size, color) {
        ctx.save();
        ctx.translate(x, y);
        
        // Draw lotus petals
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(size/3, size/3, size/2, size/1.5, 0, size);
            ctx.bezierCurveTo(-size/2, size/1.5, -size/3, size/3, 0, 0);
            ctx.fillStyle = color || '#FF7722';
            ctx.fill();
            ctx.restore();
        }
        
        // Draw center
        ctx.beginPath();
        ctx.arc(0, 0, size/5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        
        ctx.restore();
    },
    
    // Om symbol
    omSymbol: function(ctx, x, y, size, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size/100, size/100);
        
        // Drawing a simplified Om symbol
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.bezierCurveTo(30, -30, 40, 0, 20, 20);
        ctx.bezierCurveTo(0, 40, -30, 20, -10, -10);
        ctx.bezierCurveTo(0, -25, 20, -20, 0, -10);
        ctx.bezierCurveTo(-20, 0, -10, 20, 10, 10);
        ctx.lineWidth = 5;
        ctx.strokeStyle = color || '#FFD700';
        ctx.stroke();
        
        // Add the dot and crescent
        ctx.beginPath();
        ctx.arc(30, -15, 5, 0, Math.PI * 2);
        ctx.fillStyle = color || '#FFD700';
        ctx.fill();
        
        ctx.restore();
    },
    
    // Kalash (auspicious pot)
    kalash: function(ctx, x, y, size, color) {
        ctx.save();
        ctx.translate(x, y);
        
        // Pot base
        ctx.beginPath();
        ctx.moveTo(-size/3, 0);
        ctx.bezierCurveTo(-size/3, -size/2, size/3, -size/2, size/3, 0);
        ctx.bezierCurveTo(size/2, size/3, -size/2, size/3, -size/3, 0);
        ctx.fillStyle = color || '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Pot neck
        ctx.beginPath();
        ctx.moveTo(-size/6, -size/2);
        ctx.lineTo(-size/8, -size/1.5);
        ctx.lineTo(size/8, -size/1.5);
        ctx.lineTo(size/6, -size/2);
        ctx.fillStyle = color || '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Leaf on top
        ctx.beginPath();
        ctx.moveTo(0, -size/1.5);
        ctx.bezierCurveTo(size/4, -size, -size/4, -size, 0, -size/1.5);
        ctx.fillStyle = '#008000'; // Green for leaf
        ctx.fill();
        
        // Decorative pattern
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(0, -size/6, size/6, (Math.PI/2.5) * i, (Math.PI/2.5) * i + Math.PI/5);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#8B0000';
            ctx.stroke();
        }
        
        ctx.restore();
    },
    
    // Decorative border pattern
    decorativeBorder: function(ctx, x, y, width, height, color) {
        ctx.save();
        ctx.translate(x, y);
        
        const patternSize = 20;
        const numPatterns = Math.floor(width / patternSize);
        
        // Top border
        for (let i = 0; i < numPatterns; i++) {
            this.drawBorderPattern(ctx, i * patternSize, 0, patternSize, color);
        }
        
        // Bottom border
        for (let i = 0; i < numPatterns; i++) {
            ctx.save();
            ctx.translate(i * patternSize, height);
            ctx.rotate(Math.PI);
            this.drawBorderPattern(ctx, 0, 0, patternSize, color);
            ctx.restore();
        }
        
        // Left border
        for (let i = 0; i < Math.floor(height / patternSize); i++) {
            ctx.save();
            ctx.translate(0, i * patternSize);
            ctx.rotate(-Math.PI/2);
            this.drawBorderPattern(ctx, 0, 0, patternSize, color);
            ctx.restore();
        }
        
        // Right border
        for (let i = 0; i < Math.floor(height / patternSize); i++) {
            ctx.save();
            ctx.translate(width, i * patternSize);
            ctx.rotate(Math.PI/2);
            this.drawBorderPattern(ctx, 0, 0, patternSize, color);
            ctx.restore();
        }
        
        ctx.restore();
    },
    
    // Helper function for border pattern
    drawBorderPattern: function(ctx, x, y, size, color) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size/2, y + size/4);
        ctx.lineTo(x + size, y);
        ctx.strokeStyle = color || '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Small dot
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/8, size/10, 0, Math.PI * 2);
        ctx.fillStyle = color || '#FFD700';
        ctx.fill();
    },
    
    // Bow and arrow (Dhanush)
    drawBowArrow: function(ctx, x, y, size, color) {
        ctx.save();
        ctx.translate(x, y);
        
        // Draw bow
        ctx.beginPath();
        ctx.arc(0, 0, size, -Math.PI/4, Math.PI/4, false);
        ctx.lineWidth = size/10;
        ctx.strokeStyle = color || '#8B4513';
        ctx.stroke();
        
        // Bowstring
        ctx.beginPath();
        ctx.moveTo(size * Math.cos(-Math.PI/4), size * Math.sin(-Math.PI/4));
        ctx.lineTo(size * Math.cos(Math.PI/4), size * Math.sin(Math.PI/4));
        ctx.lineWidth = size/40;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
        
        // Arrow
        ctx.beginPath();
        ctx.moveTo(-size/2, 0);
        ctx.lineTo(size * 1.2, 0);
        ctx.lineWidth = size/30;
        ctx.strokeStyle = '#D4AF37';
        ctx.stroke();
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(size * 1.2, 0);
        ctx.lineTo(size, size/10);
        ctx.lineTo(size, -size/10);
        ctx.closePath();
        ctx.fillStyle = '#D4AF37';
        ctx.fill();
        
        // Arrow fletching
        ctx.beginPath();
        ctx.moveTo(-size/2, 0);
        ctx.lineTo(-size/2 - size/10, size/8);
        ctx.lineTo(-size/2 - size/5, 0);
        ctx.lineTo(-size/2 - size/10, -size/8);
        ctx.closePath();
        ctx.fillStyle = '#FF7722';
        ctx.fill();
        
        ctx.restore();
    },
    
    // Animated water with traditional patterns
    drawSacredWater: function(ctx, x, y, width, height, time) {
        ctx.save();
        
        // Create gradient for water
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, 'rgba(0, 100, 255, 0.7)');  // Blue water
        gradient.addColorStop(1, 'rgba(0, 50, 150, 0.9)');   // Deeper blue
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
        
        // Create wave pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        
        // Sine wave patterns with time-based animation
        for (let j = 0; j < 3; j++) { // Multiple wave layers
            ctx.beginPath();
            const amplitude = 5 + j * 2; // Different amplitudes
            const frequency = 0.02 - j * 0.005; // Different frequencies
            const timeOffset = time * (0.001 + j * 0.0005); // Different speeds
            
            for (let i = 0; i <= width; i += 10) {
                const xPos = x + i;
                const yPos = y + height/2 + Math.sin((i * frequency) + timeOffset) * amplitude;
                
                if (i === 0) {
                    ctx.moveTo(xPos, yPos);
                } else {
                    ctx.lineTo(xPos, yPos);
                }
            }
            ctx.stroke();
        }
        
        // Add some subtle lotus symbols in the water
        const numLotus = Math.floor(width / 200);
        for (let i = 0; i < numLotus; i++) {
            const lotusX = x + 50 + (i * 200) + Math.sin(time * 0.001) * 20;
            const lotusY = y + height - 30 + Math.cos(time * 0.001 + i) * 10;
            
            this.lotusFlower(ctx, lotusX, lotusY, 15, 'rgba(255, 150, 150, 0.3)');
        }
        
        ctx.restore();
    },
    
    // Draw a stylized monkey silhouette (representing Hanuman's army)
    drawMonkey: function(ctx, x, y, size, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size/100, size/100);
        
        ctx.fillStyle = color || 'rgba(90, 60, 30, 0.8)';
        
        // Body
        ctx.beginPath();
        ctx.ellipse(0, 20, 25, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.beginPath();
        ctx.arc(0, -30, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.beginPath();
        ctx.ellipse(-25, -40, 10, 15, Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(25, -40, 10, 15, -Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Tail
        ctx.beginPath();
        ctx.moveTo(0, 60);
        ctx.bezierCurveTo(30, 70, 60, 40, 40, 0);
        ctx.lineWidth = 8;
        ctx.strokeStyle = color || 'rgba(90, 60, 30, 0.8)';
        ctx.stroke();
        
        // Face details (simple)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-10, -35, 5, 0, Math.PI * 2); // Left eye
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(10, -35, 5, 0, Math.PI * 2); // Right eye
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-10, -35, 2, 0, Math.PI * 2); // Left pupil
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(10, -35, 2, 0, Math.PI * 2); // Right pupil
        ctx.fill();
        
        // Smile
        ctx.beginPath();
        ctx.arc(0, -25, 15, 0.2, Math.PI - 0.2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
        
        ctx.restore();
    }
};
