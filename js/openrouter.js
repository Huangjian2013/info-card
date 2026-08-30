const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_IMAGE_URL = "https://openrouter.ai/api/v1/images";

function usesStructuredExtraction(template) {
  return template === "aidraw";
}

function buildSystemPrompt(count, template) {
  if (usesStructuredExtraction(template)) {
    return buildInfographicSystemPrompt(count);
  }
  return `你是社交媒体文案编辑，负责把用户的微博文案拆解成用于配图的信息点。
要求：
1. 严格只输出 JSON，格式为 {"points": [{"keyword": "...", "detail": "..."}]}，points 数组长度必须正好是 ${count}。
2. keyword 是该信息点的核心关键词或短语，精炼有力，中文约 2-10 字。
3. detail 是对该关键点的一句话补充说明，不超过 40 字，内容必须来自原文，不得编造原文没有的信息。
4. 按原文的逻辑顺序拆分，覆盖原文核心内容，不遗漏重点，不重复。
5. 不要输出 JSON 以外的任何文字，不要用 markdown 代码块包裹。`;
}

function buildInfographicSystemPrompt(count) {
  return `你是信息图/框架图设计师，要把用户的文案拆解成 ${count} 张卡片，每张卡片用"框架图"的方式呈现一个关键信息点。
每张卡片可以是"对比结构"（比如旧范式 vs 新范式、之前 vs 之后），也可以是"要点归纳结构"（几条要点配图标），根据这部分内容本身更适合哪种结构来定，不必强求都做成对比。

严格只输出 JSON，格式如下，points 数组长度必须正好是 ${count}：
{"points":[{
  "title": "这张卡片的大标题，8-16字，精炼有力",
  "leftLabel": "仅对比结构需要，如「旧范式（Before）」，非对比结构留空字符串",
  "rightLabel": "仅对比结构需要，如「新范式（After）」，非对比结构留空字符串",
  "rows": [
    {
      "icon": "从图标库里选一个 key：${ICON_KEYS.join("、")}",
      "heading": "该行左侧（或唯一）小标题，4-10字",
      "text": "该行左侧（或唯一）说明文字，不超过30字，内容必须来自原文",
      "note": "该行的一句结论/意义总结，不超过24字，可为空字符串",
      "icon2": "仅对比结构需要，图标库同上，非对比结构留空字符串",
      "heading2": "仅对比结构需要，该行右侧小标题，非对比结构留空字符串",
      "text2": "仅对比结构需要，该行右侧说明文字，非对比结构留空字符串"
    }
  ],
  "footer": "整张卡片的一句总结/口号，可为空字符串"
}]}

其他要求：
1. 每张卡片 rows 数组长度建议 2-4 行，太多会挤不下。
2. 所有文字内容必须来自原文本意，不得编造原文没有的信息。
3. icon/icon2 必须是给定图标库里的英文 key，一个字不差，不要自造 key。
4. 不要输出 JSON 以外的任何文字，不要用 markdown 代码块包裹。`;
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw e;
  }
}

