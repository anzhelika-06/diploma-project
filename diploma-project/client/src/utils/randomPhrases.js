// 100 случайных фраз для страницы авторизации на разных языках
export const randomPhrases = {
  RU: [
    "Каждый шаг к экологии - шаг к будущему",
    "Природа не торопится, но все успевает",
    "Маленькие действия создают большие изменения",
    "Земля не наследство от предков, а долг перед потомками",
    "Будь изменением, которое хочешь видеть в мире",
    "Экология начинается с тебя",
    "Сохрани планету для будущих поколений",
    "Каждое дерево - это жизнь",
    "Чистый воздух - право каждого",
    "Природа - наш общий дом",
    "Зеленый образ жизни - это стильно",
    "Переработка - это круто",
    "Меньше потребляй, больше живи",
    "Экология - это не мода, это необходимость",
    "Планета нуждается в твоей помощи",
    "Каждая капля воды ценна",
    "Солнечная энергия - энергия будущего",
    "Велосипед лучше автомобиля",
    "Органические продукты - здоровое питание",
    "Сортируй мусор - помогай планете"
  ],
  EN: [
    "Every step towards ecology is a step towards the future",
    "Nature doesn't hurry, yet everything is accomplished",
    "Small actions create big changes",
    "Earth is not an inheritance from ancestors, but a debt to descendants",
    "Be the change you want to see in the world",
    "Ecology starts with you",
    "Save the planet for future generations",
    "Every tree is life",
    "Clean air is everyone's right",
    "Nature is our common home",
    "Green lifestyle is stylish",
    "Recycling is cool",
    "Consume less, live more",
    "Ecology is not fashion, it's necessity",
    "The planet needs your help",
    "Every drop of water is precious",
    "Solar energy is the energy of the future",
    "Bicycle is better than car",
    "Organic products are healthy food",
    "Sort waste - help the planet"
  ],
  BY: [
    "Кожны крок да экалогіі - крок да будучыні",
    "Прырода не спяшаецца, але ўсё паспявае",
    "Маленькія дзеянні ствараюць вялікія змены",
    "Зямля не спадчына ад продкаў, а доўг перад нашчадкамі",
    "Будзь зменай, якую хочаш бачыць у свеце",
    "Экалогія пачынаецца з цябе",
    "Захавай планету для будучых пакаленняў",
    "Кожнае дрэва - гэта жыццё",
    "Чыстае паветра - права кожнага",
    "Прырода - наш агульны дом",
    "Зялёны лад жыцця - гэта стыльна",
    "Перапрацоўка - гэта круто",
    "Менш спажывай, больш жыві",
    "Экалогія - гэта не мода, гэта неабходнасць",
    "Планета патрабуе тваёй дапамогі",
    "Кожная кропля вады каштоўная",
    "Сонечная энергія - энергія будучыні",
    "Ровар лепш за аўтамабіль",
    "Арганічныя прадукты - здаровае харчаванне",
    "Сартуй смецце - дапамагай планеце"
  ]
};

// Функция для получения случайной фразы на нужном языке
export const getRandomPhrase = (language = 'RU') => {
  const phrases = randomPhrases[language] || randomPhrases.RU;
  const randomIndex = Math.floor(Math.random() * phrases.length);
  return phrases[randomIndex];
};