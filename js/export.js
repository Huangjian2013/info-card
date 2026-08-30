function canvasFromCard(cardNode) {
  return html2canvas(cardNode, {
    scale: 3,
    backgroundColor: null,
    useCORS: true,
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function blobFromDataUrl(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

async function downloadCard(cardNode, index) {
  if (state.template === "aidraw") {
    const point = state.cards[index];
    if (!point?.imageB64) {
      showError("请先点击卡片上的「生成图片」按钮");
      return;
    }
    setBusy(true, "正在准备下载…");
    try {
      const blob = await blobFromDataUrl(point.imageB64);
      triggerDownload(blob, `info-card-${String(index + 1).padStart(2, "0")}.png`);
    } catch (e) {
      showError("下载失败：" + e.message);
    } finally {
      setBusy(false);
    }
    return;
  }

  setBusy(true, "正在截图…");
  try {
    const canvas = await canvasFromCard(cardNode);
    const blob = await canvasToBlob(canvas);
    triggerDownload(blob, `info-card-${String(index + 1).padStart(2, "0")}.png`);
  } catch (e) {
    showError("截图失败：" + e.message);
  } finally {
    setBusy(false);
  }
}

async function copyCardToClipboard(cardNode, btnEl, index) {
  if (!navigator.clipboard || !window.ClipboardItem) {
    showError("当前浏览器不支持复制图片到剪贴板，请改用下载按钮");
    return;
  }

  const point = state.cards[index];
  if (state.template === "aidraw" && !point?.imageB64) {
    showError("请先点击卡片上的「生成图片」按钮");
    return;
  }

  setBusy(true, "正在生成图片…");
  const originalLabel = btnEl.textContent;
  try {
    const blobPromise = state.template === "aidraw"
      ? blobFromDataUrl(point.imageB64)
      : canvasFromCard(cardNode).then((canvas) => canvasToBlob(canvas));
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blobPromise })]);
    btnEl.textContent = "已复制 ✓";
    setTimeout(() => {
      btnEl.textContent = originalLabel;
    }, 1500);
  } catch (e) {
    showError("复制失败：" + e.message + "（可以改用下载按钮）");
  } finally {
    setBusy(false);
  }
}

async function downloadAllCards() {
  const cardNodes = Array.from(document.querySelectorAll("#cardsGrid .card"));
  if (cardNodes.length === 0) return;

  if (state.template === "aidraw" && state.cards.some((c) => !c.imageB64)) {
    showError("还有卡片没有生成图片，请先给每张卡片点「生成图片」，再下载全部");
    return;
  }

  setBusy(true, "正在生成全部图片…");
  try {
    const zip = new JSZip();
    for (let i = 0; i < cardNodes.length; i++) {
      let blob;
      if (state.template === "aidraw") {
        blob = await blobFromDataUrl(state.cards[i].imageB64);
      } else {
        const canvas = await canvasFromCard(cardNodes[i]);
        blob = await canvasToBlob(canvas);
      }
      zip.file(`info-card-${String(i + 1).padStart(2, "0")}.png`, blob);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    triggerDownload(zipBlob, "info-cards.zip");
  } catch (e) {
    showError("打包下载失败：" + e.message);
  } finally {
    setBusy(false);
  }
}
