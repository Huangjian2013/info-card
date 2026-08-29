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

async function downloadCard(cardNode, index) {
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

async function copyCardToClipboard(cardNode, btnEl) {
  if (!navigator.clipboard || !window.ClipboardItem) {
    showError("当前浏览器不支持复制图片到剪贴板，请改用下载按钮");
    return;
  }

  setBusy(true, "正在生成图片…");
  const originalLabel = btnEl.textContent;
  try {
    const blobPromise = canvasFromCard(cardNode).then((canvas) => canvasToBlob(canvas));
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

  setBusy(true, "正在生成全部图片…");
  try {
    const zip = new JSZip();
    for (let i = 0; i < cardNodes.length; i++) {
      const canvas = await canvasFromCard(cardNodes[i]);
      const blob = await canvasToBlob(canvas);
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