async function callOpenRouter(modelId, apiKey, systemPrompt, userPrompt) {
  let resp;
  try {
    resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": location.href,
        "X-Title": "Weibo Info Card Generator",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
  } catch (e) {
    throw new Error("网络请求失败，请检查网络连接：" + e.message);
  }

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`OpenRouter 请求失败 (${resp.status})：${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter 返回内容为空，请重试或换个模型");
  }

  let parsed;
  try {
    parsed = extractJson(content);
  } catch (e) {
    throw new Error("模型返回的内容不是合法 JSON，请重试或换个模型");
  }
  return parsed;
}

async function splitTextIntoPoints(weiboText, count, modelId, apiKey, template) {
  const systemPrompt = buildSystemPrompt(count, template);
  const userPrompt = `文案：\n${weiboText}\n\n请拆成正好 ${count} 个信息点。`;

  let parsed = await callOpenRouter(modelId, apiKey, systemPrompt, userPrompt);
  let points = Array.isArray(parsed?.points) ? parsed.points : [];

  if (points.length !== count) {
    const retryPrompt = `${userPrompt}\n\n（上一次你返回了 ${points.length} 个信息点，数量不对，请务必返回正好 ${count} 个，一个不多一个不少）`;
    parsed = await callOpenRouter(modelId, apiKey, systemPrompt, retryPrompt);
    points = Array.isArray(parsed?.points) ? parsed.points : [];
  }

  if (points.length !== count) {
    throw new Error(`模型返回了 ${points.length} 个信息点，与要求的 ${count} 个不一致，请重试或更换模型`);
  }

  if (usesStructuredExtraction(template)) {
    return points.map(normalizeInfographicPoint);
  }

  return points.map((p) => ({
    keyword: String(p.keyword ?? "").trim(),
    detail: String(p.detail ?? "").trim(),
  }));
}

function normalizeInfographicPoint(p) {
  const rows = Array.isArray(p.rows) ? p.rows : [];
  return {
    title: String(p.title ?? "").trim(),
    leftLabel: String(p.leftLabel ?? "").trim(),
    rightLabel: String(p.rightLabel ?? "").trim(),
    footer: String(p.footer ?? "").trim(),
    rows: rows.map((r) => ({
      icon: ICON_KEYS.includes(r.icon) ? r.icon : "star",
      heading: String(r.heading ?? "").trim(),
      text: String(r.text ?? "").trim(),
      note: String(r.note ?? "").trim(),
      icon2: ICON_KEYS.includes(r.icon2) ? r.icon2 : "",
      heading2: String(r.heading2 ?? "").trim(),
      text2: String(r.text2 ?? "").trim(),
    })),
  };
}

function buildImagePrompt(point, theme) {
  const lines = [];
  if (point.leftLabel || point.rightLabel) {
    lines.push(`这是对比结构：左侧标签"${point.leftLabel}"，右侧标签"${point.rightLabel}"`);
  }
  (point.rows || []).forEach((r, idx) => {
    let seg = `${idx + 1}. ${r.heading}：${r.text}`;
    if (r.heading2 || r.text2) seg += ` ｜ 对应右侧「${r.heading2}：${r.text2}」`;
    if (r.note) seg += `（要点结论：${r.note}）`;
    lines.push(seg);
  });
  if (point.footer) lines.push(`结尾一句话总结：「${point.footer}」`);

  return `请生成一张竖版手机社交媒体信息卡图片，信息图/框架图风格，要求：
1. 整体是简洁扁平的现代信息图设计，配色以从 ${theme.bgA} 到 ${theme.bgB} 的渐变、以及 ${theme.accent} 强调色为主，背景干净不杂乱。
2. 图片中必须包含清晰、准确、不变形、不乱码的中文文字，把下面内容原样呈现为图内文字（不要翻译成英文，不要编造其他信息）：
标题：「${point.title}」
${lines.join("\n")}
3. 用图标、分栏、编号、箭头等视觉元素做分区，让信息一目了然，不要写成一大段纯文字段落。
4. 不要加水印，不要加与内容无关的装饰文字。`;
}

async function generateCardImage(prompt, imageModel, apiKey, aspectW, aspectH) {
  let resp;
  try {
    resp = await fetch(OPENROUTER_IMAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": location.href,
        "X-Title": "Weibo Info Card Generator",
      },
      body: JSON.stringify({
        model: imageModel,
        prompt,
        aspect_ratio: `${aspectW || 1}:${aspectH || 1}`,
      }),
    });
  } catch (e) {
    throw new Error("图片生成请求失败，请检查网络连接：" + e.message);
  }

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`图片生成失败 (${resp.status})：${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  const item = data?.data?.[0];
  if (!item?.b64_json) {
    throw new Error("图片生成返回内容异常，请重试或换个模型");
  }
  return `data:${item.media_type || "image/png"};base64,${item.b64_json}`;
}
