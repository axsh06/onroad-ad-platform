const languageKey = 'onroad-language';
let language = localStorage.getItem(languageKey) || 'ru';
const carsRange = document.getElementById('cars-range');
const monthsRange = document.getElementById('months-range');
const rateRange = document.getElementById('rate-range');
const cityChoices = [...document.querySelectorAll('.choice-chip')];
let cityValue = 'Алматы';

function setLanguage(next) {
  language = next;
  localStorage.setItem(languageKey, next);
  document.documentElement.lang = next;
  document.querySelectorAll('[data-ru][data-kz]').forEach((element) => {
    element.innerHTML = element.dataset[next];
  });
  document.getElementById('language-toggle').innerHTML = next === 'ru' ? 'RU <span>·</span> KZ' : 'KZ <span>·</span> RU';
  document.getElementById('menu-toggle').setAttribute('aria-label', next === 'ru' ? 'Открыть меню' : 'Мәзірді ашу');
  cityChoices.forEach((button) => {
    button.firstChild.textContent = `${next === 'ru' ? button.dataset.value : button.dataset.valueKz} `;
  });
  document.querySelectorAll('.class-choice').forEach((label) => {
    const radio = label.querySelector('input');
    label.querySelector('strong').textContent = next === 'ru' ? radio.value : radio.dataset.valueKz;
  });
  updateEstimate();
}

function money(value) { return `${Math.round(value).toLocaleString(language === 'ru' ? 'ru-RU' : 'kk-KZ')} ₸`; }

function updateEstimate() {
  const carCount = Number(carsRange.value);
  const monthCount = Number(monthsRange.value);
  const rate = Number(rateRange.value);
  const zoneCount = document.querySelectorAll('.zone-checks input:checked').length;
  const monthly = rate * carCount * zoneCount;
  const total = monthly * monthCount;
  document.getElementById('cars-value').value = carCount;
  document.getElementById('months-value').value = monthCount;
  document.getElementById('rate-value').textContent = money(rate);
  document.getElementById('summary-city').textContent = cityValue;
  document.getElementById('summary-cars').textContent = carCount;
  document.getElementById('summary-zones').textContent = zoneCount;
  document.getElementById('summary-months').textContent = monthCount;
  document.getElementById('monthly-estimate').textContent = money(monthly);
  document.getElementById('total-estimate').innerHTML = `${Math.round(total).toLocaleString(language === 'ru' ? 'ru-RU' : 'kk-KZ')} <span>₸</span>`;
  document.querySelectorAll('.range-row input, .rate-control input').forEach((range) => {
    const progress = ((Number(range.value) - Number(range.min)) / (Number(range.max) - Number(range.min))) * 100;
    range.style.setProperty('--progress', `${progress}%`);
  });
}

function currentPlan() {
  const vehicleRadio = document.querySelector('input[name="vehicle-class"]:checked');
  const vehicleClass = language === 'ru' ? vehicleRadio.value : vehicleRadio.dataset.valueKz;
  const zones = [...document.querySelectorAll('.zone-checks input:checked')].map((input) => language === 'ru' ? input.value : input.dataset.valueKz);
  const rate = Number(rateRange.value);
  const cars = Number(carsRange.value);
  const months = Number(monthsRange.value);
  const monthly = cars * zones.length * rate;
  return {city: cityValue, vehicleClass, zones, rate, cars, months, monthly, total: monthly * months};
}

function downloadPlan() {
  const plan = currentPlan();
  const text = language === 'ru'
    ? `ONROAD — черновой расчёт кампании\nГород: ${plan.city}\nТип автомобилей: ${plan.vehicleClass}\nАвтомобилей: ${plan.cars}\nЗоны: ${plan.zones.length ? plan.zones.join(', ') : 'не выбраны'}\nСрок: ${plan.months} мес.\nОриентир за место в месяц: ${money(plan.rate)}\nОриентир в месяц: ${money(plan.monthly)}\nОриентир за период: ${money(plan.total)}\n\nЭто предварительная оценка, не оферта. Печать, установка и другие расходы не включены.`
    : `ONROAD — науқанның бастапқы есебі\nҚала: ${plan.city}\nКөлік түрі: ${plan.vehicleClass}\nАвтомобиль саны: ${plan.cars}\nАймақтар: ${plan.zones.length ? plan.zones.join(', ') : 'таңдалмаған'}\nМерзімі: ${plan.months} ай\nБір орынның айлық бағдары: ${money(plan.rate)}\nАйлық бағдары: ${money(plan.monthly)}\nБарлық мерзім бағдары: ${money(plan.total)}\n\nБұл бастапқы баға, оферта емес. Басып шығару, орнату және басқа шығындар кірмейді.`;
  const file = new Blob([text], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'onroad-campaign-estimate.txt';
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Allow the browser to begin reading the file before releasing its URL.
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

carsRange.addEventListener('input', updateEstimate);
monthsRange.addEventListener('input', updateEstimate);
rateRange.addEventListener('input', updateEstimate);
document.querySelectorAll('.zone-checks input').forEach((input) => input.addEventListener('change', updateEstimate));
document.querySelectorAll('input[name="vehicle-class"]').forEach((input) => input.addEventListener('change', () => {
  document.querySelectorAll('.class-choice').forEach((label) => label.classList.toggle('selected', label.contains(input)));
}));
cityChoices.forEach((button) => button.addEventListener('click', () => {
  cityValue = language === 'ru' ? button.dataset.value : button.dataset.valueKz;
  cityChoices.forEach((choice) => choice.classList.toggle('selected', choice === button));
  updateEstimate();
}));
document.getElementById('download-estimate').addEventListener('click', downloadPlan);
document.getElementById('language-toggle').addEventListener('click', () => setLanguage(language === 'ru' ? 'kz' : 'ru'));
document.getElementById('menu-toggle').addEventListener('click', (event) => {
  const nav = document.getElementById('main-nav');
  const isOpen = nav.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(isOpen));
});

setLanguage(language);
updateEstimate();
