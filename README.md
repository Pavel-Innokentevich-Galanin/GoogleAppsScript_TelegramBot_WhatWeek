## Введение

Создадим Telegram-бота.

Бот будет работать без NodeJS.

Когда боту будет приходить сообщение,
то бот будет отправлять POST запрос на Google Apps Script.
Мы этот POST запрос будет обрабатывать и отвечать пользователю.

Дальше уже дело творческое:
- создал команду `/help`, по которой бот выведет список команд
- создал команду `/whatweek`, по которой бот выведет дни месяца с подписями (верхняя или нижняя неделя)
- создал команду `/getcalendar`, по которой бот выведет календарь на учебный год
- создал команду `/rspfeis`, по которой бот отправит ссылку на сайт с расписанием занятий
- создал команду `/examfeis`, по которой бот отправит ссылку на сайт с расписанием экзаменов
- создал команду `/about`, по которой бот выведет информацию о программисте

Плюсы Google Apps Script при создании Telegram бота:
- это бесплатно
- не нужно иметь машину с утановленой NodeJS

Минусы Google Apps Script при создании Telegram бота:
- нельзя использовать npm пакеты (нужно писать код самому)
- когда редактируешь код то, чтобы заставить бота выполнять новый код,
    нужно получать новую ссылку Google Apps Script
    и вешать хуком эту ссылку на Telegram бота
    (как это делать я описал ниже)

## Создать бота Telegram

1. https://t.me/BotFather
1. Отправляем сообщение `/newbot`
1. Отправляем имя бота `Пример имени бота`
1. Отправляем логин бота `myTestBot` (на конце `Bot` или `_bot`)
1. Копируем токен `xxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxx_xxxxxxxxxxxx`

## Как загрузить этот код на Google Apps Script

Создаем проект:
1. Заходим на [Google Apps Scripts](https://script.google.com/home).
1. Жмем `New project` (Создать проект).
1. Переименовываю проект:
    - Жму `Untitled project` (Проект без названия).
    - Пишу `GoogleAppsScript_TelegramBot_WhatWeek`.
1. В файл `Code.gs` или в файл `Код.gs` пишем код [src/Code.gs](src/Code.gs).
1. Создаем файл секретов:
    1. Жму `+`.
    1. Жму `HTML`.
    1. Ввожу название `env`.
    1. Вставляю в файл `env.html` код [src/env.html](src/env.html).
    1. В env файле (`env.html`) нужно поменять следующие параметры:
        - `APP__TELEGRAM_BOT_TOKEN` - токен бота Telegram
        - `APP__GOOGLE_SHEETS_ID` - ид [Google Таблицы](https://docs.google.com/spreadsheets)
            ```
            https://docs.google.com/spreadsheets/d/<тут_ид_гугл_таблицы>/edit
            ```
            В Google таблице создай следующие листы:
            - `logs` - таблица для логов
                - поле A (date) - хранит дату
                - поле B (message) - хранит сообщение от функции `myLog('сообщение');`
                - поле C (function) - хранит имя функции `myLog('сообщение', 'функция');`
            - `POST_logs` - логи функции doPost
                - поле A (date) - хранит дату
                - поле В (data) - хранит данные, которые пришли в POST запросе на Google Apps Script
            - `GET_logs` - логи функции doGet
                - поле A (date) - хранит дату
                - поле B (data) - хранит тело запроса, которое отправлено на Viber API
            - `logs` - таблица, которая хранит сообщения, которые отправил пользователь
                - поле A (date) - хранит дату
                - поле B (chat_id) - ид чата
                - поле С (username) - пользовательская ссылка @username
                - поле D (first_name) - имя пользователя
                - поле E (last_name) - фамилия пользователя
                - поле F (message_id) - ид сообщения
                - поле G (text) - сообщение пользователя
        - `APP__GOOGLE_APPS_SCRIPT_URL` - ссылка на проект Google Apps Script
            Как получить ссылку на проект:
            1. Откройте проект на https://script.google.com
            1. 
                - Нажмите "Deploy" или "Начать развертывание".
                - Нажмите "New deployment" или "Новое развертывание".
            1. 
                - Нажмите на шестренку у текста "Select type" или у текста "Выберите тип".
                - Нажмите "Web app" или "Веб-приложение".
            1. 
                - В поле "New description" или в поле "Описание" можно указать любое описание, можно не указывать
                - В поле "Execute as" или в поле "Запуск от имени" указать "Me" или "От моего имени"
                - В поле "Who has access" или в поле "У кого есть доступа" указать "Anyone" или "Все"
                - Нажмите "Deploy" или "Начать развертывание"
            1. Скопируйте ссылку и вставьте в файл env.html в параметр APP__GOOGLE_APPS_SCRIPT_URL
                ```conf
                APP__TELEGRAM_BOT_TOKEN=xxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxx_xxxxxxxxxxxx
                APP__GOOGLE_SHEETS_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                APP__GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec
                ```
            1. 
                - Зайдите на файл с кодом "Code.gs" или "Код.gs"
                - Выберите функцию "myFunction" и нажмите "Выполнить"
            1. Ура, теперь когда пишут Telegram боту, то он будет слать POST запрос на ссылку
                ```
                https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec
                ```

## Структура проекта

```bash
sudo apt update
sudo apt install tree
tree --charset ascii -a -I ".git"
```

```
.
|-- LICENSE             # лицензия репозитория
|-- .prettierignore     # на какие файлы не работает выравнивание кода
|-- .prettierrc.json    # выравнивание кода расширением Prettier в VS Code
|-- README.md           # инструкция репозитория
`-- src                 # папка с кодом
    |-- Code.gs         # файл скрипта в Google Apps Script
    `-- env.html        # файл с секретами (аналог .env)

1 directory, 6 files
```

## Список использованных источников

1. Мои проекты - Скрипт приложений Google Apps
    [Электронный ресурс] -
    Режим доступа:
    https://script.google.com/home.
    Дата доступа:
    14.02.2023.
1. Swagger UI
    [Electronic resource] -
    Mode of access:
    https://telegram-bot-api.vercel.app.
    Date of access:
    14.02.2023.
1. Telegram Bot API
    [Electronic resource] -
    Mode of access:
    https://core.telegram.org/bots/api/#sendmessage.
    Date of access:
    14.02.2023.
1. Download Postman | Get Started for Free
    [Electronic resource] -
    Mode of access:
    https://www.postman.com/downloads.
    Date of access:
    14.02.2023.
1. web app — Блог Дмитрия Жука о работе c Google sheets, docs, apps script
    [Электронный ресурс] -
    Режим доступа:
    [https://dmitriizhuk.ru/2021/08/16/разбираемся-с-doget-в-скриптах-часть-1](https://dmitriizhuk.ru/2021/08/16/%D1%80%D0%B0%D0%B7%D0%B1%D0%B8%D1%80%D0%B0%D0%B5%D0%BC%D1%81%D1%8F-%D1%81-doget-%D0%B2-%D1%81%D0%BA%D1%80%D0%B8%D0%BF%D1%82%D0%B0%D1%85-%D1%87%D0%B0%D1%81%D1%82%D1%8C-1).
    Дата доступа:
    19.02.2023.
1. How do I append a blank row in a Google Spreadsheet with Apps Script? - Stack Overflow
    [Electronic resource] -
    Mode of access:
    https://stackoverflow.com/questions/34689556/how-do-i-append-a-blank-row-in-a-google-spreadsheet-with-apps-script.
    Date of access:
    19.02.2023.
