const CONTENT = {
  name: "Машуля",
  genitiveName: "Машули",
  age: 25,
  stars: [
    {
      label: "Смех",
      title: "Твой смех умеет включать свет",
      text: "Ты смеёшься так заразительно, что иногда план на вечер меняется сам собой. Официально: это не шум, а самый приятный способ сделать день лучше."
    },
    {
      label: "Милота",
      title: "После твоей улыбки спорить невозможно",
      text: "Ты умеешь быть милой без всяких усилий: одним взглядом, одной интонацией и тем, как радуешься за других. Это немного нечестно — после такой улыбки невозможно продолжать серьёзный разговор."
    },
    {
      label: "Доброта",
      title: "Ты раздаёшь людям свет",
      text: "Ты умеешь дарить людям добро и позитив так естественно, будто у тебя внутри неиссякаемый запас тепла. Пожалуйста, оставляй немного и себе."
    },
    {
      label: "5 июня",
      title: "День, который я буду помнить всегда",
      text: "Этим летом, 5 июня, в Петербурге я сделал тебе предложение. Среди этого города, его воздуха и нашей истории появился вопрос, на который мне больше всего хотелось услышать «да»."
    },
    {
      label: "Август",
      title: "Год под одной крышей",
      text: "В августе у нас ещё одна приятная дата: год с тех пор, как мы съехались и живём в одной квартире. За это время я понял: счастье — это не только большие моменты, но и каждый день рядом с тобой."
    },
    {
      label: "Тепло",
      title: "После тебя мир чуть лучше",
      text: "Ты умеешь поддержать, рассмешить, порадоваться за другого и просто быть рядом. Людям с тобой теплее. Мне — особенно."
    },
    {
      label: "Машуля",
      title: "Главная звезда моей карты",
      text: "У этой звезды есть имя: Машуля. Она милая, добрая, смешно смеётся и каким-то образом согласилась жить со мной. Системная проверка считает это главным чудом."
    }
  ],
  finale: "Машуля, пусть этот год будет щедрым на людей, рядом с которыми легко, на события, от которых загораются глаза, и на дни, которые хочется прожить ещё раз. Я хочу проживать с тобой не только красивые даты — 5 июня, август и всё, что будет дальше, — но и самые обычные дни: завтраки, вечера и случайные разговоры. Ты моё самое любимое созвездие."
};
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const POSITIONS = [
  { x: 19, y: 28, side: "right" },
  { x: 34, y: 50, side: "right" },
  { x: 47, y: 23, side: "right" },
  { x: 57, y: 51, side: "right" },
  { x: 72, y: 31, side: "left" },
  { x: 78, y: 67, side: "left" },
  { x: 47, y: 78, side: "right" }
];

const CONNECTIONS = [[0, 1], [1, 2], [2, 3], [3, 4], [3, 6], [4, 5], [5, 6]];
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const openedStars = new Set();
let installPrompt = null;
let toastTimer = null;
let musicStarted = false;

const elements = {
  skyMap: document.querySelector("#sky-map"),
  lineMap: document.querySelector("#constellation-lines"),
  starField: document.querySelector("#star-field"),
  starCount: document.querySelector("#star-count"),
  mapHelp: document.querySelector("#map-help"),
  messagePanel: document.querySelector("#message-panel"),
  messageKicker: document.querySelector("#message-kicker"),
  messageTitle: document.querySelector("#message-title"),
  messageText: document.querySelector("#message-text"),
  messageClose: document.querySelector("#message-close"),
  finale: document.querySelector("#finale"),
  finalName: document.querySelector("#final-name"),
  finalText: document.querySelector("#final-text"),
  beginButton: document.querySelector("#begin-button"),
  shareButton: document.querySelector("#share-button"),
  installButton: document.querySelector("#install-button"),
  music: document.querySelector("#background-music"),
  musicToggle: document.querySelector("#music-toggle"),
  musicLabel: document.querySelector("#music-label"),
  localTime: document.querySelector("#local-time"),
  toast: document.querySelector("#toast")
};

function setPersonalDetails() {
  document.title = `Созвездие для ${CONTENT.genitiveName}`;
  elements.finalName.textContent = `${CONTENT.name}.`;
  elements.finalText.textContent = CONTENT.finale;
}

function updateNightStatus() {
  const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  elements.localTime.textContent = `НОЧЬ / ${time} / СВЯЗЬ ЕСТЬ`;
}
function setMusicState(isPlaying) {
  elements.musicToggle.classList.toggle("is-playing", isPlaying);
  elements.musicLabel.textContent = isPlaying ? "музыка играет" : "включить музыку";
  elements.musicToggle.setAttribute("aria-label", isPlaying ? "Поставить музыку на паузу" : "Включить музыку");
}

async function startMusic(notifyOnFailure = false) {
  if (!elements.music || musicStarted) return;
  elements.music.volume = 0.78;
  try {
    await elements.music.play();
    musicStarted = true;
    elements.musicToggle.hidden = false;
    setMusicState(true);
  } catch (error) {
    if (notifyOnFailure) {
      elements.musicToggle.hidden = false;
      setMusicState(false);
      showToast(error.name === "NotAllowedError" ? "Нажми на ноту, чтобы включить музыку." : "Музыку не удалось загрузить.");
    }
  }
}

