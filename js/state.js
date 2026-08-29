const STORAGE_KEY = "infoCardState_v1";

const THEMES = [
  { id: "sunset", name: "珊瑚橘", bgA: "#FF9A8B", bgB: "#FF6A88", accent: "#FF6A88", fg: "#ffffff", fgSub: "rgba(255,255,255,.85)" },
  { id: "grape", name: "薰衣草紫", bgA: "#a18cd1", bgB: "#6a5acd", accent: "#8e7cc3", fg: "#ffffff", fgSub: "rgba(255,255,255,.85)" },
  { id: "mint", name: "薄荷绿", bgA: "#8fedc7", bgB: "#2ec4b6", accent: "#189d90", fg: "#0d3b2e", fgSub: "rgba(13,59,46,.75)" },
  { id: "ocean", name: "海洋蓝", bgA: "#4facfe", bgB: "#3a86ff", accent: "#3a86ff", fg: "#ffffff", fgSub: "rgba(255,255,255,.85)" },
  { id: "amber", name: "暖橙黄", bgA: "#ffd36e", bgB: "#fb8500", accent: "#c25c00", fg: "#3a2100", fgSub: "rgba(58,33,0,.8)" },
  { id: "ink", name: "墨黑灰", bgA: "#3a3a3a", bgB: "#111111", accent: "#cccccc", fg: "#ffffff", fgSub: "rgba(255,255,255,.7)" },
  { id: "cherry", name: "樱花粉", bgA: "#ffd9e8", bgB: "#ffb6c9", accent: "#ff6f9c", fg: "#3a1220", fgSub: "rgba(58,18,32,.75)" },
  { id: "lemon", name: "柠檬黄", bgA: "#fff6b7", bgB: "#f6d365", accent: "#c98a00", fg: "#3a2b00", fgSub: "rgba(58,43,0,.75)" },
  { id: "forest", name: "森林绿", bgA: "#134e5e", bgB: "#71b280", accent: "#2e7d32", fg: "#ffffff", fgSub: "rgba(255,255,255,.85)" },
  { id: "berry", name: "葡萄浆果", bgA: "#6a11cb", bgB: "#2575fc", accent: "#8e2de2", fg: "#ffffff", fgSub: "rgba(255,255,255,.85)" },
  { id: "sand", name: "奶油沙", bgA: "#f5f0e6", bgB: "#e8dcc8", accent: "#a67c52", fg: "#3a2e1f", fgSub: "rgba(58,46,31,.75)" },
  { id: "slate", name: "石墨蓝灰", bgA: "#5b6b79", bgB: "#2c3e50", accent: "#90a4ae", fg: "#ffffff", fgSub: "rgba(255,255,255,.8)" },
];

const DEFAULT_STATE = {
  apiKey: "",
  model: "deepseek/deepseek-v4-flash-0731",
  customModel: "",
  useCustomModel: false,
  template: "bold",
  themeId: "sunset",
  aspectW: 1,
  aspectH: 1,
  count: 9,
  weiboText: "",
  cards: [],
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) {
    console.warn("读取本地存储失败，使用默认设置", e);
    return { ...DEFAULT_STATE };
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("保存本地存储失败", e);
  }
}

function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

const state = loadState();
