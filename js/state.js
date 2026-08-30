const STORAGE_KEY = "infoCardState_v1";

const THEMES = [
  { id: "sunset", name: "珊瑚橘", bgA: "#FF9A8B", bgB: "#FF6A88", accent: "#FF6A88", fg: "#ffffff", fgSub: "rgba(255,255,255,.85)", group: "light" },
  { id: "mint", name: "薄荷绿", bgA: "#8fedc7", bgB: "#2ec4b6", accent: "#189d90", fg: "#0d3b2e", fgSub: "rgba(13,59,46,.75)", group: "light" },
  { id: "amber", name: "暖橙黄", bgA: "#ffd36e", bgB: "#fb8500", accent: "#c25c00", fg: "#3a2100", fgSub: "rgba(58,33,0,.8)", group: "light" },
  { id: "cherry", name: "樱花粉", bgA: "#ffd9e8", bgB: "#ffb6c9", accent: "#ff6f9c", fg: "#3a1220", fgSub: "rgba(58,18,32,.75)", group: "light" },
  { id: "lemon", name: "柠檬黄", bgA: "#fff6b7", bgB: "#f6d365", accent: "#c98a00", fg: "#3a2b00", fgSub: "rgba(58,43,0,.75)", group: "light" },
  { id: "sand", name: "奶油沙", bgA: "#f5f0e6", bgB: "#e8dcc8", accent: "#a67c52", fg: "#3a2e1f", fgSub: "rgba(58,46,31,.75)", group: "light" },
  { id: "lavender", name: "薰衣草浅紫", bgA: "#e0c3fc", bgB: "#8ec5fc", accent: "#8e7cc3", fg: "#2e2350", fgSub: "rgba(46,35,80,.75)", group: "light" },
  { id: "rosegold", name: "浅粉玫", bgA: "#fbc2eb", bgB: "#a6c1ee", accent: "#6a5acd", fg: "#3a1c4a", fgSub: "rgba(58,28,74,.75)", group: "light" },
  { id: "sky", name: "天空蓝", bgA: "#a1c4fd", bgB: "#c2e9fb", accent: "#4facfe", fg: "#1a2b4a", fgSub: "rgba(26,43,74,.75)", group: "light" },
  { id: "peach", name: "蜜桃橙", bgA: "#ffecd2", bgB: "#fcb69f", accent: "#fb8500", fg: "#5a2e00", fgSub: "rgba(90,46,0,.75)", group: "light" },
  { id: "grape", name: "薰衣草紫", bgA: "#a18cd1", bgB: "#6a5acd", accent: "#8e7cc3", fg: "#ffffff", fgSub: "rgba(255,255,255,.85)", group: "dark" },
  { id: "ocean", name: "海洋蓝", bgA: "#4facfe", bgB: "#3a86ff", accent: "#3a86ff", fg: "#ffffff", fgSub: "rgba(255,255,255,.85)", group: "dark" },
  { id: "ink", name: "墨黑灰", bgA: "#3a3a3a", bgB: "#111111", accent: "#cccccc", fg: "#ffffff", fgSub: "rgba(255,255,255,.7)", group: "dark" },
  { id: "forest", name: "森林绿", bgA: "#134e5e", bgB: "#71b280", accent: "#2e7d32", fg: "#ffffff", fgSub: "rgba(255,255,255,.85)", group: "dark" },
  { id: "berry", name: "葡萄浆果", bgA: "#6a11cb", bgB: "#2575fc", accent: "#8e2de2", fg: "#ffffff", fgSub: "rgba(255,255,255,.85)", group: "dark" },
  { id: "slate", name: "石墨蓝灰", bgA: "#5b6b79", bgB: "#2c3e50", accent: "#90a4ae", fg: "#ffffff", fgSub: "rgba(255,255,255,.8)", group: "dark" },
  { id: "navy", name: "深海军蓝", bgA: "#0f2027", bgB: "#203a43", accent: "#2c5364", fg: "#ffffff", fgSub: "rgba(255,255,255,.85)", group: "dark" },
  { id: "wine", name: "暗红酒", bgA: "#4a0e0e", bgB: "#8b0000", accent: "#c0392b", fg: "#ffffff", fgSub: "rgba(255,255,255,.85)", group: "dark" },
  { id: "emerald", name: "深绿墨", bgA: "#0f3d3e", bgB: "#093028", accent: "#237a57", fg: "#ffffff", fgSub: "rgba(255,255,255,.85)", group: "dark" },
  { id: "obsidian", name: "曜石黑紫", bgA: "#1a1a2e", bgB: "#16213e", accent: "#0f3460", fg: "#ffffff", fgSub: "rgba(255,255,255,.85)", group: "dark" },
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
  imageModel: "bytedance-seed/seedream-5-0-pro",
  customImageModel: "",
  useCustomImageModel: false,
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
