// Склонение слов для русского, белорусского и английского языков

export const pluralizeEcoins = (n, lang) => {
  if (lang === 'EN') return n === 1 ? 'ecoin' : 'ecoins';
  
  const abs = Math.abs(n) % 100;
  const r = abs % 10;
  
  if (lang === 'BE') {
    if (abs > 10 && abs < 20) return 'экоінаў';
    if (r === 1) return 'экоін';
    if (r >= 2 && r <= 4) return 'экоіны';
    return 'экоінаў';
  }
  
  // RU
  if (abs > 10 && abs < 20) return 'экоинов';
  if (r === 1) return 'экоин';
  if (r >= 2 && r <= 4) return 'экоина';
  return 'экоинов';
};

export const pluralizeTrees = (n, lang) => {
  if (lang === 'EN') return n === 1 ? 'tree' : 'trees';
  
  const abs = Math.abs(n) % 100;
  const r = abs % 10;
  
  if (lang === 'BE') {
    if (abs > 10 && abs < 20) return 'дрэў';
    if (r === 1) return 'дрэва';
    if (r >= 2 && r <= 4) return 'дрэвы';
    return 'дрэў';
  }
  
  // RU
  if (abs > 10 && abs < 20) return 'деревьев';
  if (r === 1) return 'дерево';
  if (r >= 2 && r <= 4) return 'дерева';
  return 'деревьев';
};
