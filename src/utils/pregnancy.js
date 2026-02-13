/**
 * Pregnancy calculations and data
 */

import { DAILY_FACTS } from './dailyFacts.js';
import { getBabyMessage } from './babyVoice.js';

// Baby size comparisons by week
const BABY_SIZES = {
  4: { emoji: '🌱', name: 'valmuefrø', size: '2mm' },
  5: { emoji: '🫘', name: 'sesamfrø', size: '3mm' },
  6: { emoji: '🫛', name: 'ert', size: '6mm' },
  7: { emoji: '🫐', name: 'blåbær', size: '1cm' },
  8: { emoji: '🍇', name: 'bringebær/drue', size: '1.6cm' },
  9: { emoji: '🍒', name: 'kirsebær', size: '2.3cm' },
  10: { emoji: '🍓', name: 'jordbær', size: '3cm' },
  11: { emoji: '🫒', name: 'lime', size: '4cm' },
  12: { emoji: '🥝', name: 'plomme', size: '5.4cm' },
  13: { emoji: '🍋', name: 'sitron', size: '7cm' },
  14: { emoji: '🍑', name: 'fersken', size: '8.7cm' },
  15: { emoji: '🍎', name: 'eple', size: '10cm' },
  16: { emoji: '🥑', name: 'avokado', size: '11.6cm' },
  17: { emoji: '🍐', name: 'pære', size: '13cm' },
  18: { emoji: '🫑', name: 'paprika', size: '14cm' },
  19: { emoji: '🍅', name: 'tomat', size: '15cm' },
  20: { emoji: '🍌', name: 'banan', size: '16cm' },
  21: { emoji: '🥕', name: 'gulrot', size: '27cm' },
  22: { emoji: '🥭', name: 'mango', size: '28cm' },
  23: { emoji: '🌽', name: 'mais', size: '29cm' },
  24: { emoji: '🥔', name: 'kålrot/rutabaga', size: '30cm' },
  25: { emoji: '🥦', name: 'blomkål', size: '34cm' },
  26: { emoji: '🥬', name: 'salathode', size: '35cm' },
  27: { emoji: '🥒', name: 'squash', size: '36cm' },
  28: { emoji: '🍆', name: 'aubergine', size: '38cm' },
  29: { emoji: '🍠', name: 'butternut gresskar', size: '39cm' },
  30: { emoji: '🥬', name: 'kålhode', size: '40cm' },
  31: { emoji: '🥥', name: 'kokosnøtt', size: '41cm' },
  32: { emoji: '🥔', name: 'jicama', size: '42cm' },
  33: { emoji: '🍍', name: 'ananas', size: '44cm' },
  34: { emoji: '🍈', name: 'cantaloupe', size: '45cm' },
  35: { emoji: '🍈', name: 'honningmelon', size: '46cm' },
  36: { emoji: '🥬', name: 'romainesalat', size: '47cm' },
  37: { emoji: '🥬', name: 'mangold', size: '48cm' },
  38: { emoji: '🥒', name: 'purre', size: '49cm' },
  39: { emoji: '🍉', name: 'vannmelon', size: '50cm' },
  40: { emoji: '🎃', name: 'gresskar', size: '51cm' }
};

// Weekly fun facts
const WEEKLY_FACTS = {
  18: "Babyen kan høre hjertet ditt og stemmen din nå! 💗",
  19: "Et beskyttende lag kalt vernix dannes på babyens hud.",
  20: "Halvveis! Babyen øver seg på å svelge og kan smake det du spiser.",
  21: "Bevegelsene blir sterkere - du kjenner kanskje spark!",
  22: "Babyens lepper og øyelokk er mer utviklet nå.",
  23: "Babyen kan høre musikk! Spill litt for ham 🎵",
  24: "Ansiktet er nesten ferdig formet. Så vakker!",
  25: "Babyen begynner å få hår på hodet.",
  26: "Øynene begynner å åpne seg!",
  27: "Babyen har nå regelmessige sove- og våkneperioder.",
  28: "Tredje trimester! Babyen kan blunke og har øyevipper.",
  29: "Hjernen utvikler seg raskt nå.",
  30: "Babyen legger på seg og blir rundere!",
  31: "Babyen kan snu hodet fra side til side.",
  32: "Tåneglene er ferdig formet.",
  33: "Skjelettet hardner, men hodeskallen er myk for fødselen.",
  34: "Sentralnervesystemet modnes.",
  35: "Det begynner å bli trangt, så bevegelsene kan endre seg.",
  36: "Babyen regnes som nesten fullbåren!",
  37: "Fullbåren! Han kan komme når som helst.",
  38: "Organsystemene er klare for livet utenfor.",
  39: "Hjerne og lunger modnes fortsatt.",
  40: "Termindato! Babyen kommer når han er klar 💕"
};

/**
 * Calculate pregnancy progress
 * @param {string} dueDateStr - Due date in YYYY-MM-DD format
 * @param {Date|string} referenceDate - Optional reference date (defaults to today)
 * @returns {Object}
 */
