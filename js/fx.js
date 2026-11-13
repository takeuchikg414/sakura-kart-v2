/* ==========================================================
   SAKURA KART — 演出（ローディング・花びら・帯・当日の流れ・口コミの壁）
   動きを減らす設定（prefers-reduced-motion）の人には最小限にする
   ========================================================== */
(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- ローディング：信号 → よーい、ドン！（1セッション1回） ---------- */
  function initLoader() {
    const el = $("#loader");
    if (!el) return;
    let seen = false;
    try { seen = sessionStorage.getItem("sakura-kart:loaded") === "1"; } catch (e) {}
    if (seen || reduced) { el.classList.add("is-gone"); return; }
    const finish = () => {
      if (el.classList.contains("is-done")) return;
      el.classList.add("is-done");
      try { sessionStorage.setItem("sakura-kart:loaded", "1"); } catch (e) {}
      setTimeout(() => el.classList.add("is-gone"), 900);
    };
    setTimeout(finish, 1900);
    el.addEventListener("click", finish);
  }

  /* ---------- ヘッダー：スクロールしたら背景を付ける ---------- */
  function initHeader() {
    const hdr = $("#hdr");
    const floaty = $(".floaty");
    const book = $(".floaty__book");
    const booking = $("#booking");
    const onScroll = () => {
      hdr.classList.toggle("is-stuck", scrollY > 40);
      if (floaty) floaty.classList.toggle("is-hidden", scrollY < 300);
      if (book && booking) {
        const r = booking.getBoundingClientRect();
        book.classList.toggle("is-off", r.top < innerHeight * .7 && r.bottom > innerHeight * .3);
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 桜の花びら ---------- */
  function initPetals() {
    if (reduced) return;
    $$(".petals").forEach(box => {
      const n = innerWidth < 640 ? 10 : 18;
      for (let i = 0; i < n; i++) {
        const p = document.createElement("span");
        p.className = "petal";
        p.style.left = Math.random() * 100 + "%";
        p.style.setProperty("--s", 12 + Math.random() * 16 + "px");
        p.style.setProperty("--d", 7 + Math.random() * 8 + "s");
        p.style.setProperty("--delay", -Math.random() * 15 + "s");
        p.style.setProperty("--dx", (Math.random() * 200 - 140) + "px");
        p.innerHTML = '<svg><use href="#i-petal"/></svg>';
        box.appendChild(p);
      }
    });
  }

  /* ---------- 流れる帯：中身を複製して途切れないループにする ---------- */
  function initMarquees() {
    $$(".marquee__track").forEach(track => {
      track.innerHTML += track.innerHTML;
    });
  }

  /* ---------- 当日の流れ：スクロール位置で場面と背景色を切り替える ---------- */
  function initRide() {
    const sec = $("#ride");
    if (!sec) return;
    const scenes = $$(".scene", sec);
    const cards = $$(".ride__card", sec);
    const pills = $$(".ride__pills span", sec);
    let current = -1;
    const themes = scenes.map(s => "theme-" + s.dataset.theme);

    const set = i => {
      if (i === current) return;
      current = i;
      scenes.forEach((s, j) => s.classList.toggle("is-active", j === i));
      cards.forEach((c, j) => { c.classList.toggle("is-active", j === i); c.classList.toggle("is-past", j < i); });
      pills.forEach((p, j) => p.classList.toggle("is-active", j === i));
      sec.classList.remove(...themes);
      sec.classList.add(themes[i]);
    };

    const onScroll = () => {
      const r = sec.getBoundingClientRect();
      const total = sec.offsetHeight - innerHeight;
      const progress = Math.min(Math.max(-r.top / total, 0), .999);
      set(Math.floor(progress * scenes.length));
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    onScroll();
  }

  /* ---------- 口コミの壁：ドラッグで動かせる ---------- */
  function initWall() {
    const board = $("#wall");
    if (!board) return;
    let z = 10;
    $$(".polaroid", board).forEach(card => {
      card.addEventListener("pointerdown", e => {
        if (innerWidth <= 760) return;
        e.preventDefault();
        card.setPointerCapture(e.pointerId);
        card.classList.add("is-drag");
        card.style.zIndex = ++z;
        const b = board.getBoundingClientRect();
        const startX = e.clientX, startY = e.clientY;
        const left = card.offsetLeft, top = card.offsetTop;
        const move = ev => {
          const x = Math.min(Math.max(left + ev.clientX - startX, -40), b.width - card.offsetWidth + 40);
          const y = Math.min(Math.max(top + ev.clientY - startY, -20), b.height - card.offsetHeight + 20);
          card.style.left = x + "px";
          card.style.top = y + "px";
        };
        const up = () => {
          card.classList.remove("is-drag");
          card.style.setProperty("--r", (Math.random() * 14 - 7).toFixed(1) + "deg");
          card.removeEventListener("pointermove", move);
          card.removeEventListener("pointerup", up);
          card.removeEventListener("pointercancel", up);
        };
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerup", up);
        card.addEventListener("pointercancel", up);
      });
    });
  }

  /* ---------- ヒーローのカートをクリック → 吹き出し ---------- */
  function initHonk() {
    const kart = $("#hero-kart");
    if (!kart) return;
    const words = ["プップー!", "ブォン!!", "GO!", "キラッ☆", "Vroom!"];
    let i = 0;
    kart.addEventListener("click", e => {
      const stage = kart.parentElement;
      const r = stage.getBoundingClientRect();
      const b = document.createElement("span");
      b.className = "honk";
      b.textContent = words[i++ % words.length];
      b.style.left = e.clientX - r.left - 30 + "px";
      b.style.top = e.clientY - r.top - 60 + "px";
      stage.appendChild(b);
      setTimeout(() => b.remove(), 950);
    });
  }

  /* ---------- スクロールで“ポンッ”と出す ---------- */
  function initReveal() {
    if (reduced || !("IntersectionObserver" in window)) return;
    const targets = $$(".reason, .option, .kart, .lic, .plan, .qa, .route li, .bands, .booking__side > *, .booking-widget, .about__photo, .access__info, .access__map, .news");
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    targets.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(el);
    });
    // 料金カードは JS で描画されるので後から監視
    const watchCourses = () => $$(".course").forEach((el, i) => {
      el.classList.add("reveal"); el.style.transitionDelay = i * 90 + "ms"; io.observe(el);
    });
    watchCourses();
    document.addEventListener("langchange", () => setTimeout(() => $$(".course").forEach(el => el.classList.add("reveal", "is-in")), 0));
  }

  initLoader(); // DOM の最後で読まれるので即実行してちらつきを防ぐ
  document.addEventListener("DOMContentLoaded", () => {
    initHeader(); initPetals(); initMarquees(); initRide(); initWall(); initHonk(); initReveal();
  });
})();
