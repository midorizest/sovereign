/* ==========================================================================
   SOVEREIGN — Content
   All written content for the first build lives here, separate from logic,
   so it can be edited without touching app.js.
   Full lesson texts are lazy-loaded from /content/*.js (see LESSONS below).
   ========================================================================== */
window.SOV = window.SOV || {};

/* --------------------------------------------------------------------------
   1. DISCLAIMER (first launch, also viewable in Settings)
   -------------------------------------------------------------------------- */
SOV.DISCLAIMER = `
  <h3>Before you begin</h3>
  <p><strong>Sovereign is an educational and tracking tool. It is not a medical device</strong>, and nothing in it is medical, psychological, or sexual-health advice. It does not diagnose, treat, or prevent any condition.</p>
  <p>The practices here draw on Taoist, yogic, Ayurvedic, and Hermetic traditions. Many of their claims are traditional teachings rather than established science. We present them as frameworks for practice and invite you to test them against your own experience.</p>
  <p><strong>Consult a qualified health professional</strong> before beginning breathwork or energy practices if you are pregnant, have a heart condition, high or low blood pressure, epilepsy, a history of fainting, glaucoma, a psychiatric condition, or a history of trauma.</p>
  <p><strong>Stop any practice immediately</strong> if you feel dizzy, faint, numb, short of breath, or distressed. Never practise breathwork in or near water, or while driving. Don't use the sound sessions while driving, and avoid them if you have epilepsy or a history of seizures.</p>
  <p>Retention and cycle awareness are personal choices, not requirements for health or worth. If you are struggling with compulsive sexual behaviour, pain, changes in your cycle, or your mental health, please speak to a professional.</p>
  <p><strong>Your data stays on this device.</strong> Nothing is sent anywhere. If you clear your browser data or uninstall the app, your progress is erased — use <em>Export</em> in Settings to keep a backup.</p>
`;

/* --------------------------------------------------------------------------
   2. DAILY PRACTICES (Home checklist)
   kind: "minutes" | "retention" | "cycle" | "journal"
   tracks: which tracks see the practice
   -------------------------------------------------------------------------- */
SOV.POINTS = { practice: 10, protocol: 15, lesson: 20 };

SOV.PRACTICES = [
  { id: "grounding",  name: "Grounding",  kind: "minutes", tracks: ["men", "women"],
    desc: "Bare feet on earth, a copper mat, or direct earth contact." },
  { id: "breath",     name: "Breathwork", kind: "minutes", tracks: ["men", "women"],
    desc: {
      beginner: "Slow belly breathing: in for 4, out for 6.",
      intermediate: "Box breath (4-4-4-4) into the lower belly.",
      advanced: "Microcosmic Orbit breathing — up the spine, down the front."
    } },
  { id: "retention",  name: "Retention Check-In", kind: "retention", tracks: ["men"],
    desc: "An honest check-in. No judgement either way." },
  { id: "cycle",      name: "Cycle Awareness", kind: "cycle", tracks: ["women"],
    desc: "Notice where you are in your cycle today." },
  { id: "meditation", name: "Meditation", kind: "minutes", tracks: ["men", "women"],
    desc: "Sit. Breathe. Watch without grasping." },
  { id: "journal",    name: "Journal", kind: "journal", tracks: ["men", "women"],
    desc: "What did you notice about your energy today?" }
];

SOV.CYCLE_PHASES = [
  { id: "menstrual",  label: "Menstrual",  note: "Inner winter. Rest, release, listen." },
  { id: "follicular", label: "Follicular", note: "Inner spring. Energy rising; begin." },
  { id: "ovulatory",  label: "Ovulatory",  note: "Inner summer. Fullness; express and connect." },
  { id: "luteal",     label: "Luteal",     note: "Inner autumn. Turn inward; refine and complete." },
  { id: "unsure",     label: "Unsure / Not cycling", note: "Follow the moon, or simply your body today." }
];

/* --------------------------------------------------------------------------
   3. PROTOCOLS
   Each step: { title, seconds, prompt }. Total of seconds = duration.
   `variants` lets a step change wording by track.
   -------------------------------------------------------------------------- */
