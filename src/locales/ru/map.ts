import type { Dictionary } from "../types";

export const map: Dictionary["map"] = {
  status: { completed: "Пройдено", in_progress: "В процессе", available: "Доступно", locked: "Заблокировано" },
  premium: {
    title: "Ваш прогресс — с Wiseit Premium",
    body: "В бесплатном плане можно сохранять прогресс по первой теме. С Premium вы отмечаете понятия по всему маршруту, завершаете темы и открываете следующие.",
  },
  nodeAria: "{title}. {status}, {percent}%",
  percentDone: "Пройдено {percent}%",
  overallAria: "Общий прогресс: {percent}%",
  overallTitle: "Ваш прогресс",
  overallCount: "Пройдено тем: {completed} из {total}",
  legend: "Обозначения статусов",
  zoomControls: "Управление масштабом",
  panelAria: "Подробнее: {title}",
  close: "Закрыть панель",
  completeFirst: "Сначала пройдите:",
  content: "Содержание",
  practice: "Практика",
  noConcepts: "Для этой темы нет ключевых понятий.",
  start: "Начать изучение",
  complete: "Отметить как пройденное",
  reset: "Сбросить прогресс",
};
