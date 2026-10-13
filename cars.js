const languageKey = 'onroad-language';
const favoritesKey = 'onroad-favorites';
let language = localStorage.getItem(languageKey) || 'ru';
let favoritesOnly = false;
const cards = [...document.querySelectorAll('.catalog-card')];
const search = document.getElementById('car-search');
const city = document.getElementById('city-filter');
const type = document.getElementById('type-filter');
const sort = document.getElementById('sort-filter');
const favoriteFilter = document.getElementById('favorites-filter');
const modal = document.getElementById('request-modal');
const requestForm = document.getElementById('request-form');
let selectedCardId = '';

function getFavorites() {
  try { return new Set(JSON.parse(localStorage.getItem(favoritesKey) || '[]')); }
  catch { return new Set(); }
}

function setLanguage(next) {
  language = next;
  localStorage.setItem(languageKey, next);
  document.documentElement.lang = next;
  document.querySelectorAll('[data-ru][data-kz]').forEach((element) => {
    element.innerHTML = element.dataset[next];
  });
  document.getElementById('language-toggle').innerHTML = next === 'ru' ? 'RU <span>·</span> KZ' : 'KZ <span>·</span> RU';
  document.getElementById('menu-toggle').setAttribute('aria-label', next === 'ru' ? 'Открыть меню' : 'Мәзірді ашу');
  document.querySelectorAll('.favorite-toggle').forEach((button) => {
    button.setAttribute('aria-label', next === 'ru' ? (button.getAttribute('aria-pressed') === 'true' ? 'Убрать из избранного' : 'Добавить в избранное') : (button.getAttribute('aria-pressed') === 'true' ? 'Таңдаулылардан алу' : 'Таңдаулыға қосу'));
  });
  updateResults();
}

function updateResults() {
  const query = search.value.trim().toLocaleLowerCase(language === 'ru' ? 'ru' : 'kk');
  const saved = getFavorites();
  const visible = [];
  cards.forEach((card) => {
    const matchesText = !query || card.textContent.toLocaleLowerCase(language === 'ru' ? 'ru' : 'kk').includes(query);
    const matchesCity = city.value === 'all' || card.dataset.city === city.value;
    const matchesType = type.value === 'all' || card.dataset.type === type.value;
    const matchesSaved = !favoritesOnly || saved.has(card.dataset.id);
    const show = matchesText && matchesCity && matchesType && matchesSaved;
    card.hidden = !show;
    if (show) visible.push(card);
  });
  const sortValue = sort.value;
  visible.sort((a, b) => sortValue === 'newest' ? Number(b.dataset.year) - Number(a.dataset.year) : sortValue === 'zones' ? Number(b.dataset.zones) - Number(a.dataset.zones) : cards.indexOf(a) - cards.indexOf(b));
  const grid = document.getElementById('catalog-grid');
  visible.forEach((card) => grid.append(card));
  document.getElementById('empty-state').hidden = visible.length > 0;
  document.getElementById('result-count').textContent = language === 'ru' ? `${visible.length} ${pluralRu(visible.length, 'автомобиль', 'автомобиля', 'автомобилей')}` : `${visible.length} автомобиль`;
  document.getElementById('favorite-count').textContent = String(saved.size);
  favoriteFilter.classList.toggle('active', favoritesOnly);
  cards.forEach((card) => {
    const button = card.querySelector('.favorite-toggle');
    const isSaved = saved.has(card.dataset.id);
    button.classList.toggle('saved', isSaved);
    button.setAttribute('aria-pressed', String(isSaved));
    button.setAttribute('aria-label', language === 'ru' ? (isSaved ? 'Убрать из избранного' : 'Добавить в избранное') : (isSaved ? 'Таңдаулылардан алу' : 'Таңдаулыға қосу'));
    button.textContent = isSaved ? '♥' : '♡';
  });
}

function pluralRu(number, one, few, many) {
  const mod10 = number % 10, mod100 = number % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function openRequest(card) {
  selectedCardId = card.dataset.id;
  document.getElementById('requested-model').textContent = card.querySelector('h2').textContent;
  requestForm.hidden = false;
  document.getElementById('request-success').hidden = true;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  window.setTimeout(() => requestForm.elements.name.focus(), 80);
}

function closeRequest() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

search.addEventListener('input', updateResults);
city.addEventListener('change', updateResults);
type.addEventListener('change', updateResults);
sort.addEventListener('change', updateResults);
favoriteFilter.addEventListener('click', () => {
  favoritesOnly = !favoritesOnly;
  favoriteFilter.setAttribute('aria-pressed', String(favoritesOnly));
  updateResults();
});
document.getElementById('reset-filters').addEventListener('click', () => {
  search.value = '';
  city.value = 'all';
  type.value = 'all';
  sort.value = 'recommended';
  favoritesOnly = false;
  favoriteFilter.setAttribute('aria-pressed', 'false');
  updateResults();
});
document.querySelectorAll('.favorite-toggle').forEach((button) => button.addEventListener('click', () => {
  const id = button.closest('.catalog-card').dataset.id;
  const saved = getFavorites();
  if (saved.has(id)) saved.delete(id); else saved.add(id);
  localStorage.setItem(favoritesKey, JSON.stringify([...saved]));
  updateResults();
}));
document.querySelectorAll('[data-request-car]').forEach((button) => button.addEventListener('click', () => openRequest(button.closest('.catalog-card'))));
document.querySelectorAll('[data-close-request]').forEach((button) => button.addEventListener('click', closeRequest));
document.getElementById('language-toggle').addEventListener('click', () => setLanguage(language === 'ru' ? 'kz' : 'ru'));
document.getElementById('menu-toggle').addEventListener('click', (event) => {
  const nav = document.getElementById('main-nav');
  const isOpen = nav.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(isOpen));
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('open')) closeRequest(); });
requestForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!requestForm.reportValidity()) return;
  requestForm.hidden = true;
  document.getElementById('request-success').hidden = false;
});

setLanguage(language);
updateResults();
