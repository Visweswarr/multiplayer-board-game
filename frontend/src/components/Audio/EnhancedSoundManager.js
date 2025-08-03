import { Howl, Howler } from 'howler';

class EnhancedSoundManager {
  constructor() {
    this.sounds = {};
    this.masterVolume = 0.5;
    this.isMuted = false;
    this.audioContext = null;
    this.spatialAudio = false;
    this.listenerPosition = { x: 0, y: 0, z: 0 };
    
    this.initializeSounds();
    this.setupAudioContext();
  }

  initializeSounds() {
    // UI Sounds
    this.sounds.click = new Howl({
      src: ['/sounds/ui/click.mp3'],
      volume: 0.3,
      rate: 1.2,
      preload: true
    });

    this.sounds.hover = new Howl({
      src: ['/sounds/ui/hover.mp3'],
      volume: 0.2,
      rate: 1.0,
      preload: true
    });

    this.sounds.notification = new Howl({
      src: ['/sounds/ui/notification.mp3'],
      volume: 0.4,
      rate: 1.0,
      preload: true
    });

    // Game Sounds
    this.sounds.move = new Howl({
      src: ['/sounds/game/move.mp3'],
      volume: 0.4,
      rate: 1.0,
      preload: true
    });

    this.sounds.win = new Howl({
      src: ['/sounds/game/win.mp3'],
      volume: 0.6,
      rate: 1.0,
      preload: true
    });

    this.sounds.draw = new Howl({
      src: ['/sounds/game/draw.mp3'],
      volume: 0.5,
      rate: 1.0,
      preload: true
    });

    this.sounds.invalid = new Howl({
      src: ['/sounds/game/invalid.mp3'],
      volume: 0.3,
      rate: 0.8,
      preload: true
    });

    // Chat Sounds
    this.sounds.message = new Howl({
      src: ['/sounds/chat/message.mp3'],
      volume: 0.3,
      rate: 1.0,
      preload: true
    });

    this.sounds.typing = new Howl({
      src: ['/sounds/chat/typing.mp3'],
      volume: 0.2,
      rate: 1.0,
      preload: true
    });

    // Ambient Sounds
    this.sounds.ambient = new Howl({
      src: ['/sounds/ambient/background.mp3'],
      volume: 0.1,
      rate: 1.0,
      loop: true,
      preload: true
    });

    // Connection Sounds
    this.sounds.connect = new Howl({
      src: ['/sounds/connection/connect.mp3'],
      volume: 0.4,
      rate: 1.0,
      preload: true
    });

    this.sounds.disconnect = new Howl({
      src: ['/sounds/connection/disconnect.mp3'],
      volume: 0.4,
      rate: 1.0,
      preload: true
    });

    // Victory/Defeat Sounds
    this.sounds.victory = new Howl({
      src: ['/sounds/game/victory.mp3'],
      volume: 0.7,
      rate: 1.0,
      preload: true
    });

    this.sounds.defeat = new Howl({
      src: ['/sounds/game/defeat.mp3'],
      volume: 0.5,
      rate: 1.0,
      preload: true
    });

    // Special Effects
    this.sounds.powerup = new Howl({
      src: ['/sounds/effects/powerup.mp3'],
      volume: 0.5,
      rate: 1.0,
      preload: true
    });

    this.sounds.explosion = new Howl({
      src: ['/sounds/effects/explosion.mp3'],
      volume: 0.6,
      rate: 1.0,
      preload: true
    });
  }

  setupAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.spatialAudio = true;
    } catch (error) {
      console.warn('Spatial audio not supported:', error);
      this.spatialAudio = false;
    }
  }

  // Basic sound playback
  play(soundName, options = {}) {
    if (this.isMuted) return;

    const sound = this.sounds[soundName];
    if (!sound) {
      console.warn(`Sound '${soundName}' not found`);
      return;
    }

    const {
      volume = 1,
      rate = 1,
      position = null,
      onEnd = null
    } = options;

    const soundId = sound.play();
    
    if (soundId) {
      sound.volume(volume * this.masterVolume, soundId);
      sound.rate(rate, soundId);
      
      if (position && this.spatialAudio) {
        this.setSpatialPosition(soundId, position);
      }
      
      if (onEnd) {
        sound.once('end', onEnd, soundId);
      }
    }

    return soundId;
  }

  // Spatial audio positioning
  setSpatialPosition(soundId, position) {
    if (!this.spatialAudio || !this.audioContext) return;

    const sound = this.sounds[soundId];
    if (!sound) return;

    // Calculate distance and direction
    const dx = position.x - this.listenerPosition.x;
    const dy = position.y - this.listenerPosition.y;
    const dz = position.z - this.listenerPosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Apply distance attenuation
    const maxDistance = 10;
    const volume = Math.max(0, 1 - distance / maxDistance);
    sound.volume(volume * this.masterVolume, soundId);

    // Apply stereo panning based on X position
    const pan = Math.max(-1, Math.min(1, dx / maxDistance));
    sound.stereo(pan, soundId);
  }

  // Game-specific sounds
  playMove(position = null) {
    this.play('move', { position });
  }

  playWin(position = null) {
    this.play('win', { position });
  }

  playDraw(position = null) {
    this.play('draw', { position });
  }

  playInvalid(position = null) {
    this.play('invalid', { position });
  }

  playVictory() {
    this.play('victory');
  }

  playDefeat() {
    this.play('defeat');
  }

  // UI sounds
  playClick() {
    this.play('click');
  }

  playHover() {
    this.play('hover');
  }

  playNotification() {
    this.play('notification');
  }

  // Chat sounds
  playMessage() {
    this.play('message');
  }

  playTyping() {
    this.play('typing');
  }

  // Connection sounds
  playConnect() {
    this.play('connect');
  }

  playDisconnect() {
    this.play('disconnect');
  }

  // Special effects
  playPowerup(position = null) {
    this.play('powerup', { position });
  }

  playExplosion(position = null) {
    this.play('explosion', { position });
  }

  // Ambient sounds
  startAmbient() {
    this.play('ambient');
  }

  stopAmbient() {
    const sound = this.sounds.ambient;
    if (sound) {
      sound.stop();
    }
  }

  // Volume control
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
  }

  setSoundVolume(soundName, volume) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.volume(Math.max(0, Math.min(1, volume)));
    }
  }

  // Mute/Unmute
  mute() {
    this.isMuted = true;
    Howler.mute(true);
  }

  unmute() {
    this.isMuted = false;
    Howler.mute(false);
  }

  // Spatial audio control
  setListenerPosition(x, y, z) {
    this.listenerPosition = { x, y, z };
  }

  enableSpatialAudio() {
    this.spatialAudio = true;
  }

  disableSpatialAudio() {
    this.spatialAudio = false;
  }

  // Sound effects with dynamic parameters
  playWithEffect(soundName, effect = {}) {
    const {
      volume = 1,
      rate = 1,
      pitch = 1,
      reverb = 0,
      delay = 0
    } = effect;

    const soundId = this.play(soundName, { volume, rate });
    
    if (soundId && this.audioContext) {
      // Apply audio effects
      const sound = this.sounds[soundName];
      if (sound) {
        // Pitch shifting
        if (pitch !== 1) {
          sound.rate(pitch, soundId);
        }
        
        // Reverb effect (simplified)
        if (reverb > 0) {
          // Create a simple reverb effect
          setTimeout(() => {
            this.play(soundName, { 
              volume: volume * reverb * 0.3,
              rate: rate * 0.8
            });
          }, 100);
        }
        
        // Delay effect
        if (delay > 0) {
          setTimeout(() => {
            this.play(soundName, { 
              volume: volume * 0.5,
              rate: rate
            });
          }, delay);
        }
      }
    }

    return soundId;
  }

  // Stop all sounds
  stopAll() {
    Object.values(this.sounds).forEach(sound => {
      if (sound && typeof sound.stop === 'function') {
        sound.stop();
      }
    });
  }

  // Cleanup
  destroy() {
    this.stopAll();
    Object.values(this.sounds).forEach(sound => {
      if (sound && typeof sound.unload === 'function') {
        sound.unload();
      }
    });
    this.sounds = {};
  }

  // Get audio statistics
  getAudioStats() {
    return {
      totalSounds: Object.keys(this.sounds).length,
      masterVolume: this.masterVolume,
      isMuted: this.isMuted,
      spatialAudio: this.spatialAudio,
      audioContext: !!this.audioContext
    };
  }
}

// Create singleton instance
const enhancedSoundManager = new EnhancedSoundManager();

export default enhancedSoundManager; 