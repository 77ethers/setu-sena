// Improved custom cursor implementation
document.addEventListener('DOMContentLoaded', function() {
    // Create a custom cursor div
    const customCursor = document.createElement('div');
    customCursor.id = 'custom-gada-cursor';
    document.body.appendChild(customCursor);
    
    // Add the active class to body to use our custom styling
    document.body.classList.add('custom-cursor-active');
    
    // Track mouse movement and update cursor position
    document.addEventListener('mousemove', (e) => {
        requestAnimationFrame(() => {
            customCursor.style.left = `${e.clientX}px`;
            customCursor.style.top = `${e.clientY}px`;
        });
    });
    
    // Add click effect
    document.addEventListener('mousedown', () => {
        customCursor.classList.add('clicking');
    });
    
    document.addEventListener('mouseup', () => {
        customCursor.classList.remove('clicking');
    });
    
    // Handle cursor leaving the window
    document.addEventListener('mouseleave', () => {
        customCursor.style.display = 'none';
    });
    
    document.addEventListener('mouseenter', () => {
        customCursor.style.display = 'block';
    });
    
    // Make sure cursor doesn't interfere with clicks
    customCursor.style.pointerEvents = 'none';
    
    console.log('Custom cursor initialized');
});
