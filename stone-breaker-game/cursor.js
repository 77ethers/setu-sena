// Custom cursor implementation using JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // First attempt to preload the cursor image
    const cursorImage = new Image();
    cursorImage.src = 'assets/pointer-gada.png';
    
    // When the image is loaded, we can attach cursor functionality
    cursorImage.onload = function() {
        // Create a cursor overlay element
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);
        
        // Position the cursor at mouse location
        document.addEventListener('mousemove', function(e) {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
        
        // Hide the default cursor on the body and specific elements
        document.body.style.cursor = 'none';
        
        // Add to all clickable elements
        const clickableElements = document.querySelectorAll(
            '.game-button, .instructions-button, .close-button, .mobile-button, .hud-controls button'
        );
        
        clickableElements.forEach(function(element) {
            element.style.cursor = 'none';
        });
        
        // Handle cursor state changes
        document.addEventListener('mousedown', function() {
            cursor.classList.add('active');
        });
        
        document.addEventListener('mouseup', function() {
            cursor.classList.remove('active');
        });
    };
});
