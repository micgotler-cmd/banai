// Text of the carpenter PDF in Hebrew and English. Numbers, ids and geometry never live here:
// they come from the design, so both languages print identical sizes. The Hebrew wording of the
// carpentry terms is a configurable default (see Decisions & Assumptions), not a business rule.

export const PDF_LANGUAGES = Object.freeze(['he', 'en']);
export const isRtl = (language) => language === 'he';

const en = {
  title: 'Wardrobe: instructions for the carpenter',
  date: 'Date',
  design: 'Design',
  pictureUnavailable: '(3D picture unavailable)',
  overallData: 'Overall data',
  overallSize: (w, h, d) => `Overall size: ${w} x ${h} x ${d} mm (width x height x depth)`,
  panelLine: (t, iw, ih) => `Panel thickness: ${t} mm. Interior: ${iw} x ${ih} mm`,
  compartmentsLine: (n, doors) => `Compartments: ${n}. Doors: ${doors}`,
  carcass: 'Carcass',
  doorsLabel: 'Doors',
  doorKind: { hinged: 'hinged', sliding: 'sliding', none: 'none' },
  illustration: 'How the wardrobe should look',
  legend: 'Front view. Dashed lines = doors, red bars = hanging rails, C = compartment, D = drawer. Sizes in mm.',
  topView: 'Top view',
  sideView: 'Side view',
  cuttingList: 'Cutting list (nominal sizes, mm)',
  columns: ['Part', 'Qty', 'Length', 'Width', 'Thick.', 'Material, colour, finish / note'],
  assemblySteps: 'Assembly steps',
  disclaimer: 'Illustrative instructions, not engineering or manufacturing drawings. Dimensions, joinery and hardware must be verified by the carpenter.',
  page: (n, total) => `Page ${n} / ${total}`,
  custom: 'custom',
  mm: 'mm',
  parts: {
    side: 'Side panel', top: 'Top panel', bottom: 'Bottom panel', partition: (n) => `Partition ${n}`,
    shelf: (n) => `Shelf ${n}`, drawerFront: (n) => `Drawer front ${n}`, hingedDoor: (n) => `Hinged door ${n}`,
    slidingDoor: (n) => `Sliding door ${n}`, rail: (n) => `Hanging rail ${n}`,
  },
  notes: {
    between: (a, b) => `between compartments ${a} and ${b}`,
    compartment: (n) => `compartment ${n}`,
    drawer: 'nominal size; drawer box and runners per carpenter',
    hinged: (side) => `nominal size; hinges on the ${side === 'left' ? 'left' : 'right'} side`,
    sliding: 'nominal size; panels overlap on the track',
    rail: (n, y) => `compartment ${n}; at ${y} mm above the bottom panel`,
  },
  steps: {
    cut: 'Cut the parts listed in the cutting list. Check every size against the drawing before cutting. Back panel: not modelled; the carpenter decides.',
    sides: (h, d, iw, w) => `Stand the two side panels (${h} mm high, ${d} mm deep) parallel, ${iw} mm apart inside (overall width ${w} mm).`,
    topBottom: (iw) => `Fix the bottom panel (${iw} mm) and the top panel (${iw} mm) between the side panels. Check the carcass is square.`,
    partition: (n, t, x) => `Fix partition ${n} (${t} mm thick) with its left face ${x} mm from the inner face of the left side panel.`,
    shelf: (c, n, top, under) => `Compartment ${c}: fix shelf ${n} with its top face ${top} mm above the bottom panel (underside at ${under} mm).`,
    drawer: (c, n, h, y) => `Compartment ${c}: build and fit drawer ${n}, ${h} mm high, with its bottom at ${y} mm above the bottom panel.`,
    rail: (c, n, y) => `Compartment ${c}: fix hanging rail ${n} at ${y} mm above the bottom panel.`,
    hinged: (n) => `Hang the ${n} hinged door(s) on the sides marked in the cutting list.`,
    sliding: (n) => `Fit the track and hang the ${n} sliding door panels.`,
    final: 'Final check: square, level, all fixings tight, doors and drawers moving freely.',
  },
  catalog: {},
};