function toUtcDayNumber(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / (1000 * 60 * 60 * 24);
}

function diffCalendarDays(fromDate, toDate) {
  return Math.round(toUtcDayNumber(toDate) - toUtcDayNumber(fromDate));
}

export function getPregnancyProgress(dueDateStr = '2026-06-29', referenceDate = null) {
  const now = referenceDate ? new Date(referenceDate) : new Date();

  // Dev Mode: Allow overriding "today" for testing daily facts (only if no referenceDate provided)
  if (!referenceDate) {
    const override = localStorage.getItem('bumpy:dev_date_override');
    if (override) {
      now.setTime(new Date(override).getTime());
      console.log('🛠️ Dev Mode: Overriding current date to', now.toDateString());
    }
  }

  // Reset time to midnight to ensure day calculation doesn't depend on current time
  now.setHours(0, 0, 0, 0);

  if (!dueDateStr) {
    dueDateStr = '2026-06-29';
  }

  const dueDate = new Date(dueDateStr);
  // Handle potential timezone offset by setting to local midnight if input is simple date string
  if (dueDateStr.length <= 10) {
    // If it's YYYY-MM-DD, parse manually to avoid UTC shift or ensures it's treated as local midnight 
    const [y, m, d] = dueDateStr.split('-').map(Number);
    dueDate.setFullYear(y, m - 1, d);
    dueDate.setHours(0, 0, 0, 0);
  } else {
    dueDate.setHours(0, 0, 0, 0);
  }

  // Adjusted to 283 days to match user's timeline (June 29 due = Feb 9 is 20w3d)
  const conceptionDate = new Date(dueDate);
  conceptionDate.setDate(conceptionDate.getDate() - 283);

  // Calculate days pregnant (calendar-day diff, DST-safe)
  const daysPregnant = diffCalendarDays(conceptionDate, now);
  const weeksPregnant = Math.floor(daysPregnant / 7);
  const daysIntoWeek = daysPregnant % 7;

  // Days remaining (calendar-day diff, DST-safe)
  const daysRemaining = Math.max(0, diffCalendarDays(now, dueDate));

  // Trimester
  let trimester = 1;
  if (weeksPregnant >= 28) trimester = 3;
  else if (weeksPregnant >= 14) trimester = 2;

  // Progress percentage (0-100)
  const progressPercent = Math.min(100, Math.max(0, (daysPregnant / (40 * 7)) * 100));

  // Baby size
  const weekClamped = Math.min(40, Math.max(4, weeksPregnant));
  const babySize = BABY_SIZES[weekClamped] || BABY_SIZES[20];

  // Fun fact
  const funFact = WEEKLY_FACTS[weekClamped] || WEEKLY_FACTS[20];

  // Daily Fact (from the new data)
  const dailyFact = (DAILY_FACTS[weeksPregnant] && DAILY_FACTS[weeksPregnant][daysIntoWeek + 1]) ||
    (DAILY_FACTS[weekClamped] && DAILY_FACTS[weekClamped][1]) ||
    { emoji: '💡', title: 'Dagens visdom', text: funFact };

  // Month approximation (standard 4.3 weeks per month)
  const month = Math.ceil(weeksPregnant / 4.3);

  // Baby message
  const babyMessage = getBabyMessage(weeksPregnant);

  return {
    weeksPregnant,
    daysIntoWeek,
    daysPregnant, // Total days
    daysLeft: daysRemaining,
    trimester,
    percentage: progressPercent,
    month,
    babySize,
    dailyFact,
    babyMessage,
    funnyFact: dailyFact.text, // Backward compatibility for home.js initially, but we will update home.js
    dueDate: dueDate.toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };
}

/**
 * Get greeting based on time of day
 * @param {string} name 
 */
export function getGreeting(name) {
  const hour = new Date().getHours();
  let greeting = 'Hei';

  if (hour < 12) greeting = 'God morgen';
  else if (hour < 17) greeting = 'God dag';
  else if (hour < 21) greeting = 'God kveld';
  else greeting = 'Drøm søtt';

  return `${greeting}, ${name} 💕`;
}

/**
 * Get a random love note
 * @returns {string}
 */
export function getRandomLoveNote() {
  const notes = [
    "Du gjør en fantastisk jobb, mamma! 💕",
    "Kroppen din skaper et mirakel.",
    "Ta et øyeblikk til å puste og kjenne etter babyen.",
    "Du er sterk, vakker og dyktig.",
    "Babyen elsker å høre stemmen din.",
    "Hver dag bringer deg nærmere møtet med den lille.",
    "Stol på kroppen din og intuisjonen din.",
    "Du er akkurat den mammaen babyen din trenger.",
    "Hvil deg når du trenger det - du lager et liv!",
    "Sender deg kjærlighet og gode tanker i dag."
  ];
  return notes[Math.floor(Math.random() * notes.length)];
}
