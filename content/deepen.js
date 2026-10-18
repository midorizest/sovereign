/* ==========================================================================
   DEEPEN — advanced knowledge (Guide › Deepen) and the reading list (Guide › Books)
   Lazy-loaded with the Guide.

   Extra item fields used here:
     evidence  short tag shown in the header (e.g. "Some clinical evidence")
     labels    { steps, cue } to rename the "How" / "When to use it" headings
     tool      { type: "breath", pattern: "<id>" } or { type: "mala", mantra: "..." }
               adds a "Practise now" button that opens the breath / mantra pacer
   ========================================================================== */
window.SOV = window.SOV || {};
SOV.GUIDE = SOV.GUIDE || {};

/* --------------------------------------------------------------------------
   BREATH & MANTRA PACER PATTERNS
   Each phase: { label, sub, s (seconds), grow: 1 | 0 | null(hold) }
   -------------------------------------------------------------------------- */
SOV.PACER = {
  "so-hum": { title: "So Hum", note: "Hear “So” on the in-breath, “Hum” on the out-breath. I am That.",
    phases: [{ label: "Inhale", sub: "So…", s: 4, grow: 1 }, { label: "Exhale", sub: "Hum…", s: 6, grow: 0 }] },
  "aum": { title: "AUM Chant", note: "Chant aloud on the exhale: A from the belly, U through the chest, M humming in the head. Then rest in the silence.",
    phases: [{ label: "Inhale", sub: "Fill from the belly", s: 4, grow: 1 }, { label: "Chant", sub: "Aaa — Uuu — Mmm…", s: 10, grow: 0 }, { label: "Silence", sub: "Listen", s: 3, grow: null }] },
  "bija": { title: "Bija Ascent", note: "One seed sound per centre, rising from root to crown. Chant each on a long exhale and feel it vibrate in that place.",
    phases: [
      { label: "Inhale", sub: "Root", s: 4, grow: 1 }, { label: "Chant", sub: "LAM · base of spine", s: 7, grow: 0 },
      { label: "Inhale", sub: "Sacral", s: 4, grow: 1 }, { label: "Chant", sub: "VAM · below the navel", s: 7, grow: 0 },
      { label: "Inhale", sub: "Solar plexus", s: 4, grow: 1 }, { label: "Chant", sub: "RAM · solar plexus", s: 7, grow: 0 },
      { label: "Inhale", sub: "Heart", s: 4, grow: 1 }, { label: "Chant", sub: "YAM · centre of chest", s: 7, grow: 0 },
      { label: "Inhale", sub: "Throat", s: 4, grow: 1 }, { label: "Chant", sub: "HAM · throat", s: 7, grow: 0 },
      { label: "Inhale", sub: "Brow", s: 4, grow: 1 }, { label: "Chant", sub: "OM · between the eyebrows", s: 8, grow: 0 },
      { label: "Silence", sub: "Crown · rest in stillness", s: 8, grow: null }
    ] },
  "healing-sounds": { title: "Six Healing Sounds", note: "Make each sound slowly and softly, almost a whisper, picturing the organ releasing heat and tension.",
    phases: [
      { label: "Inhale", sub: "Lungs · release grief", s: 4, grow: 1 }, { label: "Sound", sub: "Ssssss…", s: 8, grow: 0 },
      { label: "Inhale", sub: "Kidneys · release fear", s: 4, grow: 1 }, { label: "Sound", sub: "Chooooo…", s: 8, grow: 0 },
      { label: "Inhale", sub: "Liver · release anger", s: 4, grow: 1 }, { label: "Sound", sub: "Shhhhhh…", s: 8, grow: 0 },
      { label: "Inhale", sub: "Heart · release impatience", s: 4, grow: 1 }, { label: "Sound", sub: "Hawwww…", s: 8, grow: 0 },
      { label: "Inhale", sub: "Spleen · release worry", s: 4, grow: 1 }, { label: "Sound", sub: "Whoooo…", s: 8, grow: 0 },
      { label: "Inhale", sub: "Triple Warmer · balance", s: 4, grow: 1 }, { label: "Sound", sub: "Heeeee…", s: 8, grow: 0 }
    ] },
  "nadi": { title: "Alternate Nostril Breath", note: "Right thumb closes the right nostril; right ring finger closes the left. Smooth and silent.",
    phases: [
      { label: "Inhale", sub: "Left nostril", s: 4, grow: 1 }, { label: "Exhale", sub: "Right nostril", s: 6, grow: 0 },
      { label: "Inhale", sub: "Right nostril", s: 4, grow: 1 }, { label: "Exhale", sub: "Left nostril", s: 6, grow: 0 }
    ] },
  "bhramari": { title: "Bee Breath", note: "Close your ears gently with your thumbs, lips sealed, and hum like a bee on the exhale. Feel the skull vibrate.",
    phases: [{ label: "Inhale", sub: "Through the nose", s: 4, grow: 1 }, { label: "Hum", sub: "Mmmmmmm…", s: 8, grow: 0 }] },
  "478": { title: "4-7-8 Breath", note: "Inhale through the nose, hold, exhale through the mouth with a soft whoosh. Deeply calming.",
    phases: [{ label: "Inhale", sub: "Nose · 4", s: 4, grow: 1 }, { label: "Hold", sub: "7", s: 7, grow: null }, { label: "Exhale", sub: "Mouth · 8", s: 8, grow: 0 }] },
  "kumbhaka": { title: "Retention (Kumbhaka)", note: "Hold with a gentle root lock and the chin slightly lowered. Never strain — shorten the hold if you feel any discomfort.",
    phases: [{ label: "Inhale", sub: "Slow and full", s: 4, grow: 1 }, { label: "Hold", sub: "Root lock · stillness", s: 12, grow: null }, { label: "Exhale", sub: "Slow release", s: 8, grow: 0 }] }
};

