/* ==========================================================================
   SOVEREIGN — Daycycle (optional, off by default)
   Three classic biorhythm cycles computed from the birth date:
   Physical 23 days · Emotional 28 days · Intellectual 33 days.
   value = sin(2π · t / period), t = whole days since birth (UTC midnights,
   so daylight-saving changes never shift a day).
   Pure functions only. Everything is computed on the device.
   Biorhythm theory has no scientific support; Sovereign frames this as a
   planning prompt and lets each person check it against how days really feel.
   ========================================================================== */
(function (SOV) {
  "use strict";
  const CYCLES = [
    { k: "phy", n: "Physical", p: 23 },
    { k: "emo", n: "Emotional", p: 28 },
    { k: "int", n: "Intellectual", p: 33 }
  ];
  const DAY = 86400000;
  const toUTC = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  const daysAlive = (dob, day) => Math.round((toUTC(day) - toUTC(dob)) / DAY);
  const isoAdd = (s, n) => new Date(toUTC(s) + n * DAY).toISOString().slice(0, 10);
  const val = (t, p) => Math.sin((2 * Math.PI * t) / p);
  const pct = (v) => Math.round(v * 100);
  const signed = (v) => (pct(v) > 0 ? "+" : pct(v) < 0 ? "−" : "") + Math.abs(pct(v)) + "%";
  /** A turning point: the cycle crosses zero between today and tomorrow, or sits right at it. */
  const turning = (t, p) => Math.sign(val(t, p)) !== Math.sign(val(t + 1, p)) || Math.abs(val(t, p)) < 0.07;

  function stateOf(t, p) {
    const v = val(t, p), up = val(t + 1, p) > v;
    if (turning(t, p)) return { id: "turn", label: "Turning point", up };
    if (v > 0.6) return { id: "peak", label: "Peak", up };
    if (v > 0) return { id: "high", label: "High", up };
    if (v > -0.6) return { id: "low", label: "Low", up };
    return { id: "trough", label: "Trough", up };
  }

  function readings(t) {
    return CYCLES.map((c) => ({ ...c, v: val(t, c.p), state: stateOf(t, c.p) }));
  }

  function headline(t) {
    const s = readings(t);
    const turn = s.filter((x) => x.state.id === "turn");
    if (turn.length) return { id: "turn", h: "A turning-point day",
      s: `${turn.map((x) => x.n).join(" and ")} ${turn.length > 1 ? "are" : "is"} crossing over today. Move a little slower and check things twice.` };
    const best = [...s].sort((a, b) => b.v - a.v)[0], worst = [...s].sort((a, b) => a.v - b.v)[0];
    if (best.v > 0.5 && worst.v > 0) return { id: "strong", h: "A strong day across the board",
      s: `All three cycles are positive. Lead with your ${best.n.toLowerCase()} strength.` };
    if (worst.v < -0.5 && best.v < 0) return { id: "recharge", h: "A recharge day",
      s: "All three cycles are below the line. Keep commitments small and let the energy gather." };
    return { id: "lean", h: `Lean on your ${best.n.toLowerCase()} side`,
      s: `${best.n} is highest (${signed(best.v)}) and ${worst.n.toLowerCase()} is lowest (${signed(worst.v)}). Plan around both.` };
  }

  /* Women's track: the body's own cycle is layered over the three rhythms. */
  const PHASE = {
    menstrual: "Inner winter comes first. Whatever the cycles say, keep effort soft and rest when you can.",
    follicular: "Inner spring. Rising energy supports anything the cycles mark as high.",
    ovulatory: "Inner summer. A natural time to connect and express, so lean into people time.",
    luteal: "Inner autumn. Favour finishing over starting, and protect your evenings."
  };

  /** The day plan, from wake to sleep. Each block's time is given as
      minutes after waking (at), minutes before sleep (before), or a fraction
      of the waking day (frac); the app turns these into clock times. Each
      block lists practice suggestions in order of preference; the app shows
      the first one the member's track, level and path allow. */
  function plan(t, ctx = {}) {
    const P = val(t, 23), E = val(t, 28), I = val(t, 33);
    const tP = turning(t, 23), tE = turning(t, 28), tI = turning(t, 33);
    const winter = ctx.phase === "menstrual", faith = !!ctx.scripture;
    const b = [];

    b.push({ at: 0, k: "phy",
      what: tP ? "Ground first" : winter ? "Wake gently" : P > 0.3 ? "Move first" : P > -0.3 ? "Ease in" : "Wake gently",
      txt: tP ? "Physical is crossing over. Skip max effort and anything that needs fine coordination. A walk, stretching and grounding are enough."
        : winter ? "Your body's own cycle asks for softness today. Stretch, breathe low into the belly, and keep exercise easy."
        : P > 0.3 ? "The body is on your side. Do your training or most physical task in the first two hours, then raise the energy with breath."
        : P > -0.3 ? "Moderate energy. A brisk walk or light session wakes you without draining you."
        : "The body cycle is low. Sleep a little longer if you can, keep exercise easy, and start with water and protein.",
      act: tP ? [{ type: "protocol", id: "grounding-reset" }]
        : winter ? [{ type: "protocol", id: "yoni-breathing" }, { type: "pacer", id: "so-hum" }]
        : P > 0.3 ? [{ type: "protocol", id: "breath-of-fire" }]
        : P > -0.3 ? [{ type: "pacer", id: "nadi" }]
        : [{ type: "pacer", id: "so-hum" }] });

    b.push({ at: 120, k: "int",
      what: tI ? "Careful work" : I > 0.3 ? "Deep work" : I > -0.3 ? "Steady work" : "Light work",
      txt: tI ? "Intellectual is at a turning point. Double-check numbers, agreements and messages before sending. Postpone big decisions if you can."
        : I > 0.3 ? "Your sharpest window. Put the hardest thinking, writing or study here, with notifications off."
        : I > -0.3 ? "Good for routine focus: planning, reviewing and steady progress on known work."
        : "Thinking may feel slower. Clear messages, tidy and work through checklists. Save the hard problems.",
      act: tI ? [{ type: "pacer", id: "nadi" }]
        : I > 0.3 ? [{ type: "lesson" }, { type: "sound", id: "deep-focus" }]
        : I > -0.3 ? [{ type: "sound", id: "calm-focus" }]
        : [{ type: "sound", id: "alertness" }] });

    b.push({ frac: 0.42, k: "emo",
      what: tE ? "Pause before reacting" : E > 0.3 ? "People time" : E > -0.3 ? "Check in" : "Protect your mood",
      txt: tE ? "Emotional is crossing over. Reactions may come quicker than usual, so take a breath before replying to anything charged."
        : E > 0.3 ? "Warmth and empathy run high. Have the important conversation, or reach out to someone you've been meaning to."
        : E > -0.3 ? "An even keel. Short check-ins and shared work go well."
        : "Patience may be thinner. Keep meetings short, step away from conflict, and write out what you feel instead of carrying it.",
      act: tE ? [{ type: "pacer", id: "478" }]
        : E > 0.3 ? [{ type: "protocol", id: "mirror-gaze" }, { type: "pacer", id: "aum" }]
        : E > -0.3 ? [{ type: "pacer", id: "bhramari" }]
        : [{ type: "journal" }] });

    const body = (P + I) / 2;
    b.push({ frac: 0.62, k: "phy",
      what: tP ? "Reset, don't push" : P > 0.3 ? "Second wind" : body > -0.3 ? "Get outside" : "Rest and recover",
      txt: tP ? "The afternoon dip may land harder today. Ten minutes of stillness or a short walk will do more than caffeine."
        : P > 0.3 ? "There's still strength in the body this afternoon. If you didn't train this morning, now is good; otherwise spend the charge on physical work."
        : body > -0.3 ? "Step outside for a few minutes. Daylight, fresh air and bare feet on the ground reset the afternoon."
        : "Energy is low this afternoon. A 20-minute rest, a slow walk or quiet sound will carry you further than forcing it.",
      act: tP ? [{ type: "protocol", id: "grounding-reset" }]
        : P > 0.3 ? [{ type: "guide", id: "train-charged" }, { type: "protocol", id: "breath-of-fire" }]
        : body > -0.3 ? [{ type: "guide", id: faith ? "creation-walk" : "earth-daily" }, { type: "guide", id: "earth-daily" }]
        : [{ type: "sound", id: "schumann" }] });

    const avg = (P + E + I) / 3;
    b.push({ before: 210, k: "all",
      what: avg > 0.2 ? "Cultivate" : avg > -0.2 ? "Gather" : "Wind down early",
      txt: avg > 0.2 ? "Overall the cycles are positive. A good evening to cultivate and circulate the energy you've built."
        : avg > -0.2 ? "A balanced evening. A short sitting practice gathers the day's energy instead of scattering it on screens."
        : "Overall the cycles are low. Keep the evening light, put the phone away early, and set up tomorrow.",
      act: avg > 0.2 ? [{ type: "protocol", id: "transmutation-15" }, { type: "sound", id: "schumann" }]
        : avg > -0.2 ? [{ type: "pacer", id: faith ? "jesus-prayer" : "so-hum" }, { type: "sound", id: "meditation" }]
        : [{ type: "pacer", id: "bhramari" }] });

    b.push({ before: 60, k: "emo",
      what: E > 0.3 ? "Close with gratitude" : tE ? "Settle the heart" : E > -0.3 ? "Close the day" : "Let the day go",
      txt: E > 0.3 ? "End the day warmly. Share it with someone you love, or write down three things that went well."
        : tE ? "Feelings may still be stirred. Slow your breathing before bed so you don't carry them into sleep."
        : E > -0.3 ? "Look back over the day briefly, then let it go. Screens off, lights low."
        : "Let today be finished. Lights low, slow breathing, and let a quiet sound carry you toward sleep. If something still weighs on you, a few lines in the journal will help.",
      act: [...(faith ? [{ type: "guide", id: "examen" }] : []),
        ...(tE ? [{ type: "pacer", id: "478" }] : E > 0.3 ? [{ type: "journal" }] : [{ type: "sound", id: "deep-sleep" }])] });
    return b;
  }

  /** The one practice to put forward on Home: steady the turning point, else follow the strongest cycle. */
  function keyBlock(t, blocks) {
    const r = readings(t);
    const turn = r.find((x) => x.state.id === "turn");
    if (turn) return blocks.find((b) => b.k === turn.k) || blocks[0];
    const best = [...r].sort((a, b) => b.v - a.v)[0];
    if (best.v < 0) return blocks.find((b) => b.k === "all") || blocks[0];
    return blocks.find((b) => b.k === best.k) || blocks[0];
  }

  function eventsOn(t) {
    const ev = [];
    CYCLES.forEach((c) => {
      const v = val(t, c.p);
      if (turning(t, c.p) && !turning(t - 1, c.p)) ev.push(`${c.n} turning point`);
      else if (v > val(t - 1, c.p) && v >= val(t + 1, c.p)) ev.push(`${c.n} peak`);
      else if (v < val(t - 1, c.p) && v <= val(t + 1, c.p)) ev.push(`${c.n} low`);
    });
    const all = CYCLES.map((c) => val(t, c.p));
    if (all.every((v) => v > 0.5)) ev.unshift("Triple high: the best day for big pushes");
    if (all.every((v) => v < -0.5)) ev.unshift("Triple low: keep it light");
    return ev;
  }
  function upcoming(dob, day, n = 30, max = 10) {
    const t0 = daysAlive(dob, day), rows = [];
    for (let i = 1; i <= n && rows.length < max; i++) {
      const ev = eventsOn(t0 + i);
      if (ev.length) rows.push({ date: isoAdd(day, i), events: ev });
    }
    return rows;
  }
  /** A gentle in-app heads-up for tomorrow (never a notification). */
  function tomorrow(t) {
    const ev = eventsOn(t + 1).filter((e) => /turning|Triple/.test(e));
    return ev.length ? ev.join(" · ") : null;
  }

  /** One line for the daily reminder (used only when notifications show details). */
  function brief(t) {
    const h = headline(t);
    return `${h.h}. ` + readings(t).map((r) => `${r.n} ${signed(r.v)}`).join(" · ");
  }

  /* Does it match you? Pearson correlation between how days felt (1–5) and
     the cycles, overall and for each cycle. */
  function corr(xs, ys) {
    const n = xs.length; if (n < 3) return 0;
    const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
  }
  const MATCH_DAYS = 30;
  function match(dob, feel) {
    const days = Object.keys(feel || {}).filter((d) => d >= dob).sort();
    const ts = days.map((d) => daysAlive(dob, d)), fs = days.map((d) => feel[d]);
    const out = { n: days.length, need: MATCH_DAYS, ready: days.length >= MATCH_DAYS };
    if (!out.ready) return out;
    out.r = corr(ts.map((t) => CYCLES.reduce((a, c) => a + val(t, c.p), 0) / 3), fs);
    out.cycles = CYCLES.map((c) => ({ n: c.n, k: c.k, r: corr(ts.map((t) => val(t, c.p)), fs) })).sort((a, b) => b.r - a.r);
    const r = out.r;
    out.verdict = r >= 0.4 ? "The cycles have tracked your days closely."
      : r >= 0.2 ? "The cycles have tracked your days loosely."
      : r > -0.2 ? "So far there's no real match between the cycles and how your days feel. Trust your body over the chart."
      : "Your days have tended to run opposite to the cycles. Trust your body over the chart.";
    return out;
  }

  const FEEL = [[1, "Drained"], [2, "Low"], [3, "Steady"], [4, "Good"], [5, "Strong"]];

  const DISCLAIMER = "Biorhythm theory has no scientific support, so treat Daycycle as a planning prompt, not a forecast. Your sleep, health and own sense of the day matter more than any chart. The evening check-in shows how well it matches you.";


  /* ========================================================================
     DAY SUMMARY — an on-device writer
     Not everyone lives by a schedule, so Daycycle also describes the day in
     plain prose. Each cycle's position (10 states: turning up/down, peak,
     high, low and trough, each rising or falling) selects one of several
     sentences; connectors, an opening, advice, a look ahead and a personal
     note (from the member's own check-ins on days shaped like this one) are
     composed around them. A seed from the day number picks the wording, so a
     day always reads the same, but no two days read alike. Millions of
     distinct summaries come from a small phrase library, with no server and
     no AI model.
     ======================================================================== */
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const weekday = (day) => WEEKDAYS[new Date(toUTC(day)).getUTCDay()];

  function bucket(t, p) {
    const v = val(t, p), up = val(t + 1, p) > v;
    const b = turning(t, p) ? "turn" : v > 0.6 ? "peak" : v > 0 ? "high" : v > -0.6 ? "low" : "trough";
    return b + (up ? "Up" : "Down");
  }

  const CLAUSE = {
    phy: {
      turnUp: ["Your body is crossing back over its midline today, so energy may feel unpredictable.", "Physically, today is a hinge: the body is turning from low to high and may feel a little out of sync.", "The physical rhythm crosses upward today, a day when coordination can wobble before strength returns."],
      turnDown: ["Your body is crossing its midline on the way down, so energy may drop off sooner than you expect.", "Physically, today is a hinge: the body is passing from high to low and may tire without warning.", "The physical rhythm crosses downward today, which can mean clumsiness or a sudden dip in stamina."],
      peakUp: ["Your body is near the top of its cycle and still climbing, with strength and stamina close to their best.", "Physically you're almost at your peak, with energy that wants to be used.", "The physical rhythm is high and still rising, so the body is ready for real effort."],
      peakDown: ["Your body has just passed its peak; there's plenty of strength left, but it's starting to ease.", "Physically you're just over the crest: still strong, and best used before the slope begins.", "The physical rhythm is high but turning downhill, so use today's strength rather than save it."],
      highUp: ["Your body is on the rise, with energy building day by day.", "Physical energy is climbing steadily, so each day this week should feel a little stronger.", "The physical rhythm is positive and rising, a good time to build habits that take effort."],
      highDown: ["Your body is still in positive territory but drifting down, so pace yourself.", "Physical energy is good but fading gently, so spend it on what matters most.", "The physical rhythm is above the line and easing, so finish strong rather than start big."],
      lowDown: ["Your body is below its midline and still sinking, so recovery deserves attention.", "Physical energy is low and drifting lower, so sleep, food and gentle movement matter more than usual.", "The physical rhythm is in its quieter half and heading down, so don't ask too much of the body today."],
      lowUp: ["Your body is below its midline but climbing back, so energy should return over the next few days.", "Physical energy is low but recovering, and gentle movement will help it along.", "The physical rhythm is coming up out of its low, with strength slowly returning."],
      troughDown: ["Your body is near the bottom of its cycle, so this is a day for rest, warmth and easy movement.", "Physically you're close to your lowest point, so treat today as recovery, not training.", "The physical rhythm is deep in its low, and the body is asking for restoration."],
      troughUp: ["Your body has just passed the bottom of its cycle, so the worst of the fatigue is behind you.", "Physically you're turning the corner from your lowest point; rest today and the climb begins.", "The physical rhythm is at its low but beginning to lift, so recovery is under way."]
    },
    emo: {
      turnUp: ["Emotionally you're crossing over today, so feelings may swing before they settle into a warmer phase.", "Your heart is at a turning point, moving from a quieter phase into an open one, so be gentle with quick reactions.", "The emotional rhythm crosses upward today, so moods may be changeable."],
      turnDown: ["Emotionally you're crossing into a quieter phase today, so small things may land harder than usual.", "Your heart is at a turning point on the way down, so give yourself extra patience.", "The emotional rhythm crosses downward today, so moods may be changeable and reactions quick."],
      peakUp: ["Your heart is wide open, near the top of its cycle, and warmth, empathy and confidence come easily.", "Emotionally you're close to your high point, a natural time for connection and generosity.", "The emotional rhythm is high and still rising, so people will feel easier to reach."],
      peakDown: ["Your heart has just passed its high point, still warm and open but beginning to turn inward.", "Emotionally you're just past your peak, a good day for conversations you've been putting off.", "The emotional rhythm is high but easing, so share what's good while it's flowing."],
      highUp: ["Your mood is lifting, with warmth and patience growing.", "Emotionally things are brightening day by day.", "The emotional rhythm is positive and rising, which favours people and creativity."],
      highDown: ["Your mood is good but slowly turning inward.", "Emotionally you're steady and positive, though the tide is going out.", "The emotional rhythm is above the line and easing, so protect the good mood rather than spend it all."],
      lowDown: ["Your mood is in its quieter phase and sinking, so sensitivity may be higher than usual.", "Emotionally you're below the line and heading lower, so guard your peace and your words.", "The emotional rhythm is in its quieter half and still descending, a day to keep things simple with people."],
      lowUp: ["Your mood is still quiet but beginning to lift.", "Emotionally you're coming back up, and the heaviness should ease over the next few days.", "The emotional rhythm is low but rising, so better days for connection are close."],
      troughDown: ["Your heart is near the bottom of its cycle, so expect to feel more tender than usual and don't judge what you feel.", "Emotionally you're close to your lowest point, so solitude, prayer or journaling may serve you better than company.", "The emotional rhythm is deep in its low, a time to be kind to yourself before anyone else."],
      troughUp: ["Your heart has just passed the bottom of its cycle, and the emotional weight is starting to lift.", "Emotionally you're turning the corner from your lowest point.", "The emotional rhythm is at its low but rising, so lightness is on its way back."]
    },
    int: {
      turnUp: ["Your mind is crossing its midline today, so focus may come and go before it sharpens.", "Mentally today is a hinge: thinking is shifting into a clearer phase, but double-check the details.", "The intellectual rhythm crosses upward today, so read things twice before you commit."],
      turnDown: ["Your mind is crossing its midline on the way down, so errors slip in more easily and it pays to check your work.", "Mentally today is a hinge: clarity is fading into a quieter phase, so avoid big decisions if you can.", "The intellectual rhythm crosses downward today, a day to double-check numbers and messages."],
      peakUp: ["Your mind is sharp and still sharpening, near the top of its cycle.", "Mentally you're close to your best: quick, clear and ready for hard problems.", "The intellectual rhythm is high and climbing, ideal for study and strategy."],
      peakDown: ["Your mind has just passed its peak but is still very clear, so finish the hard thinking now.", "Mentally you're just over the crest and still sharp, so tackle the difficult work first.", "The intellectual rhythm is high but easing, so make decisions while clarity is strong."],
      highUp: ["Your mind is clearing and gaining focus day by day.", "Mental energy is rising, so learning and planning come more easily.", "The intellectual rhythm is positive and climbing, good for starting new study."],
      highDown: ["Your mind is clear but slowly losing its edge, so use the focus you have.", "Mental energy is good but easing, so close open loops rather than open new ones.", "The intellectual rhythm is above the line and drifting down, a time to finish rather than begin."],
      lowDown: ["Your mind is in its quieter phase and drifting lower, so keep to routine work.", "Mental energy is low and sinking, so lists and simple tasks will serve you better than big plans.", "The intellectual rhythm is in its quieter half and heading down, so don't force the hard problems."],
      lowUp: ["Your mind is quiet but beginning to clear again.", "Mental energy is low but recovering, so plan the hard work for later in the week.", "The intellectual rhythm is coming up from its low, with focus slowly returning."],
      troughDown: ["Your mind is near the bottom of its cycle, so let it rest: tidy, walk and leave the big thinking for another day.", "Mentally you're close to your lowest point, a day for simple, familiar tasks.", "The intellectual rhythm is deep in its low, so be patient with forgetfulness and slow thinking."],
      troughUp: ["Your mind has just passed the bottom of its cycle, and clarity is starting to come back.", "Mentally you're turning the corner from your lowest point.", "The intellectual rhythm is at its low but lifting, so your focus will improve day by day."]
    }
  };
  const OPEN = {
    turn: ["{Day} is a turning-point day.", "Today is a hinge in your cycles.", "Think of this {Day} as a crossing day.", "Today is a day of transition."],
    strong: ["{Day} is a strong day.", "All three rhythms are working for you today.", "Today the tide is with you.", "Today is a day to lead from strength."],
    recharge: ["{Day} is a recharge day.", "Today all three rhythms are resting.", "This is a quiet day in your cycles.", "Today is a day for gathering rather than spending."],
    lean: ["{Day} is a mixed day.", "Today your rhythms pull in different directions.", "Today brings both strengths and soft spots.", "This {Day} asks for a little strategy."]
  };
  const JOIN2 = ["Meanwhile,", "At the same time,", "Alongside that,", "On another level,"];
  const JOIN3 = ["And", "Finally,", "Underneath it all,"];
  const BEST = {
    phy: ["Put your energy into the body: train, build, clean, carry.", "Use the strength while it's here: move early and work with your hands.", "Let the body lead today."],
    emo: ["Spend it on people: the call, the visit, the honest conversation.", "Lead with your heart today: connect, encourage, create.", "Let warmth lead today."],
    int: ["Give your best hours to thinking: study, plan, write, solve.", "Protect a long block of deep focus, because it will pay back more than usual.", "Let the mind lead today."]
  };
  const CARE = {
    phy: ["Go easy on the body: no max efforts, and get to bed on time.", "Don't schedule anything physically demanding if you can avoid it.", "Rest counts as progress for the body today."],
    emo: ["Be slow to react and quick to forgive, yourself included.", "Keep hard conversations for another day if you can.", "Guard your mood: less news, less noise, more quiet."],
    int: ["Check anything important twice, and don't sign or decide in a hurry.", "Keep the to-do list short and simple.", "Save the hard problems for a sharper day."]
  };
  const EVEN = ["Nothing is pulling hard in either direction, so steady habits are your friend today.", "With no strong highs or lows, today rewards consistency over intensity."];
  const PRACTICE = ["If you do one practice today, make it {p}.", "Today's practice: {p}.", "One practice suits today best: {p}."];
  const AHEAD = {
    tripleHigh: ["A triple high arrives {when}, the best day this cycle for a big push.", "Look ahead to {when}: all three rhythms are high together."],
    tripleLow: ["A triple low comes {when}, so keep that day light.", "Plan a gentle day {when}, when all three rhythms are low together."],
    turn: ["{Cycle} reaches a turning point {when}.", "Expect a shift {when}, when your {cycle} rhythm crosses over."],
    peak: ["Your {cycle} rhythm peaks {when}.", "{Cycle} reaches its high point {when}."],
    low: ["Your {cycle} rhythm reaches its low {when}, then begins to rise.", "{Cycle} bottoms out {when}."]
  };
  const FEELWORD = ["", "drained", "low", "steady", "good", "strong"];
  const PERSONAL = ["On the {n} days you've rated that were shaped most like today, you felt {word} on average.", "Your own record says days with a shape like this have usually felt {word} to you."];
  const NEWBIE = ["Rate tonight how today actually felt. Over time Daycycle learns which days suit you.", "Tonight's check-in teaches Daycycle how days like this really feel for you."];
  const UNSEEN = ["You haven't rated a day quite like this one yet, so tonight's check-in will help."];

  /** Compose today's summary. ctx: { phase, practice (label), history: [{ day, feel }], match } */
  function summary(dob, day, ctx = {}) {
    const t = daysAlive(dob, day), R = rng(t * 7919 + 104729), pick = (a) => a[Math.floor(R() * a.length)];
    const fill = (s, m) => s.replace(/\{(\w+)\}/g, (_, k) => m[k] ?? "");
    const r = readings(t), h = headline(t), Day = weekday(day);
    const order = [...r].sort((a, b) => (b.state.id === "turn") - (a.state.id === "turn") || Math.abs(b.v) - Math.abs(a.v));
    const opener = fill(pick(OPEN[h.id]), { Day });
    const c1 = pick(CLAUSE[order[0].k][bucket(t, order[0].p)]);
    const c2 = pick(JOIN2) + " " + lowerFirst(pick(CLAUSE[order[1].k][bucket(t, order[1].p)]));
    const c3 = pick(JOIN3) + " " + lowerFirst(pick(CLAUSE[order[2].k][bucket(t, order[2].p)]));
    const p1 = [opener, c1, c2, c3, ctx.phase && PHASE[ctx.phase] ? PHASE[ctx.phase] : ""].filter(Boolean).join(" ");

    const best = [...r].sort((a, b) => b.v - a.v)[0];
    const weak = [...r].filter((x) => x.state.id === "turn" || x.v < -0.3).sort((a, b) => a.v - b.v)[0];
    const adv = [];
    if (best.v > 0.3) adv.push(pick(BEST[best.k]));
    if (weak && weak.k !== best.k) adv.push(pick(CARE[weak.k]));
    if (!adv.length) adv.push(pick(EVEN));
    if (ctx.practice) adv.push(fill(pick(PRACTICE), { p: ctx.practice }));

    const more = [];
    for (let i = 1; i <= 7 && !more.length; i++) {
      const tt = t + i, all = CYCLES.map((c) => val(tt, c.p));
      const when = i === 1 ? "tomorrow" : i === 7 ? "a week from today" : `on ${weekday(isoAdd(day, i))}`;
      if (all.every((v) => v > 0.5) && !CYCLES.every((c) => val(tt - 1, c.p) > 0.5)) more.push(fill(pick(AHEAD.tripleHigh), { when }));
      else if (all.every((v) => v < -0.5) && !CYCLES.every((c) => val(tt - 1, c.p) < -0.5)) more.push(fill(pick(AHEAD.tripleLow), { when }));
      else for (const c of CYCLES) {
        if (more.length) break;
        const v = val(tt, c.p), m = { when, Cycle: c.n, cycle: c.n.toLowerCase() };
        if (turning(tt, c.p) && !turning(tt - 1, c.p)) more.push(fill(pick(AHEAD.turn), m));
        else if (i <= 4 && v > val(tt - 1, c.p) && v >= val(tt + 1, c.p) && v > 0.9) more.push(fill(pick(AHEAD.peak), m));
        else if (i <= 4 && v < val(tt - 1, c.p) && v <= val(tt + 1, c.p) && v < -0.9) more.push(fill(pick(AHEAD.low), m));
      }
    }
    // Personal: average feel on the most similar days already rated.
    const hist = (ctx.history || []).filter((x) => x.day !== day && x.day >= dob);
    const near = hist.map((x) => { const tx = daysAlive(dob, x.day); return { feel: x.feel, d: Math.hypot(...CYCLES.map((c) => val(tx, c.p) - val(t, c.p))) }; })
      .filter((x) => x.d < 0.7).sort((a, b) => a.d - b.d).slice(0, 5);
    if (near.length >= 3) {
      const avg = near.reduce((a, x) => a + x.feel, 0) / near.length, word = FEELWORD[Math.round(avg)];
      more.push(fill(pick(PERSONAL), { n: near.length, word }));
      if ((avg >= 4 && h.id === "recharge") || (avg <= 2 && h.id === "strong")) more.push("Trust your own experience over the chart.");
    } else more.push(pick(hist.length < 5 ? NEWBIE : UNSEEN));
    if (ctx.match && ctx.match.ready && ctx.match.r < 0.2) more.push("So far the cycles haven't matched your days closely, so hold this lightly.");

    const theme = h.id === "lean" ? `lean-${[...r].sort((a, b) => a.v - b.v)[0].k}` : h.id;
    return { title: h.h, lead: c1, paras: [p1, adv.join(" "), more.join(" ")], theme };
  }

  SOV.DAYCYCLE = { CYCLES, PHASE, FEEL, MATCH_DAYS, DISCLAIMER, daysAlive, isoAdd, val, pct, signed, turning, stateOf,
    readings, headline, plan, keyBlock, upcoming, tomorrow, brief, match, summary, bucket };
})(window.SOV || (window.SOV = {}));