const he = {
  title: 'ארון: הוראות לנגר',
  date: 'תאריך',
  design: 'עיצוב',
  pictureUnavailable: '(תמונת התלת-ממד אינה זמינה)',
  overallData: 'נתונים כלליים',
  overallSize: (w, h, d) => `מידות כלליות: ${w} × ${h} × ${d} מ״מ (רוחב × גובה × עומק)`,
  panelLine: (t, iw, ih) => `עובי לוח: ${t} מ״מ. מידות פנימיות: ${iw} × ${ih} מ״מ`,
  compartmentsLine: (n, doors) => `תאים: ${n}. דלתות: ${doors}`,
  carcass: 'גוף הארון',
  doorsLabel: 'דלתות',
  doorKind: { hinged: 'פתיחה על צירים', sliding: 'הזזה', none: 'ללא דלתות' },
  illustration: 'כך הארון אמור להיראות',
  legend: 'מבט מלפנים. קווים מקווקווים = דלתות, פסים אדומים = מוטות תלייה, C = תא, D = מגירה. מידות במ״מ.',
  topView: 'מבט מלמעלה',
  sideView: 'מבט מהצד',
  cuttingList: 'רשימת חיתוך (מידות נומינליות, מ״מ)',
  columns: ['חלק', 'כמות', 'אורך', 'רוחב', 'עובי', 'חומר, צבע, גימור / הערה'],
  assemblySteps: 'שלבי הרכבה',
  disclaimer: 'הוראות להמחשה בלבד, אינן שרטוטים הנדסיים או שרטוטי ייצור. את המידות, החיבורים והאביזרים חובה לוודא מול הנגר.',
  page: (n, total) => `עמוד ${n} / ${total}`,
  custom: 'מותאם אישית',
  mm: 'מ״מ',
  parts: {
    side: 'דופן צד', top: 'לוח עליון', bottom: 'לוח תחתון', partition: (n) => `מחיצה ${n}`,
    shelf: (n) => `מדף ${n}`, drawerFront: (n) => `חזית מגירה ${n}`, hingedDoor: (n) => `דלת צירים ${n}`,
    slidingDoor: (n) => `דלת הזזה ${n}`, rail: (n) => `מוט תלייה ${n}`,
  },
  notes: {
    between: (a, b) => `בין תא ${a} לתא ${b}`,
    compartment: (n) => `תא ${n}`,
    drawer: 'מידה נומינלית; ארגז המגירה והפסים לפי הנגר',
    hinged: (side) => `מידה נומינלית; הצירים בצד ${side === 'left' ? 'שמאל' : 'ימין'}`,
    sliding: 'מידה נומינלית; הלוחות חופפים על המסילה',
    rail: (n, y) => `תא ${n}; בגובה ${y} מ״מ מעל הלוח התחתון`,
  },
  steps: {
    cut: 'חתכו את החלקים שברשימת החיתוך. בדקו כל מידה מול השרטוט לפני החיתוך. גב הארון: אינו מעוצב כאן, והנגר מחליט.',
    sides: (h, d, iw, w) => `העמידו את שני דפנות הצד (גובה ${h} מ״מ, עומק ${d} מ״מ) במקביל, במרחק ${iw} מ״מ ביניהן מבפנים (רוחב כולל ${w} מ״מ).`,
    topBottom: (iw) => `חברו את הלוח התחתון (${iw} מ״מ) ואת הלוח העליון (${iw} מ״מ) בין דפנות הצד. ודאו שהגוף מרובע.`,
    partition: (n, t, x) => `חברו את מחיצה ${n} (עובי ${t} מ״מ) כשהפן השמאלי שלה במרחק ${x} מ״מ מהפן הפנימי של דופן הצד השמאלית.`,
    shelf: (c, n, top, under) => `תא ${c}: חברו את מדף ${n} כך שפניו העליונים ${top} מ״מ מעל הלוח התחתון (תחתית המדף ב-${under} מ״מ).`,
    drawer: (c, n, h, y) => `תא ${c}: בנו והתקינו את מגירה ${n}, גובה ${h} מ״מ, כשתחתיתה ${y} מ״מ מעל הלוח התחתון.`,
    rail: (c, n, y) => `תא ${c}: חברו את מוט תלייה ${n} בגובה ${y} מ״מ מעל הלוח התחתון.`,
    hinged: (n) => `תלו ${n} דלתות צירים בצדדים המסומנים ברשימת החיתוך.`,
    sliding: (n) => `התקינו את המסילה ותלו ${n} לוחות הזזה.`,
    final: 'בדיקה סופית: ישרות, אופקיות, כל החיבורים הדוקים, והדלתות והמגירות נעות בחופשיות.',
  },
  // Hebrew names for the default catalog. Unknown ids fall back to the catalog's English name.
  catalog: {
    melamine: 'לוח מלמין', oak_veneer: 'פורניר אלון', lacquered_mdf: 'MDF צבוע', birch_plywood: 'דיקט ליבנה',
    white: 'לבן', light_grey: 'אפור בהיר', anthracite: 'אנתרציט', black: 'שחור', natural_oak: 'אלון טבעי', walnut: 'אגוז',
    navy_blue: 'כחול כהה', sage_green: 'ירוק מרווה', terracotta: 'טרקוטה',
    matte: 'מט', satin: 'סאטן', gloss: 'מבריק',
  },
};

export const PDF_STRINGS = Object.freeze({ he, en });
export const pdfStringsFor = (language) => PDF_STRINGS[language] ?? PDF_STRINGS.en;