SOV.PROTOCOLS = [
  {
    id: "grounding-reset",
    title: "The 5-Minute Grounding Reset",
    level: "beginner",
    tracks: ["men", "women"],
    minutes: 5,
    logsPractice: "grounding",
    summary: "Discharge scattered energy into the earth, draw stable energy up, and seal it in the lower belly. The foundation of every other practice.",
    setup: "Stand barefoot on grass, soil, sand, or stone — or on a grounding mat indoors. If you can't stand, sit with both feet flat on the floor.",
    benefits: [
      "Settles the nervous system and slows the breath",
      "Pulls attention out of the head and into the body",
      "Builds the habit of returning to centre before you spend energy",
      "Prepares the lower belly as a reservoir for later transmutation work"
    ],
    steps: [
      { title: "Arrive", seconds: 30,
        prompt: "Stand with feet hip-width apart, knees soft, spine long. Let your arms hang. Close your eyes or soften your gaze to the ground. You have nowhere else to be for five minutes." },
      { title: "Root", seconds: 60,
        prompt: "Feel the weight of your body sink into your heels. Breathe in for four, out for six. With each exhale, imagine roots growing from the soles of your feet down into the cool, dark earth." },
      { title: "Discharge", seconds: 60,
        prompt: "On each exhale, let tension, static, and borrowed agitation drain down through your legs and into the ground. Notice which pendulums have been pulling at you today. Let the earth take what is not yours." },
      { title: "Draw Up", seconds: 60,
        prompt: "On each inhale, draw cool, steady earth energy up through the soles of your feet, up the legs, and gather it low in the belly, three finger-widths below the navel. Exhale and let it settle there." },
      { title: "Seal", seconds: 60,
        variants: {
          men: "Place your palms over your lower belly, left hand over right. Feel warmth gather beneath your hands. You are a battery, charging. Hold the energy here — calm, contained, yours.",
          women: "Place your palms over your womb space, right hand over left. Feel warmth gather beneath your hands. You are a vessel, filling. Hold the energy here — calm, contained, yours."
        } },
      { title: "Return", seconds: 30,
        prompt: "Choose one word for how you will carry this energy today. Breathe it into your belly. When you are ready, open your eyes. You are grounded. You are sovereign." }
    ]
  }
];

/* Shown as "coming next" so members can see the path ahead. */
SOV.UPCOMING_PROTOCOLS = [
  { title: "The Breath of Fire", level: "beginner", tracks: ["men", "women"] },
  { title: "The Morning Retention Check-In", level: "beginner", tracks: ["men"] },
  { title: "Cycle Syncing", level: "beginner", tracks: ["women"] },
  { title: "Yoni Breathing", level: "beginner", tracks: ["women"] },
  { title: "The 15-Minute Transmutation Practice", level: "intermediate", tracks: ["men", "women"] },
  { title: "The Mirror Gaze", level: "intermediate", tracks: ["men", "women"] },
  { title: "The Womb Meditation", level: "intermediate", tracks: ["women"] },
  { title: "The 2–3 AM Akashic Window", level: "advanced", tracks: ["men", "women"] },
  { title: "The Full Ojas Build Protocol", level: "advanced", tracks: ["men"] },
  { title: "The Serpent Rising", level: "advanced", tracks: ["men", "women"] },
  { title: "The Priestess Protocol", level: "advanced", tracks: ["women"] },
  { title: "The Maker's Verdict Meditation", level: "advanced", tracks: ["men", "women"] }
];

/* --------------------------------------------------------------------------
   4. LESSONS
   `file` lessons are lazy-loaded when opened. Others are listed as upcoming.
   -------------------------------------------------------------------------- */
SOV.LESSONS = [
  { id: "what-is-sexual-energy", title: "What Is Sexual Energy?", level: "beginner", minutes: 5,
    file: "content/lesson-what-is-sexual-energy.js",
    summary: "The raw current beneath desire — and why the traditions treat it as fuel rather than appetite." },
  { id: "science-of-retention", title: "The Science of Retention", level: "beginner", minutes: 5,
    file: "content/lesson-science-of-retention.js",
    summary: "What research shows, what it doesn't, and what the traditions actually teach." },
  { id: "grounding-bioelectricity", title: "Grounding and Bioelectricity", level: "beginner", minutes: 5,
    file: "content/lesson-grounding-bioelectricity.js",
    summary: "The body as a battery, what earthing research suggests, and why the root comes first." },
  { id: "role-of-breathwork", title: "The Role of Breathwork", level: "beginner", minutes: 5,
    file: "content/lesson-role-of-breathwork.js",
    summary: "The bridge between body and energy: calming, energising, moving and going inward." },
  { id: "planetary-hand", title: "The Planetary Hand", level: "beginner", minutes: 6,
    file: "content/lesson-planetary-hand.js",
    summary: "As above, so below: the planets that rule each finger, and the mudras that call on them." },
  { id: "transmutation", title: "Transmutation Practices", level: "intermediate", minutes: 5,
    file: "content/lesson-transmutation.js",
    summary: "The full map: conserve, gather and raise, circulate, and express." },
  { id: "esoteric-principles", title: "The Esoteric Principles", level: "intermediate", minutes: 5,
    file: "content/lesson-esoteric-principles.js",
    summary: "The Kybalion's seven principles, Transurfing's pendulums, and the lion of Arcanum XI." },
  { id: "energetic-signature", title: "The Energetic Signature", level: "intermediate", minutes: 6,
    file: "content/lesson-energetic-signature.js",
    summary: "Cultivation doesn't change you directly. It changes the signature you carry — and that changes your reality." },
  { id: "pitfalls", title: "Common Pitfalls and How to Avoid Them", level: "intermediate", minutes: 5,
    file: "content/lesson-pitfalls.js",
    summary: "Suppression, energy in the head, streak obsession, the shame spiral — and the way out of each." },
  { id: "akashic-window", title: "The Akashic Records and the 2–3 AM Window", level: "advanced", minutes: 6,
    file: "content/lesson-akashic-window.js",
    summary: "Akasha, the night vigil, the receptive drowsy mind — and how to practise without harming sleep." }
];

