const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function buildSystemPrompt(count) {
  return `你是社交媒体文案编辑，负责把用户的微博文案拆解成用于配图的信息点。
要求：
1. 严格只输出 JSON，格式为 {"points": [{"keyword": "...", "detail": "..."}]}，points 数组长度必须正好是 ${count}。
2. keyword 是该信息点的核心关键词或短语，精炼有力，中文约 2-10 字。
3. detail 是对该关键点的一句话补充说明，不超过 40 字，内容必须来自原文，不得编造原文没有的信息。
4. 按原文的逻辑顺序拆分，覆盖原文核心内容，不遗漏重点，不重复。
5. 不要输出 JSON 以外的任何文字，不要用 markdown 代码块包裹。`;
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

async function splitTextIntoPoints(weiboText, count, modelId, apiKey) {
  const systemPrompt = buildSystemPrompt(count);
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

  return points.map((p) => ({
    keyword: String(p.keyword ?? "").trim(),
    detail: String(p.detail ?? "").trim(),
  }));
}
