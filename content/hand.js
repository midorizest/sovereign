/* ==========================================================================
   THE PLANETARY HAND — Guide › Build
   Finger rulers from W. Ryan Kurczak & Richard Fish, The Art and Science of
   Vedic Astrology; mudras from Gertrud Hirschi, Mudras: Yoga in Your Hands
   (Shuni and Buddhi from the Kundalini yoga tradition).
   Loaded after guide.js and deepen.js; appends a category to the Build tab
   and adds a guided breathing pattern for each planetary mudra.
   ========================================================================== */
window.SOV = window.SOV || {};

(function () {
  const PLANETS = [
    { id: "jupiter", planet: "Jupiter", day: "Thursday", seat: "Index finger", mudra: "Jnana (Gyan) Mudra",
      form: "Touch the tip of the thumb to the tip of the index finger, with the other three fingers extended and relaxed. Rest the backs of the hands on the thighs.",
      quality: "Wisdom, expansion, faith and the urge to grow. Hirschi calls this the gesture of knowledge: the circle of thumb and index finger is the union of the individual soul with the universal.",
      visual: "Imagine a warm golden light in the chest, widening with each breath, opening your view beyond today's concerns.",
      affirm: "I grow in wisdom and see the larger pattern.",
      cue: "When you need perspective, before study or teaching, and as the standard gesture for any sitting practice.",
      hand: "right" },
    { id: "saturn", planet: "Saturn", day: "Saturday", seat: "Middle finger", mudra: "Shuni Mudra",
      form: "Touch the tip of the thumb to the tip of the middle finger, with the other fingers extended. Rest the hands on the thighs, palms up.",
      quality: "Patience, discipline, structure and endurance. Saturn rules time; this gesture is used to steady the mind and keep commitments.",
      visual: "Imagine yourself as a mountain: unmoved by weather, patient through seasons, rooted and enduring.",
      affirm: "I am patient, steady and true to my word.",
      cue: "When impatience or restlessness rises, on difficult days of retention, and when committing to a long-term goal.",
      hand: "either",
      source: "Shuni mudra from the Kundalini yoga tradition" },
    { id: "sun", planet: "The Sun", day: "Sunday", seat: "Ring finger", mudra: "Prithvi Mudra",
      form: "Touch the tip of the thumb to the tip of the ring finger with light pressure, the other fingers extended. Do this with both hands.",
      quality: "Vitality, confidence, self-assurance and stamina. Hirschi connects the ring finger with the root chakra and describes this mudra as restoring stability, staying power and trust in your own steps.",
      visual: "Inhale earth energy up through the soles of the feet to the crown; exhale and let it fall like golden rain into a basin in your pelvic floor.",
      affirm: "I stand in my own light, rooted and radiant.",
      cue: "When you feel unsure of yourself, unsteady or depleted, and before stepping into a role that needs presence.",
      hand: "right" },
    { id: "mercury", planet: "Mercury", day: "Wednesday", seat: "Little finger", mudra: "Buddhi Mudra",
      form: "Touch the tip of the thumb to the tip of the little finger, the other fingers extended and relaxed.",
      quality: "Communication, clarity, intelligence and quickness of mind. In palmistry, the little finger also holds creativity and a sense of beauty.",
      visual: "Imagine a clear stream running through the throat and mind, carrying words that are true, kind and precise.",
      affirm: "My mind is clear and my words are true.",
      cue: "Before an important conversation, presentation or piece of writing, and when thoughts feel tangled.",
      hand: "either",
      source: "Buddhi mudra from the Kundalini yoga tradition" },
    { id: "mars", planet: "Mars", day: "Tuesday", seat: "Thumb", mudra: "Linga Mudra",
      form: "Place the palms together and interlace the fingers. Keep one thumb upright and encircle it with the thumb and index finger of the other hand. Hold in front of the lower belly.",
      quality: "Will, courage, drive and vital fire. Hirschi describes this upright mudra as generating heat in the body. It is the fire of Mars, which here is held and directed rather than spent.",
      visual: "Imagine a steady flame in the lower belly, bright and contained, burning away hesitation.",
      affirm: "My will is strong and my fire is mine to direct.",
      cue: "When you need courage or momentum, and when desire runs high and needs a focused channel.",
      hand: "both", caution: "Linga mudra generates heat. Hold it for shorter periods (5–10 minutes), and stop if you feel sluggish or overheated." },
    { id: "moon", planet: "The Moon", day: "Monday", seat: "Palm · lunar mount", mudra: "Dhyani Mudra",
      form: "Place both hands like bowls in your lap, the left hand resting in the right, thumbs lightly touching to form a circle.",
      quality: "Feeling, intuition, receptivity and rest. The Moon has no finger; it rules the fleshy outer edge of the palm. This is the classic gesture of receptive meditation, emptying so that you can be filled.",
      visual: "Imagine the bowl of your hands filling slowly with cool silver moonlight, and your mind becoming as still as water.",
      affirm: "I receive, I rest, I trust the tide.",
      cue: "For quiet meditation, the Akashic Window, the menstrual and luteal phases, and whenever you need to stop doing and simply be.",
      hand: "left" },
    { id: "venus", planet: "Venus", day: "Friday", seat: "Palm · thumb mount", mudra: "Lotus Mudra",
      form: "At the heart, join the heels of the hands. Keep the tips of the little fingers and the outer edges of the thumbs touching, and open the other fingers wide like a flower. After four breaths, close into a bud, then open again.",
      quality: "Love, beauty, harmony and sensuality. Venus rules the mound at the base of the thumb. Hirschi associates the Lotus with the heart chakra and with love given purely, like a flower open to the sun.",
      visual: "Imagine a lotus opening at the centre of the chest, rising clean from muddy water, open to the light.",
      affirm: "My heart is open, pure and generous.",
      cue: "Before intimacy, after conflict, when you feel closed or guarded, and on days that call for warmth.",
      hand: "left" }
  ];

  /* Breathing patterns for the pacer: slow 4 / 6 breath with the mudra and its affirmation. */
  SOV.PACER = SOV.PACER || {};
  PLANETS.forEach((p) => {
    SOV.PACER["hand-" + p.id] = {
      title: `${p.planet} · ${p.mudra}`,
      note: p.form,
      logs: "meditation",
      phases: [
        { label: "Inhale", sub: `${p.mudra.replace(" Mudra", "")} · ${p.planet}`, s: 4, grow: 1 },
        { label: "Exhale", sub: p.affirm, s: 6, grow: 0 }
      ]
    };
  });

  const items = [
    {
      id: "hand-overview", title: "The Two Hands", tracks: ["men", "women"], time: "Read first",
      labels: { steps: "Principles", cue: "In practice" },
      why: "The Vedic tradition distinguishes the hands as well as the fingers. The right hand projects and relates to the solar channel, Pingala. The left hand receives and relates to the lunar channel, Ida. This is the Hermetic Principle of Gender in your own body.",
      steps: [
        "Index — Jupiter. Middle — Saturn. Ring — the Sun. Little — Mercury. Thumb — Mars.",
        "The Moon and Venus have no finger: the Moon rules the outer edge of the palm, and Venus the mound at the base of the thumb.",
        "Right hand (projecting): suits the Sun, Mars and Jupiter. Left hand (receiving): suits the Moon and Venus. Mercury and Saturn are neutral.",
        "Most mudras are held with both hands, which balances the two. To emphasise expressing a quality, focus on the right; to absorb it, the left.",
        "Each planet rules a day: Sun–Sunday, Moon–Monday, Mars–Tuesday, Mercury–Wednesday, Jupiter–Thursday, Venus–Friday, Saturn–Saturday."
      ],
      cue: "Hold the day's mudra for 5–15 minutes in your morning sitting, or choose by need.",
      source: "Kurczak & Fish, The Art and Science of Vedic Astrology; Hirschi, Mudras: Yoga in Your Hands",
      lesson: "planetary-hand"
    },
    ...PLANETS.map((p) => ({
      id: "hand-" + p.id,
      title: `${p.planet} · ${p.mudra}`,
      tracks: ["men", "women"],
      time: `${p.day} · ${p.seat}`,
      labels: { steps: "Practice", cue: "When to use it" },
      why: p.quality,
      steps: [
        p.form,
        `Hand: ${p.hand === "right" ? "emphasise the right (projecting) hand, or use both" : p.hand === "left" ? "emphasise the left (receiving) hand, or use both" : "use both hands"}.`,
        "Close your eyes and breathe slowly: in for four, out for six.",
        p.visual,
        `Silently repeat: "${p.affirm}"`,
        "Hold for 5–15 minutes with a light touch, then release and rest your hands on your thighs."
      ],
      cue: p.cue,
      caution: p.caution,
      source: p.source || "Finger ruler from Kurczak & Fish; mudra from Hirschi, Mudras: Yoga in Your Hands",
      tool: { type: "breath", pattern: "hand-" + p.id }
    }))
  ];

  SOV.GUIDE = SOV.GUIDE || {};
  if (SOV.GUIDE.build && !SOV.GUIDE.build.categories.some((c) => c.figure === "planetary-hand")) {
    SOV.GUIDE.build.categories.push({
      name: "The Planetary Hand",
      sub: "As above, so below: each finger is ruled by a planet, and each mudra calls on its qualities.",
      figure: "planetary-hand",
      items
    });
  }
})();
