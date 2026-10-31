import { Csound } from "@csound/browser";
import { projectConfig } from "./config.js";

// Загружаем Csound-файлы из папки csd
const csdFiles = import.meta.glob("../csd/*.csd", {
  query: "?raw",
  import: "default",
  eager: true
});

const $ = (selector) => document.querySelector(selector);

let currentIndex = 0;
let csound = null;
let isPlaying = false;

// Находим CSD-файл по имени из конфигурации
function getCompositionCode(composition) {
  const filePath = `../csd/${composition.file}`;
  return csdFiles[filePath];
}

// Обновляем информацию на странице
function renderComposition() {
  const composition = projectConfig.compositions[currentIndex];

  $("#project-title").textContent = projectConfig.title.toUpperCase();
  $("#composition-title").textContent = composition.title;
  $("#composition-subtitle").textContent = composition.subtitle;
  $("#composition-description").textContent = composition.description;
  $("#counter").textContent =
    `COMPOSITION ${String(currentIndex + 1).padStart(2, "0")}`;
  $("#player-title").textContent = composition.title;

  document.title = projectConfig.title;

  document.documentElement.style.setProperty(
    "--accent",
    projectConfig.accentColor
  );

  document.querySelectorAll(".chapter").forEach((button, index) => {
    button.classList.toggle("active", index === currentIndex);
  });
}

// Создаём навигацию по композициям
function createNavigation() {
  const navigation = $("#chapters");
  navigation.innerHTML = "";

  projectConfig.compositions.forEach((composition, index) => {
    const button = document.createElement("button");

    button.className = "chapter";
    button.textContent = composition.title;

    button.addEventListener("click", async () => {
      await stopComposition();
      currentIndex = index;
      renderComposition();
    });

    navigation.appendChild(button);
  });
}

// Останавливаем текущую композицию
async function stopComposition() {
  if (csound) {
    try {
      await csound.stop();
    } catch (error) {
      console.warn("Csound stop:", error);
    }

    csound = null;
  }

  isPlaying = false;
  $("#play").textContent = "▶";
  $("#status").textContent = "Ready to listen";
}

// Запускаем выбранную композицию
async function playComposition() {
  const composition = projectConfig.compositions[currentIndex];
  const code = getCompositionCode(composition);

  if (!code) {
    $("#status").textContent = `File not found: ${composition.file}`;
    return;
  }

  await stopComposition();

  try {
    $("#status").textContent = "Loading Csound...";

    csound = await Csound();

    $("#status").textContent = "Compiling composition...";

    await csound.compileCSD(code, 1);
    await csound.start();

    isPlaying = true;
    $("#play").textContent = "Ⅱ";
    $("#status").textContent = "Now playing";
  } catch (error) {
    console.error("Csound error:", error);
    $("#status").textContent = "Could not start composition";
    isPlaying = false;
    $("#play").textContent = "▶";
  }
}

// Переключение воспроизведения
async function togglePlayback() {
  if (isPlaying) {
    await stopComposition();
  } else {
    await playComposition();
  }
}

// Переход к следующей композиции
async function nextComposition() {
  await stopComposition();

  currentIndex =
    (currentIndex + 1) % projectConfig.compositions.length;

  renderComposition();
}

// Переход к предыдущей композиции
async function previousComposition() {
  await stopComposition();

  currentIndex =
    (currentIndex - 1 + projectConfig.compositions.length) %
    projectConfig.compositions.length;

  renderComposition();
}

// Кнопки управления
$("#play").addEventListener("click", togglePlayback);
$("#play-main").addEventListener("click", togglePlayback);
$("#next").addEventListener("click", nextComposition);
$("#next-main").addEventListener("click", nextComposition);
$("#prev").addEventListener("click", previousComposition);

// Первоначальная настройка страницы
createNavigation();
renderComposition();