/* --------------------------------------------------------------------------
   DEEPEN TAB
   -------------------------------------------------------------------------- */
SOV.GUIDE.deepen = {
  intro: "Cultivation does not change you directly. It changes your energetic signature — the frequency you carry into every room and decision — and that signature reshapes your reality. Like feeding the body well, this is foundation work. Go slowly. Go inward.",
  lesson: "energetic-signature",
  categories: [
    /* ---------------- Sound ---------------- */
    {
      name: "The Inner Sound",
      sub: "Mantra and chant train the mind to rest on vibration instead of thought.",
      items: [
        {
          id: "so-hum", title: "So Hum — The Breath Mantra", tracks: ["men", "women"], time: "5–20 min",
          why: "The simplest and most ancient of mantras: the sound the breath already makes. “So” on the inhale, “Hum” on the exhale — I am That. Because it rides the breath, it carries you inward without effort.",
          steps: [
            "Sit upright, eyes closed, hands resting on the thighs or in Gyan mudra (index finger and thumb touching).",
            "Let the breath move naturally through the nose. Don't control it.",
            "Silently hear “So” as the breath enters, “Hum” as it leaves.",
            "When thoughts arrive, notice them and return to the sound. The returning is the practice.",
            "In time, let the mantra fade and rest in the space between breaths."
          ],
          cue: "Your daily sitting practice, or any time you need to drop below the noise of thought.",
          tool: { type: "breath", pattern: "so-hum" }
        },
        {
          id: "aum", title: "Chanting AUM", tracks: ["men", "women"], time: "5–10 min",
          why: "In the Vedic tradition, AUM is the primordial vibration from which all sound arises. Chanting it aloud is felt physically: belly, chest, and skull resonate in turn. The silence afterward is where the practice really happens.",
          steps: [
            "Sit tall and inhale deeply into the belly.",
            "On the exhale, chant A (as in ‘father’) from the belly, flow into U (‘you’) in the chest, and close into a long humming M in the head.",
            "Let the M fade completely. Rest in the silence for one breath.",
            "Repeat 9, 21, or 108 times."
          ],
          cue: "To open a meditation, or after a draining day to re-tune your field.",
          tool: { type: "breath", pattern: "aum" }
        },
        {
          id: "bija-ascent", title: "Bija Mantras — The Seed Sounds", tracks: ["men", "women"], time: "10 min",
          why: "The tantric traditions assign a seed syllable to each energy centre. Chanting them from root to crown is a sound-based form of transmutation: you lift vibration step by step, the same path cultivated energy travels.",
          steps: [
            "LAM — root, base of the spine (stability).",
            "VAM — sacral, below the navel (sexual and creative energy).",
            "RAM — solar plexus (will and power).",
            "YAM — heart (love, connection).",
            "HAM — throat (expression, truth).",
            "OM — brow, between the eyebrows (insight). Then rest in silence at the crown.",
            "Chant each on a long exhale, three times, feeling the vibration in that place."
          ],
          cue: "After root breathing, to move gathered energy upward through every centre.",
          source: "Tantric and yogic tradition",
          tool: { type: "breath", pattern: "bija" }
        },
        {
          id: "six-healing-sounds", title: "The Six Healing Sounds", tracks: ["men", "women"], time: "10 min",
          why: "A Taoist practice for releasing heat and stuck emotion from the organs before you cultivate. Each organ has a sound and an emotion it holds. Chia teaches it as preparation for the deeper orbit work, and best done before sleep.",
          steps: [
            "Lungs — “Ssss” — release grief and sadness.",
            "Kidneys — “Chooo” — release fear.",
            "Liver — “Shhhh” — release anger.",
            "Heart — “Hawww” — release impatience and hastiness.",
            "Spleen — “Whooo” — release worry.",
            "Triple Warmer — “Heee” — balance the whole body.",
            "Make each sound slowly and softly, then smile inwardly to the organ and breathe in its positive quality."
          ],
          cue: "Before bed, or whenever an emotion feels lodged in the body.",
          source: "Mantak Chia, The Six Healing Sounds",
          tool: { type: "breath", pattern: "healing-sounds" }
        },
        {
          id: "japa-mala", title: "Japa — 108 Repetitions", tracks: ["men", "women"], time: "10–20 min",
          why: "Japa is the repetition of a mantra a fixed number of times, traditionally 108, counted on a mala of beads. The counting keeps the mind occupied just enough to let something deeper surface. Over weeks, the mantra begins to repeat itself.",
          steps: [
            "Choose one mantra and keep it for at least 40 days. Options: “Om Namah Shivaya” (I bow to the inner Self), “So Hum,” “AUM,” or a short phrase of your own intention.",
            "Hold the mala in the right hand, moving one bead per repetition with the thumb. Don't cross the larger guru bead; turn around instead.",
            "Begin aloud, then whisper, then repeat silently.",
            "No mala? Use the counter in this app — tap once per repetition."
          ],
          cue: "Morning or evening, at the same time each day. Consistency builds the current.",
          tool: { type: "mala", mantra: "Om Namah Shivaya" }
        }
      ]
    },

    /* ---------------- Breath ---------------- */
    {
      name: "Breath for the Inward Journey",
      sub: "Breath is the bridge between the body you can control and the energy you can't yet see.",
      items: [
        {
          id: "nadi-shodhana", title: "Nadi Shodhana — Alternate Nostril", tracks: ["men", "women"], time: "5–10 min",
          why: "Yoga describes two channels spiralling around the spine: Ida (lunar, feminine, left) and Pingala (solar, masculine, right). Balancing them is a breath-level expression of the Hermetic Principle of Gender, and prepares the central channel for rising energy.",
          steps: [
            "Sit upright. Rest the right index and middle fingers between the eyebrows.",
            "Close the right nostril with the thumb; inhale through the left.",
            "Close the left with the ring finger; release the thumb; exhale right.",
            "Inhale right. Close; exhale left. That is one round.",
            "Continue for 5–10 minutes. Finish with an exhale through the left."
          ],
          cue: "Before meditation, before important decisions, or whenever you feel lopsided — too driven or too drained.",
          tool: { type: "breath", pattern: "nadi" }
        },
        {
          id: "bhramari", title: "Bhramari — Bee Breath", tracks: ["men", "women"], time: "5 min",
          why: "Humming on a long exhale turns attention inward almost immediately. The vibration is felt through the skull, and closing the ears removes the outer world. A natural doorway into pratyahara, the withdrawal of the senses.",
          steps: [
            "Sit comfortably. Close your eyes and gently press the ear flaps closed with your thumbs.",
            "Rest your fingers lightly over the eyes and forehead.",
            "Inhale through the nose. With lips closed, hum on the exhale like a bee — steady and smooth.",
            "Repeat 7 to 11 times, then sit in the silence that follows."
          ],
          cue: "When the mind is loud or anxious, or to transition from a busy day into practice.",
          tool: { type: "breath", pattern: "bhramari" }
        },
        {
          id: "478", title: "4-7-8 — The Settling Breath", tracks: ["men", "women"], time: "4 rounds",
          why: "A long hold and a longer exhale strongly activate the body's calming response. Use it to settle an arousal surge or quiet the mind before sleep.",
          steps: [
            "Tongue behind the upper front teeth.",
            "Exhale completely through the mouth.",
            "Inhale quietly through the nose for 4.",
            "Hold for 7.",
            "Exhale through the mouth with a soft whoosh for 8. Repeat up to 4 rounds at first."
          ],
          cue: "In bed, after a charged moment, or before the before-sleep subconscious practice.",
          tool: { type: "breath", pattern: "478" }
        },
        {
          id: "kumbhaka", title: "Kumbhaka — Breath Retention", tracks: ["men", "women"], time: "10 min",
          why: "In the hatha yoga texts, the pause in breath is where prana is concentrated and directed. Combined with the root lock, retention is used to draw energy upward. It is powerful, and it must be built slowly.",
          steps: [
            "Practise Nadi Shodhana for a few minutes first.",
            "Inhale slowly for 4. Hold for 12, gently lifting the pelvic floor (mula bandha) and lowering the chin slightly.",
            "Release the lock and chin, then exhale slowly for 8.",
            "Work over months toward the classical ratio of 1:4:2 — never by force."
          ],
          cue: "Advanced practice, after your foundations are steady. Never immediately after eating.",
          caution: "Don't practise breath retention if you are pregnant, or have high blood pressure, heart disease, glaucoma, epilepsy, or a history of panic attacks. Never practise in water or while driving. Stop immediately if you feel lightheaded.",
          tool: { type: "breath", pattern: "kumbhaka" }
        },
        {
          id: "pratyahara", title: "Pratyahara — Withdrawing the Senses", tracks: ["men", "women"], time: "15 min",
          why: "The fifth limb of yoga, and the bridge between outer and inner practice. You learn to let sights, sounds, and sensations pass without following them. This is how you go inward during the experience instead of being carried away by it.",
          steps: [
            "Sit with eyes closed after a few minutes of breathwork.",
            "Name the sounds you hear, one by one, without judging them. Then let them become background.",
            "Notice sensations on the skin. Let them become background.",
            "Notice the light behind your closed eyes. Let it become background.",
            "Rest attention on the breath at the nostrils, then on the space behind the brow. Stay there."
          ],
          cue: "Use the skill during arousal itself: stay with the sensation inside rather than chasing it outward."
        }
      ]
    },

    /* ---------------- Herbs ---------------- */
    {
      name: "Herbal Allies",
      sub: "Plants used across traditions to nourish vitality. Supportive, not magic — and not risk-free.",
      items: [
        {
          id: "herb-safety", title: "Read This First: Herbal Safety", tracks: ["men", "women"], time: "Before any herb",
          labels: { steps: "Principles", cue: "Always" },
          why: "Herbs are real medicine — that's why they work, and why they can interact with medications or harm the wrong person. Supplements in the US aren't tested like drugs, and quality varies widely.",
          steps: [
            "Talk to a doctor or pharmacist first, especially if you take antidepressants, blood thinners, blood pressure, diabetes, thyroid, or hormonal medications, or have any chronic condition.",
            "Avoid medicinal herbs if pregnant, breastfeeding, or trying to conceive unless guided by a qualified practitioner.",
            "Buy products that are third-party tested (look for USP, NSF, or similar seals).",
            "Introduce one herb at a time and use it for 4–8 weeks, so you know what's actually working.",
            "Follow the dose on the product label. Take breaks: many traditions cycle tonics, e.g. 6–8 weeks on, 1–2 weeks off.",
            "Stop and seek advice if you notice palpitations, sleep problems, mood changes, digestive upset, or a rash."
          ],
          cue: "Herbs support a strong foundation of sleep, food, movement, and practice. They don't replace it.",
          caution: "This information is educational, drawn from traditional use and the published literature. It is not a recommendation to take any herb."
        },
        {
          id: "herb-ashwagandha", title: "Ashwagandha", tracks: ["men", "women"], time: "Ayurveda · Rasayana",
          evidence: "Some clinical evidence",
          labels: { steps: "Traditional use", cue: "Best suited for" },
          why: "The most famous Ayurvedic rasayana (rejuvenative), traditionally said to give the strength and vitality of a horse. Small clinical trials suggest it may reduce stress and cortisol and support sexual function and sperm quality in men, and sexual function in women.",
          steps: [
            "Traditionally taken as root powder stirred into warm milk with ghee, honey, or spices at night (‘moon milk’).",
            "Also taken as a standardised root extract in capsules.",
            "Grounding and slightly calming — usually taken in the evening."
          ],
          cue: "Stress, burnout, poor sleep, and depleted vitality.",
          caution: "Avoid in pregnancy. Use caution with thyroid conditions, autoimmune disease, sedatives, and before surgery. Rare cases of liver injury have been reported. May affect fertility in some contexts.",
          source: "Ayurveda; James A. Duke, Handbook of Medicinal Herbs"
        },
        {
          id: "herb-ginseng", title: "Panax Ginseng", tracks: ["men", "women"], time: "Chinese medicine · Qi tonic",
          evidence: "Some clinical evidence",
          labels: { steps: "Traditional use", cue: "Best suited for" },
          why: "Chinese medicine's premier qi tonic, used for thousands of years for vitality, stamina, and resilience. Some trials support its use for erectile function and fatigue.",
          steps: [
            "Traditionally simmered as a root decoction, or taken as a tea or standardised extract.",
            "Stimulating — taken in the morning, often in cycles of a few weeks on and a break off."
          ],
          cue: "Fatigue and low drive, especially in older practitioners or after illness.",
          caution: "Can raise or lower blood pressure, cause insomnia, and interact with blood thinners (warfarin), diabetes medications, MAOI antidepressants, and stimulants including coffee. Avoid in pregnancy and with hormone-sensitive conditions.",
          source: "Traditional Chinese medicine; James A. Duke, Handbook of Medicinal Herbs"
        },
        {
          id: "herb-maca", title: "Maca", tracks: ["men", "women"], time: "Andean · Root food",
          evidence: "Limited clinical evidence",
          labels: { steps: "Traditional use", cue: "Best suited for" },
          why: "A root vegetable from the high Andes, eaten for millennia as food and strength-builder. Small studies suggest it may improve libido and mood in both men and women, seemingly without changing hormone levels.",
          steps: [
            "Traditionally eaten cooked; the powder is usually gelatinised (pre-cooked) for easier digestion.",
            "Commonly added to smoothies, porridge, or warm drinks."
          ],
          cue: "Low libido or energy, and during menopause.",
          caution: "Generally well tolerated as a food. Use caution with thyroid conditions and hormone-sensitive conditions. Raw maca can upset digestion.",
          source: "Andean traditional use"
        },
        {
          id: "herb-schisandra", title: "Schisandra", tracks: ["men", "women"], time: "Taoist · Jing herb",
          evidence: "Traditional use; limited human trials",
          labels: { steps: "Traditional use", cue: "Best suited for" },
          why: "The ‘five-flavour berry’ of Taoist herbalism, prized for conserving jing (essence) and calming shen (spirit). It's described as astringent: helping the body hold on to what it would otherwise leak — which is why cultivators favoured it.",
          steps: [
            "Traditionally taken as a tea of the dried berries, or as a tincture or extract.",
            "Often combined with other tonics in Taoist formulas."
          ],
          cue: "Supporting retention practice, focus, and calm alertness.",
          caution: "Avoid in pregnancy and with epilepsy. Affects liver enzymes that process many medications, so check with a pharmacist if you take any prescription drug.",
          source: "Taoist herbal tradition"
        },
        {
          id: "herb-tulsi", title: "Holy Basil (Tulsi)", tracks: ["men", "women"], time: "Ayurveda · Sattvic herb",
          evidence: "Some clinical evidence",
          labels: { steps: "Traditional use", cue: "Best suited for" },
          why: "Sacred in India and kept in many homes as a devotional plant. Considered sattvic — promoting clarity and calm — and widely used as an adaptogen for stress.",
          steps: ["Drunk as a daily tea of fresh or dried leaves, often before meditation."],
          cue: "Clearing mental fog and calming the heart before practice.",
          caution: "May slow blood clotting and lower blood sugar. Avoid if pregnant or trying to conceive — animal studies suggest it may affect fertility.",
          source: "Ayurveda"
        },
        {
          id: "herb-gotu-kola", title: "Gotu Kola", tracks: ["men", "women"], time: "Ayurveda · Medhya herb",
          evidence: "Limited clinical evidence",
          labels: { steps: "Traditional use", cue: "Best suited for" },
          why: "Called a medhya rasayana — a tonic for the mind — and traditionally used by yogis to support meditation and balance the two hemispheres of the brain.",
          steps: ["Taken as a tea, fresh leaves in food, or as a capsule."],
          cue: "Deepening meditation, memory, and mental clarity.",
          caution: "Avoid with liver disease and in pregnancy. Can cause drowsiness; avoid combining with sedatives.",
          source: "Ayurveda"
        },
        {
          id: "herb-tongkat", title: "Tongkat Ali", tracks: ["men"], time: "Southeast Asia · Yang tonic",
          evidence: "Some clinical evidence",
          labels: { steps: "Traditional use", cue: "Best suited for" },
          why: "A Malaysian root traditionally used for male vitality. Several small trials suggest it may support testosterone levels, mood, and libido in men with low levels or high stress.",
          steps: ["Usually taken as a standardised root extract in the morning, often cycled."],
          cue: "Men with low drive and high stress.",
          caution: "Quality and contamination vary greatly — use only tested products. Avoid with hormone-sensitive conditions (e.g. prostate cancer), heart disease, or kidney/liver disease.",
          source: "Malaysian traditional use"
        },
        {
          id: "herb-shilajit", title: "Shilajit", tracks: ["men", "women"], time: "Ayurveda · Mineral resin",
          evidence: "Limited clinical evidence",
          labels: { steps: "Traditional use", cue: "Best suited for" },
          why: "Not a plant but a mineral-rich resin that seeps from Himalayan rock. Ayurveda calls it the ‘conqueror of mountains and destroyer of weakness.’ A few studies suggest it may support energy and male hormone levels.",
          steps: ["Traditionally dissolved in warm water or milk in the morning."],
          cue: "Deep fatigue and depleted vitality.",
          caution: "Raw or unprocessed shilajit can contain heavy metals and fungi. Only use purified, third-party-tested products. Avoid with gout, high iron levels (haemochromatosis), and in pregnancy.",
          source: "Ayurveda"
        },
        {
          id: "herb-shatavari", title: "Shatavari", tracks: ["women"], time: "Ayurveda · Women's rasayana",
          evidence: "Traditional use; limited human trials",
          labels: { steps: "Traditional use", cue: "Best suited for" },
          why: "Its name is often translated as ‘she who has a hundred husbands.’ Ayurveda's foremost tonic for the female reproductive system, used to nourish, cool, and moisten — the feminine counterpart to ashwagandha.",
          steps: ["Traditionally taken as a powder in warm milk with ghee, or as a capsule."],
          cue: "Depletion, dryness, and support through the cycle and menopause.",
          caution: "Avoid if allergic to asparagus, or with oestrogen-sensitive conditions unless guided by a practitioner. May have a diuretic effect.",
          source: "Ayurveda"
        },
        {
          id: "herb-damiana", title: "Damiana", tracks: ["women", "men"], time: "Mesoamerican · Nervine",
          evidence: "Traditional use",
          labels: { steps: "Traditional use", cue: "Best suited for" },
          why: "A fragrant shrub used in Mexico and Central America as an aphrodisiac and mood lifter for both sexes. Traditionally considered gently uplifting and relaxing at once.",
          steps: ["Drunk as a tea of the leaves, or taken as a tincture."],
          cue: "Low desire linked to stress or low mood.",
          caution: "May lower blood sugar — use care with diabetes medication. Avoid in pregnancy and breastfeeding. Large amounts can be laxative.",
          source: "Mesoamerican traditional use; James A. Duke, Handbook of Medicinal Herbs"
        },
        {
          id: "herb-raspberry", title: "Red Raspberry Leaf", tracks: ["women"], time: "Western herbalism · Uterine tonic",
          evidence: "Traditional use",
          labels: { steps: "Traditional use", cue: "Best suited for" },
          why: "A gentle, mineral-rich leaf traditionally used as a tonic for the uterus and for easing menstrual cramps.",
          steps: ["Drunk as a daily tea, often in the luteal and menstrual phases."],
          cue: "Supporting the womb and easing period discomfort.",
          caution: "In pregnancy, use only late in pregnancy and under the guidance of a midwife or doctor.",
          source: "Western herbal tradition"
        },
        {
          id: "herb-caution", title: "Herbs to Approach With Great Care", tracks: ["men", "women"], time: "Know the risks",
          labels: { steps: "Herbs", cue: "Rule of thumb" },
          why: "Some herbs commonly sold for sexual energy carry serious risks. They're listed here so you can recognise them, not as recommendations.",
          steps: [
            "Yohimbe — can cause dangerous rises in blood pressure, rapid heartbeat, and anxiety. Banned or restricted in several countries.",
            "He Shou Wu (Fo-Ti) — a classic Taoist longevity herb linked to many reports of liver injury.",
            "Dong Quai — thins the blood and can cause heavy bleeding; avoid in pregnancy and with anticoagulants.",
            "Tribulus — evidence is weak and mixed; can affect blood sugar and blood pressure.",
            "Any ‘male enhancement’ product without a full ingredient list — many have been found to contain hidden prescription drugs."
          ],
          cue: "If a product promises dramatic results, be more cautious, not less."
        }
      ]
    },

    /* ---------------- Protection ---------------- */
    {
      name: "Protecting Your Field",
      sub: "The more energy you hold, the more it matters what you let in and what you let drain away.",
      items: [
        {
          id: "golden-egg", title: "The Sealed Field", tracks: ["men", "women"], time: "3 min",
          why: "Traditions across the world describe a field of energy around the body — the aura. Whatever it is, visualising it as whole and sealed shifts your inner posture from open and absorbent to centred and contained.",
          steps: [
            "Stand grounded. Breathe into the lower belly until it feels warm.",
            "On each exhale, imagine that warmth expanding outward into an egg of golden light around your whole body, about an arm's length in every direction — including beneath your feet.",
            "Feel its edge: clear, bright, sealed. Others' moods can be seen but don't pass through.",
            "Affirm silently: ‘What is mine stays in. What is not mine stays out.’",
            "Renew it before stepping into crowds, conflict, or intimacy."
          ],
          cue: "Every morning, and before any situation that usually drains you."
        },
        {
          id: "salt-cleanse", title: "Salt & Water Cleansing", tracks: ["men", "women"], time: "20 min",
          why: "Salt and water have been used for purification in nearly every culture. At the least, a warm bath relaxes the muscles, and the ritual of washing marks a clear end to a heavy day.",
          steps: [
            "Dissolve 1–2 cups of Epsom salt or sea salt in a warm bath.",
            "Soak for 15–20 minutes. On each exhale, imagine the day's residue dissolving into the water.",
            "Watch the water drain away before you step out.",
            "No bath? In the shower, picture the water washing through your field from crown to feet, carrying off what isn't yours."
          ],
          cue: "After crowds, hospitals, arguments, or any day that left you feeling ‘not yourself.’",
          caution: "Avoid very hot baths if you're pregnant or have heart or blood pressure problems."
        },
        {
          id: "cord-cutting", title: "Releasing Energetic Cords", tracks: ["men", "women"], time: "10 min",
          why: "After intense connections — past relationships, conflicts, sexual partners — people often feel a lingering pull. Many traditions describe these as energetic cords. Consciously releasing them helps you reclaim attention that's still tied up elsewhere.",
          steps: [
            "Sit quietly and ground. Bring the person or situation to mind.",
            "Notice where in your body you feel the connection — often the belly, heart, or throat.",
            "Picture a cord running from that place to them.",
            "Thank the connection for what it taught you. Then see the cord dissolve in light, or gently cut it.",
            "Call your energy back to you, and seal the place with warm light. Wish them well."
          ],
          cue: "After a breakup, or when someone keeps occupying your thoughts against your will.",
          caution: "This complements, but doesn't replace, real-world boundaries — or therapy for grief or trauma."
        },
        {
          id: "space-clearing", title: "Clearing Your Space", tracks: ["men", "women"], time: "15 min",
          why: "Your environment reflects your inner state — as within, so without. A clear, intentional space makes practice easier and protects the energy you build there.",
          steps: [
            "Declutter the place where you practise and sleep. Keep it simple and clean.",
            "Open the windows to let fresh air move through.",
            "Many people burn herbs like rosemary, garden sage, or cedar, or ring a bell or bowl in each corner. Do what feels meaningful to you.",
            "Keep work, screens, and conflict out of the bedroom.",
            "Place one object that reminds you of your intention where you'll see it daily."
          ],
          cue: "At the start of a new cycle, or when your space starts to feel heavy.",
          caution: "Never leave burning herbs unattended. Ventilate well, especially with asthma, children, or pets. Choose sustainably sourced plants — white sage is overharvested and sacred to several Native American nations."
        }
      ]
    },

    /* ---------------- Information diet ---------------- */
    {
      name: "The Little Black Box",
      sub: "Reduce the influence of the outside world — by changing how you see it, or limiting how much reaches you.",
      items: [
        {
          id: "phone-pendulum", title: "Your Phone Is a Pendulum", tracks: ["men", "women"], time: "Ongoing",
          why: "The device in your pocket is engineered to capture attention, and attention is life force. Every feed, outrage, and comparison is a pendulum asking to be fed. What you consume repeatedly becomes your inner atmosphere, and in time your signature.",
          steps: [
            "Check your screen time for the past week. Notice, without judgement, where your energy went.",
            "Delete or log out of the one app that drains you most. Use it only from a computer, if at all.",
            "Turn off every notification that isn't from a real person you care about.",
            "Switch the screen to grayscale (in accessibility settings). Colour is part of the hook.",
            "Move all apps off the home screen except tools: maps, camera, calendar, this app."
          ],
          cue: "Do this audit today, then revisit monthly."
        },
        {
          id: "phone-fences", title: "Morning & Evening Fences", tracks: ["men", "women"], time: "Daily",
          why: "The first and last hour of the day shape the subconscious most. Filling them with other people's content means starting and ending your day in someone else's frequency.",
          steps: [
            "No phone for the first hour after waking. Ground, breathe, create first.",
            "No phone for the last hour before sleep. Charge it outside the bedroom; use a simple alarm clock.",
            "Fill the reclaimed time with practice, reading, journaling, or conversation.",
            "If you slip, don't spiral. Just begin again tomorrow."
          ],
          cue: "Start with the evening fence — it improves sleep, which improves everything."
        },
        {
          id: "information-diet", title: "The Information Diet", tracks: ["men", "women"], time: "Weekly",
          why: "You become what you repeatedly take in. Curating inputs is like choosing food: you're building the substance your thoughts are made from.",
          steps: [
            "News: once a day at most, from one or two sources, in text rather than video. Many practitioners do better with a weekly summary.",
            "Unfollow every account that leaves you feeling smaller, angrier, or more anxious.",
            "Replace one hour of scrolling a day with one chapter of a book from the Books tab.",
            "One full day a week offline — a digital sabbath. Tell people in advance.",
            "Before opening anything, ask: ‘Is this nourishment or noise?’"
          ],
          cue: "Sunday evening: review the week's inputs and adjust.",
          source: "See Cal Newport, Digital Minimalism"
        },
        {
          id: "lower-importance", title: "Change How You See It", tracks: ["men", "women"], time: "In the moment",
          why: "You can't always limit the world, but you can change your relationship to it. Transurfing teaches that pendulums gain their power through excess importance — the more something matters to you, the more energy it drains. Lowering importance, without becoming indifferent, frees you.",
          steps: [
            "When something hooks you, ask: ‘In five years, will this matter?’",
            "Shift to the observer: watch the event as if it were a scene in a play you're attending, not a war you must win.",
            "Respond if action is needed — calmly, from the belly — but don't feed it with rumination.",
            "Remember the Principle of Mentalism: the world reaches you only through your interpretation of it. You choose the interpretation."
          ],
          cue: "Headlines, online arguments, other people's opinions of you.",
          source: "Vadim Zeland, Reality Transurfing; The Kybalion"
        }
      ]
    },

    /* ---------------- Creativity ---------------- */
    {
      name: "Creative Channels",
      sub: "There are as many ways to spend this energy well as there are people. These are starting points.",
      items: [
        {
          id: "charged-creation", title: "Charged Creation Ritual", tracks: ["men", "women"], time: "30–90 min",
          why: "The same force that can create life can create anything. Artists and mystics have long noticed that their best work came when this energy was high and directed. Make a ritual of it, so the energy learns where to go.",
          steps: [
            "When you feel the charge rising, light a candle or set a timer — a signal that this is creation time.",
            "Raise the energy: 3 rounds of the 90-Second Redirect, or a few minutes of Bija chanting.",
            "Create without judging: paint, write, compose, sketch, build, choreograph, plan your business.",
            "Don't edit in the same session. Raw first, refine later.",
            "Close by grounding and noting what came through."
          ],
          cue: "Whenever desire, restlessness, or vivid imagination peaks."
        },
        {
          id: "creative-menu", title: "A Menu of Outlets", tracks: ["men", "women"], time: "Choose one",
          why: "Different charges want different outlets. Having a menu ready means you don't default to the old leaks when energy is high.",
          steps: [
            "Body: dance freely to music, martial arts, qigong, hard training, long walks in nature.",
            "Voice: singing, chanting, poetry read aloud, recording ideas as voice notes.",
            "Hands: drawing, pottery, woodwork, cooking an elaborate meal, gardening.",
            "Mind: writing, learning a language or instrument, designing a project, strategy and planning.",
            "World: building a business, organising a community, teaching what you know, acts of service.",
            "Write your personal top five on a card and keep it where you'll see it."
          ],
          cue: "When you notice energy rising and don't know where to put it."
        },
        {
          id: "vision-practice", title: "Seeing Your Future Self", tracks: ["men", "women"], time: "10 min",
          why: "Imagination is the form-giving power. When cultivated energy is joined to a clear image, you aren't just calmer — you're moving toward something. This is where a changed signature becomes a changed reality.",
          steps: [
            "After breathwork, with energy gathered, bring to mind yourself one year from now, living the change you're building.",
            "See specifics: where you are, how you move, how people respond to you, what you've made.",
            "Feel it in the body as already real — warmth in the belly, openness in the chest.",
            "Ask that future self for one piece of advice. Write it down.",
            "Take one action today that the future self would take."
          ],
          cue: "Weekly, and at the start of each new milestone."
        }
      ]
    }
  ]
};