/* --------------------------------------------------------------------------
   5. JOURNAL PROMPTS (30 — one per day, rotating)
   The fixed daily question is always shown above these.
   -------------------------------------------------------------------------- */
SOV.PROMPTS = [
  "Where in your body did you feel the most energy today? Where the least?",
  "What drained you today — and did you consent to it?",
  "Which pendulum pulled at your attention most strongly today?",
  "When did you feel most like yourself today?",
  "What thought did you return to again and again? Is it yours?",
  "Describe a moment today when you chose stillness over reaction.",
  "Where did desire arise today, and what did you do with it?",
  "What would the lion in you do differently tomorrow?",
  "How did the earth feel beneath your feet today?",
  "What did your breath tell you that your mind did not?",
  "Nothing rests; everything vibrates. What was your vibration today?",
  "What did you give your attention to that did not deserve it?",
  "Where did you feel the masculine in you today? The feminine?",
  "What are you building with the energy you are keeping?",
  "Name one thing you did today purely for your own sovereignty.",
  "What did your body ask for that you ignored?",
  "When did you feel warmth gather in your lower belly?",
  "What image or memory kept returning? What might it be asking?",
  "Who did you compare yourself to today? What did it cost you?",
  "As within, so without. What inner state did your surroundings reflect?",
  "What did you create today, however small?",
  "Where did you feel tension held, and where did you release it?",
  "If your energy were a flame today, how would you describe it?",
  "What boundary did you hold, or wish you had held?",
  "What did your dreams or quiet moments show you?",
  "Where did strength and gentleness meet in you today?",
  "What urge did you notice, and what was underneath it?",
  "What are you grateful your body carried you through today?",
  "What is the next small act of mastery available to you?",
  "Looking back on this month, what has shifted in how you hold your energy?"
];

/* --------------------------------------------------------------------------
   6. MILESTONE MESSAGES (streak days)
   -------------------------------------------------------------------------- */
SOV.MILESTONES = {
  7:   { title: "The First Seal", text: "Seven days. A week of returning to yourself. The body has begun to notice that you are listening. This is where every master once stood." },
  14:  { title: "The Root Takes Hold", text: "Fourteen days. What was effort is becoming rhythm. You have proven that your word to yourself holds weight." },
  30:  { title: "One Moon", text: "Thirty days — a full lunar cycle of practice. You have moved through every phase and kept your centre. The current is building." },
  60:  { title: "The Vessel Strengthens", text: "Sixty days. Your energy no longer leaks through the same old doors. Others may sense a steadiness in you before they can name it." },
  90:  { title: "The Lion Is Calm", text: "Ninety days. Like the figure of Arcanum XI, you hold the lion's jaw not by force but by presence. Strength has become gentle." },
  180: { title: "Half the Sun's Journey", text: "One hundred and eighty days. Half a year of sovereign practice. This is no longer something you do — it is becoming who you are." },
  365: { title: "The Circle Complete", text: "Three hundred and sixty-five days. A full turning of the sun. You have kept faith with yourself through every season. Walk on — the path deepens from here." }
};

/* --------------------------------------------------------------------------
   7. DAILY PRINCIPLES (rotating on Home — woven, not preached)
   Kybalion quotes are from the 1908 public-domain text.
   -------------------------------------------------------------------------- */
