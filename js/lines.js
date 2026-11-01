/*
 * Lines: every sentence the app speaks, in one place.
 *
 * The app uses these functions to decide what to say, and
 * tools/make_voice.py uses Lines.all() to pre-record each one with a natural
 * voice. If you change wording here (or in data.js), re-run the voice tool;
 * any line without a recording falls back to the iPad's built-in voice.
 *
 * A line can be a string or an array of strings. Arrays are played back to
 * back, so "That's the blue car." + "Find the red car!" need only
 * 8 + 8 recordings instead of 64.
 */
window.Lines = (() => {
  const { VEHICLES, COLORS, SHAPES, LETTERS, NUMBER_THINGS } = window.DATA;

  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const article = w => (/^[aeiou]/i.test(w) ? 'an' : 'a');
  const MAX_COUNT = 10;

  const L = {
    NUM,
    article,

    welcome: "Let's go! What do you want to play?",
    topic: {
      garage: 'Trucks and cars!',
      numbers: 'Numbers!',
      shapes: 'Shapes!',
      colors: 'Colors!',
      abc: 'A, B, C!',
      stickers: 'Your stickers!',
    },
    trafficCar: 'Beep beep!',
    trafficMonster: 'Vroom vroom! Monster truck!',

    praise: ['Yes!', 'You found it!', 'Great job!', 'Hooray!', 'You did it!'],

    vehicle: v => `${v.name}! ${v.says}`,

    numberLearn: n => {
      const t = NUMBER_THINGS[n - 1];
      const counting = NUM.slice(1, n + 1).map(cap).join(', ');
      return `${cap(NUM[n])}! ${counting}. ${cap(NUM[n])} ${n === 1 ? t.one : t.many}!`;
    },

    countFirst: "Let's count the cars! Tap each car, and the monster truck will crush it!",
    countAgain: ["Let's count the cars!", 'How many cars? Tap and count!', "More cars! Let's count!"],
    count: n => `${cap(NUM[n])}!`,
    countDone: n => `${cap(NUM[n])} ${n === 1 ? 'car' : 'cars'}! Great counting!`,

    shape: s => `${cap(s.name)}! ${s.tip}`,
    shapeFind: s => `Find the ${s.name}!`,
    shapeName: s => `The ${s.name}!`,
    shapeThats: s => `That's the ${s.name}.`,

    color: c => `${cap(c.name)}! ${cap(article(c.name))} ${c.name} monster truck!`,
    colorFind: c => `Find the ${c.name} car!`,
    colorName: c => `The ${c.name} car!`,
    colorThats: c => `That's the ${c.name} car.`,

    letter: l => l.speak || `${l.l}! ${l.l} is for ${l.word}!`,
    letterFind: l => `Find the letter ${l.l}!`,
    letterName: l => `${l.l}!`,
    letterThats: l => `That's ${l.l}.`,

    stickerWin: v => `You got a sticker! ${cap(article(v.name))} ${v.name}!`,
    stickerCount: n => (n
      ? `You have ${n} ${n === 1 ? 'sticker' : 'stickers'}! Great job!`
      : 'Play games to win stickers!'),
    stickerLocked: 'Keep playing to win this sticker!',
  };

  // How many items each "Find it" game uses (kept here so the recordings match).
  L.FIND_COLORS = COLORS.slice(0, 8);
  L.FIND_LETTERS = LETTERS.slice(0, 8);

  // Every distinct string the app can say.
  L.all = () => {
    const out = new Set();
    const add = x => [].concat(x).forEach(s => s && out.add(s));
    add(L.welcome);
    add(Object.values(L.topic));
    add([L.trafficCar, L.trafficMonster, L.countFirst, L.stickerLocked]);
    add(L.countAgain);
    add(L.praise);
    VEHICLES.forEach(v => { add(L.vehicle(v)); add(L.stickerWin(v)); });
    for (let n = 1; n <= MAX_COUNT; n++) { add(L.numberLearn(n)); add(L.count(n)); add(L.countDone(n)); }
    for (let n = 0; n <= VEHICLES.length; n++) add(L.stickerCount(n));
    SHAPES.forEach(s => add([L.shape(s), L.shapeFind(s), L.shapeName(s), L.shapeThats(s)]));
    COLORS.forEach(c => add(L.color(c)));
    L.FIND_COLORS.forEach(c => add([L.colorFind(c), L.colorName(c), L.colorThats(c)]));
    LETTERS.forEach(l => add(L.letter(l)));
    L.FIND_LETTERS.forEach(l => add([L.letterFind(l), L.letterName(l), L.letterThats(l)]));
    return [...out];
  };

  return L;
})();
