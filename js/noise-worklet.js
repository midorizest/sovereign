/* ==========================================================================
   SOVEREIGN — Continuous noise generator (AudioWorklet)
   Generates pink or brown noise sample by sample, forever, so there is no
   looping buffer and therefore no repeating pattern or loop-seam dip
   (the cause of the "wave" heard in v1.3–1.5).
   Each channel has its own generator, so the stereo image stays wide.
   ========================================================================== */
class SovNoise extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.color = (options.processorOptions && options.processorOptions.color) || "pink";
    // Per-channel filter state (up to 2 channels)
    this.state = [0, 1].map(() => ({ b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0, last: 0 }));
  }
  process(_inputs, outputs) {
    const out = outputs[0];
    for (let ch = 0; ch < out.length; ch++) {
      const d = out[ch], s = this.state[ch] || this.state[0];
      if (this.color === "brown") {
        for (let i = 0; i < d.length; i++) {
          const w = Math.random() * 2 - 1;
          s.last = (s.last + 0.02 * w) / 1.02; // leaky integrator → 1/f² spectrum
          d[i] = s.last * 3.5;
        }
      } else { // pink — Paul Kellet's refined method
        for (let i = 0; i < d.length; i++) {
          const w = Math.random() * 2 - 1;
          s.b0 = 0.99886 * s.b0 + w * 0.0555179; s.b1 = 0.99332 * s.b1 + w * 0.0750759;
          s.b2 = 0.96900 * s.b2 + w * 0.1538520; s.b3 = 0.86650 * s.b3 + w * 0.3104856;
          s.b4 = 0.55000 * s.b4 + w * 0.5329522; s.b5 = -0.7616 * s.b5 - w * 0.0168980;
          d[i] = (s.b0 + s.b1 + s.b2 + s.b3 + s.b4 + s.b5 + s.b6 + w * 0.5362) * 0.11;
          s.b6 = w * 0.115926;
        }
      }
    }
    return true; // keep running
  }
}
registerProcessor("sov-noise", SovNoise);
