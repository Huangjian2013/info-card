function showError(message) {
  const banner = document.getElementById("errorBanner");
  banner.textContent = message;
  banner.hidden = false;
}

function clearError() {
  const banner = document.getElementById("errorBanner");
  banner.hidden = true;
  banner.textContent = "";
}

function setBusy(isBusy, label) {
  const busyEl = document.getElementById("busyBanner");
  if (isBusy) {
    busyEl.textContent = label || "处理中…";
    busyEl.hidden = false;
  } else {
    busyEl.hidden = true;
  }
  document.querySelectorAll("button, select, input, textarea").forEach((el) => {
    el.disabled = isBusy;
  });
}

function getEffectiveModel() {
  return state.useCustomModel && state.customModel.trim() ? state.customModel.trim() : state.model;
}

function readInputsIntoState() {
  state.weiboText = document.getElementById("weiboText").value;
  state.count = Math.max(1, Math.min(20, Number(document.getElementById("cardCount").value) || 1));
  persist();
}

function validateBeforeCall() {
  if (!state.apiKey.trim()) {
    showError("请先在设置里填入 OpenRouter API Key");
    return false;
  }
  if (!state.weiboText.trim()) {
    showError("请先粘贴微博文案");
    return false;
  }
  return true;
}

async function doSplit() {
  clearError();
  readInputsIntoState();
  if (!validateBeforeCall()) return;

  if (state.cards.length) {
    const ok = confirm("重新拆分会覆盖当前已编辑的卡片文字，确定继续吗？");
    if (!ok) return;
  }

  setBusy(true, "AI 正在拆解文案…");
  try {
    const points = await splitTextIntoPoints(state.weiboText, state.count, getEffectiveModel(), state.apiKey);
    state.cards = points;
    persist();
    renderCards();
  } catch (e) {
    showError(e.message);
  } finally {
    setBusy(false);
  }
}

async function doPipeline() {
  clearError();
  readInputsIntoState();
  if (!validateBeforeCall()) return;

  if (state.cards.length) {
    const ok = confirm("一键生成会覆盖当前已编辑的卡片文字，确定继续吗？");
    if (!ok) return;
  }

  setBusy(true, "AI 正在拆解文案…");
  try {
    const points = await splitTextIntoPoints(state.weiboText, state.count, getEffectiveModel(), state.apiKey);
    state.cards = points;
    persist();
    renderCards();
    await downloadAllCards();
  } catch (e) {
    showError(e.message);
  } finally {
    setBusy(false);
  }
}

function initSettingsUI() {
  const apiKeyInput = document.getElementById("apiKeyInput");
  apiKeyInput.value = state.apiKey;
  apiKeyInput.addEventListener("input", () => {
    state.apiKey = apiKeyInput.value;
    persist();
  });

  document.getElementById("toggleKeyVisibility").addEventListener("click", () => {
    apiKeyInput.type = apiKeyInput.type === "password" ? "text" : "password";
  });

  const modelSelect = document.getElementById("modelSelect");
  const customModelInput = document.getElementById("customModelInput");
  const presetIds = Array.from(modelSelect.options).map((o) => o.value).filter((v) => v !== "custom");

  if (state.useCustomModel || !presetIds.includes(state.model)) {
    modelSelect.value = "custom";
    customModelInput.hidden = false;
    customModelInput.value = state.customModel;
  } else {
    modelSelect.value = state.model;
  }

  modelSelect.addEventListener("change", () => {
    if (modelSelect.value === "custom") {
      state.useCustomModel = true;
      customModelInput.hidden = false;
      customModelInput.focus();
    } else {
      state.useCustomModel = false;
      state.model = modelSelect.value;
      customModelInput.hidden = true;
    }
    persist();
  });

  customModelInput.addEventListener("input", () => {
    state.customModel = customModelInput.value;
    persist();
  });

  const templateSelect = document.getElementById("templateSelect");
  templateSelect.value = state.template;
  templateSelect.addEventListener("change", () => {
    state.template = templateSelect.value;
    persist();
    renderCards();
  });

  renderThemeSwatches();

  const ratioW = document.getElementById("ratioW");
  const ratioH = document.getElementById("ratioH");
  ratioW.value = state.aspectW;
  ratioH.value = state.aspectH;

  function onRatioChange() {
    state.aspectW = Number(ratioW.value) || 1;
    state.aspectH = Number(ratioH.value) || 1;
    persist();
    renderCards();
  }
  ratioW.addEventListener("input", onRatioChange);
  ratioH.addEventListener("input", onRatioChange);

  document.querySelectorAll(".ratio-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      ratioW.value = btn.dataset.w;
      ratioH.value = btn.dataset.h;
      onRatioChange();
    });
  });
}

function initInputUI() {
  document.getElementById("weiboText").value = state.weiboText;
  document.getElementById("cardCount").value = state.count;

  document.getElementById("btnSplit").addEventListener("click", doSplit);
  document.getElementById("btnPipeline").addEventListener("click", doPipeline);
  document.getElementById("btnDownloadAll").addEventListener("click", downloadAllCards);
}

function openSettings() {
  document.getElementById("settingsOverlay").hidden = false;
}

function closeSettings() {
  document.getElementById("settingsOverlay").hidden = true;
}

function initSettingsModalUI() {
  document.getElementById("btnOpenSettings").addEventListener("click", openSettings);
  document.getElementById("btnCloseSettings").addEventListener("click", closeSettings);
  document.getElementById("settingsOverlay").addEventListener("click", (e) => {
    if (e.target.id === "settingsOverlay") closeSettings();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !document.getElementById("settingsOverlay").hidden) {
      closeSettings();
    }
  });
}

function init() {
  initSettingsUI();
  initSettingsModalUI();
  initInputUI();
  renderCards();
}

init();
