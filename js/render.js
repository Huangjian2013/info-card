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

    const idx = document.createElement("div");
    idx.className = "card-index";
    idx.textContent = `${String(i + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}`;

    const kw = document.createElement("div");
    kw.className = "card-keyword";
    kw.contentEditable = "true";
    kw.textContent = point.keyword;
    kw.addEventListener("input", () => {
      state.cards[i].keyword = kw.textContent;
      persist();
    });

    const detail = document.createElement("div");
    detail.className = "card-detail";
    detail.contentEditable = "true";
    detail.textContent = point.detail;
    detail.addEventListener("input", () => {
      state.cards[i].detail = detail.textContent;
      persist();
    });

    card.append(idx, kw, detail);

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
    btnCopy.addEventListener("click", () => copyCardToClipboard(card, btnCopy));

    actions.append(btnDown, btnCopy);

    wrap.append(card, actions);
    grid.append(wrap);
  });
}

function renderThemeSwatches() {
  const container = document.getElementById("themeSwatches");
  container.innerHTML = "";
  THEMES.forEach((theme) => {
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
    container.append(btn);
  });
}