function toggleMusic() {
  if (elements.music.paused) {
    startMusic(true);
    return;
  }
  elements.music.pause();
  setMusicState(false);
  showToast("Музыка поставлена на паузу.");
}


function renderConstellation() {
  POSITIONS.forEach((position, index) => {
    const star = document.createElement("button");
    star.type = "button";
    star.className = "star-button";
    star.style.left = `${position.x}%`;
    star.style.top = `${position.y}%`;
    star.dataset.index = String(index);
    star.setAttribute("aria-label", `Звезда ${index + 1}: ${CONTENT.stars[index].label}`);
    star.setAttribute("aria-pressed", "false");
    star.innerHTML = `<span class="star-number">0${index + 1}</span><span class="star-label ${position.side === "left" ? "left" : ""}">${CONTENT.stars[index].label}</span>`;
    star.addEventListener("click", () => openStar(index));
    elements.starField.appendChild(star);
  });

  CONNECTIONS.forEach(([from, to], index) => {
    const line = document.createElementNS(SVG_NAMESPACE, "line");
    line.classList.add("constellation-line");
    line.dataset.connection = String(index);
    line.setAttribute("x1", POSITIONS[from].x);
    line.setAttribute("y1", POSITIONS[from].y);
    line.setAttribute("x2", POSITIONS[to].x);
    line.setAttribute("y2", POSITIONS[to].y);
    elements.lineMap.appendChild(line);
  });
}

function openStar(index) {
  const starData = CONTENT.stars[index];
  openedStars.add(index);
  const starButton = elements.starField.querySelector(`[data-index="${index}"]`);
  if (starButton) {
    starButton.classList.add("is-open");
    starButton.setAttribute("aria-pressed", "true");
  }
  updateConstellation();
  elements.messageKicker.textContent = `ЗВЕЗДА 0${index + 1} / ${starData.label.toUpperCase()}`;
  elements.messageTitle.textContent = starData.title;
  elements.messageText.textContent = starData.text;
  elements.messagePanel.hidden = false;
  elements.messagePanel.classList.remove("is-new");
  window.requestAnimationFrame(() => elements.messagePanel.classList.add("is-new"));
  elements.mapHelp.textContent = getMapHelpText();
  elements.starCount.textContent = `${openedStars.size} / ${CONTENT.stars.length} ОТКРЫТО`;
  if (openedStars.size === CONTENT.stars.length) revealFinale();
}

function updateConstellation() {
  CONNECTIONS.forEach(([from, to], index) => {
    const line = elements.lineMap.querySelector(`[data-connection="${index}"]`);
    if (line && openedStars.has(from) && openedStars.has(to)) line.classList.add("is-lit");
  });
}

function getMapHelpText() {
  if (openedStars.size === CONTENT.stars.length) return "Созвездие собрано. Финальное поздравление уже открыто.";
  if (openedStars.size === 0) return "Выбери первую звезду — остальные уже знают дорогу.";
  return `Открыто ${openedStars.size} из ${CONTENT.stars.length}. Можно выбрать следующую.`;
}

function scrollToElement(element, block) {
  element.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block });
}

function revealFinale() {
  elements.finale.hidden = false;
  showToast("Созвездие собрано. Теперь можно загадать желание.");
  scrollToElement(elements.finale, "center");
}

function closeMessage() {
  elements.messagePanel.hidden = true;
  elements.mapHelp.textContent = getMapHelpText();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 3600);
}

async function copyAddress() {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(window.location.href);
      return true;
    } catch {
      // Fall through to the older clipboard path when permission is unavailable.
    }
  }
  try {
    const field = document.createElement("textarea");
    field.value = window.location.href;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  } catch {
    return false;
  }
}

async function shareMap() {
  const shareData = { title: `Созвездие для ${CONTENT.genitiveName}`, text: "Я собрал для тебя маленькую карту неба.", url: window.location.href };
  if (navigator.share) {
    await navigator.share(shareData);
    showToast("Карта готова к отправке.");
    return;
  }
  showToast(await copyAddress() ? "Ссылка на карту скопирована." : "Скопируй адрес страницы и отправь его ей.");
}

elements.beginButton.addEventListener("click", () => {
  startMusic(true);
  scrollToElement(document.querySelector("#map"), "start");
  window.setTimeout(() => elements.starField.querySelector(".star-button")?.focus(), prefersReducedMotion ? 0 : 550);
});
elements.messageClose.addEventListener("click", closeMessage);
elements.shareButton.addEventListener("click", () => shareMap().catch((error) => {
  if (error.name !== "AbortError") showToast("Не получилось открыть отправку. Скопируй адрес страницы вручную.");
}));
elements.musicToggle.addEventListener("click", toggleMusic);
elements.music.addEventListener("error", () => {
  if (!musicStarted) return;
  musicStarted = false;
  elements.musicToggle.hidden = false;
  setMusicState(false);
  showToast("Музыка остановилась — проверь аудиофайл.");
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  elements.installButton.hidden = false;
});
elements.installButton.addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  elements.installButton.hidden = true;
});

setPersonalDetails();
renderConstellation();
updateNightStatus();
window.setInterval(updateNightStatus, 30000);
window.addEventListener("load", () => startMusic());
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
