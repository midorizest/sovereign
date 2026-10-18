/* ==========================================================================
   GUIDE — "Build" and "Apply"
   Lazy-loaded the first time the Guide tab opens.

   Item shape:
     id, title, tracks ["men","women"], time, why,
     steps   (array, or { men: [...], women: [...] })
     cue     when to reach for it in daily life
     caution optional safety note
     source  optional lineage / reference
     link    optional { view, label } to jump to a protocol or lesson
   Any text field may also be { men: "...", women: "..." }.
   ========================================================================== */
window.SOV = window.SOV || {};

SOV.GUIDE = {
  /* ======================================================================
     BUILD — generating, storing, and circulating the energy
     ====================================================================== */
  build: {
    intro: "Energy is built the same way strength is: daily, quietly, and mostly through what you stop leaking. Start with the foundations before the advanced work.",
    categories: [
      {
        name: "Protect the Reservoir",
        sub: "Stop the leaks first. Everything else builds on this.",
        items: [
          {
            id: "sleep-window", title: "Sleep Before Midnight", tracks: ["men", "women"], time: "Nightly",
            why: "Both Taoist and Ayurvedic traditions treat the hours before midnight as the body's deepest restoration window. Modern research agrees that short or broken sleep lowers hormones, drive, and mood. You cannot transmute energy you never rebuilt.",
            steps: [
              "Set a fixed lights-out time, ideally between 10 and 11 PM, and keep it on weekends.",
              "Dim screens and overhead lights 60 minutes before bed. Charge your phone outside the bedroom.",
              "Keep the room cool, dark, and quiet.",
              "If you wake, stay still and breathe into the lower belly rather than reaching for a screen."
            ],
            cue: "If your energy feels flat or scattered for several days, look at sleep before anything else."
          },
          {
            id: "stimulation-fast", title: "Lower the Noise", tracks: ["men", "women"], time: "7-day reset",
            why: "Constant stimulation — explicit content, endless scrolling, notifications — trains attention outward and spends arousal cheaply. These are pendulums: they grow by feeding on your energy. A short fast shows you how much you were leaking.",
            steps: [
              "Pick 7 days. Remove explicit content and set a daily limit on social apps.",
              "Turn off all non-essential notifications. Move tempting apps off your home screen.",
              "When the reflex to reach for stimulation appears, take three slow breaths into the belly and notice what you were actually feeling.",
              "Journal each evening: what did you do with the attention you reclaimed?"
            ],
            cue: "Restless, foggy, or unable to focus? Start a reset today.",
            caution: "This is about choice, not shame. If you find you can't stop despite real effort, that's worth discussing with a professional — it's common and treatable."
          },
          {
            id: "ojas-nutrition", title: "Eat for Ojas", tracks: ["men", "women"], time: "Daily",
            why: "Ayurveda teaches that ojas — the refined reserve behind steady vitality — is built from food that is fresh, warm, and well digested. Whatever the framework, whole food and stable blood sugar support stable energy.",
            steps: [
              "Favour warm, cooked, whole foods. Eat your largest meal around midday when digestion is strongest.",
              "Traditional ojas foods include ghee, soaked almonds, dates, whole milk (if you tolerate it), sweet fruits, and root vegetables.",
              "Include enough protein and healthy fats. Hormones are built from them.",
              "Reduce alcohol, heavy late-night meals, and ultra-processed snacks — the traditions call these ojas-depleting.",
              "Eat without screens when you can. Attention aids digestion."
            ],
            cue: "Plan tomorrow's meals tonight, especially on demanding days.",
            caution: "Not dietary or medical advice. Adjust for allergies, conditions, and your doctor's guidance."
          }
        ]
      },
      {
        name: "Generate",
        sub: "Physical practices that strengthen the root and raise vitality.",
        items: [
          {
            id: "pelvic-floor", title: "Pelvic Floor Training", tracks: ["men", "women"], time: "5 min · daily",
            why: "The pelvic floor is the gate. Every Taoist and yogic retention method depends on being able to feel, contract, and fully relax these muscles. It is also one of the most well-supported exercises in conventional health.",
            steps: [
              "Find the muscles: gently lift as if stopping the flow of urine and holding in gas at the same time. Keep the belly, buttocks, and thighs relaxed.",
              "Slow holds: lift for 5 seconds, then release fully for 5 seconds. Repeat 10 times.",
              "Quick flicks: lift and release briskly 10 times.",
              "The release matters as much as the lift. Finish by letting the whole pelvis soften.",
              "Build to holds of 10 seconds over several weeks."
            ],
            cue: "Pair it with something you already do daily — waiting for coffee, sitting at red lights.",
            caution: "Don't practise while actually urinating. If you have pelvic pain, tightness, or pain with sex, see a pelvic floor physiotherapist — some people need to learn to relax, not strengthen."
          },
          {
            id: "root-breathing", tracks: ["men", "women"], time: "10 min",
            title: { men: "Testicle Breathing", women: "Ovarian Breathing" },
            why: {
              men: "The foundational Taoist practice for men. It teaches you to move the cool, resting sexual energy from the testes up the spine using breath and attention alone — no arousal needed.",
              women: "The foundational Taoist practice for women. It teaches you to gather the energy of the ovaries into the womb space and draw it up the spine using breath and attention alone — no arousal needed."
            },
            steps: {
              men: [
                "Sit upright on the edge of a chair, feet flat, spine straight, tongue resting on the roof of the mouth. Dress warmly.",
                "Bring your attention to the testes. Breathe slowly through the nose.",
                "On each inhale, gently draw the testes upward and imagine cool energy lifting into the perineum. On the exhale, relax and let them lower.",
                "Repeat 9 times, then hold the energy at the perineum and feel it gather.",
                "Next, guide it to the sacrum, then over successive sessions to points higher up the spine and eventually the crown.",
                "Always finish by bringing the energy down the front of the body and storing it at the navel. Rest your hands there."
              ],
              women: [
                "Sit upright on the edge of a chair, feet flat, spine straight, tongue resting on the roof of the mouth. Dress warmly.",
                "Place your palms over your ovaries (a hand's width below the navel, to each side). Gently rub until you feel warmth.",
                "Bring your attention to the ovaries. On each inhale, imagine energy gathering from them into the womb space; on the exhale, let it rest there.",
                "After 9 breaths, draw that warmth down to the perineum, then up to the sacrum.",
                "Over successive sessions, guide it higher up the spine and eventually to the crown.",
                "Always finish by bringing the energy down the front of the body and storing it at the navel. Rest your hands there."
              ]
            },
            cue: "Mornings, on an empty stomach, before the day pulls at you.",
            caution: "From Chia's safety rules: sit upright, never lie flat on your back or on your left side; wait an hour after eating; breathe through the nose. If you feel pressure in the head or chest, bring the energy down to the navel and rest.",
            source: "Taoist practice, as taught by Mantak Chia"
          },
          {
            id: "strength-training", title: "Train Heavy, Recover Fully", tracks: ["men", "women"], time: "3× / week",
            why: "Heavy, compound movement builds the vessel. Strength training supports healthy hormone levels, sleep, mood, and confidence in both men and women — and gives the energy somewhere powerful to go.",
            steps: [
              "Train 2–4 times a week with compound lifts: squats, deadlifts or hip hinges, presses, rows, carries.",
              "Breathe low into the belly and brace before each rep. Keep the pelvic floor engaged on effort, relaxed at rest.",
              "End each session with 2 minutes standing still, feet grounded, letting the heart rate settle.",
              "Recovery is part of the practice: sleep, food, and at least one full rest day."
            ],
            cue: "Schedule sessions like appointments. Charged energy finds a worthy outlet here.",
            caution: "Learn technique first and progress gradually. Check with a doctor if you have a heart, joint, or blood pressure condition."
          },
          {
            id: "earth-daily", title: "Daily Earth Contact", tracks: ["men", "women"], time: "10+ min",
            why: "The body is a battery. Grounding — skin contact with the earth — is used across traditions to settle the nervous system. The research is early and small, but the practice is free, calm, and gets you outside.",
            steps: [
              "Spend at least 10 minutes barefoot on grass, soil, sand, or unsealed stone.",
              "Combine it with something: morning light, a phone call, stretching, journaling.",
              "Indoors, a grounding mat is the alternative.",
              "Run the 5-Minute Grounding Reset whenever you feel charged and scattered."
            ],
            cue: "First thing after waking, and after any heated conversation.",
            link: { view: "protocols", label: "Open the Grounding Reset" }
          }
        ]
      },
      {
        name: "Circulate",
        sub: "Moving stored energy up and through the body.",
        items: [
          {
            id: "microcosmic-orbit", title: "The Microcosmic Orbit", tracks: ["men", "women"], time: "15 min",
            why: "The Taoist circuit: up the spine (the Governor channel) and down the front of the body (the Functional channel). Opening it gives raised energy a safe path, so it nourishes rather than agitates.",
            steps: [
              "Sit upright, tongue touching the roof of the mouth just behind the teeth — this connects the two channels.",
              "Rest attention at the navel until it feels warm. Then move it to the perineum.",
              "On slow inhales, guide attention up the spine: sacrum, mid-back, base of the skull, crown.",
              "On slow exhales, guide it down the front: brow, throat, heart, solar plexus, navel.",
              "Circle 9 to 36 times. Don't force sensation; attention leads, energy follows.",
              "Finish by collecting the energy at the navel. Men: spiral 36 times outward, 24 inward. Women: the reverse direction."
            ],
            cue: "After pelvic floor or root breathing, to distribute what you've gathered.",
            caution: "If you feel headaches, heat, or agitation, stop circulating and simply rest attention at the navel and soles of the feet.",
            source: "Taoist practice, as taught by Mantak Chia"
          },
          {
            id: "mudras-root", title: "Mudras for the Root", tracks: ["men", "women"], time: "15 min",
            why: "Hand gestures are used in yoga to hold attention on a particular quality. Two are traditionally linked to the root and to sexual force: the Earth mudra for stability, and the Kundalini mudra for uniting masculine and feminine.",
            steps: [
              "Earth (Prithvi) Mudra: touch the tips of the thumb and ring finger with light pressure; extend the other fingers. Both hands.",
              "With feet flat, inhale earth energy up through the soles to the crown; exhale and let it fall like rain back into a basin in your pelvic floor.",
              "Kundalini Mudra: make loose fists. Insert the left index finger into the right fist from below and rest the right thumb on its tip. Hold it low in front of the belly.",
              "Hold either one for 5–15 minutes while breathing slowly into the lower belly."
            ],
            cue: "Earth mudra when you feel unsteady or unsure; Kundalini mudra before transmutation work.",
            source: "Adapted from Gertrud Hirschi, Mudras: Yoga in Your Hands"
          }
        ]
      },
      {
        name: "Women's Cycle",
        sub: "Working with your tides instead of against them.",
        items: [
          {
            id: "cycle-seasons", title: "Build With Your Seasons", tracks: ["women"], time: "Monthly",
            why: "Your energy is cyclical by design. Treating every day the same leads to depletion. Matching practice to phase lets you conserve when you're low and build when you're rising.",
            steps: [
              "Menstrual (inner winter): rest, gentle walks, warmth on the belly. Lighter practice; skip intense retention work and inversions.",
              "Follicular (inner spring): energy rising. Begin new routines, increase training intensity, practise Ovarian Breathing daily.",
              "Ovulatory (inner summer): peak vitality. This is when energy is most abundant to gather and circulate. Ideal for the Microcosmic Orbit.",
              "Luteal (inner autumn): turn inward. Shift to grounding, slower breath, and journaling. Protect sleep."
            ],
            cue: "Log your phase daily on Home — patterns appear within two or three cycles.",
            caution: "If you're not cycling (pregnancy, menopause, contraception), follow the moon's phases or simply your body's signals."
          },
          {
            id: "breast-massage", title: "Taoist Breast Massage", tracks: ["women"], time: "5 min",
            why: "In the Taoist women's practice, gentle breast massage is used to warm and gather energy and to calm the heart. It also builds familiarity with your own body.",
            steps: [
              "Sit upright and rub your palms together until warm.",
              "Place the palms over the breasts and slowly circle outward — up the centre, out to the sides, down and in — 36 times.",
              "Rest the hands and breathe the warmth into the heart centre.",
              "Optionally follow with Ovarian Breathing."
            ],
            cue: "Mornings or before bed, especially in the follicular phase.",
            caution: "Notice any lumps, pain, discharge, or skin changes and have them checked by a doctor promptly. This doesn't replace screening.",
            source: "Taoist women's practice"
          }
        ]
      }
    ]
  },

  /* ======================================================================
     APPLY — using the energy in the real world
     ====================================================================== */
  apply: {
    intro: "Built energy has to go somewhere. Spent unconsciously, it leaks. Directed, it becomes focus, presence, creative output, and steadiness under pressure. These are the ways to point it.",
    categories: [
      {
        name: "In the Moment",
        sub: "When the surge rises, you have a choice.",
        items: [
          {
            id: "surge-redirect", title: "The 90-Second Redirect", tracks: ["men", "women"], time: "90 sec",
            why: "An urge peaks and passes like a wave, usually within a couple of minutes. This sequence, a simplified form of the Taoist Power Lock, turns that wave upward instead of outward.",
            steps: [
              "Stop. Exhale fully. Place your tongue on the roof of your mouth.",
              "Inhale slowly through the nose while lifting the pelvic floor. Lightly clench the fists, jaw, and feet.",
              "Imagine the hot energy rising from the pelvis to the tailbone, up the spine to the crown.",
              "Hold the breath and lift briefly at the top, then exhale and release all tension.",
              "Let the energy flow down the front of the body and settle at the navel.",
              "Repeat 3 to 9 times until the charge settles. Then move: walk, do push-ups, run cold water over your wrists, or switch tasks."
            ],
            cue: "The moment you notice arousal tipping into compulsion — or any strong urge.",
            caution: "Never strain until dizzy. Over time, use less muscle and more attention.",
            source: "Adapted from the Power Lock, Mantak Chia"
          },
          {
            id: "charge-to-direction", title: "Turn Charge Into Direction", tracks: ["men", "women"], time: "2 min",
            why: "Anger, anxiety, and frustration are raw energy. Like the figure of Arcanum XI, you don't kill the lion — you hold it with enough presence that its strength becomes yours.",
            steps: [
              "Name it silently: \"This is anger,\" \"This is fear.\" Naming creates distance.",
              "Drop attention to your feet. Exhale twice as long as you inhale for 6 breaths.",
              "Ask: what is this energy trying to protect or achieve?",
              "Choose one clean action it can fuel — a hard workout, an honest conversation later, a task you've avoided.",
              "Don't speak or send messages until the breath is slow again."
            ],
            cue: "Before replying to anything that made your heart rate jump."
          }
        ]
      },
      {
        name: "Work & Creativity",
        sub: "The oldest use of transmuted energy: building something.",
        items: [
          {
            id: "creative-first-hour", title: "The Creative First Hour", tracks: ["men", "women"], time: "60 min",
            why: "Energy is highest and cleanest before the world's demands reach you. Spending the first hour on inputs — news, messages, feeds — gives it away. Spending it on your most important work invests it.",
            steps: [
              "The night before, write down the single most important thing you'll create or move forward.",
              "On waking: water, light, a few minutes of grounding or root breathing. No phone.",
              "Work on that one thing for 45–60 minutes before opening any messages.",
              "Close by noting one line in your journal: what did the energy build today?"
            ],
            cue: "Every weekday. Protect it like a meeting with your future self."
          },
          {
            id: "transmutation-sprint", title: "The Transmutation Sprint", tracks: ["men", "women"], time: "25–50 min",
            why: "Napoleon Hill famously argued that highly successful people learned to redirect sexual drive into ambition and creative work. When you feel charged, that's the moment to build, not to scroll.",
            steps: [
              "Notice the charge: restlessness, heat, heightened desire, or vivid imagination.",
              "Do 3 rounds of the 90-Second Redirect to raise the energy.",
              "Immediately begin a timed sprint on demanding creative work: writing, designing, training, planning, practising your craft.",
              "Phone in another room. One task only.",
              "After the sprint, ground for 2 minutes and note what you produced."
            ],
            cue: "Whenever desire or restlessness peaks — especially in the evening, when it most often leaks.",
            source: "Inspired by Napoleon Hill, Think and Grow Rich"
          },
          {
            id: "subconscious-sleep", title: "Impress the Subconscious Before Sleep", tracks: ["men", "women"], time: "5 min · nightly",
            why: "Joseph Murphy taught that the drowsy state between waking and sleep is when the mind is most receptive. Effort works against you there; a calm feeling of completion works for you. As within, so without.",
            steps: [
              "In bed, relax your body from feet to head. Let yourself become drowsy.",
              "Condense your goal into a short phrase in the present tense — three to six words.",
              "Repeat it slowly, like a lullaby, without strain.",
              "Picture one small scene that would only happen if it were already true: a congratulation, a handshake, a moment of relief. Feel it.",
              "Fall asleep in that feeling."
            ],
            cue: "Every night, especially when you're working toward something specific.",
            source: "Adapted from Joseph Murphy, Grow Rich with the Power of Your Subconscious Mind"
          },
          {
            id: "seal-intention", title: "Seal an Intention", tracks: ["men", "women"], time: "3 min",
            why: "Thought is the seed; feeling gives it form. A brief, focused ritual turns a vague wish into a clear direction your daily energy can serve.",
            steps: [
              "Formulate one goal clearly in words. Ask your heart honestly: is this good for me, and for those around me?",
              "Form the Kubera mudra: the tips of the thumb, index, and middle fingers together; ring and little fingers folded into the palm. Both hands.",
              "Press the fingertips together and state the goal aloud, positively, three times.",
              "Then act on it: choose the one step you'll take today."
            ],
            cue: "At the start of a week, a project, or a new cycle.",
            source: "Adapted from Gertrud Hirschi, Mudras: Yoga in Your Hands"
          },
          {
            id: "cycle-planning", title: "Plan Your Month by Phase", tracks: ["women"], time: "15 min · monthly",
            why: "Your cycle is a monthly strategy. Many women find they work best when they match tasks to the energy each phase naturally brings.",
            steps: [
              "Follicular: start projects, brainstorm, learn new skills, take on challenges.",
              "Ovulatory: pitch, present, negotiate, network, have important conversations.",
              "Luteal: finish, edit, organise, review details; set boundaries on new commitments.",
              "Menstrual: reflect, evaluate, plan the next cycle; lighten your schedule where you can."
            ],
            cue: "On the first day of your period, map the coming weeks."
          }
        ]
      },
      {
        name: "Presence & Relationships",
        sub: "Contained energy is felt by others before it's understood.",
        items: [
          {
            id: "grounded-presence", title: "Grounded Presence", tracks: ["men", "women"], time: "Any conversation",
            why: "People respond to steadiness. When your energy is contained and your breath is low, you speak less, listen more, and carry a calm that others read as confidence.",
            steps: [
              "Before you walk in, take three breaths into the lower belly and feel your feet.",
              "Hold eye contact a beat longer than is comfortable, softly.",
              "Speak slower than usual. Pause before answering.",
              "Listen to understand, not to reply. Let silences be.",
              "Notice when you start performing or seeking approval — that's leakage. Return to your breath."
            ],
            cue: "Interviews, dates, difficult conversations, leading a team.",
            caution: "Magnetism is not manipulation. Use presence to connect honestly, never to pressure anyone."
          },
          {
            id: "pendulum-defense", title: "Pendulum Defense", tracks: ["men", "women"], time: "Daily",
            why: "Transurfing teaches that pendulums — outrage cycles, gossip, toxic group dynamics, endless arguments — feed on your emotional energy. Fighting them feeds them too. The skill is to step aside.",
            steps: [
              "Notice the hook: a sudden pull to argue, prove, judge, or join in.",
              "Don't resist and don't feed it. Neither agree nor attack — simply withdraw attention.",
              "Ask: does engaging serve what I'm building?",
              "After time in crowds or draining company, release it: Ksepana mudra (index fingers together pointing down, other fingers interlaced) for 7–15 exhales, with three deep sighs."
            ],
            cue: "Comment sections, heated group chats, the news cycle, family flashpoints.",
            source: "Concept from Vadim Zeland, Reality Transurfing; mudra from Gertrud Hirschi"
          },
          {
            id: "partner-practice", title: "Practising With a Partner", tracks: ["men", "women"], time: "Ongoing",
            why: "Cultivation can deepen intimacy rather than restrict it. The Taoist traditions teach couples to slow down, breathe together, and circulate energy between them — but it only works with honesty and full agreement.",
            steps: [
              "Talk openly first. Explain what you're practising and why. Ask what your partner wants.",
              "Retention is your personal practice, never a rule you impose on someone else. Their needs matter equally.",
              "Make connection the goal, not performance: slow down, keep eye contact, and breathe together chest to chest.",
              "When intensity rises, pause together and breathe the energy up the spine instead of rushing toward the peak.",
              "Afterward, lie together quietly and let the energy settle. Talk about what you each felt."
            ],
            cue: "Whenever you share intimacy — and in the conversations before it.",
            caution: "Enthusiastic consent comes first, every time. If practice creates pressure, resentment, or pain for either of you, stop and talk — or see a sex-positive therapist.",
            source: "Inspired by the Taoist teachings on harmonising partners (Chia & Winn)"
          }
        ]
      },
      {
        name: "Body, Decisions & Service",
        sub: "Where mastered energy shows up in everyday life.",
        items: [
          {
            id: "train-charged", title: "Spend It in Movement", tracks: ["men", "women"], time: "20–60 min",
            why: "Retained energy that isn't used can become restlessness or irritability. Physical effort is the cleanest outlet: it converts the charge into strength, endurance, and calm.",
            steps: [
              "When you feel charged or agitated, move within the hour: lift, sprint, swim, climb, dance, or fight sports.",
              "Train with focus — breath low, attention on each rep.",
              "Finish standing still with feet grounded for 2 minutes."
            ],
            cue: "Days when restlessness or arousal is high and you can't focus."
          },
          {
            id: "belly-decisions", title: "Decide From the Belly", tracks: ["men", "women"], time: "3 min",
            why: "Decisions made from a scattered, charged state are often regretted. The traditions place deeper knowing in the lower belly. Ground first, then choose.",
            steps: [
              "Ground for 60 seconds: feet flat, slow breath, hands on the belly.",
              "Hold the first option in mind. Notice the body's response — expansion or contraction, warmth or tightness.",
              "Repeat with the other option.",
              "For big decisions, write both down and sleep on them. Revisit in the morning, before your phone."
            ],
            cue: "Financial commitments, relationship turning points, reacting to bad news."
          },
          {
            id: "give-from-overflow", title: "Give From Overflow", tracks: ["men", "women"], time: "Weekly",
            why: "Cultivation turns selfish if it stops at the self. The fullest expression of built energy is generosity — mentoring, protecting, creating for others. But you can only pour from a full cup.",
            steps: [
              "Each week, choose one act of service that costs you energy and gives nothing back.",
              "Do it from fullness, not obligation. If you're depleted, rest first.",
              "Mentor someone earlier on the path, or share what has worked for you.",
              "Notice how you feel afterward. True giving should leave you steadier, not drained."
            ],
            cue: "Once your practice feels stable — usually after the 30-day mark."
          }
        ]
      }
    ]
  }
};
