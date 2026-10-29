/* ==========================================================================
   40-DAY ENERGY TRACKER — built into the app
   The same tracker as the printable (library/pdf/tracker-*.pdf), in the
   app's own screens. Entries are stored under the printable's own field
   names (d01_energy, week1_q1, …), so the built-in tracker and the
   printable always show the same entries.
   Wording is taken verbatim from the Sovereign Series printables.
   ========================================================================== */
window.SOV = window.SOV || {};
SOV.TRACKER = {
  title: "40-Day Energy Tracker",
  tagline: "Desire is not the enemy. Unconscious spending is.",
  intro: {
    men: [
      "Forty days. Tick what you practised, rate your energy, and write where you directed it. A review closes each week.",
      "Each day has an honest check-in: held or released, and how strong the urge was. Both are information. Neither is a verdict on your worth."
    ],
    women: [
      "Forty days. Tick what you practised, rate your energy, and write where you directed it. A review closes each week.",
      "Each day has a cycle check-in: note the phase you are in, or Unsure if you aren’t cycling, and patterns appear within two or three cycles."
    ]
  },
  before: {
    men: "This is an educational and reflective practice, not medical, psychological or sexual-health advice. Many of its claims are traditional teachings rather than established science. Consult a qualified health professional before breathwork if you are pregnant or have a heart, blood-pressure, seizure or psychiatric condition, and stop any practice if you feel dizzy, faint or distressed. Retention is a personal choice, not a requirement for health or worth. If you are struggling with compulsive sexual behaviour, pain or your mental health, please speak to a professional.",
    women: "This is an educational and reflective practice, not medical, psychological or sexual-health advice. Many of its claims are traditional teachings rather than established science. Consult a qualified health professional before breathwork if you are pregnant or have a heart, blood-pressure, seizure or psychiatric condition, and stop any practice if you feel dizzy, faint or distressed. Cycle awareness is a personal choice, not a requirement for health or worth. If you are struggling with pain, changes in your cycle or your mental health, please speak to a professional."
  },
  commitment: "For the next forty days, I choose.",
  prompts: {
    "men": [
      "Where in your body did you feel the most energy today? Where the least?",
      "What drained you today, and did you consent to it?",
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
      "Where in your body did you feel the most energy today? Where the least?",
      "What are you building with the energy you are keeping?",
      "Which pendulum pulled at your attention most strongly today?",
      "What did you create today, however small?",
      "What did your breath tell you that your mind did not?",
      "What urge did you notice, and what was underneath it?",
      "When did you feel most like yourself today?",
      "What boundary did you hold, or wish you had held?",
      "What is the next small act of mastery available to you?",
      "Describe a moment today when you chose stillness over reaction.",
      "Looking back on this month, what has shifted in how you hold your energy?"
    ],
    "women": [
      "Where in your body did you feel the most energy today? Where the least?",
      "When did you feel warmth gather in your lower belly?",
      "What did your body ask for that you ignored?",
      "What drained you today, and did you consent to it?",
      "How did the earth feel beneath your feet today?",
      "What did your breath tell you that your mind did not?",
      "Where did you feel the masculine in you today? The feminine?",
      "When did you feel most like yourself today?",
      "Where did you feel tension held, and where did you release it?",
      "Which pendulum pulled at your attention most strongly today?",
      "What are you grateful your body carried you through today?",
      "What boundary did you hold, or wish you had held?",
      "Where did desire arise today, and what did you do with it?",
      "What are you building with the energy you are keeping?",
      "What thought did you return to again and again? Is it yours?",
      "Nothing rests; everything vibrates. What was your vibration today?",
      "Where did strength and gentleness meet in you today?",
      "Describe a moment today when you chose stillness over reaction.",
      "If your energy were a flame today, how would you describe it?",
      "What image or memory kept returning? What might it be asking?",
      "What did you give your attention to that did not deserve it?",
      "What urge did you notice, and what was underneath it?",
      "Who did you compare yourself to today? What did it cost you?",
      "As within, so without. What inner state did your surroundings reflect?",
      "What did you create today, however small?",
      "Name one thing you did today purely for your own sovereignty.",
      "What did your dreams or quiet moments show you?",
      "What would the lion in you do differently tomorrow?",
      "What is the next small act of mastery available to you?",
      "Where in your body did you feel the most energy today? Where the least?",
      "What are you building with the energy you are keeping?",
      "Which pendulum pulled at your attention most strongly today?",
      "What did you create today, however small?",
      "What did your breath tell you that your mind did not?",
      "What urge did you notice, and what was underneath it?",
      "When did you feel most like yourself today?",
      "What boundary did you hold, or wish you had held?",
      "What is the next small act of mastery available to you?",
      "Describe a moment today when you chose stillness over reaction.",
      "Looking back on this month, what has shifted in how you hold your energy?"
    ]
  },
  reviewQ: {
    "men": [
      "What changed in how I hold my energy this week?",
      "Where did I leak, and what led up to it?",
      "What did I create or build?",
      "One adjustment for next week:"
    ],
    "women": [
      "Where was I in my cycle this week, and how did my energy follow it?",
      "Where did I leak, and what led up to it?",
      "What did I create or build?",
      "One adjustment for next week:"
    ]
  },
  weeks: [
    { n: 1, from: 1, to: 7, name: "Week One Review", title: "The First Seal", text: "Seven days. A week of returning to yourself. The body has begun to notice that you are listening. This is where every master once stood." },
    { n: 2, from: 8, to: 14, name: "Week Two Review", title: "The Root Takes Hold", text: "Fourteen days. What was effort is becoming rhythm. You have proven that your word to yourself holds weight." },
    { n: 3, from: 15, to: 21, name: "Week Three Review" },
    { n: 4, from: 22, to: 28, name: "Week Four Review" },
    { n: 5, from: 29, to: 35, name: "Week Five Review", title: "One Moon", text: "Thirty days, a full lunar cycle of practice. You have moved through every phase and kept your centre. The current is building." }
  ],
  final: {
    name: "Day 40 Review",
    questions: ["Looking back on these forty days, what has shifted in how I hold my energy?", "Which practices proved true for me?", "What did I build with the energy I kept?", "What will I carry into the next forty days?"],
    closingTitle: "Welcome to the club",
    closing: "You have finished forty days of returning to yourself. Keep the practices that proved true, and begin again whenever you need to.",
    quote: "Fall seven times, rise eight. The rising is the practice."
  },
  mudras: [["sun", "☉", "Sun"], ["moon", "☽", "Moon"], ["mars", "♂", "Mars"], ["mercury", "☿", "Mercury"], ["jupiter", "♃", "Jupiter"], ["venus", "♀", "Venus"], ["saturn", "♄", "Saturn"]],
  phases: [["menstrual", "Menstrual"], ["follicular", "Follicular"], ["ovulatory", "Ovulatory"], ["luteal", "Luteal"], ["unsure", "Unsure"]]
};
