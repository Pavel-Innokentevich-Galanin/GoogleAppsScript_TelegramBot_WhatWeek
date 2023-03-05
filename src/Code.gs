const process = { env: getEnv() };

/**
 * Эта функция, которая меняет хук Telegram
 *
 * Если вы поменяли код, то чтобы заставить бота его выполнять, выполните следующие пункты:
 * 1. Откройте проект на https://script.google.com
 * 1. Нажмите "Deploy" или "Начать развертывание".
 * 2. Нажмите "New deployment" или "Новое развертывание".
 * 3. Нажмите на шестренку у текста "Select type" или у текста "Выберите тип".
 * 4. Нажмите "Web app" или "Веб-приложение".
 * 5. В поле "New description" или в поле "Описание" можно указать любое описание, можно не указывать
 * 6. В поле "Execute as" или в поле "Запуск от имени" указать "Me" или "От моего имени"
 * 7. В поле "Who has access" или в поле "У кого есть доступа" указать "Anyone" или "Все"
 * 6. Нажмите "Deploy" или "Начать развертывание"
 * 7. Скопируйте ссылку и вставьте в файл env.html в параметр APP__GOOGLE_APPS_SCRIPT_URL
 *    https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec
 * 8. Зайдите на файл с кодом "Code.gs" или "Код.gs"
 * 9. Выберите функцию "myFunction" и нажмите "Выполнить"
 * 10. Ура, теперь когда пишут Telegram боту, то он будет слать POST запрос на ссылку
 *    https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec
 */
function myFunction() {
  try {
    setHook();
    setCommands();
  } catch (err) {
    myLog(err, 'myFunction');
  }
}

/**
 * Функция возвращает JS объект из env файла
 * @returns object
 */
function getEnv() {
  const env = {};
  const envFile = HtmlService.createHtmlOutputFromFile('env.html').getContent();
  const lines = envFile.split('\n');

  lines.forEach((el) => {
    if (el.length == 0) return;

    const myRe = new RegExp('.*=.*', 'g');
    const [result] = myRe.exec(el);

    if (!result) return;

    const key = result.split('=')[0];
    const value = result.split('=')[1];

    env[key] = value;
  });

  return env;
}

/**
 * Функция, которая будет вызываться, когда открываем приложение по ссылке
 * @returns Функция возвращает JSON (object)
 */