/* --------------------------------------------------------------------------
   BOOKS TAB — reading list
   inLibrary: true marks books already in the program's project library.
   -------------------------------------------------------------------------- */
SOV.GUIDE.books = {
  intro: "Books to take you deeper — into the energy body, the aura, sound and breath, and the mind's role in shaping reality. Read slowly, practise what you read, and keep what proves true in your own experience.",
  categories: [
    {
      name: "Sexual Energy & Taoist Cultivation",
      items: [
        { title: "Taoist Secrets of Love: Cultivating Male Sexual Energy", author: "Mantak Chia & Michael Winn", inLibrary: true, tracks: ["men", "women"],
          note: "The classic manual for men: Testicle Breathing, the Power Lock, the Microcosmic Orbit, and practice with a partner." },
        { title: "Healing Love Through the Tao: Cultivating Female Sexual Energy", author: "Mantak Chia & Maneewan Chia", tracks: ["women", "men"],
          note: "The women's companion volume: Ovarian Breathing, breast massage, and working with the cycle." },
        { title: "The Alchemy of Sexual Energy", author: "Mantak Chia", inLibrary: true, tracks: ["men", "women"],
          note: "How sexual essence is refined into life force and spirit, and how this connects to the wider cosmic practices." },
        { title: "Awaken Healing Energy Through the Tao", author: "Mantak Chia", tracks: ["men", "women"],
          note: "The detailed guide to opening the Microcosmic Orbit — the circuit everything else runs on." },
        { title: "The Six Healing Sounds", author: "Mantak Chia", tracks: ["men", "women"],
          note: "The full practice behind the healing sounds in Deepen." }
      ]
    },
    {
      name: "The Aura & the Energy Body",
      items: [
        { title: "Hands of Light", author: "Barbara Ann Brennan", tracks: ["men", "women"],
          note: "A former NASA physicist's detailed map of the human energy field, its layers, and how it responds to emotion and healing. The foundational aura text." },
        { title: "How to See and Read the Aura", author: "Ted Andrews", tracks: ["men", "women"],
          note: "Short and practical: exercises to begin perceiving and interpreting the aura in yourself and others." },
        { title: "The Subtle Body: An Encyclopedia of Your Energetic Anatomy", author: "Cyndi Dale", tracks: ["men", "women"],
          note: "A comprehensive reference to chakras, meridians, nadis, and auric fields across many traditions." },
        { title: "Energy Medicine", author: "Donna Eden", tracks: ["men", "women"],
          note: "Hands-on routines for balancing your own energy daily; very accessible." },
        { title: "Psychic Self-Defence", author: "Dion Fortune", tracks: ["men", "women"],
          note: "A 1930 classic of the Western esoteric tradition on protecting your field and recognising energetic drains." },
        { title: "Becoming Supernatural", author: "Joe Dispenza", tracks: ["men", "women"],
          note: "A modern take on changing your energetic state — and your life — through meditation and elevated emotion." }
      ]
    },
    {
      name: "Breath, Sound & Mantra",
      items: [
        { title: "Light on Pranayama", author: "B.K.S. Iyengar", tracks: ["men", "women"],
          note: "The authoritative guide to yogic breathwork, including retention, with careful instruction." },
        { title: "Asana Pranayama Mudra Bandha", author: "Swami Satyananda Saraswati", tracks: ["men", "women"],
          note: "The Bihar School manual covering breath, energy locks, and mudras — a practitioner's handbook." },
        { title: "Mudras: Yoga in Your Hands", author: "Gertrud Hirschi", inLibrary: true, tracks: ["men", "women"],
          note: "Dozens of hand gestures with visualisations and affirmations, including the Earth, Kundalini, and Kubera mudras." },
        { title: "Healing Mantras", author: "Thomas Ashley-Farrand", tracks: ["men", "women"],
          note: "A practical introduction to Sanskrit mantras, their meanings, and how to work with them over 40-day periods." },
        { title: "Breath: The New Science of a Lost Art", author: "James Nestor", tracks: ["men", "women"],
          note: "A readable account of what modern research says about how we breathe and why it matters." }
      ]
    },
    {
      name: "Mind, Reality & the Hermetic Path",
      items: [
        { title: "The Kybalion", author: "Three Initiates", tracks: ["men", "women"],
          note: "The seven Hermetic principles — Mentalism, Correspondence, Vibration, Polarity, Rhythm, Cause and Effect, and Gender." },
        { title: "Reality Transurfing", author: "Vadim Zeland", tracks: ["men", "women"],
          note: "The source of the pendulum concept and of lowering importance. Unusual, challenging, and practical." },
        { title: "Meditations on the Tarot", author: "Anonymous (Valentin Tomberg)", tracks: ["men", "women"],
          note: "A deep, contemplative study of the 22 Major Arcana. Its letter on Arcanum XI, Strength, speaks directly to this work." },
        { title: "Grow Rich with the Power of Your Subconscious Mind", author: "Joseph Murphy", inLibrary: true, tracks: ["men", "women"],
          note: "How to impress the subconscious, especially in the drowsy state before sleep." },
        { title: "Think and Grow Rich", author: "Napoleon Hill", tracks: ["men", "women"],
          note: "Includes the famous chapter on the transmutation of sexual energy into creative and professional drive." },
        { title: "Kundalini: The Evolutionary Energy in Man", author: "Gopi Krishna", tracks: ["men", "women"],
          note: "A first-hand account of a powerful kundalini awakening — inspiring, and a sobering reminder to go gradually." }
      ]
    },
    {
      name: "Herbs & Ayurveda",
      items: [
        { title: "Handbook of Medicinal Herbs", author: "James A. Duke", inLibrary: true, tracks: ["men", "women"],
          note: "An exhaustive reference to herbs' traditional uses, research, doses, and contraindications." },
        { title: "The Yoga of Herbs", author: "David Frawley & Vasant Lad", tracks: ["men", "women"],
          note: "An Ayurvedic guide to herbs and their energetics, including the rasayanas used for ojas." }
      ]
    },
    {
      name: "Protecting Your Attention",
      items: [
        { title: "Digital Minimalism", author: "Cal Newport", tracks: ["men", "women"],
          note: "A practical philosophy for reclaiming your attention from the little black box, including a 30-day digital declutter." }
      ]
    }
  ]
};
