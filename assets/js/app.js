(function(){
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

  // Footer year
  $("#year").textContent = new Date().getFullYear();

  // Fake stock (optional)
  const stockEl = $("#stock");
  if(stockEl){
    const n = Math.max(7, Math.min(29, Number(stockEl.textContent||17)));
    stockEl.textContent = String(n);
  }

  // Timer: 20 minutes rolling from first visit
  const KEY = "promoEndsAt";
  const now = Date.now();
  let endsAt = Number(localStorage.getItem(KEY) || 0);
  if(!endsAt || endsAt < now){
    endsAt = now + 20*60*1000;
    localStorage.setItem(KEY, String(endsAt));
  }

  function pad(n){return String(n).padStart(2,"0");}
  function tick(){
    const left = Math.max(0, endsAt - Date.now());
    const s = Math.floor(left/1000);
    const h = Math.floor(s/3600);
    const m = Math.floor((s%3600)/60);
    const ss = s%60;
    $("#tH").textContent = pad(h);
    $("#tM").textContent = pad(m);
    $("#tS").textContent = pad(ss);
    if(left <= 0){
      // restart on end
      endsAt = Date.now() + 20*60*1000;
      localStorage.setItem(KEY, String(endsAt));
    }
  }
  tick(); setInterval(tick, 1000);

  // Modal open/close
  const modal = $("#orderModal");
  const openers = ["#openOrder", "#openOrderTop", "#openOrderBottom"].map(sel => $(sel)).filter(Boolean);
  openers.forEach(btn => btn.addEventListener("click", () => openModal()));
 $$("[data-close='1']", modal).forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    closeModal();
  });
});
  document.addEventListener("keydown", (e)=>{ if(e.key==="Escape" && modal.classList.contains("is-open")) closeModal(); });

  function openModal(){
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden","false");
    const fio = $("input[name='fio']", modal);
    setTimeout(()=>fio && fio.focus(), 50);
  }
  function closeModal(){
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden","true");
  }

  // Form submit -> Telegram
  const form = $("#orderForm");

// Phone: keep +380 prefix
const phoneInput = $("input[name='phone']", form);

function ensurePrefix() {
  if (!phoneInput.value.startsWith("+380")) {
    const digits = phoneInput.value.replace(/\D/g, "");
    let tail = digits;
    if (tail.startsWith("380")) tail = tail.slice(3);
    if (tail.startsWith("0")) tail = tail.slice(1);
    tail = tail.slice(0, 9);
    phoneInput.value = "+380" + tail;
  }
  if (phoneInput.value.length < 4) phoneInput.value = "+380";
}

function moveCaretToEnd() {
  const len = phoneInput.value.length;
  phoneInput.setSelectionRange(len, len);
}

phoneInput.addEventListener("focus", () => { ensurePrefix(); setTimeout(moveCaretToEnd, 0); });
phoneInput.addEventListener("click", () => { ensurePrefix(); setTimeout(moveCaretToEnd, 0); });

phoneInput.addEventListener("keydown", (e) => {
  const pos = phoneInput.selectionStart || 0;
  if ((e.key === "Backspace" && pos <= 4) || (e.key === "Delete" && pos < 4)) {
    e.preventDefault();
    ensurePrefix();
    moveCaretToEnd();
  }
});

phoneInput.addEventListener("input", () => {
  ensurePrefix();
});

const notice = $("#notice");
const submitBtn = $("#submitBtn");
  const notice = $("#notice");
  const submitBtn = $("#submitBtn");

  function setNotice(text, ok){
    notice.hidden = false;
    notice.textContent = text;
    notice.className = "notice " + (ok ? "ok" : "bad");
  }

  function validPhoneUA(phone){
    // accept +380XXXXXXXXX (9 digits after 380) or 0XXXXXXXXX (9 digits)
    const p = phone.replace(/\s|\-|\(|\)/g,"");
    return /^\+380\d{9}$/.test(p) || /^0\d{9}$/.test(p);
  }

  async function sendToTelegram(message){
    if(!window.TELEGRAM_BOT_TOKEN && typeof TELEGRAM_BOT_TOKEN !== "undefined") window.TELEGRAM_BOT_TOKEN = TELEGRAM_BOT_TOKEN;
    if(!window.TELEGRAM_CHAT_ID && typeof TELEGRAM_CHAT_ID !== "undefined") window.TELEGRAM_CHAT_ID = TELEGRAM_CHAT_ID;

    const token = (typeof TELEGRAM_BOT_TOKEN !== "undefined") ? TELEGRAM_BOT_TOKEN : "";
    const chatId = (typeof TELEGRAM_CHAT_ID !== "undefined") ? TELEGRAM_CHAT_ID : "";

    if(!token || token.includes("PASTE_") || !chatId || String(chatId).includes("PASTE_")){
      throw new Error("Не заповнені TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID у файлі assets/js/config.js");
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(()=> ({}));
    if(!res.ok || !data.ok){
      const err = (data && data.description) ? data.description : "Помилка Telegram API";
      throw new Error(err);
    }
  }

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    notice.hidden = true;

    const fd = new FormData(form);
    const fio = String(fd.get("fio")||"").trim();
    const phone = String(fd.get("phone")||"").trim();
    const region = String(fd.get("region")||"").trim();
    const city = String(fd.get("city")||"").trim();
    const np = String(fd.get("np")||"").trim();
    const qty = Number(fd.get("qty")||1);

    if(fio.length < 3) return setNotice("Вкажіть ПІБ (мінімум 3 символи).", false);
    if(!validPhoneUA(phone)) return setNotice("Невірний телефон. Приклад: +380XXXXXXXXX", false);
    if(!region || !city || !np) return setNotice("Заповніть область, місто та відділення Нової Пошти.", false);
    if(!Number.isFinite(qty) || qty < 1) return setNotice("Кількість має бути 1 або більше.", false);

    const total = qty * 99;
    const msg =
`<b>🛒 НОВЕ ЗАМОВЛЕННЯ</b>
<b>Товар:</b> Компактний тепловентилятор
<b>Ціна:</b> 99 грн
<b>К-сть:</b> ${qty}
<b>Сума:</b> ${total} грн

<b>ПІБ:</b> ${escapeHtml(fio)}
<b>Тел:</b> ${escapeHtml(phone)}
<b>Область:</b> ${escapeHtml(region)}
<b>Місто:</b> ${escapeHtml(city)}
<b>НП:</b> ${escapeHtml(np)}

<b>Час:</b> ${new Date().toLocaleString("uk-UA")}`;

    submitBtn.disabled = true;
    submitBtn.textContent = "Відправляємо…";

    try{
      await sendToTelegram(msg);
      setNotice("✅ Замовлення відправлено! Ми зв’яжемося з вами найближчим часом.", true);
      form.reset();
      closeModal();
    }catch(err){
      setNotice("❌ Не вдалося відправити: " + (err?.message || "помилка"), false);
    }finally{
      submitBtn.disabled = false;
      submitBtn.textContent = "Відправити замовлення";
    }
  });

  function escapeHtml(s){
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }
})();
