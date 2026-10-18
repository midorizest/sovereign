/* ==========================================================================
   SOVEREIGN — Sound engine (binaural beats, isochronic tones, noise)
   Everything is synthesised live with the Web Audio API — no audio files.
   Shared by the app page (website) and the extension's offscreen document.

   Binaural:   left ear = carrier − beat/2, right ear = carrier + beat/2.
               The brain perceives the difference ("beat") between them.
               Requires headphones.
   Isochronic: one tone pulsed on and off at the beat rate (smooth pulses).
               Works with or without headphones; better above ~30 Hz.
   Noise:      pink or brown noise generated into a looping buffer.

   API
     const s = new SovSound.Session(preset, { minutes, volume, noise, offset }, onEnd)
     s.start()            fade in and play
     s.stop({ log })      fade out; onEnd({ minutes, completed, log }) fires after the fade
     s.setVolume(0..1)    master volume
     s.setNoise(0..1)     noise level (if the preset has noise)
     s.status()           { presetId, playing, elapsed, total }
     SovSound.headphoneCheck(onStep)   left tone, then right tone
   ========================================================================== */
(function (root) {
  "use strict";

  const FADE_IN = 8;    // seconds
  const FADE_OUT = 6;   // seconds
  const TONE_LEVEL = 0.22; // keeps pure tones gentle at full volume

  /* ---- Noise -------------------------------------------------------------
     Preferred: the AudioWorklet in js/noise-worklet.js generates noise
     continuously — no loop, so no repeating pattern and no seam.
     Fallback (worklet unavailable): a 60-second buffer whose loop point is
     made seamless by generating extra samples past the end and blending them
     into the start with an equal-power crossfade.                         */
  const WORKLET_URL = "js/noise-worklet.js";
  const workletReady = new WeakMap();

  function loadNoiseWorklet(ctx) {
    if (!ctx.audioWorklet) return Promise.reject(new Error("no AudioWorklet"));
    if (!workletReady.has(ctx)) workletReady.set(ctx, ctx.audioWorklet.addModule(WORKLET_URL));
    return workletReady.get(ctx);
  }

  function noiseSample(color, st) {
    const w = Math.random() * 2 - 1;
    if (color === "brown") { st.last = (st.last + 0.02 * w) / 1.02; return st.last * 3.5; }
    st.b0 = 0.99886 * st.b0 + w * 0.0555179; st.b1 = 0.99332 * st.b1 + w * 0.0750759;
    st.b2 = 0.96900 * st.b2 + w * 0.1538520; st.b3 = 0.86650 * st.b3 + w * 0.3104856;
    st.b4 = 0.55000 * st.b4 + w * 0.5329522; st.b5 = -0.7616 * st.b5 - w * 0.0168980;
    const v = (st.b0 + st.b1 + st.b2 + st.b3 + st.b4 + st.b5 + st.b6 + w * 0.5362) * 0.11;
    st.b6 = w * 0.115926;
    return v;
  }

  function noiseBuffer(ctx, color) {
    const len = ctx.sampleRate * 60, xf = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      const st = { b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0, last: 0 };
      for (let i = 0; i < len; i++) d[i] = noiseSample(color, st);
      // The samples that would naturally follow the end of the buffer…
      const tail = new Float32Array(xf);
      for (let i = 0; i < xf; i++) tail[i] = noiseSample(color, st);
      // …are blended into the start, so the wrap from end → start is continuous.
      for (let i = 0; i < xf; i++) {
        const t = i / xf;
        d[i] = d[i] * Math.sin(t * Math.PI / 2) + tail[i] * Math.cos(t * Math.PI / 2);
      }
    }
    return buf;
  }

  class Session {
    constructor(preset, opts = {}, onEnd = () => {}) {
      this.preset = preset;
      this.total = Math.max(0.2, opts.minutes || 20) * 60; // seconds (UI offers 10–60 min)
      this.offset = Math.max(0, opts.offset || 0);         // seconds already done (resume)
      this.volume = opts.volume ?? 0.6;
      this.noiseLevel = opts.noise ?? (preset.noise ? 0.5 : 0);
      this.onEnd = onEnd;
      this.ctx = null;
      this.ending = false;
      this.ended = false;
    }

    start() {
      const AC = root.AudioContext || root.webkitAudioContext;
      const ctx = this.ctx = new AC();
      const p = this.preset;
      const now = ctx.currentTime;

      this.master = ctx.createGain();
      this.master.gain.setValueAtTime(0.0001, now);
      this.master.gain.linearRampToValueAtTime(this.volume, now + FADE_IN);
      this.master.connect(ctx.destination);

      this.nodes = [];
      if (p.mode === "isochronic") {
        // Tone × smooth pulse (0..1) at the beat rate, sent to both ears.
        const osc = ctx.createOscillator(); osc.frequency.value = p.carrier;
        const amp = ctx.createGain(); amp.gain.value = 0;
        const lfo = ctx.createOscillator(); lfo.frequency.value = p.beat;
        const depth = ctx.createGain(); depth.gain.value = 0.5;
        const bias = ctx.createConstantSource(); bias.offset.value = 0.5;
        lfo.connect(depth).connect(amp.gain); bias.connect(amp.gain);
        const level = ctx.createGain(); level.gain.value = TONE_LEVEL;
        osc.connect(amp).connect(level).connect(this.master);
        [osc, lfo, bias].forEach((n) => n.start(now));
        this.nodes.push(osc, lfo, bias);
        this.freqs = { left: p.carrier, right: p.carrier };
      } else {
        // Binaural: separate tones hard-panned left and right.
        const left = p.carrier - p.beat / 2, right = p.carrier + p.beat / 2;
        const merger = ctx.createChannelMerger(2);
        [[left, 0], [right, 1]].forEach(([f, ch]) => {
          const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
          const g = ctx.createGain(); g.gain.value = TONE_LEVEL;
          o.connect(g).connect(merger, 0, ch);
          o.start(now); this.nodes.push(o);
        });
        merger.connect(this.master);
        this.freqs = { left, right };
      }

      if (p.noise) {
        this.noiseGain = ctx.createGain(); this.noiseGain.gain.value = this.noiseLevel * 0.5;
        // Remove sub-audible rumble (< 30 Hz) that can feel like slow swells in headphones.
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 30; hp.Q.value = 0.7;
        hp.connect(this.noiseGain).connect(this.master);
        const useBuffer = () => {
          const src = ctx.createBufferSource();
          src.buffer = noiseBuffer(ctx, p.noise); src.loop = true;
          src.connect(hp); src.start(); this.nodes.push(src);
        };
        this.ready = loadNoiseWorklet(ctx).then(() => {
          if (this.ending) return;
          const node = new AudioWorkletNode(ctx, "sov-noise", { numberOfInputs: 0, outputChannelCount: [2], processorOptions: { color: p.noise } });
          node.connect(hp); this.noiseNode = node;
        }).catch(() => { if (!this.ending) useBuffer(); });
      }

      this.t0 = now;
      this.timer = setInterval(() => this._tick(), 500);
      return this;
    }

    get elapsed() {
      return this.ctx ? this.offset + (this.ctx.currentTime - this.t0) : this.offset;
    }

    _tick() {
      if (!this.ending && this.elapsed >= this.total - FADE_OUT) this.stop({ log: true, completed: true });
    }

    setVolume(v) {
      this.volume = Math.min(1, Math.max(0, v));
      if (this.ctx && !this.ending) this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    }
    setNoise(v) {
      this.noiseLevel = Math.min(1, Math.max(0, v));
      if (this.noiseGain) this.noiseGain.gain.setTargetAtTime(this.noiseLevel * 0.5, this.ctx.currentTime, 0.1);
    }

    /** Fade out, then release everything. Resolves with { minutes, completed, elapsed }. */
    stop({ log = true, completed = false, fade = true } = {}) {
      if (this.ending) return this._endPromise;
      this.ending = true;
      clearInterval(this.timer);
      const elapsed = Math.min(this.total, this.elapsed + (fade ? FADE_OUT : 0));
      const result = { minutes: Math.round(elapsed / 60), completed, elapsed, log, presetId: this.preset.id };
      const ctx = this.ctx;
      const fadeTime = fade ? FADE_OUT : 0.05;
      this._endPromise = new Promise((resolve) => {
        if (ctx) {
          const t = ctx.currentTime;
          this.master.gain.cancelScheduledValues(t);
          this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), t);
          this.master.gain.exponentialRampToValueAtTime(0.0001, t + fadeTime);
        }
        setTimeout(() => {
          try { this.nodes.forEach((n) => n.stop()); } catch (_) {}
          try { this.noiseNode && this.noiseNode.disconnect(); } catch (_) {}
          try { ctx && ctx.close(); } catch (_) {}
          this.ended = true;
          this.onEnd(result);
          resolve(result);
        }, fadeTime * 1000 + 50);
      });
      return this._endPromise;
    }

    status() {
      return {
        presetId: this.preset.id, playing: !this.ended, ending: this.ending,
        elapsed: this.elapsed, total: this.total, volume: this.volume, noise: this.noiseLevel,
        freqs: this.freqs
      };
    }
  }

  /** Play a short tone in the left ear, then the right, so members can check their headphones. */
  function headphoneCheck(onStep = () => {}) {
    const AC = root.AudioContext || root.webkitAudioContext;
    const ctx = new AC();
    const merger = ctx.createChannelMerger(2);
    merger.connect(ctx.destination);
    const beep = (ch, at) => {
      const o = ctx.createOscillator(); o.frequency.value = 440;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.18, at + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
      o.connect(g).connect(merger, 0, ch);
      o.start(at); o.stop(at + 1);
    };
    const t = ctx.currentTime + 0.1;
    beep(0, t); onStep("left");
    setTimeout(() => { beep(1, ctx.currentTime + 0.05); onStep("right"); }, 1300);
    setTimeout(() => { onStep("done"); ctx.close(); }, 2600);
  }

  /* ---- "Ouuuum" — the reminder sound -----------------------------------
     A synthesised chant: a voice-like source (two slightly detuned saws plus
     a soft sub-octave) shaped by three formant filters that glide through
     the vowels O → U and close into the humming M, with gentle vibrato and a
     short generated room reverb. About 6.5 seconds. No audio files.        */
  const VOWELS = {               //  F1    F2    F3   (gains)
    O: [[450, 1.0], [800, 0.55], [2830, 0.12]],
    U: [[325, 1.0], [700, 0.40], [2530, 0.08]],
    M: [[250, 1.0], [1000, 0.06], [2400, 0.02]]
  };

  function reverbImpulse(ctx, seconds = 2.4) {
    const len = Math.floor(ctx.sampleRate * seconds), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return ir;
  }

  /** Schedule an Om into `dest` on `ctx`, starting at time `t0`. Returns its duration. */
  function om(ctx, dest, { t0 = ctx.currentTime + 0.05, volume = 0.5, pitch = 110 } = {}) {
    const D = 6.6;
    const out = ctx.createGain(); out.gain.value = 0;
    const dry = ctx.createGain(); dry.gain.value = 0.8;
    const wet = ctx.createGain(); wet.gain.value = 0.35;
    const verb = ctx.createConvolver(); verb.buffer = reverbImpulse(ctx);
    out.connect(dry).connect(dest); out.connect(verb).connect(wet).connect(dest);

    // Source: voice-like buzz, softened
    const src = ctx.createGain(); src.gain.value = 1;
    const tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.Q.value = 0.5;
    tone.frequency.setValueAtTime(3200, t0);
    tone.frequency.setValueAtTime(3200, t0 + 2.5);
    tone.frequency.exponentialRampToValueAtTime(420, t0 + 3.2);  // lips close → M
    const vib = ctx.createOscillator(); vib.frequency.value = 4.8;
    const vibDepth = ctx.createGain(); vibDepth.gain.setValueAtTime(0, t0);
    vibDepth.gain.linearRampToValueAtTime(1.3, t0 + 1.4);
    vib.connect(vibDepth);
    const voices = [[pitch, "sawtooth", 0.5], [pitch * 1.004, "sawtooth", 0.45], [pitch / 2, "sine", 0.35]].map(([f, type, g]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      vibDepth.connect(o.frequency);
      const og = ctx.createGain(); og.gain.value = g;
      o.connect(og).connect(src); return o;
    });
    src.connect(tone);

    // Three formant filters in parallel, gliding O → U → M
    const keys = [["O", t0 + 0.3], ["O", t0 + 1.5], ["U", t0 + 2.3], ["U", t0 + 2.6], ["M", t0 + 3.2]];
    for (let k = 0; k < 3; k++) {
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = k === 0 ? 7 : 10;
      const g = ctx.createGain();
      bp.frequency.setValueAtTime(VOWELS.O[k][0], t0);
      g.gain.setValueAtTime(VOWELS.O[k][1], t0);
      keys.forEach(([v, t]) => {
        bp.frequency.linearRampToValueAtTime(VOWELS[v][k][0], t);
        g.gain.linearRampToValueAtTime(VOWELS[v][k][1], t);
      });
      tone.connect(bp).connect(g).connect(out);
    }

    // Breath-like envelope: soft swell, long hum, slow release
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(volume, t0 + 0.45);
    out.gain.setValueAtTime(volume, t0 + 3.0);
    out.gain.linearRampToValueAtTime(volume * 0.85, t0 + 5.0);   // the long "mmm"
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + D);

    [vib, ...voices].forEach((o) => { o.start(t0); o.stop(t0 + D + 0.1); });
    return D + 2.4; // including reverb tail
  }

  /** Play an Om now on its own short-lived context. Resolves when it has finished. */
  function playOm(volume = 0.8) {
    const AC = root.AudioContext || root.webkitAudioContext;
    const ctx = new AC();
    const dur = om(ctx, ctx.destination, { volume });
    return new Promise((res) => setTimeout(() => { try { ctx.close(); } catch (_) {} res(); }, dur * 1000 + 200));
  }

  root.SovSound = { Session, headphoneCheck, om, playOm, FADE_IN, FADE_OUT };
})(typeof window !== "undefined" ? window : self);
