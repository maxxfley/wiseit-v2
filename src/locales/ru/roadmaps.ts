import type { Dictionary } from "../types";

export const roadmaps: Dictionary["roadmaps"] = {
  dashboard: {
    title: "Панель",
    createHeading: "Создать маршрут",
    topicLabel: "Что вы хотите изучить?",
    topicPlaceholder: "Например: PostgreSQL, теория музыки, фотография…",
    draftHint: "Это тема, которую вы написали на главной странице. Её можно изменить перед генерацией.",
    generate: "Создать маршрут",
    generating: "Создаём ваш маршрут…",
    remaining: "Сегодня осталось попыток: {remaining} из {limit}.",
    limitNotice: "У вас {limit} сохранённых маршрута — максимум бесплатного плана. Удалите один, чтобы создать новый.",
    limitLink: "Перейти в «Мои маршруты»",
    recentHeading: "Ваши последние маршруты",
    viewAll: "Смотреть все",
  },
  list: {
    title: "Мои маршруты",
    emptyTitle: "У вас пока нет маршрутов.",
    emptyBody: "Выберите тему, и мы создадим ваш первый учебный маршрут.",
    emptyCta: "Создать маршрут",
    steps: { one: "{count} шаг", few: "{count} шага", many: "{count} шагов", other: "{count} шага" },
  },
  delete: {
    button: "Удалить",
    aria: "Удалить «{title}»",
    title: "Удалить этот маршрут?",
    body: "«{title}» и все его шаги будут удалены навсегда. Потраченные сегодня попытки не вернутся.",
    cancel: "Отмена",
    pending: "Удаляем…",
  },
  detail: {
    metaTitle: "Учебный маршрут",
    back: "← Мои маршруты",
    topics: { one: "{count} тема", few: "{count} темы", many: "{count} тем", other: "{count} темы" },
    created: "создан {date}",
    legacy:
      "Этот маршрут создан до появления интерактивной карты, поэтому он показан только списком. Создайте его заново, чтобы увидеть карту и отмечать прогресс.",
    notFoundTitle: "Маршрут не найден",
    notFoundBody: "Возможно, он был удалён или принадлежит другому пользователю.",
    notFoundBack: "К моим маршрутам",
  },
  timeline: { step: "Шаг {n}", keyConcepts: "Ключевые понятия", practice: "Практика: " },
  views: { label: "Вид маршрута", list: "Список", map: "Интерактивная карта" },
};
