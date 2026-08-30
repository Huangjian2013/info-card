function renderCards() {
  const grid = document.getElementById("cardsGrid");
  const section = document.getElementById("cardsSection");
  grid.innerHTML = "";

  if (!state.cards.length) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  const theme = getTheme(state.themeId);
  const total = state.cards.length;

  state.cards.forEach((point, i) => {
    const wrap = document.createElement("div");
    wrap.className = "card-wrap";

    const card = document.createElement("div");
    card.className = `card tpl-${state.template}`;
    card.style.setProperty("--bg-a", theme.bgA);
    card.style.setProperty("--bg-b", theme.bgB);
    card.style.setProperty("--accent", theme.accent);
    card.style.setProperty("--fg", theme.fg);
    card.style.setProperty("--fg-sub", theme.fgSub);
    card.style.setProperty("--ar-w", state.aspectW || 1);
    card.style.setProperty("--ar-h", state.aspectH || 1);

    if (state.template === "aidraw") {
      buildAiDrawCard(card, point, i, total);
    } else {
      buildSimpleCard(card, point, i, total);
    }

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const btnDown = document.createElement("button");
    btnDown.type = "button";
    btnDown.className = "btn btn-ghost btn-small";
    btnDown.textContent = "下载这张";
    btnDown.addEventListener("click", () => downloadCard(card, i));

    const btnCopy = document.createElement("button");
    btnCopy.type = "button";
    btnCopy.className = "btn btn-ghost btn-small";
    btnCopy.textContent = "复制";
    btnCopy.addEventListener("click", () => copyCardToClipboard(card, btnCopy, i));

    actions.append(btnDown, btnCopy);

    wrap.append(card, actions);
    grid.append(wrap);
  });
}

function editableEl(className, text, onInput) {
  const el = document.createElement("div");
  el.className = className;
  el.contentEditable = "true";
  el.textContent = text;
  el.addEventListener("input", () => onInput(el.textContent));
  return el;
}

function buildSimpleCard(card, point, i, total) {
  const idx = document.createElement("div");
  idx.className = "card-index";
  idx.textContent = `${String(i + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}`;

  const keywordText = point.keyword ?? point.title ?? "";
  const detailText = point.detail ?? point.footer ?? flattenInfographicToText(point);

  const kw = editableEl("card-keyword", keywordText, (val) => {
    state.cards[i].keyword = val;
    persist();
  });

  const detail = editableEl("card-detail", detailText, (val) => {
    state.cards[i].detail = val;
    persist();
  });

  card.append(idx, kw, detail);
}

function flattenInfographicToText(point) {
  if (!Array.isArray(point.rows) || !point.rows.length) return "";
  return point.rows.map((r) => r.text || r.heading).filter(Boolean).join(" ");
}

function ensureInfographicShape(point, i) {
  if (Array.isArray(point.rows)) return point;
  const synthesized = {
    title: point.keyword || "",
    leftLabel: "",
    rightLabel: "",
    footer: "",
    rows: [
      { icon: "star", heading: point.keyword || "", text: point.detail || "", note: "", icon2: "", heading2: "", text2: "" },
    ],
  };
  state.cards[i] = synthesized;
  persist();
  return synthesized;
}

function buildAiDrawCard(card, rawPoint, i, total) {
  const idx = document.createElement("div");
  idx.className = "card-index";
  idx.textContent = `${String(i + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}`;
  card.append(idx);

  const data = ensureInfographicShape(rawPoint, i);

  const prompt = document.createElement("div");
  prompt.className = "aidraw-prompt";

  const title = editableEl("aidraw-title", data.title, (val) => {
    state.cards[i].title = val;
    persist();
  });
  prompt.append(title);

  data.rows.forEach((row, ri) => {
    const rowEl = document.createElement("div");
    rowEl.className = "aidraw-row";

    const heading = editableEl("aidraw-row-heading", row.heading, (val) => {
      state.cards[i].rows[ri].heading = val;
      persist();
    });
    const text = editableEl("aidraw-row-text", row.text, (val) => {
      state.cards[i].rows[ri].text = val;
      persist();
    });
    rowEl.append(heading, text);
    prompt.append(rowEl);
  });

  card.append(prompt);

  const imageArea = document.createElement("div");
  imageArea.className = "aidraw-image-area" + (data.imageB64 ? " has-image" : "");
  if (data.imageB64) {
    const img = document.createElement("img");
    img.className = "aidraw-img";
    img.src = data.imageB64;
    imageArea.append(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "aidraw-placeholder";
    placeholder.textContent = "还没有生成图片，点击下方按钮用 AI 绘图模型生成";
    imageArea.append(placeholder);
  }
  card.append(imageArea);

  const actions = document.createElement("div");
  actions.className = "aidraw-actions";
  const btnGen = document.createElement("button");
  btnGen.type = "button";
  btnGen.className = "btn btn-primary btn-small";
  btnGen.textContent = data.imageB64 ? "🔁 重新生成" : "🎨 生成图片";
  btnGen.addEventListener("click", async () => {
    btnGen.disabled = true;
    const original = btnGen.textContent;
    btnGen.textContent = "生成中…";
    clearError();
    try {
      await generateImageForCard(i);
      renderCards();
    } catch (e) {
      showError(e.message);
      btnGen.disabled = false;
      btnGen.textContent = original;
    }
  });
  actions.append(btnGen);
  card.append(actions);
}

function renderThemeSwatches() {
  const container = document.getElementById("themeSwatches");
  container.innerHTML = "";

  ["light", "dark"].forEach((group) => {
    const row = document.createElement("div");
    row.className = "swatch-row";
    THEMES.filter((t) => t.group === group).forEach((theme) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swatch" + (theme.id === state.themeId ? " active" : "");
      btn.title = theme.name;
      btn.style.background = `linear-gradient(135deg, ${theme.bgA}, ${theme.bgB})`;
      btn.addEventListener("click", () => {
        state.themeId = theme.id;
        persist();
        renderThemeSwatches();
        renderCards();
      });
      row.append(btn);
    });
    container.append(row);
  });
}
