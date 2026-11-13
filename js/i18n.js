/* ==========================================================
   多言語対応（英語がデフォルト）
   書き方は2通り：
   1) 短い文言 … 英語を要素の中に書き、日本語を data-ja 属性に書く
        <h2 data-ja="コースと料金">Rides &amp; Prices</h2>
      属性の翻訳は data-ja-aria-label / data-ja-placeholder / data-ja-alt
   2) 長い文章 … <div class="en">…</div><div class="ja">…</div> と並べる
      （表示の切り替えは CSS の html[lang] で行う）
   JS で描画する部分の文言は下の UI に en / ja 両方書く
   ========================================================== */
(function () {
  const UI = {
    en: {
      months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
      monthTitle: (y, m) => `${UI.en.months[m]} ${y}`,
      dow: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
      prevMonth: "Previous month", nextMonth: "Next month",
      min: "min", perDriver: "/ driver", popular: "No.1 PICK", bookThis: "Book this ride",
      thrill: "Thrill", from: "from",
      driversOpt: n => `${n} ${n === 1 ? "driver" : "drivers"}`,
      date: d => d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" }),
      pickDate: "Pick a date first.",
      sum: { course: "Ride", date: "Date", time: "Time", drivers: "Drivers", insurance: "Insurance", name: "Name", email: "Email", phone: "Phone", country: "Country", permit: "Permit", total: "Total" },
      ins: { standard: "Standard (included)", full: "Full coverage" },
      err: { slot: "Please select a date and time.", required: "Please fill in all required fields.", email: "Please enter a valid email address.", agree: "Please check the confirmation box." },
      redirecting: "Redirecting to payment…",
      pay: "Proceed to Payment",
      paymentNotSet: "The payment page is not connected yet. (Booking saved as a test.)\nBooking ID: "
    },
    ja: {
      months: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
      monthTitle: (y, m) => `${y}年${m + 1}月`,
      dow: ["日","月","火","水","木","金","土"],
      prevMonth: "前の月", nextMonth: "次の月",
      min: "分", perDriver: "/ 1名", popular: "人気No.1", bookThis: "このコースを予約",
      thrill: "ワクワク度", from: "",
      driversOpt: n => `${n}名`,
      date: d => d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" }),
      pickDate: "先に日付を選んでください。",
      sum: { course: "コース", date: "日付", time: "時刻", drivers: "人数", insurance: "保険", name: "氏名", email: "メール", phone: "電話", country: "国", permit: "免許証", total: "合計" },
      ins: { standard: "標準（料金に含む）", full: "フルカバー" },
      err: { slot: "日付と時刻を選択してください。", required: "必須項目をすべて入力してください。", email: "正しいメールアドレスを入力してください。", agree: "確認のチェックを入れてください。" },
      redirecting: "決済ページへ移動しています…",
      pay: "お支払いへ進む",
      paymentNotSet: "決済ページはまだ接続されていません（テストとして予約を保存しました）。\n予約ID: "
    }
  };

  const STORAGE_KEY = "sakura-kart:lang";
  const SUPPORTED = ["en", "ja"];
  const ATTRS = ["aria-label", "placeholder", "alt", "content"];
  let current = "en";

  function detectInitial() {
    const q = new URLSearchParams(location.search).get("lang");
    if (SUPPORTED.includes(q)) return q;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED.includes(saved)) return saved;
    } catch (e) {}
    return "en"; // インバウンド向けなので英語をデフォルトにする
  }

  function apply(lang) {
    current = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-ja]").forEach(el => {
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML; // 英語原文を保持
      el.innerHTML = lang === "ja" ? el.dataset.ja : el.dataset.en;
    });
    ATTRS.forEach(attr => {
      const key = "ja" + attr.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase()); // aria-label → jaAriaLabel
      document.querySelectorAll(`[data-ja-${attr}]`).forEach(el => {
        const enKey = "en" + key.slice(2);
        if (el.dataset[enKey] === undefined) el.dataset[enKey] = el.getAttribute(attr) || "";
        el.setAttribute(attr, lang === "ja" ? el.dataset[key] : el.dataset[enKey]);
      });
    });
    document.querySelectorAll("[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  window.I18N = {
    get lang() { return current; },
    t: () => UI[current],
    apply
  };

  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-lang]");
    if (btn) apply(btn.dataset.lang);
  });

  document.documentElement.classList.add("js"); // JS 前提の演出（ローディング・当日の流れ）を有効にする
  current = detectInitial();
  document.documentElement.lang = current; // CSS の .en/.ja 切り替えをちらつかせない
  document.addEventListener("DOMContentLoaded", () => apply(current));
})();
