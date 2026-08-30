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

function getEffectiveImageModel() {
  return state.useCustomImageModel && state.customImageModel.trim() ? state.customImageModel.trim() : state.imageModel;
}

async function generateImageForCard(i) {
  const theme = getTheme(state.themeId);
  const data = ensureInfographicShape(state.cards[i], i);
  const prompt = buildImagePrompt(data, theme);
  const dataUrl = await generateCardImage(prompt, getEffectiveImageModel(), state.apiKey, state.aspectW, state.aspectH);
  state.cards[i].imageB64 = dataUrl;
  persist();
  return dataUrl;
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
    const points = await splitTextIntoPoints(state.weiboText, state.count, getEffectiveModel(), state.apiKey, state.template);
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

  const skipResplit = state.template === "aidraw" && state.cards.length > 0;

  if (state.cards.length && !skipResplit) {
    const ok = confirm("一键生成会覆盖当前已编辑的卡片文字，确定继续吗？");
    if (!ok) return;
  }

  if (state.template === "aidraw") {
    const pendingCount = skipResplit ? state.cards.filter((c) => !c.imageB64).length : state.count;
    if (skipResplit && pendingCount === 0) {
      showError("所有卡片都已经生成过图片了，可以直接点上面的「下载全部（zip）」");
      return;
    }
    const ok2 = confirm(`即将为 ${pendingCount} 张卡片调用 AI 绘图模型生成整图（已经生成过的会跳过），会产生额外费用（具体价格以 OpenRouter 该模型页面为准），确定继续吗？`);
    if (!ok2) return;
  }

  setBusy(true, "AI 正在拆解文案…");
  try {
    if (!skipResplit) {
      const points = await splitTextIntoPoints(state.weiboText, state.count, getEffectiveModel(), state.apiKey, state.template);
      state.cards = points;
      persist();
      renderCards();
    }

    if (state.template === "aidraw") {
      for (let i = 0; i < state.cards.length; i++) {
        if (state.cards[i].imageB64) continue;
        setBusy(true, `正在生成第 ${i + 1}/${state.cards.length} 张图片…`);
        await generateImageForCard(i);
      }
      renderCards();
    }

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

  const imageModelSelect = document.getElementById("imageModelSelect");
  const customImageModelInput = document.getElementById("customImageModelInput");
  const imagePresetIds = Array.from(imageModelSelect.options).map((o) => o.value).filter((v) => v !== "custom");

  if (state.useCustomImageModel || !imagePresetIds.includes(state.imageModel)) {
    imageModelSelect.value = "custom";
    customImageModelInput.hidden = false;
    customImageModelInput.value = state.customImageModel;
  } else {
    imageModelSelect.value = state.imageModel;
  }

  imageModelSelect.addEventListener("change", () => {
    if (imageModelSelect.value === "custom") {
      state.useCustomImageModel = true;
      customImageModelInput.hidden = false;
      customImageModelInput.focus();
    } else {
      state.useCustomImageModel = false;
      state.imageModel = imageModelSelect.value;
      customImageModelInput.hidden = true;
    }
    persist();
  });

  customImageModelInput.addEventListener("input", () => {
    state.customImageModel = customImageModelInput.value;
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