function doGet(e = {}) {
  try {
    saveToGoogleTable('GET_logs', [new Date(), JSON.stringify(e, null, 2)]);

    const data = {
      message: 'Приложение работает',
      more: {
        data: e,
      },
    };

    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (err) {
    myLog(err, 'doGet');
  }
}

/**
 * Эта функция которую будет вызывать бот, когда ему пришлют сообщение
 * @return Функция не возвращает ничего (undefined).
 */
function doPost(e = {}) {
  try {
    saveToGoogleTable('POST_logs', [new Date(), JSON.stringify(e, null, 2)]);

    if (!e.postData?.contents) {
      throw new Error('нет тела запроса у POST');
    }

    const data = JSON.parse(e.postData?.contents);

    const user = new User(data);

    const message_id = user.getMessageId();
    const text = user.getText();
    const chatId = user.getChatId();
    const userFirstName = user.getUserFirstName();
    const userLastName = user.getUserLastName();
    const userUsername = user.getUserUsername();

    saveToGoogleTable('messages', [
      new Date(),
      chatId,
      userUsername,
      userFirstName,
      userLastName,
      message_id,
      text,
    ]);

    if (isStartCommand(chatId, text, message_id)) return;
    if (isHelpCommand(chatId, text, message_id)) return;
    if (isWhatweekCommand(chatId, text, message_id)) return;
    if (isGetcalendarCommand(chatId, text, message_id)) return;
    if (isRspfeisCommand(chatId, text, message_id)) return;
    if (isExamfeisCommand(chatId, text, message_id)) return;
    if (isAboutCommand(chatId, text, message_id)) return;

    let answer = '';
    answer += 'Я цябе не разумею. \n\n';
    answer += 'Паспрабуй каманду /help \n\n';
    answer += '<b>Дадзеныя, якія дашлі на Google Apps Script</b>: \n';
    answer += `<pre>${JSON.stringify(data, null, 2)}</pre>`;

    const params = {
      reply_to_message_id: message_id,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    };

    sendMessage(chatId, answer, params);
  } catch (err) {
    myLog(err, 'doPost');
  }
}

class User {
  constructor(data) {
    this.data = data;
    this.message_id = data?.message?.message_id;
    this.text = data?.message?.text;
    this.chatId = data?.message?.from?.id;
    this.userFirstName = data?.message?.from?.first_name;
    this.userLastName = data?.message?.from?.last_name;
    this.userUsername = data?.message?.from?.username;
    this.languageCode = data?.message?.from?.language_code;
    this.date = data?.date;
  }

  getMessageId() {
    return this.message_id;
  }

  getText() {
    return this.text;
  }

  getChatId() {
    return this.chatId;
  }

  getUserFirstName() {
    return this.userFirstName;
  }

  getUserLastName() {
    return this.userLastName;
  }

  getUserUsername() {
    return this.userUsername;
  }

  getLanguageCode() {
    return this.languageCode;
  }

  getDate() {
    return this.date;
  }
}

/**
 * Функция отправляет сообщение в телеграм
 * @param {number} chat_id - ид чата, в который слать сообщение боту
 * @param {string} text - сообщение, которое напишет бот
 */
function sendMessage(chat_id, text, params = {}) {
  try {
    const url = `https://api.telegram.org/bot${process.env.APP__TELEGRAM_BOT_TOKEN}/sendMessage`;

    const data = {
      chat_id,
      text,
      ...params,
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(data),
    };

    UrlFetchApp.fetch(url, options);
  } catch (err) {
    myLog(err, 'sendMessage');
  }
}

class DateController {
  /**
   * Функция возвращает следующий год
   * @param {*} year
   * @returns {string}
   * ```
   * 2022
   * 0999
   * 0001
   * 0000
   * -000001
   * -000999
   * ```
   */
  static getNextYear(year) {
    year = Number(year) + 1;

    if (year < 0) {
      year = `${-year}`.padStart(6, 0);
      return `-${year}`;
    }

    return `${year}`.padStart(4, 0);
  }

  /**
   * Функция возвращает предыдущий год
   * @param {*} year
   * @returns {string}
   * ```
   * 2022
   * 0999
   * 0001
   * 0000
   * -000001
   * -000999
   * ```
   */
  static getPrevYear(year) {
    year = Number(year) - 1;

    if (year < 0) {
      year = `${-year}`.padStart(6, 0);
      return `-${year}`;
    }

    return `${year}`.padStart(4, 0);
  }

  static getStringMonth(month) {
    const ru = [
      'студзень (январь)',
      'люты (февраль)',
      'сакавік (март)',
      'красавік (апрель)',
      'травень (май)',
      'чэрвень (июнь)',
      'ліпень (июль)',
      'жнівень (август)',
      'верасень (сентябрь)',
      'кастрычнік (октябрь)',
      'лістапад (ноябрь)',
      'снежань (декабрь)',
    ];
    return ru[month - 1];
  }

  static getUniversityYearCalendar(year = 2020) {
    const nextYear = DateController.getNextYear(year);
    return [
      { month: 9, dates: DateController.getMonthDays(year, 9) },
      { month: 10, dates: DateController.getMonthDays(year, 10) },
      { month: 11, dates: DateController.getMonthDays(year, 11) },
      { month: 12, dates: DateController.getMonthDays(year, 12) },
      { month: 1, dates: DateController.getMonthDays(nextYear, 1) },
      { month: 2, dates: DateController.getMonthDays(nextYear, 2) },
      { month: 3, dates: DateController.getMonthDays(nextYear, 3) },
      { month: 4, dates: DateController.getMonthDays(nextYear, 4) },
      { month: 5, dates: DateController.getMonthDays(nextYear, 5) },
      { month: 6, dates: DateController.getMonthDays(nextYear, 6) },
      { month: 7, dates: DateController.getMonthDays(nextYear, 7) },
      { month: 8, dates: DateController.getMonthDays(nextYear, 8) },
    ];
  }

  /**
   * Функция возвращает сообщение о типе недели (верхняя или нижняя)
   */
  static getWeekType(string_date) {
    try {
      let d = new Date(string_date);

      if (d === 'Invalid Date') {
        d = new Date();
      }

      let d1 = d;

      let mounth = d.getMonth() + 1; // Определяем номер месяца

      if (mounth === 7 || mounth === 8) {
        return 'none';
      }

      if (mounth >= 1 && mounth <= 8) {
        // Если месяц Январь - Август, то берём прошлый год
        let year = d.getFullYear() - 1;
        d = new Date(`${year}-09-01`);
      } else {
        // Если месяц Сентябрь - Декабрь, то берём текущий год
        let year = d.getFullYear();
        d = new Date(`${year}-09-01`);
      }

      let weeks = []; // Массив недель. Массив массивов дней недели
      let days = []; // Массив дней недели
      for (let i = 0; i < 365; ++i) {
        if (d.getDay() === 1) {
          // Если это первый день недели, то добавить в массив недель
          if (days.length !== 0) {
            weeks.push(days);
          }
          days = [];
        }

        days.push(d.toJSON()); // Добавляю день в массив дней недели
        d.setDate(d.getDate() + 1); // Сетаю новую дату
      }
      weeks.push(days); // Добавляю оставший массив дней недел в массив недель

      let type = DateController.getWeekIndex(weeks, d1); // Вызываю функцию, которая определяет номер недели
      if (type === -1) {
        return '-1';
      }

      if (type % 2 === 0) {
        return 'up';
      } else {
        return 'down';
      }
    } catch (e) {
      return '' + e;
    }
  }

  /**
   * Функция, по созданому массиву недель
   * (массив с 1-ого сентября и 365 дней)
   * возвращает номер недели.
   * [Если чётное число (индексация от нуля) - верхняя неделя]
   * [Если нечётное число - нижняя неделя]
   */
  static getWeekIndex(weeks = [[]], d1 = new Date()) {
    let date_1 = d1.getDate(); // Определяю текущий день
    let mount_1 = d1.getMonth(); // Определяю текущий месяц
    for (let i = 0; i < weeks.length; ++i) {
      // Прохожусь по массиву недель
      for (let j = 0; j < weeks[i].length; ++j) {
        // Прохожусь по массиву дней недели
        let d2 = new Date(weeks[i][j]); // Определяю объект дня недели
        let date_2 = d2.getDate(); // Определяю дату дня недели
        let mount_2 = d2.getMonth(); // Определяю месяц дня недели
        if (date_1 === date_2 && mount_1 === mount_2) {
          return i; // Если даты и месяцы равны, то возвращаем номер недели
        }
      }
    }
    return -1; // Какая-то ошибка
  }

  /**
   * Функция сгенерирует массив текущего месяца c 42 элементами
   * с пустотами спереди по понедельник
   * и с пустотами сзади по воскресенье
   * @param {*} year - год
   * @param {*} month - месяц
   * @returns {array}
   */
  static getMonthDays(year, month) {
    let array = [];

    let temp = new Date(`${year}-${month}-1 00:00`);
    for (let step = 0; step <= 31; ++step) {
      if (temp.getMonth() + 1 !== Number(month)) break;

      const element = { date: temp.toJSON(), isThisMonth: true };
      array.push(element);

      const d = new Date(temp.getTime() + 1000 * 60 * 60 * 25);

      temp = new Date(
        `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} 00:00`
      );
    }

    temp = new Date(array[0].date);
    for (let i = 0; i <= 7; ++i) {
      if (temp.getDay() === 1) break;

      const d = new Date(temp.getTime() - 1000 * 60 * 60 * 24);

      temp = new Date(
        `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} 00:00`
      );

      const element = { date: temp.toJSON(), isThisMonth: false };
      array = [element, ...array];
    }

    temp = new Date(array[array.length - 1].date);
    for (let i = 0; i <= 14; ++i) {
      if (temp.getDay() === 0 && array.length >= 42) break;

      const d = new Date(temp.getTime() + 1000 * 60 * 60 * 25);

      temp = new Date(
        `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} 00:00`
      );

      const element = { date: temp.toJSON(), isThisMonth: false };
      array.push(element);
    }

    return array;
  }
}

/**
 * Получеам массив месяца с подписями недели (верхняя или нижняя)
 * @param year
 * @param month
 * @returns
 * ```
 * Год    : 2023
 * Месяц  : люты (февраль)
 *
 * Тыдзень Пн Аў Ср Чц Пт Сб Нд
 * верхні |30|31|01|02|03|04|05|
 * ніжні  |06|07|08|09|10|11|12|
 * верхні |13|14|15|16|17|18|19|
 * ніжні  |20|21|22|23|24|25|26|
 * верхні |27|28|01|02|03|04|05|
 * ніжні  |06|07|08|09|10|11|12|
 * ```
 */
function getMonthArray(year, month) {
  const array = DateController.getMonthDays(year, month);
  let monthArray = [[]];

  let rowNumber = 0;
  let count = 0;
  array.forEach((el) => {
    el.type = DateController.getWeekType(new Date(el.date).toJSON());

    count += 1;
    monthArray[rowNumber]?.push(el);
    if (count >= 7) {
      count = 0;
      rowNumber += 1;
      monthArray.push([]);
    }
  });

  let clearArr = [];

  monthArray.filter((el) => {
    if (el.length == 0) {
      return el;
    }
    clearArr.push(el);
  });

  return clearArr;
}

/**
 * Функция, которая возвращает строку с днями месяца и подписями (верхняя или нижняя)
 * @param year
 * @param month
 * @returns
 * ```
 * Год    : 2023
 * Месяц  : люты (февраль)
 *
 * Тыдзень Пн Аў Ср Чц Пт Сб Нд
 * верхні |30|31|01|02|03|04|05|
 * ніжні  |06|07|08|09|10|11|12|
 * верхні |13|14|15|16|17|18|19|
 * ніжні  |20|21|22|23|24|25|26|
 * верхні |27|28|01|02|03|04|05|
 * ніжні  |06|07|08|09|10|11|12|
 * ```
 */
function printMonth(year, month) {
  const qq = getMonthArray(year, month);
  let text = '';
  text += `Год    : ${year} \n`;
  text += `Месяц  : ${DateController.getStringMonth(month)} \n`;
  text += '\n';
  text += 'Тыдзень Пн Аў Ср Чц Пт Сб Нд \n';
  qq.forEach((i) => {
    const d = new Date(i[0].date);
    let date = d.getDate();
    date = date < 10 ? `0${date}` : `${date}`;

    switch (i[6].type) {
      case 'up':
        text += `верхні |`;
        break;
      case 'down':
        text += `ніжні  |`;
        break;
      default:
        text += `       |`;
        break;
    }

    i.forEach((j) => {
      const d = new Date(j.date);
      let date = d.getDate();
      date = date < 10 ? `0${date}` : `${date}`;

      switch (j.type) {
        case 'up':
          text += `${date}|`;
          break;
        case 'down':
          text += `${date}|`;
          break;
        default:
          text += `${date}|`;
          break;
      }
    });
    text += '\n';
  });

  return text;
}

/**
 * Функция, которая отправляет несколько месяце (от сентября до июня)
 * @param d - дата `new Date()`
 * @returns 
```
 * 2022-2023 навучальны год 
 * 
 * Год    : 2022 
 * Месяц  : верасень (сентябрь) 
 * 
 * Тыдзень Пн Аў Ср Чц Пт Сб Нд 
 * верхні |29|30|31|01|02|03|04|
 * ніжні  |05|06|07|08|09|10|11|
 * верхні |12|13|14|15|16|17|18|
 * ніжні  |19|20|21|22|23|24|25|
 * верхні |26|27|28|29|30|01|02|
 * ніжні  |03|04|05|06|07|08|09|
 * 
 * ... // тут ещё другие месяцы
 * 
 * Год    : 2023 
 * Месяц  : чэрвень (июнь) 
 * 
 * Тыдзень Пн Аў Ср Чц Пт Сб Нд 
 * ніжні  |29|30|31|01|02|03|04|
 * верхні |05|06|07|08|09|10|11|
 * ніжні  |12|13|14|15|16|17|18|
 * верхні |19|20|21|22|23|24|25|
 *        |26|27|28|29|30|01|02|
 *        |03|04|05|06|07|08|09|
```
 */
function printYearCalendar(d = new Date()) {
  ye = d.getFullYear();
  mo = d.getMonth() + 1;
  let prevYear;
  let nextYear;
  if (mo >= 1 && mo <= 8) {
    prevYear = DateController.getPrevYear(ye);
    nextYear = ye;
  } else {
    prevYear = ye;
    nextYear = DateController.getNextYear(ye);
  }

  let text = '';
  text += `<b>${prevYear}-${nextYear} навучальны год</b> \n\n`;
  text += `${printMonth(prevYear, 09)} \n`;
  text += `${printMonth(prevYear, 10)} \n`;
  text += `${printMonth(prevYear, 11)} \n`;
  text += `${printMonth(prevYear, 12)} \n`;
  text += `${printMonth(nextYear, 01)} \n`;
  text += `${printMonth(nextYear, 02)} \n`;
  text += `${printMonth(nextYear, 03)} \n`;
  text += `${printMonth(nextYear, 04)} \n`;
  text += `${printMonth(nextYear, 05)} \n`;
  text += `${printMonth(nextYear, 06)} \n`;

  return text;
}

/**
 * Функция сохраняет array в Google Таблицу на лист sheet
 * @param sheet - лист
 * @param array - массив значений в колонках
 */
function saveToGoogleTable(sheet, array) {
  const ss = SpreadsheetApp.openById(process.env.APP__GOOGLE_SHEETS_ID);
  const messagesTable = ss.getSheetByName(sheet);
  messagesTable.appendRow(array);
}

/**
 * Фукнция сохраняет сообщение message в Google Таблицу
 * @param message - сообщение
 * @param func - функция от которой пришло сообщение
 */
function myLog(message, func) {
  saveToGoogleTable('logs', [new Date(), `${message}`, func]);
}

/**
 * Функция, которая устанавливает новую ссылку для телеграм бота.
 * Когда кто-то шлет сообщение в телеграм, то на эту ссылку прийдет POST запрос.
 */
function setHook() {
  try {
    const url = `https://api.telegram.org/bot${process.env.APP__TELEGRAM_BOT_TOKEN}/setWebhook`;

    const data = {
      url: process.env.APP__GOOGLE_APPS_SCRIPT_URL,
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(data),
    };

    UrlFetchApp.fetch(url, options);
  } catch (err) {
    myLog(err, 'setHook');
  }
}

/**
 * Функция возвращает массив команд телеграм бота
 * @returns
 *  ```
 *  [
 *      {
 *          command: "/start",
 *          description: "Старт бота"
 *      }
 *  ]
 * ```
 */
function getCommands() {
  return [
    {
      command: '/start',
      description: 'Старт бота',
    },
    {
      command: '/help',
      description: 'Спіс каманд',
    },
    {
      command: '/whatweek',
      description: 'Верхні ці ніжні тыдзень?',
    },
    {
      command: '/getcalendar',
      description: 'Каляндар на навучальны год',
    },
    {
      command: '/rspfeis',
      description: 'Расклад заняткаў факультата ЭІС',
    },
    {
      command: '/examfeis',
      description: 'Расклад экзаменаў факультата ЭІС',
    },
    {
      command: '/about',
      description: 'Пра праграміста',
    },
  ];
}

/**
 * Функция возвращает текстовый вид комманд
 * @returns
 * ```
 * /start
 *  - Старт бота
 *
 * /about
 *  - Пра праграміста
 * ```
 */
function getTextCommands() {
  const commands = getCommands();
  let text = '';
  commands.forEach((el) => {
    text += `${el.command} \n`;
    text += ` - ${el.description} \n`;
    text += '\n';
  });
  return text;
}

/**
 * Функция устанавливает список команд для телеграм бота
 */
function setCommands() {
  try {
    const url = `https://api.telegram.org/bot${process.env.APP__TELEGRAM_BOT_TOKEN}/setMyCommands`;

    const data = {
      commands: getCommands(),
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(data),
    };

    UrlFetchApp.fetch(url, options);
  } catch (err) {
    myLog(err, 'setCommands');
  }
}

function isStartCommand(chat_id, text, message_id) {
  try {
    if (text !== '/start') return false;

    let answer = '';
    answer += 'Сардэчна запрашаем у чат! \n\n';
    answer += 'Спіс каманд:\n\n';
    answer += getTextCommands();

    sendMessage(chat_id, answer, { reply_to_message_id: message_id });

    return true;
  } catch (err) {
    myLog(err, 'isStartCommand');
  }
}

function isHelpCommand(chat_id, text, message_id) {
  try {
    if (text !== '/help') return false;

    let answer = getTextCommands();

    sendMessage(chat_id, answer, { reply_to_message_id: message_id });

    return true;
  } catch (err) {
    myLog(err, 'isHelpCommand');
  }
}

function isWhatweekCommand(chat_id, text, message_id) {
  try {
    if (text !== '/whatweek') return false;

    const d = new Date();
    const ye = d.getFullYear();
    const mo = d.getMonth();
    let answer = '';

    answer += `${printTime()} \n\n`;
    answer += `<pre>${printMonth(ye, mo)}</pre>`;

    sendMessage(chat_id, answer, {
      reply_to_message_id: message_id,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });

    return true;
  } catch (err) {
    myLog(err, 'isWhatweekCommand');
  }
}

function isGetcalendarCommand(chat_id, text, message_id) {
  try {
    if (text !== '/getcalendar') return false;

    let answer = `<pre>${printYearCalendar()}</pre>`;

    sendMessage(chat_id, answer, {
      reply_to_message_id: message_id,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });

    return true;
  } catch (err) {
    myLog(err, 'isGetcalendarCommand');
  }
}

function isRspfeisCommand(chat_id, text, message_id) {
  try {
    if (text !== '/rspfeis') return false;

    let answer = '';
    answer += 'Расклад заняткаў факультата ЭІС: \n';
    answer += `https://bstu.by/obrazovanie/fakultety/feis/raspisanie-zanyatij`;

    sendMessage(chat_id, answer, {
      reply_to_message_id: message_id,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });

    return true;
  } catch (err) {
    myLog(err, 'isRspfeisCommand');
  }
}

function isExamfeisCommand(chat_id, text, message_id) {
  try {
    if (text !== '/examfeis') return false;

    let answer = '';
    answer += 'Расклад экзаменаў факультата ЭІС: \n';
    answer += `https://bstu.by/obrazovanie/fakultety/feis/raspisanie-ekzamenov`;

    sendMessage(chat_id, answer, {
      reply_to_message_id: message_id,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });

    return true;
  } catch (err) {
    myLog(err, 'isExamfeisCommand');
  }
}

function isAboutCommand(chat_id, text, message_id) {
  try {
    if (text !== '/about') return false;

    let answer = `
Студэнт
факультэта ЭІС
4 курса
8 семестра
групы ПЗ-4 (ПО-4)

GitHub:
https://github.com/BrSTU-PO4-190333
    `;

    sendMessage(chat_id, answer, {
      reply_to_message_id: message_id,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });

    return true;
  } catch (err) {
    myLog(err, 'isAboutCommand');
  }
}

function printTime(d = new Date()) {
  const ye = d.getFullYear();

  let mo = d.getMonth();
  mo = mo < 10 ? `0${mo}` : `${mo}`;

  let da = d.getDate();
  da = da < 10 ? `0${da}` : `${da}`;

  let ho = d.getHours();
  ho = ho < 10 ? `0${ho}` : `${ho}`;

  let mi = d.getMinutes();
  mi = mi < 10 ? `0${mi}` : `${mi}`;

  return `${ye}-${mo}-${da} ${ho}:${mi}`;
}
