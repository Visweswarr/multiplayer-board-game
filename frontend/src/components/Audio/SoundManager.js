import { Howl } from 'howler';

class SoundManager {
  constructor() {
    this.sounds = {
      click: new Howl({
        src: ['/sounds/click.mp3'],
        volume: 0.3,
        rate: 1.2
      }),
      move: new Howl({
        src: ['/sounds/move.mp3'],
        volume: 0.4,
        rate: 1.0
      }),
      win: new Howl({
        src: ['/sounds/win.mp3'],
        volume: 0.6,
        rate: 1.0
      }),
      message: new Howl({
        src: ['/sounds/message.mp3'],
        volume: 0.3,
        rate: 1.0
      }),
      join: new Howl({
        src: ['/sounds/join.mp3'],
        volume: 0.4,
        rate: 1.0
      })
    };
  }

  playClick() {
    this.sounds.click.play();
  }

  playMove() {
    this.sounds.move.play();
  }

  playWin() {
    this.sounds.win.play();
  }

  playMessage() {
    this.sounds.message.play();
  }

  playJoin() {
    this.sounds.join.play();
  }

  setVolume(volume) {
    Object.values(this.sounds).forEach(sound => {
      sound.volume(volume);
    });
  }

  mute() {
    this.setVolume(0);
  }

  unmute() {
    this.setVolume(0.4);
  }
}

export default new SoundManager(); 