/*
 * Content for the app. Edit this file to add vehicles, words, or change what
 * the app says -- no other code changes needed.
 *
 *  - `says`  is spoken after the name when the vehicle is tapped.
 *  - `sfx`   is the sound effect (see js/audio.js for the list).
 *  - `svg: 'monster'` draws the custom monster truck instead of an emoji.
 */
window.DATA = {
  VEHICLES: [
    { id: 'monster', name: 'Monster Truck', svg: 'monster', color: '#e53935', sfx: 'vroom', says: 'Vroom vroom! Monster trucks have giant wheels!' },
    { id: 'monster-blue', name: 'Blue Monster Truck', svg: 'monster', color: '#1e88e5', sfx: 'vroom', says: 'Crunch! Monster trucks can jump over cars!' },
    { id: 'car', name: 'Car', emoji: '🚗', sfx: 'honk', says: 'Beep beep!' },
    { id: 'racecar', name: 'Race Car', emoji: '🏎️', sfx: 'zoom', says: 'Zoom zoom! Race cars go super fast!' },
    { id: 'police', name: 'Police Car', emoji: '🚓', sfx: 'siren', says: 'Wee-oo, wee-oo! Police cars help keep us safe.' },
    { id: 'firetruck', name: 'Fire Truck', emoji: '🚒', sfx: 'siren', says: 'Nee-naw, nee-naw! Fire trucks spray water on fires.' },
    { id: 'ambulance', name: 'Ambulance', emoji: '🚑', sfx: 'siren', says: 'Ambulances help people who are hurt.' },
    { id: 'bus', name: 'Bus', emoji: '🚌', sfx: 'honk', says: 'The wheels on the bus go round and round!' },
    { id: 'taxi', name: 'Taxi', emoji: '🚕', sfx: 'honk', says: 'Taxis are yellow. Beep beep!' },
    { id: 'jeep', name: 'Jeep', emoji: '🚙', sfx: 'vroom', says: 'Jeeps can drive on bumpy roads!' },
    { id: 'pickup', name: 'Pickup Truck', emoji: '🛻', sfx: 'vroom', says: 'Pickup trucks carry things in the back!' },
    { id: 'delivery', name: 'Delivery Truck', emoji: '🚚', sfx: 'honk', says: 'Delivery trucks bring packages!' },
    { id: 'bigrig', name: 'Big Rig', emoji: '🚛', sfx: 'bighonk', says: 'Honk honk! Big rigs are super long!' },
    { id: 'tractor', name: 'Tractor', emoji: '🚜', sfx: 'putt', says: 'Putt putt putt! Tractors work on the farm.' },
    { id: 'van', name: 'Van', emoji: '🚐', sfx: 'honk', says: 'Vans carry lots of people!' },
    { id: 'motorcycle', name: 'Motorcycle', emoji: '🏍️', sfx: 'zoom', says: 'Vroom! Motorcycles have two wheels.' },
    { id: 'scooter', name: 'Scooter', emoji: '🛵', sfx: 'zoom', says: 'Beep beep! Scooters are small and quick.' },
    { id: 'bicycle', name: 'Bicycle', emoji: '🚲', sfx: 'bell', says: 'Ring ring! You pedal a bicycle with your feet.' },
    { id: 'train', name: 'Train', emoji: '🚂', sfx: 'choo', says: 'Choo choo! Trains ride on tracks.' },
    { id: 'airplane', name: 'Airplane', emoji: '✈️', sfx: 'whoosh', says: 'Airplanes fly high in the sky!' },
    { id: 'helicopter', name: 'Helicopter', emoji: '🚁', sfx: 'chop', says: 'Chop chop chop! Helicopters go up and down.' },
    { id: 'rocket', name: 'Rocket', emoji: '🚀', sfx: 'whoosh', says: 'Three, two, one, blast off!' },
    { id: 'boat', name: 'Boat', emoji: '🚤', sfx: 'whoosh', says: 'Splash! Boats go on the water.' },
  ],

  COLORS: [
    { id: 'red', name: 'red', hex: '#e53935', ink: '#fff' },
    { id: 'blue', name: 'blue', hex: '#1e88e5', ink: '#fff' },
    { id: 'yellow', name: 'yellow', hex: '#fdd835', ink: '#222' },
    { id: 'green', name: 'green', hex: '#43a047', ink: '#fff' },
    { id: 'orange', name: 'orange', hex: '#fb8c00', ink: '#fff' },
    { id: 'purple', name: 'purple', hex: '#8e24aa', ink: '#fff' },
    { id: 'pink', name: 'pink', hex: '#f06292', ink: '#fff' },
    { id: 'black', name: 'black', hex: '#263238', ink: '#fff' },
    { id: 'white', name: 'white', hex: '#fafafa', ink: '#222' },
    { id: 'brown', name: 'brown', hex: '#8d5524', ink: '#fff' },
  ],

  SHAPES: [
    { id: 'circle', name: 'circle', color: '#e53935', tip: 'Round like a wheel!' },
    { id: 'square', name: 'square', color: '#1e88e5', tip: 'Four sides, all the same!' },
    { id: 'triangle', name: 'triangle', color: '#fb8c00', tip: 'Three sides, like a traffic cone!' },
    { id: 'rectangle', name: 'rectangle', color: '#43a047', tip: 'Long like a bus!' },
    { id: 'star', name: 'star', color: '#fdd835', tip: 'You are a star!' },
    { id: 'heart', name: 'heart', color: '#f06292', tip: 'I love you!' },
    { id: 'oval', name: 'oval', color: '#8e24aa', tip: 'Like an egg!' },
    { id: 'diamond', name: 'diamond', color: '#00acc1', tip: 'Like a road sign!' },
  ],

  // `hl` = which letter of the word to highlight (defaults to the first).
  LETTERS: [
    { l: 'A', word: 'Ambulance', emoji: '🚑' },
    { l: 'B', word: 'Bus', emoji: '🚌' },
    { l: 'C', word: 'Car', emoji: '🚗' },
    { l: 'D', word: 'Delivery truck', emoji: '🚚' },
    { l: 'E', word: 'Engine', emoji: '🚂' },
    { l: 'F', word: 'Fire truck', emoji: '🚒' },
    { l: 'G', word: 'Gas pump', emoji: '⛽' },
    { l: 'H', word: 'Helicopter', emoji: '🚁' },
    { l: 'I', word: 'Ice cream', emoji: '🍦' },
    { l: 'J', word: 'Jet', emoji: '✈️' },
    { l: 'K', word: 'Kite', emoji: '🪁' },
    { l: 'L', word: 'Lights', emoji: '🚦' },
    { l: 'M', word: 'Monster truck', svg: 'monster' },
    { l: 'N', word: 'Nuts and bolts', emoji: '🔩' },
    { l: 'O', word: 'Octopus', emoji: '🐙' },
    { l: 'P', word: 'Police car', emoji: '🚓' },
    { l: 'Q', word: 'Queen', emoji: '👑' },
    { l: 'R', word: 'Rocket', emoji: '🚀' },
    { l: 'S', word: 'Stop sign', emoji: '🛑' },
    { l: 'T', word: 'Tractor', emoji: '🚜' },
    { l: 'U', word: 'UFO', emoji: '🛸' },
    { l: 'V', word: 'Van', emoji: '🚐' },
    { l: 'W', word: 'Wheel', emoji: '🛞' },
    { l: 'X', word: 'Taxi', emoji: '🚕', speak: 'X! Taxi has an X in it!' },
    { l: 'Y', word: 'Yo-yo', emoji: '🪀' },
    { l: 'Z', word: 'Zoom', emoji: '🏎️', speak: 'Z! Z is for Zoom zoom zoom!' },
  ],

  // What gets counted on the "Learn numbers" screen (1 to 10).
  NUMBER_THINGS: [
    { emoji: '🚗', one: 'car', many: 'cars' },
    { emoji: '🚌', one: 'bus', many: 'buses' },
    { emoji: '🚒', one: 'fire truck', many: 'fire trucks' },
    { emoji: '🚜', one: 'tractor', many: 'tractors' },
    { emoji: '🏎️', one: 'race car', many: 'race cars' },
    { emoji: '🚓', one: 'police car', many: 'police cars' },
    { emoji: '🚕', one: 'taxi', many: 'taxis' },
    { emoji: '🛞', one: 'wheel', many: 'wheels' },
    { emoji: '🚛', one: 'big rig', many: 'big rigs' },
    { emoji: '🚀', one: 'rocket', many: 'rockets' },
  ],
};
