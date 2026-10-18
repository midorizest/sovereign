/* ==========================================================================
   SOVEREIGN — Guided protocols (v1.5)
   Added to SOV.PROTOCOLS (the Grounding Reset lives in content.js).

   Step fields:
     title, seconds, prompt
     variants  { men, women }          — wording by track
     byPhase   { menstrual, follicular, ovulatory, luteal, unsure }
               — wording by the cycle phase logged on Home today
   Protocol fields:
     level, tracks, minutes (must equal the sum of step seconds / 60),
     logsPractice, summary, setup, benefits, caution, source
   ========================================================================== */
window.SOV = window.SOV || {};

SOV.PROTOCOLS.push(

  /* ---------------------------------------------------------------- BEGINNER */
  {
    id: "breath-of-fire", title: "The Breath of Fire", level: "beginner", tracks: ["men", "women"],
    minutes: 5, logsPractice: "breath",
    summary: "Short, sharp exhales from the belly with a passive inhale. Three rounds with rests between, to clear the head and kindle warmth low in the body.",
    setup: "Sit tall on a cushion or the front of a chair, on an empty stomach. Breathe only through the nose. Have tissues nearby.",
    benefits: [
      "Clears mental fog and brings alertness without caffeine",
      "Strengthens the abdominal pump used in later transmutation work",
      "Generates internal heat that the rests then draw inward",
      "Trains you to stay present with strong sensation"
    ],
    caution: "Don't practise if you are pregnant, menstruating heavily, or have high or low blood pressure, heart disease, epilepsy, glaucoma or other eye or ear conditions, a hernia, or recent abdominal surgery. Some classical texts (including Iyengar's Light on Prāṇāyāma) go further and advise women against forceful breathing altogether; most modern teachers don't, so let your body decide. Stop at the first sign of dizziness, strain, a nosebleed, or a weakening sound.",
    source: "Adapted from kapalabhati, as described in B.K.S. Iyengar, Light on Prāṇāyāma",
    steps: [
      { title: "Settle", seconds: 30, prompt: "Sit tall. Rest your hands on your knees in Gyan mudra, thumb and index finger touching. Close your eyes and take three slow breaths through the nose." },
      { title: "Learn the pump", seconds: 30, prompt: "Place a hand on your belly. Snap the navel back toward the spine to push a short, sharp breath out through the nose. Let the inhale happen by itself as the belly relaxes. Slowly — one breath every second or two." },
      { title: "First round", seconds: 45, prompt: "Begin a steady rhythm, about one exhale per second. Keep the chest and shoulders still; only the belly moves. If you feel dizzy, stop and breathe normally." },
      { title: "Rest and gather", seconds: 45, prompt: "Inhale deeply and hold comfortably, gently lifting the pelvic floor. Exhale slowly. Breathe naturally and feel the tingling and warmth spread. Let it settle below the navel." },
      { title: "Second round", seconds: 45, prompt: "Begin again. Same steady rhythm — strength in the exhale, ease in the inhale. Quality over speed." },
      { title: "Rest and gather", seconds: 45, prompt: "Deep inhale, gentle hold, slow release. Feel the charge. Send it down to the lower belly rather than letting it gather in the head." },
      { title: "Final round", seconds: 30, prompt: "One last round, a little gentler. Keep the face soft." },
      { title: "Seal", seconds: 30, prompt: "Long, slow breaths. Rest your palms on your lower belly and feel the warmth there. The fire is lit and contained." }
    ]
  },

  {
    id: "morning-retention", title: "The Morning Retention Check-In", level: "beginner", tracks: ["men"],
    minutes: 5, logsPractice: "meditation",
    summary: "Before the phone, before the world: witness the morning charge, draw it up, set where it will go today, and check in honestly.",
    setup: "Do this on waking, before checking any screen. You'll begin lying down and finish seated on the edge of the bed.",
    benefits: [
      "Meets the morning surge of energy with awareness instead of habit",
      "Turns the first minutes of the day into practice",
      "Gives the day's energy a direction before others claim it",
      "Builds an honest, shame-free record of your retention"
    ],
    caution: "Morning erections are a normal sign of health, not something to suppress or fear. If you notice pain or persistent changes, see a doctor.",
    source: "Draws on Testicle Breathing, as taught by Mantak Chia",
    steps: [
      { title: "Wake and witness", seconds: 45, prompt: "Stay still for a moment. Before reaching for anything, notice your body. If there is morning arousal, simply observe it: this is vitality, rising on its own. No judgement, no action." },
      { title: "Sit and ground", seconds: 45, prompt: "Sit up on the edge of the bed with both feet flat on the floor. Lengthen your spine. Feel the floor beneath your soles." },
      { title: "Draw up", seconds: 90, prompt: "Begin Testicle Breathing: on each slow inhale, gently draw the testes up and feel cool energy rise to the perineum; on each exhale, relax. Nine breaths. Then guide the energy to the sacrum and hold it there." },
      { title: "Store", seconds: 45, prompt: "Let the energy flow down the front of the body to the navel. Place your palms there, left hand over right. Feel the warmth gather." },
      { title: "Name the day", seconds: 45, prompt: "Ask: where will this energy go today? Name one thing you will build, create, or protect. Hold it in mind for three breaths." },
      { title: "Check in honestly", seconds: 30, prompt: "When the timer ends, open Home and log your retention check-in: held or released. Both are information. Neither is a verdict on your worth." }
    ]
  },

  {
    id: "cycle-syncing", title: "Cycle Syncing", level: "beginner", tracks: ["women"],
    minutes: 10, logsPractice: "meditation",
    summary: "A ten-minute check-in with your inner season. The practice adapts to the cycle phase you've logged on Home today.",
    setup: "Log today's cycle phase on Home first so the prompts match your season. Sit or lie comfortably with your hands on your lower belly.",
    benefits: [
      "Builds body literacy: noticing your own rhythms rather than fighting them",
      "Matches practice to your energy, so you conserve when low and build when rising",
      "Turns your cycle into a monthly planning tool",
      "Ends with energy gathered and stored at the navel"
    ],
    caution: "Cycle changes such as severe pain, very heavy bleeding, missed periods, or new symptoms deserve a conversation with your doctor. If you aren't cycling, choose 'Unsure / Not cycling' on Home and follow the moon or your body.",
    source: "Draws on Mantak & Maneewan Chia, Healing Love Through the Tao",
    steps: [
      { title: "Arrive", seconds: 60, prompt: "Rest your hands on your womb space. Breathe slowly into your palms. Let the day fall away for these ten minutes." },
      { title: "Listen", seconds: 90, prompt: "Scan your body without changing anything: energy, mood, appetite, breasts, belly, desire. What is your body telling you today?" },
      { title: "Honour the season", seconds: 180, byPhase: {
          menstrual: "Inner winter. Imagine the release as a returning to the earth: what you no longer need flows down and away. Breathe warmth into the lower back and belly. Rest is your practice today; there is nothing to push.",
          follicular: "Inner spring. Feel energy rising like green shoots. On each inhale, imagine fresh light gathering in the ovaries; on each exhale, let it brighten. This is a season for beginnings.",
          ovulatory: "Inner summer. Your energy is at its fullest. Feel warmth radiating from the womb through the whole body. This is the abundance you can gather and circulate rather than spend.",
          luteal: "Inner autumn. Energy turns inward. Breathe slowly and notice what wants to be completed or let go. Soften the jaw and belly. Protect your evenings and your sleep.",
          unsure: "Follow your body. If energy feels low, rest and breathe warmth into the belly. If it feels high, imagine it gathering in the ovaries like light. There is no wrong season."
        } },
      { title: "Gather", seconds: 120, prompt: "Bring attention to the ovaries. With each inhale, imagine their energy gathering at the Ovarian Palace, the point between them. With each exhale, let it rest there, warm and contained." },
      { title: "Plan by season", seconds: 90, byPhase: {
          menstrual: "Choose one thing to remove from today's list. Choose one way to rest.",
          follicular: "Choose one new thing to begin today, however small.",
          ovulatory: "Choose one conversation, connection, or expression that today's energy is perfect for.",
          luteal: "Choose one thing to finish or tidy today, and one boundary to keep.",
          unsure: "Choose one thing that would honour your energy as it is today."
        } },
      { title: "Seal", seconds: 60, prompt: "Draw the gathered warmth up to the navel and rest your palms there. Breathe it in. You are in rhythm with yourself." }
    ]
  },

  {
    id: "yoni-breathing", title: "Yoni Breathing", level: "beginner", tracks: ["women"],
    minutes: 10, logsPractice: "breath",
    summary: "Breath coordinated with gentle, staged lifts of the vaginal muscles, drawing energy upward and storing it. The foundation of the Taoist women's practice.",
    setup: "Sit on the edge of a firm chair, feet flat, knees apart, spine tall, tongue on the roof of the mouth. Practise on an empty stomach and dress warmly.",
    benefits: [
      "Builds sensitive control of the pelvic floor, both lifting and releasing",
      "Gathers sexual energy without arousal and moves it into the body",
      "Prepares for Ovarian Breathing and the Womb Meditation",
      "Supports pelvic tone and awareness"
    ],
    caution: "Keep the effort gentle and always release fully between lifts. If you have pelvic pain, pain with sex, or a feeling of heaviness, see a pelvic floor physiotherapist first. If pregnant, ask your midwife or doctor. During menstruation, practise very gently or simply breathe. This app teaches the practice without inserting any object.",
    source: "Adapted from Mantak & Maneewan Chia, Healing Love Through the Tao (practised without the jade egg, as the authors also teach)",
    steps: [
      { title: "Prepare", seconds: 60, prompt: "Sit tall at the edge of the chair. Rub your palms together until they're warm. Breathe slowly through the nose and let the belly soften." },
      { title: "Warm the heart", seconds: 60, prompt: "Place your warm palms over your breasts and circle slowly outward, a few times. Then rest the hands and feel the warmth gather at the heart. This awakens the energy you're about to draw." },
      { title: "Find the gates", seconds: 90, prompt: "Gently close the outer opening of the vagina, then release. Next, lift a little higher, the middle ring, then release. Then the upper ring. Three gates, three gentle lifts. Release completely after each." },
      { title: "Breathe the yoni", seconds: 120, prompt: "Inhale in small sips while lifting through the three gates in turn — lower, middle, upper — as if drawing gently upward. Hold for a moment at the top. Exhale and release everything. Repeat, slowly, nine times." },
      { title: "Rise", seconds: 120, prompt: "Now let the gathered warmth move: on each inhale, draw it to the perineum, then to the tailbone and sacrum. On the exhale, rest and keep it there with your mind, not your muscles." },
      { title: "Store", seconds: 90, prompt: "Bring the energy up and over, down the front of the body to the navel. Place your palms there, right hand over left. Feel it settle, warm and safe." },
      { title: "Rest", seconds: 60, prompt: "Release all effort. Let the pelvis soften completely. Notice how your body feels now." }
    ]
  },

  /* ------------------------------------------------------------ INTERMEDIATE */
  {
    id: "transmutation-15", title: "The 15-Minute Transmutation Practice", level: "intermediate", tracks: ["men", "women"],
    minutes: 15, logsPractice: "meditation",
    summary: "The complete cycle in fifteen minutes: ground, gather at the root, raise the charge, circulate it through the Orbit, store it, and point it at something real.",
    setup: "Sit upright on the edge of a chair, feet flat, tongue on the roof of the mouth. Empty stomach, warm clothing. Have one current creative goal in mind.",
    benefits: [
      "Practises every stage of transmutation in one session",
      "Converts restlessness or desire into steady, usable energy",
      "Ends with a clear intention, so the energy has somewhere to go",
      "A dependable daily practice once the foundations are steady"
    ],
    caution: "If you feel pressure in the head or chest, heat, or agitation, stop raising energy and simply rest attention at the navel and the soles of the feet. Never strain the breath.",
    source: "Synthesised from Mantak Chia's Taoist practices and the transmutation principle in Napoleon Hill's Think and Grow Rich",
    steps: [
      { title: "Ground", seconds: 90, prompt: "Feet flat, spine long. Exhale tension down through the legs into the earth. Inhale steadiness up into the lower belly. Five slow breaths." },
      { title: "Gather at the root", seconds: 180, variants: {
          men: "Testicle Breathing: on each inhale, gently draw the testes up and feel cool energy rise to the perineum. Exhale and relax. Nine breaths, then hold the energy at the perineum.",
          women: "Ovarian Breathing: on each inhale, gather the energy of the ovaries at the Ovarian Palace and draw it down to the perineum. Exhale and keep it there. Nine breaths."
        } },
      { title: "Raise the charge", seconds: 150, prompt: "Three rounds of the Redirect: inhale slowly while lifting the pelvic floor and lightly clenching fists and jaw; draw the energy up the spine to the crown; hold briefly; exhale and release all tension." },
      { title: "Circulate", seconds: 240, prompt: "Microcosmic Orbit: inhale and guide attention up the spine — sacrum, mid-back, base of the skull, crown. Exhale and guide it down the front — brow, throat, heart, solar plexus, navel. Let the circuit flow at its own pace." },
      { title: "Store", seconds: 90, variants: {
          men: "Collect the energy at the navel. Spiral it outward 36 times, then inward 24 times. Rest your palms there, left over right.",
          women: "Collect the energy at the navel. Spiral it in the opposite direction to the men's practice: 36 outward, 24 inward. Rest your palms there, right over left."
        } },
      { title: "Direct", seconds: 150, prompt: "Bring your creative goal to mind. Feel the stored warmth and imagine it flowing into that work: the first sentence written, the first stroke made, the first step taken. Choose one action you will take within the hour." }
    ]
  },

  {
    id: "mirror-gaze", title: "The Mirror Gaze", level: "intermediate", tracks: ["men", "women"],
    minutes: 12, logsPractice: "meditation",
    summary: "A contemplative gaze into your own eyes. You learn to stay present, kind, and unshaken while perception shifts. The observer is not the face.",
    setup: "Use a room with soft, dim light — not darkness. Place a mirror at arm's length at eye level, with a candle or lamp to the side, never behind you. Sit comfortably.",
    benefits: [
      "Builds the observer stance that steadies you under strong sensation",
      "Develops self-acceptance and calm presence",
      "Strengthens attention through a fixed, soft gaze",
      "A practical experience of the Principle of Mentalism"
    ],
    caution: "Gazing at your reflection in low light commonly makes the face appear to distort or change. This is a normal visual effect, not something supernatural. If you have a history of dissociation, psychosis, panic attacks, or trauma, skip this practice or do it only with support. Stop whenever you feel frightened: look away, put your hands on the floor, and name five things you can see.",
    steps: [
      { title: "Set the space", seconds: 60, prompt: "Check the light: soft and dim, coming from the side. Sit at arm's length from the mirror. Let your hands rest in your lap." },
      { title: "Settle the breath", seconds: 60, prompt: "Close your eyes. Breathe slowly into the belly — in for four, out for six. Feel your feet and seat. You are safe and in control; you can stop at any moment." },
      { title: "Soft gaze", seconds: 240, prompt: "Open your eyes and rest your gaze on your own left eye. Keep it soft; blink when you need to. Your face may seem to shift, blur or change. Let it. Stay the observer, breathing slowly. If anything feels like too much, simply look away." },
      { title: "Meet yourself", seconds: 180, prompt: "Silently say: I see you. Hold your own gaze with the kindness you would offer a friend. Notice that you are the one who looks, not the face being looked at." },
      { title: "Speak one truth", seconds: 90, prompt: "Say one true sentence aloud to yourself — something you need to hear, or a commitment you are making. Say it slowly, three times." },
      { title: "Return", seconds: 90, prompt: "Look away from the mirror. Place your palms on the floor or your thighs. Name five things you can see in the room. Take three deep breaths. Turn on a brighter light." }
    ]
  },

  {
    id: "womb-meditation", title: "The Womb Meditation", level: "intermediate", tracks: ["women"],
    minutes: 15, logsPractice: "meditation",
    summary: "Smile into the womb, gather the energy of the ovaries at the Ovarian Palace, raise it through the spine, and store it safely at the navel.",
    setup: "Sit on the edge of a chair, feet flat, spine tall, tongue on the roof of the mouth. Empty stomach, warm clothing. Practise Yoni Breathing first until it feels familiar.",
    benefits: [
      "Cultivates a warm, loving relationship with the womb space",
      "Gathers ovarian energy and circulates it to nourish the whole body",
      "Calms the nervous system and steadies emotion",
      "The core of the Taoist women's cultivation"
    ],
    caution: "If the energy feels warm or hot, always bring it back down to the navel; never leave it in the head. Practise gently during menstruation, and ask your doctor or midwife if pregnant.",
    source: "Adapted from Mantak & Maneewan Chia, Healing Love Through the Tao",
    steps: [
      { title: "Arrive", seconds: 60, prompt: "Settle on the chair. Rub your palms warm and rest them on your lower belly. Breathe slowly into your hands." },
      { title: "Smile inward", seconds: 120, prompt: "Feel a gentle smile in your eyes. Let it flow down through your face, throat and heart, all the way into your womb. Smile to your uterus and ovaries as you would to someone you love." },
      { title: "Ovarian Palace", seconds: 180, prompt: "Bring attention to the ovaries, a hand's width below the navel on each side. On each inhale, gather their energy toward the Ovarian Palace, the point between them. On each exhale, let it rest there, warm and full." },
      { title: "Ovarian Breathing", seconds: 240, prompt: "Inhale in small sips while very gently lifting the vagina and the front of the perineum, drawing the energy down to the perineum. Hold, then exhale and keep it there with your mind. After nine breaths, draw it to the tailbone and sacrum, then up the spine toward the crown." },
      { title: "Circulate", seconds: 180, prompt: "Let the energy pour from the crown down the front of the body: brow, tongue, throat, heart, solar plexus, navel. Let it flow around this circle a few times at its own pace." },
      { title: "Store", seconds: 120, prompt: "Collect the energy at the navel. Spiral it gently, the reverse direction of the men's practice. Rest your palms there, right hand over left, and feel the warmth soak in." }
    ]
  },

  /* ---------------------------------------------------------------- ADVANCED */
  {
    id: "akashic-window", title: "The 2–3 AM Akashic Window", level: "advanced", tracks: ["men", "women"],
    minutes: 20, logsPractice: "meditation",
    summary: "A short practice in the deep stillness of the night: settle, descend inward, hold one sincere question, receive in silence, and record what comes before returning to sleep.",
    setup: "Only on nights you went to bed early. Before sleep, place water, your journal or this app, and a dim light within reach. Set a gentle alarm, or practise only if you wake naturally.",
    benefits: [
      "Uses the quietest hours, when outer noise is at its lowest",
      "Deepens meditation through natural drowsy stillness",
      "Builds a practice of asking and listening rather than forcing",
      "Captures insights that are often lost by morning"
    ],
    caution: "Protect your sleep: practise this no more than once or twice a week, and never when you're sleep-deprived or must drive early. Skip it if you have insomnia, bipolar disorder (sleep disruption can trigger mood episodes), or other mental-health concerns. Keep the light dim and stay off other screens.",
    steps: [
      { title: "Wake gently", seconds: 60, prompt: "Move slowly. Keep the light low. No messages, no news. If you feel exhausted rather than alert, go back to sleep; the window will return another night." },
      { title: "Water and seat", seconds: 60, prompt: "Take a few sips of water. Sit up in bed or on a cushion, wrapped in a blanket, spine supported. Rest your hands in Dhyani mudra, left hand resting in the right." },
      { title: "Balance the channels", seconds: 180, prompt: "Alternate nostril breathing: inhale left, exhale right; inhale right, exhale left. Slow and silent. Feel the two sides of yourself come into balance." },
      { title: "Descend", seconds: 240, prompt: "Let the breath become natural. Let sounds become background. Let sensations become background. Rest attention behind the brow, in the quiet space there. Go down, as if into still water." },
      { title: "Hold the question", seconds: 240, prompt: "Bring one sincere question to mind — about your path, a choice, or what you need to understand. Ask it once, clearly. Then let it go, as if placing it into the vast space of akasha, the ether that holds all things." },
      { title: "Receive", seconds: 240, prompt: "Rest in silence. Don't search for an answer. Notice whatever arises — an image, a word, a feeling, a memory, or simply peace. All of it is welcome. None of it needs to be dramatic." },
      { title: "Record", seconds: 120, prompt: "When the bell sounds, write down whatever came, without judging it: a few words are enough. Choose 'Journal now' when you finish." },
      { title: "Return to sleep", seconds: 60, prompt: "Lie down. Rest your hands on your belly. Breathe slowly and let yourself sink back into sleep, carrying the stillness with you." }
    ]
  },

  {
    id: "ojas-build", title: "The Full Ojas Build Protocol", level: "advanced", tracks: ["men"],
    minutes: 30, logsPractice: "meditation",
    summary: "The complete men's cultivation sequence: ground, clear, gather, lock, circulate, store, and nourish. Thirty minutes to refine essence into steady vitality.",
    setup: "Morning, on an empty stomach. Barefoot on the ground or a mat, then seated upright on the edge of a chair, tongue on the roof of the mouth. Dress warmly and keep a warm drink ready for afterwards.",
    benefits: [
      "Combines every men's practice into one complete session",
      "Gathers, raises, circulates and stores energy safely",
      "Builds the steady reserve the Ayurvedic tradition calls ojas",
      "Ends with rest and nourishment so the practice is absorbed"
    ],
    caution: "Chia's safety rules apply: sit upright; never lie flat on your back or on your left side while practising; breathe through the nose; wait an hour after eating. If you feel pressure in the head or chest, bring the energy down to the navel and rest. Stop if you feel pain, numbness or dizziness.",
    source: "Adapted from Mantak Chia & Michael Winn, Taoist Secrets of Love; ojas from the Ayurvedic tradition",
    steps: [
      { title: "Ground", seconds: 180, prompt: "Stand barefoot, knees soft. Exhale tension and static down into the earth. Inhale cool, steady energy up the legs into the lower belly. Feel the body as a battery being connected." },
      { title: "Clear the organs", seconds: 180, prompt: "Sit down. Six Healing Sounds, softly, one exhale each: lungs 'ssss', kidneys 'chooo', liver 'shhhh', heart 'hawww', spleen 'whooo', triple warmer 'heeee'. Smile inwardly after each." },
      { title: "Testicle Breathing", seconds: 300, prompt: "On each slow inhale, gently draw the testes up and feel cool energy rise to the perineum; on each exhale, relax. After nine breaths, guide the energy to the sacrum, then up to the point opposite the solar plexus, and hold it there." },
      { title: "The Power Lock", seconds: 240, prompt: "Intermediate stage, with less muscle and more mind. Inhale slowly, lifting the perineum and the area around the anus, and draw the energy from the root to the sacrum and up the spine to the crown. Hold briefly. Exhale and release completely. Three to six rounds." },
      { title: "Microcosmic Orbit", seconds: 360, prompt: "Let the energy circulate: up the spine on the inhale — sacrum, mid-back, base of the skull, crown — and down the front on the exhale — brow, throat, heart, solar plexus, navel. Let attention lead and the energy follow." },
      { title: "Store", seconds: 180, prompt: "Collect everything at the navel. Spiral outward 36 times, then inward 24 times. Rest your palms there, left over right. Feel the warmth condense into a steady glow." },
      { title: "Nourish", seconds: 180, prompt: "Stay seated and breathe naturally. Afterwards, take a warm, nourishing drink, such as warm milk with ghee or a few soaked dates. The tradition teaches that ojas is built from what you absorb, not only from what you hold." },
      { title: "Silence", seconds: 180, prompt: "Sit in silence. No technique. Simply feel the body, full and quiet. This stillness is where the practice settles in." }
    ]
  },

  {
    id: "serpent-rising", title: "The Serpent Rising", level: "advanced", tracks: ["men", "women"],
    minutes: 25, logsPractice: "meditation",
    summary: "A careful, grounded approach to kundalini: balance the channels, awaken the root, draw energy up the central channel to the crown, and always bring it home.",
    setup: "Sit with a straight, supported spine on a cushion or chair, on an empty stomach. This practice assumes months of steady work with the Orbit and Breath Retention.",
    benefits: [
      "Works with the subtle body's central channel in a safe, complete circuit",
      "Unites breath, lock, sound and attention",
      "Deepens meditation and inner stillness",
      "Builds the capacity to hold a higher charge with grounding"
    ],
    caution: "The traditions themselves warn against forcing this energy. Gopi Krishna's well-known account describes years of difficulty after a sudden awakening. Stop and ground yourself for several days if you notice intense heat, pressure in the head, insomnia, involuntary movements, or overwhelming emotion, and seek an experienced teacher. Don't practise if you are pregnant, have uncontrolled blood pressure, or have a psychiatric history. Never skip the descent and grounding at the end.",
    source: "Informed by Gopi Krishna, Kundalini; B.K.S. Iyengar, Light on Prāṇāyāma; and the Taoist practice of completing the circuit",
    steps: [
      { title: "Ground", seconds: 180, prompt: "Feel the weight of your body into the earth. Breathe down through the base of the spine. Imagine roots. Strong grounding is what makes rising safe." },
      { title: "Balance the channels", seconds: 240, prompt: "Alternate nostril breathing: left in, right out; right in, left out. The lunar and solar channels, Ida and Pingala, come into balance, preparing the central channel between them." },
      { title: "Awaken the root", seconds: 180, prompt: "Inhale for four, hold for four with a gentle root lock — lifting the pelvic floor — and exhale slowly for six while releasing. Feel warmth gather at the base of the spine." },
      { title: "Spinal breath", seconds: 300, prompt: "On each inhale, draw a thread of light from the base of the spine up through its centre to the crown. On each exhale, let it flow down the front of the body to the navel. Up through the centre, down the front. Slow, unforced." },
      { title: "Seed sounds", seconds: 240, prompt: "Silently sound each seed syllable as you rise, feeling it vibrate in place: LAM at the root, VAM below the navel, RAM at the solar plexus, YAM at the heart, HAM at the throat, OM between the brows." },
      { title: "Rest at the crown", seconds: 180, prompt: "Let attention rest at the crown in silence. Notice light, space or stillness, without grasping. Then begin to let the energy descend gently down the front of the body." },
      { title: "Descend and ground", seconds: 120, prompt: "Bring everything down to the navel and store it there. Then feel the soles of your feet and the base of the spine. Press your palms to the floor. You are here, in your body, on the earth." },
      { title: "Integrate", seconds: 60, prompt: "Sit quietly. Open your eyes slowly. Drink some water before standing. Move gently for the next few minutes." }
    ]
  }
);

/* The roadmap list is now empty: every planned protocol is built. The Maker's
   Verdict and the Priestess Protocol are set aside for a future build. */
SOV.UPCOMING_PROTOCOLS = [];
