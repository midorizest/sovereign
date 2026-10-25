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

  /** The day plan as offsets from wake time. Each block lists practice
      suggestions in order of preference; the app shows the first one the
      member's track and level allow. */
  function plan(t, ctx = {}) {
    const P = val(t, 23), E = val(t, 28), I = val(t, 33);
    const tP = turning(t, 23), tE = turning(t, 28), tI = turning(t, 33);
    const winter = ctx.phase === "menstrual";
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

    b.push({ at: 330, k: "emo",
      what: tE ? "Pause before reacting" : E > 0.3 ? "People time" : E > -0.3 ? "Check in" : "Protect your mood",
      txt: tE ? "Emotional is crossing over. Reactions may come quicker than usual, so take a breath before replying to anything charged."
        : E > 0.3 ? "Warmth and empathy run high. Have the important conversation, or reach out to someone you've been meaning to."
        : E > -0.3 ? "An even keel. Short check-ins and shared work go well."
        : "Patience may be thinner. Keep meetings short, step away from conflict, and write out what you feel instead of carrying it.",
      act: tE ? [{ type: "pacer", id: "478" }]
        : E > 0.3 ? [{ type: "protocol", id: "mirror-gaze" }, { type: "pacer", id: "aum" }]
        : E > -0.3 ? [{ type: "pacer", id: "bhramari" }]
        : [{ type: "journal" }] });

    const avg = (P + E + I) / 3;
    b.push({ at: 540, k: "all",
      what: avg > 0.2 ? "Cultivate" : "Wind down early",
      txt: avg > 0.2 ? "Overall the cycles are positive. A good evening to cultivate and circulate the energy you've built."
        : "Overall the cycles are low. Keep the evening light, go to bed early, and set up tomorrow.",
      act: avg > 0.2 ? [{ type: "protocol", id: "transmutation-15" }, { type: "sound", id: "schumann" }]
        : [{ type: "sound", id: "deep-sleep" }] });
    return b;
  }

  /** The one practice to put forward on Home: steady the turning point, else follow the strongest cycle. */
  function keyBlock(t, blocks) {
    const r = readings(t);
    const turn = r.find((x) => x.state.id === "turn");
    if (turn) return blocks.find((b) => b.k === turn.k) || blocks[0];
    const best = [...r].sort((a, b) => b.v - a.v)[0];
    if (best.v < 0) return blocks[3];
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

  SOV.DAYCYCLE = { CYCLES, PHASE, FEEL, MATCH_DAYS, DISCLAIMER, daysAlive, isoAdd, val, pct, signed, turning, stateOf,
    readings, headline, plan, keyBlock, upcoming, tomorrow, brief, match };
})(window.SOV || (window.SOV = {}));
