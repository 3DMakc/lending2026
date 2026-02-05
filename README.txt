# Лендинг (GitHub Pages / Netlify)

## Что внутри
- `index.html` — страница
- `assets/css/style.css` — стили
- `assets/js/app.js` — логика (таймер, модалка, отправка в Telegram)
- `assets/js/config.js` — ВАЖНО: сюда вставить токен бота и chat_id
- `assets/img/product.png` — картинка-заглушка (замени на свою)

## Как подключить отправку заказов в Telegram
1) Открой `assets/js/config.js`
2) Вставь:
   - `TELEGRAM_BOT_TOKEN` — токен бота (от @BotFather)
   - `TELEGRAM_CHAT_ID` — куда слать заявки

### Как узнать CHAT_ID быстро
- Если хочешь получать в ЛС:
  1) Напиши что-то своему боту в Telegram
  2) Открой в браузере:
     `https://api.telegram.org/bot<ТОКЕН>/getUpdates`
  3) В ответе найди `chat":{"id":...}` — это и есть chat_id

- Если хочешь в группу:
  1) Добавь бота в группу
  2) Дай ему права читать сообщения (и/или админа)
  3) Напиши в группу любое сообщение
  4) Аналогично `getUpdates` — там будет chat_id группы (обычно отрицательное число)

## Как загрузить на GitHub Pages
1) Создай репозиторий `landing` (Public)
2) Залей содержимое этой папки в корень репозитория (чтобы `index.html` был в корне)
3) Settings → Pages → Deploy from a branch → main → /(root)
4) Получишь ссылку вида: `https://username.github.io/landing/`
