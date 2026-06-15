// Audio manager using Web Audio API - procedurally generated sounds
var AudioManager = (function() {
    function AudioManager() {
        this.ctx = null;
        this.masterGain = null;
        this.muted = false;
        this.volume = 0.7;
        this._init();
    }

    AudioManager.prototype._init = function() {
        try {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.ctx.destination);
        } catch(e) {
            console.warn('Web Audio API not available:', e);
        }
    };

    AudioManager.prototype._resume = function() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    };

    AudioManager.prototype._playTone = function(frequency, duration, type, gainVal, startTime, endFreq) {
        if (!this.ctx || this.muted) return;
        this._resume();
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(frequency, startTime);
        if (endFreq !== undefined) {
            osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
        }
        gain.gain.setValueAtTime(gainVal || 0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
    };

    AudioManager.prototype._playNoise = function(duration, gainVal, startTime) {
        if (!this.ctx || this.muted) return;
        this._resume();
        var bufferSize = this.ctx.sampleRate * duration;
        var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        var source = this.ctx.createBufferSource();
        source.buffer = buffer;

        var gain = this.ctx.createGain();
        var filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        gain.gain.setValueAtTime(gainVal || 0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        source.start(startTime);
        source.stop(startTime + duration);
    };

    AudioManager.prototype.playSound = function(name) {
        if (!this.ctx || this.muted) return;
        this._resume();
        var now = this.ctx.currentTime;

        switch(name) {
            case 'fire':
                // Swish + thump
                this._playNoise(0.15, 0.4, now);
                this._playTone(120, 0.2, 'sawtooth', 0.3, now, 60);
                this._playTone(80, 0.1, 'sine', 0.4, now + 0.05, 40);
                break;

            case 'impact':
                // Dull thud
                this._playNoise(0.1, 0.5, now);
                this._playTone(100, 0.15, 'sine', 0.5, now, 40);
                this._playNoise(0.05, 0.3, now + 0.02);
                break;

            case 'impact_stone':
                // Hard crack
                this._playNoise(0.08, 0.6, now);
                this._playTone(150, 0.1, 'square', 0.4, now, 50);
                break;

            case 'impact_wood':
                // Wooden crack
                this._playNoise(0.12, 0.4, now);
                this._playTone(200, 0.15, 'sawtooth', 0.3, now, 100);
                break;

            case 'explosion':
                // Big boom
                this._playNoise(0.5, 0.8, now);
                this._playTone(60, 0.4, 'sawtooth', 0.7, now, 20);
                this._playTone(40, 0.3, 'sine', 0.6, now + 0.05, 15);
                this._playNoise(0.3, 0.5, now + 0.1);
                break;

            case 'enemy_die':
                // Quick squeal
                this._playTone(600, 0.2, 'square', 0.3, now, 200);
                this._playTone(300, 0.15, 'sine', 0.2, now + 0.1, 100);
                break;

            case 'win':
                // Ascending fanfare
                var notes = [261, 329, 392, 523, 659, 784];
                for (var i = 0; i < notes.length; i++) {
                    this._playTone(notes[i], 0.3, 'sine', 0.4, now + i * 0.12);
                    this._playTone(notes[i] * 1.5, 0.25, 'triangle', 0.2, now + i * 0.12);
                }
                break;

            case 'lose':
                // Descending sad tones
                var notes = [392, 349, 293, 261, 220, 196];
                for (var i = 0; i < notes.length; i++) {
                    this._playTone(notes[i], 0.35, 'sine', 0.3, now + i * 0.15);
                }
                break;

            case 'star':
                // Twinkle
                this._playTone(880, 0.1, 'sine', 0.3, now);
                this._playTone(1100, 0.1, 'sine', 0.3, now + 0.12);
                this._playTone(1320, 0.2, 'sine', 0.4, now + 0.24);
                break;

            case 'button':
                this._playTone(440, 0.08, 'sine', 0.2, now);
                break;

            case 'select':
                this._playTone(520, 0.06, 'sine', 0.15, now);
                this._playTone(660, 0.06, 'sine', 0.15, now + 0.08);
                break;
        }
    };

    AudioManager.prototype.setVolume = function(v) {
        this.volume = MathUtils.clamp(v, 0, 1);
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    };

    AudioManager.prototype.mute = function() {
        this.muted = true;
        if (this.masterGain) this.masterGain.gain.value = 0;
    };

    AudioManager.prototype.unmute = function() {
        this.muted = false;
        if (this.masterGain) this.masterGain.gain.value = this.volume;
    };

    AudioManager.prototype.toggleMute = function() {
        if (this.muted) this.unmute();
        else this.mute();
    };

    return AudioManager;
})();
