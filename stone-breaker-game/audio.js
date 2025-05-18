// Audio management for the Stone Breaker Game

class AudioManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.initialized = false;
    }

    initialize() {
        // Create audio elements
        this.sounds = {
            stoneBreak: new Audio(),
            splash: new Audio(),
            bridgeProgress: new Audio(),
            victory: new Audio(),
            background: new Audio()
        };
        
        // Set audio sources
        // Using the actual stone-break-sound.mp3 file from assets folder
        this.sounds.stoneBreak.src = 'assets/stone-break-sound.mp3';
        this.sounds.splash.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFCgUFBQUFBQ8PDw8PDxQPDw8PDw8ZGRkZGRkfGRkZGRkZJCQkJCQkKSQkJCQkJC4uLi4uLjMuLi4uLi42NjY2NjY8NjY2NjY2P////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAUGAAAAAAAAAAB4zMP+c0gAAAAAAAAAAAAAAAAA/+xDEAAPAAAGkAAAAIAAANIAAAAQTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xDEKYPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
        this.sounds.bridgeProgress.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFCgUFBQUFBQ8PDw8PDxQPDw8PDw8ZGRkZGRkfGRkZGRkZJCQkJCQkKSQkJCQkJC4uLi4uLjMuLi4uLi42NjY2NjY8NjY2NjY2P////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAQGAAAAAAAAAAB4zMP+c0gAAAAAAAAAAAAAAAAA/+xDEAAPAAAGkAAAAIAAANIAAAAQTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xDEKYPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
        this.sounds.victory.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFCgUFBQUFBQ8PDw8PDxQPDw8PDw8ZGRkZGRkfGRkZGRkZJCQkJCQkKSQkJCQkJC4uLi4uLjMuLi4uLi42NjY2NjY8NjY2NjY2P////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYSAAAAAAAAAAB4zMP+c0gAAAAAAAAAAAAAAAAA/+xDEAAPAAAGkAAAAIAAANIAAAAQTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xDEKYPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
        this.sounds.background.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFCgUFBQUFBQ8PDw8PDxQPDw8PDw8ZGRkZGRkfGRkZGRkZJCQkJCQkKSQkJCQkJC4uLi4uLjMuLi4uLi42NjY2NjY8NjY2NjY2P////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAm2AAAAAAAAAAB4zMP+c0gAAAAAAAAAAAAAAAAA/+xDEAAPAAAGkAAAAIAAANIAAAAQTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xDEKYPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
        
        // Set loop for background
        this.sounds.background.loop = true;
        
        // Set volumes
        this.sounds.stoneBreak.volume = 0.7;
        this.sounds.splash.volume = 0.5;
        this.sounds.bridgeProgress.volume = 0.6;
        this.sounds.victory.volume = 0.8;
        this.sounds.background.volume = 0.3;
        
        this.initialized = true;
    }

    play(soundName) {
        if (!this.initialized) this.initialize();
        if (this.muted) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            // For short sounds, reset to start before playing again
            if (soundName !== 'background') {
                sound.currentTime = 0;
            }
            sound.play().catch(error => {
                console.log('Audio play error:', error);
                // Most browsers require user interaction before playing audio
                // This error is expected on page load
            });
        }
    }

    stop(soundName) {
        if (!this.initialized) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        
        // Update icon and stop/play background music accordingly
        if (this.muted) {
            // Stop all sounds
            Object.values(this.sounds).forEach(sound => {
                sound.pause();
            });
        } else {
            // Resume background music
            this.play('background');
        }
        
        return this.muted;
    }
}

// Create a global audio manager instance
const audioManager = new AudioManager();