SOV.PRINCIPLES = [
  { q: "The All is Mind; the Universe is Mental.", src: "The Kybalion · Mentalism" },
  { q: "Nothing rests; everything moves; everything vibrates.", src: "The Kybalion · Vibration" },
  { q: "Gender is in everything; everything has its Masculine and Feminine Principles.", src: "The Kybalion · Gender" },
  { q: "As above, so below; as below, so above.", src: "The Kybalion · Correspondence" },
  { q: "Everything flows, out and in; everything has its tides.", src: "The Kybalion · Rhythm" },
  { q: "Whatever you feed with attention, you feed with life force. Choose your pendulums.", src: "Sovereign · Transurfing" },
  { q: "The lion is not slain. It is held gently, and so becomes your strength.", src: "Sovereign · Arcanum XI" },
  { q: "The body is a battery. Ground it, charge it, and do not leak it.", src: "Sovereign · Bioelectricity" },
  { q: "Desire is not the enemy. Unconscious spending is.", src: "Sovereign · Transmutation" }
];

/* --------------------------------------------------------------------------
   8. SOUND — binaural & isochronic presets (Protocols › Sound)
   Generated live by js/sound-engine.js; no audio files.
     beat     the perceived beat / pulse rate in Hz
     carrier  the base tone in Hz (binaural: L = carrier − beat/2, R = carrier + beat/2)
     mode     "binaural" (headphones) or "isochronic" (pulsed; speakers OK)
     noise    null | "pink" | "brown"
     pairs    a practice it pairs well with (shown on the card)
   -------------------------------------------------------------------------- */
SOV.SOUND = {
  presets: [
    { id: "deep-sleep", name: "Deep Sleep", band: "Delta", glyph: "δ", beat: 3, carrier: 150, mode: "binaural", noise: null, minutes: 30,
      desc: "The slowest waves, associated with deep, dreamless sleep. Play as you drift off, at a low volume.",
      pairs: "Impress the Subconscious Before Sleep" },
    { id: "meditation", name: "Meditation", band: "Theta", glyph: "θ", beat: 6, carrier: 200, mode: "binaural", noise: null, minutes: 20,
      desc: "The twilight state between waking and sleep, linked with deep meditation and inner imagery.",
      pairs: "So Hum · The Microcosmic Orbit" },
    { id: "schumann", name: "Schumann Resonance", band: "Earth", glyph: "⊕", beat: 7.83, carrier: 180, mode: "binaural", noise: "brown", minutes: 20,
      desc: "7.83 Hz, the fundamental resonance of the cavity between the Earth and the ionosphere, under a soft bed of brown noise. Traditionally used for grounding.",
      pairs: "The 5-Minute Grounding Reset" },
    { id: "calm-focus", name: "Calm Focus", band: "Alpha", glyph: "α", beat: 10, carrier: 220, mode: "binaural", noise: "pink", minutes: 25,
      desc: "Relaxed, alert awareness: eyes-closed calm or easy, unhurried work. Softened with pink noise.",
      pairs: "The Creative First Hour" },
    { id: "deep-focus", name: "Deep Focus", band: "Beta", glyph: "β", beat: 14, carrier: 240, mode: "binaural", noise: null, minutes: 45,
      desc: "Low beta, associated with sustained, engaged concentration.",
      pairs: "The Transmutation Sprint" },
    { id: "alertness", name: "Alertness", band: "Beta", glyph: "β", beat: 20, carrier: 260, mode: "binaural", noise: null, minutes: 20,
      desc: "Higher beta, associated with active thinking and energy. Best earlier in the day.",
      pairs: "Train Heavy, Recover Fully" },
    { id: "peak-state", name: "Peak State", band: "Gamma", glyph: "γ", beat: 40, carrier: 300, mode: "isochronic", noise: null, minutes: 15,
      desc: "40 Hz gamma, associated with heightened integration and insight. Delivered as smooth isochronic pulses, which are felt more clearly at this speed than binaural beats.",
      pairs: "Charged Creation Ritual" }
  ],

  safety: "Use headphones at a low, comfortable volume. Don't listen while driving or operating machinery. Avoid if you have epilepsy or a history of seizures, or a pacemaker, unless your doctor approves. Stop if you feel discomfort. Research on brainwave entrainment is still mixed: treat these as aids to relaxation and focus, not treatments.",

  /* ------------------------------------------------------------------------
     RECOMMENDED CREATOR — a shout-out, like the authors in Books.
     Fill in name + url to show the card; leave url empty to hide it.
     ------------------------------------------------------------------------ */
  credits: [
    { name: "", url: "", note: "" }
  ]
};
