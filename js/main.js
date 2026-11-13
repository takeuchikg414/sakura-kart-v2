/* ==========================================================
   SAKURA KART — 予約・料金表・連絡先・メニュー
   （演出系のアニメーションは fx.js）
   ========================================================== */
(function () {
  const CFG = window.SITE_CONFIG;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const t = () => window.I18N.t();
  const lang = () => window.I18N.lang;
  const yen = n => (n < 0 ? "−" : "") + "¥" + Math.abs(n).toLocaleString("en-US");
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toMin = s => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- 料金の計算 ---------- */
  const bandFor = time => (CFG.priceBands || []).find(b => toMin(time) >= toMin(b.from) && toMin(time) < toMin(b.to));
  const unitPrice = (course, time, insurance) =>
    course.price + (time ? (bandFor(time)?.diff || 0) : 0) + (insurance === "full" ? CFG.insurance.full : 0);

  /* ---------- 連絡先（config.js から差し込む） ---------- */
  function fillContacts() {
    const c = CFG.contact;
    const hrefs = {
      phone: "tel:" + c.phone.replace(/[^\d+]/g, ""),
      email: "mailto:" + c.email,
      licenseEmail: "mailto:" + c.licenseEmail,
      line: c.line, whatsapp: c.whatsapp, messenger: c.messenger,
      instagram: c.instagram, tiktok: c.tiktok, youtube: c.youtube, form: c.form
    };
    const texts = { phone: c.phone, email: c.email, licenseEmail: c.licenseEmail };
    $$("[data-c]").forEach(a => {
      const k = a.dataset.c;
      a.href = hrefs[k] || "#";
      if (/^https?:/.test(a.href) && !a.href.startsWith(location.origin)) { a.target = "_blank"; a.rel = "noopener"; }
      if (texts[k]) {
        const span = $("span:not([data-ja])", a);
        if (span && !span.textContent.trim()) span.textContent = texts[k];
        else if (!a.children.length) a.textContent = texts[k];
      }
    });
    $$("[data-c-text]").forEach(el => { el.textContent = c[el.dataset.cText] || ""; });
    $$(".ins-full, #opt-ins-price").forEach(el => { el.textContent = (el.id ? "" : "+") + yen(CFG.insurance.full); });
    $$(".ins-deductible").forEach(el => { el.textContent = yen(CFG.insurance.deductible); });
  }

  /* ---------- メニュー（スマホ） ---------- */
  function initNav() {
    const toggle = $(".hdr__menu");
    const nav = $("#global-nav");
    const set = open => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () => set(!nav.classList.contains("is-open")));
    $$("a", nav).forEach(a => a.addEventListener("click", () => set(false)));
  }

  /* ---------- モーダル ---------- */
  function initModal() {
    let lastFocus = null;
    document.addEventListener("click", e => {
      const opener = e.target.closest("[data-open-modal]");
      if (opener) {
        const m = document.getElementById(opener.dataset.openModal);
        lastFocus = opener;
        m.hidden = false;
        $(".modal__close", m).focus();
        return;
      }
      if (e.target.closest("[data-close-modal]")) closeAll();
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeAll(); });
    function closeAll() {
      $$(".modal").forEach(m => { m.hidden = true; });
      if (lastFocus) lastFocus.focus();
    }
  }

  /* ---------- 料金カード ---------- */
  function renderCourses() {
    const list = $("#course-list");
    if (!list) return;
    const bolt = on => `<svg class="${on ? "on" : ""}" aria-hidden="true"><use href="#i-bolt"/></svg>`;
    const minDiff = Math.min(0, ...(CFG.priceBands || []).map(b => b.diff));
    list.innerHTML = CFG.courses.map(c => `
      <article class="course course--${c.color || "cream"}">
        ${c.popular ? `<span class="course__badge">${t().popular}</span>` : ""}
        <div class="ph ph--${c.color === "shu" ? "night" : c.color === "pink" ? "yellow" : "sky"}" data-label="${escapeHtml(c.name.en.toUpperCase())}"></div>
        <div class="course__body">
          <div class="course__top">
            <h3 class="course__name">${escapeHtml(c.name[lang()])}</h3>
            <p class="course__price">${t().from ? `<small>${t().from}</small>` : ""}${yen(c.price + minDiff)}</p>
          </div>
          <div class="course__meta">
            <span>${c.minutes} ${t().min}</span>
            <span class="course__thrill" role="img" aria-label="${t().thrill} ${c.thrill}/3">${[1, 2, 3].map(i => bolt(i <= c.thrill)).join("")}</span>
          </div>
          <p class="course__route">${escapeHtml(c.route[lang()])}</p>
          <p class="course__desc">${escapeHtml(c.desc[lang()])}</p>
          <a href="#booking" class="btn btn--ink btn--block" data-pick-course="${c.id}">${t().bookThis}</a>
        </div>
      </article>`).join("");
  }

  function renderBands() {
    const list = $("#band-list");
    if (!list) return;
    list.innerHTML = (CFG.priceBands || []).map(b => `
      <li class="band">
        <b>${escapeHtml(b.name[lang()])}</b>
        <span>${b.from}–${b.to === "24:00" ? (lang() === "ja" ? "最終" : "close") : b.to}</span>
        <strong>${b.diff === 0 ? (lang() === "ja" ? "通常料金" : "Base price") : (b.diff > 0 ? "+" : "") + yen(b.diff)}</strong>
      </li>`).join("");
  }

  /* ==========================================================
     Booking widget
     ========================================================== */
  const state = {
    step: 1,
    courseId: CFG.courses[0].id,
    date: null,     // "YYYY-MM-DD"
    time: null,
    drivers: 1,
    insurance: "standard",
    view: null      // 表示中の月 (Date, 1日)
  };

  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const lastBookable = () => { const d = today(); d.setDate(d.getDate() + CFG.bookableDaysAhead); return d; };
  const course = () => CFG.courses.find(c => c.id === state.courseId);
  const total = () => unitPrice(course(), state.time, state.insurance) * state.drivers;

  function renderCourseSelect() {
    const sel = $("#bw-course");
    sel.innerHTML = CFG.courses.map(c =>
      `<option value="${c.id}">${escapeHtml(c.name[lang()])} (${c.minutes}${t().min} / ${yen(c.price)}〜)</option>`).join("");
    sel.value = state.courseId;
  }

  function renderDriversSelect() {
    const sel = $("#bw-drivers");
    sel.innerHTML = Array.from({ length: CFG.maxDrivers }, (_, i) => i + 1)
      .map(n => `<option value="${n}">${t().driversOpt(n)}</option>`).join("");
    sel.value = state.drivers;
  }

  function renderInsuranceSelect() {
    const sel = $("#bw-insurance");
    sel.innerHTML = `
      <option value="standard">${t().ins.standard}</option>
      <option value="full">${t().ins.full} (+${yen(CFG.insurance.full)})</option>`;
    sel.value = state.insurance;
  }

  function renderCalendar() {
    const el = $("#calendar");
    const v = state.view;
    const y = v.getFullYear(), m = v.getMonth();
    const first = new Date(y, m, 1);
    const days = new Date(y, m + 1, 0).getDate();
    const min = today(), max = lastBookable();
    const canPrev = new Date(y, m, 1) > new Date(min.getFullYear(), min.getMonth(), 1);
    const canNext = new Date(y, m + 1, 1) <= max;

    let cells = t().dow.map(d => `<span class="cal__dow">${d}</span>`).join("");
    cells += "<span></span>".repeat(first.getDay());
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d);
      const key = ymd(date);
      const disabled = date < min || date > max || CFG.closedWeekdays.includes(date.getDay());
      const cls = ["cal__day", +date === +min ? "is-today" : ""].join(" ").trim();
      cells += `<button type="button" class="${cls}" data-date="${key}" aria-pressed="${state.date === key}" ${disabled ? "disabled" : ""}
                 aria-label="${t().date(date)}">${d}</button>`;
    }
    el.innerHTML = `
      <div class="cal__head">
        <button type="button" class="cal__nav" data-cal="-1" aria-label="${t().prevMonth}" ${canPrev ? "" : "disabled"}>‹</button>
        <span class="cal__title">${t().monthTitle(y, m)}</span>
        <button type="button" class="cal__nav" data-cal="1" aria-label="${t().nextMonth}" ${canNext ? "" : "disabled"}>›</button>
      </div>
      <div class="cal__grid">${cells}</div>`;
  }

  function renderSlots() {
    const el = $("#slots");
    if (!state.date) {
      el.innerHTML = `<p class="slots__empty">${t().pickDate}</p>`;
      return;
    }
    // 今日の場合は過ぎた時刻（＋1時間）を選べないようにする（空き状況の取得は今後 API 連携で）
    const now = new Date();
    const isToday = state.date === ymd(now);
    el.innerHTML = CFG.timeSlots.map(s => {
      const past = isToday && toMin(s) <= now.getHours() * 60 + now.getMinutes() + 60;
      return `<button type="button" class="slot" data-time="${s}" aria-pressed="${state.time === s}" ${past ? "disabled" : ""}>
                ${s}<small>${yen(unitPrice(course(), s, "standard"))}</small></button>`;
    }).join("");
  }

  function renderTotal() { $("#bw-total").textContent = yen(total()); }

  function renderSteps() {
    $$(".bw-step").forEach(f => { f.hidden = Number(f.dataset.step) !== state.step; });
    $$(".booking-steps li").forEach((li, i) => {
      li.classList.toggle("is-active", i + 1 === state.step);
      li.classList.toggle("is-done", i + 1 < state.step);
    });
  }

  function renderSummary() {
    const f = $("#booking-form");
    const S = t().sum;
    const permitSel = f.permit;
    const rows = [
      [S.course, course().name[lang()]],
      [S.date, t().date(new Date(state.date + "T00:00:00"))],
      [S.time, state.time],
      [S.drivers, t().driversOpt(state.drivers)],
      [S.insurance, t().ins[state.insurance]],
      [S.name, f.name.value],
      [S.email, f.email.value],
      [S.phone, f.phone.value],
      [S.country, f.country.value],
      [S.permit, permitSel.options[permitSel.selectedIndex].text]
    ];
    $("#bw-summary").innerHTML =
      rows.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join("") +
      `<div class="summary__total"><dt>${S.total}</dt><dd>${yen(total())}</dd></div>`;
  }

  function showError(msg) {
    const e = $("#bw-error");
    e.textContent = msg;
    e.hidden = !msg;
  }

  function validateStep2() {
    const f = $("#booking-form");
    const fields = ["name", "email", "phone", "country", "permit"].map(n => f[n]);
    let firstBad = null;
    fields.forEach(el => {
      const bad = !el.value.trim() || (el.type === "email" && !el.checkValidity());
      el.setAttribute("aria-invalid", String(bad));
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      showError(firstBad.type === "email" && firstBad.value ? t().err.email : t().err.required);
      firstBad.focus();
      return false;
    }
    if (!f.agree.checked) { showError(t().err.agree); f.agree.focus(); return false; }
    showError("");
    return true;
  }

  function goTo(step) {
    state.step = step;
    if (step === 3) renderSummary();
    renderSteps();
    const w = $(".booking-widget");
    if (w.getBoundingClientRect().top < 0) w.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function initBooking() {
    const t0 = today();
    state.view = new Date(t0.getFullYear(), t0.getMonth(), 1);

    renderCourseSelect(); renderDriversSelect(); renderInsuranceSelect();
    renderCalendar(); renderSlots(); renderTotal(); renderSteps();

    $("#bw-course").addEventListener("change", e => { state.courseId = e.target.value; renderSlots(); renderTotal(); });
    $("#bw-drivers").addEventListener("change", e => { state.drivers = Number(e.target.value); renderTotal(); });
    $("#bw-insurance").addEventListener("change", e => { state.insurance = e.target.value; renderTotal(); });

    $("#calendar").addEventListener("click", e => {
      const nav = e.target.closest("[data-cal]");
      if (nav) {
        state.view = new Date(state.view.getFullYear(), state.view.getMonth() + Number(nav.dataset.cal), 1);
        renderCalendar();
        return;
      }
      const day = e.target.closest("[data-date]");
      if (day && !day.disabled) {
        state.date = day.dataset.date;
        state.time = null;
        renderCalendar(); renderSlots(); renderTotal();
      }
    });

    $("#slots").addEventListener("click", e => {
      const s = e.target.closest("[data-time]");
      if (s && !s.disabled) { state.time = s.dataset.time; renderSlots(); renderTotal(); }
    });

    // 料金カードの「このコースを予約」
    document.addEventListener("click", e => {
      const pick = e.target.closest("[data-pick-course]");
      if (pick) { state.courseId = pick.dataset.pickCourse; $("#bw-course").value = state.courseId; renderSlots(); renderTotal(); goTo(1); }
    });

    $("#booking-form").addEventListener("click", e => {
      if (e.target.closest("[data-prev]")) { showError(""); goTo(state.step - 1); }
      if (e.target.closest("[data-next]")) {
        if (state.step === 1) {
          if (!state.date || !state.time) { alert(t().err.slot); return; }
          goTo(2);
        } else if (state.step === 2) {
          if (validateStep2()) goTo(3);
        }
      }
    });

    $("#booking-form").addEventListener("submit", async e => {
      e.preventDefault();
      const f = e.target;
      const btn = $('button[type="submit"]', f);
      btn.disabled = true;
      btn.textContent = t().redirecting;

      const c = course();
      const booking = {
        courseId: c.id, courseName: c.name.en, minutes: c.minutes,
        date: state.date, time: state.time, drivers: state.drivers,
        insurance: state.insurance,
        unitPrice: unitPrice(c, state.time, state.insurance),
        total: total(), currency: CFG.currency,
        name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(),
        country: f.country.value.trim(), permit: f.permit.value, lang: lang(),
        createdAt: new Date().toISOString()
      };

      const res = await CFG.submitBooking(booking);
      const url = CFG.paymentUrls[c.id] || CFG.paymentUrl;

      if (res.ok && /^https?:\/\//.test(url)) {
        // 決済ページへ予約IDを渡して照合できるようにする（Stripe Payment Links は client_reference_id に対応）
        const u = new URL(url);
        u.searchParams.set("client_reference_id", res.id);
        location.href = u.toString();
        return;
      }
      alert(t().paymentNotSet + (res.id || ""));
      btn.disabled = false;
      btn.textContent = t().pay;
    });
  }

  /* ---------- 言語切り替え：JS で描画した部分を描き直す ---------- */
  document.addEventListener("langchange", () => {
    renderCourses(); renderBands();
    if (!state.view) return; // 予約ウィジェットのないページ / 初期化前
    renderCourseSelect(); renderDriversSelect(); renderInsuranceSelect(); renderCalendar(); renderSlots();
    if (state.step === 3) renderSummary();
  });

  document.addEventListener("DOMContentLoaded", () => {
    const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
    fillContacts();
    if ($(".hdr__menu")) initNav();
    initModal();
    renderCourses(); renderBands();
    if ($("#booking-form")) initBooking();
  });
})();
