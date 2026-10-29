// Sovereign Library catalog.
// To add a printable later: drop its PDF in ./pdf, a page-1 cover image in ./covers,
// and add one entry here. `track` is "men", "women" or "all".
// `contentsPage` is the page the Contents button jumps to (1-based).
export const CATALOG = [
  {
    id: "tracker-men",
    title: "40-Day Energy Tracker",
    edition: "Men's Edition",
    blurb: "Forty days, two to a page. Practices, mudra of the day, an honest check-in and where you directed the energy.",
    track: "men",
    file: "pdf/tracker-men.pdf",
    cover: "covers/tracker-men.jpg",
    pages: 30,
    contentsPage: 3,
  },
  {
    id: "tracker-women",
    title: "40-Day Energy Tracker",
    edition: "Women's Edition",
    blurb: "Forty days with cycle-phase check-ins, body and tide prompts, and a weekly look at how your energy followed the cycle.",
    track: "women",
    file: "pdf/tracker-women.pdf",
    cover: "covers/tracker-women.jpg",
    pages: 30,
    contentsPage: 3,
  },
];
