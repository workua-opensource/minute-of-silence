# SilenceMoment

Автономний JavaScript плагін для показу модального вікна хвилини мовчання о 09:00 за київським часом.

## Опис

SilenceMoment - це повністю автономний плагін, який показує модальне вікно з таймером о 09:00 за київським часом. Плагін автоматично обробляє перехід між зимовим та літнім часом, блокує взаємодію з сайтом протягом хвилини та показує попередження при спробі закриття.

## Встановлення

1. Підключіть файл `silence-moment.js` до вашого HTML:

```html
<script src="silence-moment.js"></script>
```

min версія
```html
<script src="silence-moment.min.js"></script>
```

або через CDN

```html
<script src="https://cdn.jsdelivr.net/gh/minute-of-silence/workua-minute-of-silence@v1.0.1/silence-moment.js"></script>
```

min версія
```html
<script src="https://cdn.jsdelivr.net/gh/minute-of-silence/workua-minute-of-silence@v1.0.1/silence-moment.min.js"></script>
```

2. Ініціалізуйте плагін:

```html
<script>
SilenceMoment.init();
</script>
```

## Конфігурація

### Приклад повної конфігурації

```javascript
SilenceMoment.init({
    // Налаштування часу
    showTime: 9,           // Година показу (за замовчуванням: 9)
    showMinute: 0,         // Хвилина показу (за замовчуванням: 0)
    showSecond: 0,         // Секунда показу (за замовчуванням: 0)
    duration: 60000,       // Тривалість в мілісекундах (за замовчуванням: 60000 = 1 хв)
    
    // Кастомізація текстів
    title: "Хвилина мовчання", // Заголовок модального вікна
    text: "Просимо вас приєднатися до хвилини мовчання", // Основний текст
    additionalText: "На згадку про всіх, хто загинув", // Додатковий текст
    alertTitle: "Увага!", // Заголовок попередження при спробі закриття
    alertText: "Будь ласка, не закривайте це вікно протягом хвилини мовчання", // Текст попередження при спробі закриття
    
    // Налаштування кольорів
    backgroundColor: "#009cea", // Колір фону модального вікна
    textColor: "#fff",         // Колір тексту (за замовчуванням: #fff)
    alertBackgroundColor: "#fff", // Колір фону попередження (за замовчуванням: #fff)
    alertTextColor: "#000",   // Колір тексту попередження (за замовчуванням: #000)
    
    // Фонові зображення
    backgroundImage: "https://st.work.ua/i/info_blocks/minute_of_silence/decor_lg.svg",      // Фонове зображення модалки (десктоп)
    alertBackgroundImage: "https://st.work.ua/i/info_blocks/minute_of_silence/decor_alert_lg.svg", // Фонове зображення попередження (десктоп)
    mobileBackgroundImage: "https://st.work.ua/i/info_blocks/minute_of_silence/decor_xs.svg", // Фонове зображення модалки (мобільні)
    mobileAlertBackgroundImage: "https://st.work.ua/i/info_blocks/minute_of_silence/decor_alert_xs.svg", // Фонове зображення попередження (мобільні)
    
    // Додаткові налаштування
    modalClass: "",        // Додатковий CSS клас для модального вікна
    customStyles: "",      // Додаткові CSS стилі (санітизовані для безпеки)
    disableWorkLogo: false, // Відключити логотип Work.ua (за замовчуванням: false)
    zIndex: 9999999        // Z-index модального вікна (за замовчуванням: 9999999)
});
```

## API Методи

### `SilenceMoment.show()`
Ручний показ модального вікна (для тестування):

```javascript
SilenceMoment.show();
```

### `SilenceMoment.hide()`
Ручне закриття модального вікна:

```javascript
SilenceMoment.hide();
```

### `SilenceMoment.destroy()`
Повне очищення плагіну:

```javascript
SilenceMoment.destroy();
```

### `SilenceMoment.getKyivTime()`
Отримання поточного київського часу:

```javascript
const kyivTime = SilenceMoment.getKyivTime();
console.log(kyivTime);
```

## Поведінка

### Автоматичний показ
- Модальне вікно з'являється о 09:00 за київським часом
- Показується таймер зворотного відліку
- Блокується взаємодія з сайтом протягом хвилини

### Спроби закриття
При спробі закрити модальне вікно (ESC, клік поза межами, кнопка ×) показується алерт з повідомленням.

## Технічні деталі

### Київський час
Плагін автоматично визначає київський час використовуючи вбудовані часові зони браузера:
- Використовує `Europe/Kyiv` або `Europe/Kiev` залежно від підтримки браузера
- Автоматично обробляє перехід між зимовим (UTC+2) та літнім (UTC+3) часом
- Точний час без додаткових налаштувань

### Браузерна підтримка
- Chrome 67+
- Firefox 80+
- Safari 13+
- Opera 54+
- Edge 80+

### Безпека

Плагін включає вбудовані заходи безпеки:
- Санітизація CSS стилів для запобігання XSS атак
- Правильне очищення ресурсів та event listeners
- Збереження оригінального стану сторінки (overflow, scroll)
- Ізольований scope для запобігання конфліктів
