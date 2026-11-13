/* ==========================================================
   サイト設定 — 料金・時間枠・連絡先・決済先はここだけ編集すればOK
   ※ 金額・電話番号などはすべてサンプル値
   ========================================================== */
window.SITE_CONFIG = {
  currency: "JPY",

  // 連絡先（ヘッダー・相談ポップアップ・フッターに反映）
  contact: {
    phone: "+81-00-0000-0000",
    email: "info@example.com",
    licenseEmail: "license@example.com", // 免許の事前チェック用
    hours: "9:00–21:00",
    line: "#",        // LINE 公式アカウントのURL
    whatsapp: "#",    // https://wa.me/81xxxxxxxxxx
    messenger: "#",   // https://m.me/xxxx
    instagram: "#",
    tiktok: "#",
    youtube: "#",
    form: "#"         // お問い合わせフォーム（Googleフォーム等）
  },

  // コース（料金表と予約フォームの両方に使われる）
  // thrill: ワクワク度 1〜3（料金カードのアイコン数）
  courses: [
    {
      id: "short",
      minutes: 60,
      price: 10000,
      thrill: 1,
      color: "pink",
      name: { en: "Sakura Short", ja: "さくらショート" },
      route: { en: "Shop → Tokyo Tower → Roppongi → Shop", ja: "店舗 → 東京タワー → 六本木 → 店舗" },
      desc: {
        en: "Tokyo Tower up close. Perfect for your first ride.",
        ja: "東京タワーを間近に。はじめての方にぴったり。"
      }
    },
    {
      id: "bay",
      minutes: 90,
      price: 14000,
      thrill: 2,
      color: "cream",
      popular: true,
      name: { en: "Tokyo Bay Run", ja: "東京ベイラン" },
      route: { en: "Shop → Rainbow Bridge → Odaiba → Shop", ja: "店舗 → レインボーブリッジ → お台場 → 店舗" },
      desc: {
        en: "Cross the Rainbow Bridge. Our most popular route.",
        ja: "レインボーブリッジを渡る、一番人気のコース。"
      }
    },
    {
      id: "grand",
      minutes: 120,
      price: 18000,
      thrill: 3,
      color: "shu",
      name: { en: "Grand Tokyo", ja: "グランド東京" },
      route: { en: "Shibuya Crossing → Tokyo Tower → Bay Area", ja: "渋谷スクランブル → 東京タワー → ベイエリア" },
      desc: {
        en: "Shibuya, Tokyo Tower and the bay. The full anime-hero day.",
        ja: "渋谷・東京タワー・ベイエリア。主人公気分のフルコース。"
      }
    }
  ],

  // 出発時刻
  timeSlots: ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30"],

  // 時間帯ごとの料金差（コース料金に加算。マイナスなら割引）
  // from/to は "HH:MM"、from 以上 to 未満の出発時刻に適用
  priceBands: [
    { from: "09:00", to: "12:00", diff: -1000, name: { en: "Morning Sakura", ja: "朝さくら割" } },
    { from: "12:00", to: "17:00", diff: 0,     name: { en: "Daytime", ja: "デイタイム" } },
    { from: "17:00", to: "24:00", diff: 2000,  name: { en: "Neon Night", ja: "ネオンナイト" } }
  ],

  // 保険（1名あたり）
  insurance: {
    standard: 0,     // 料金に含まれる
    full: 2000,      // フルカバー（任意）
    deductible: 50000 // 標準プランの免責額（1台あたり）
  },

  maxDrivers: 6,          // 1グループの最大人数（ガイド1名あたり）
  bookableDaysAhead: 90,  // 何日先まで予約可能か
  closedWeekdays: [],     // 定休日 (0=日 … 6=土) 例: [2]
  freeCancelDays: 7,      // 何日前まで無料キャンセルか

  // 決済ページ（Stripe Payment Links などが決まったら差し替え）
  // コースごとに分けたい場合は paymentUrls を使う
  paymentUrl: "#payment-url-not-set",
  paymentUrls: {
    // short: "https://buy.stripe.com/xxxx",
  },

  /**
   * 予約データの送信先（現在は仮実装：ブラウザ内に保存するだけ）
   * GAS 等が決まったらここを fetch(...) に置き換える。
   * @param {object} booking
   * @returns {Promise<{ok: boolean, id?: string, message?: string}>}
   */
  submitBooking: async function (booking) {
    const id = "SK" + Date.now().toString(36).toUpperCase();
    try {
      localStorage.setItem("sakura-kart:last-booking", JSON.stringify({ id, ...booking }));
    } catch (e) { /* storage unavailable */ }
    return { ok: true, id };
  }
};
