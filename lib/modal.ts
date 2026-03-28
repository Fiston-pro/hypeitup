import type { BuzzwordDensity, ModalResponse, PostLength } from "./types";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function parseModalJson(raw: unknown): ModalResponse {
  if (!isRecord(raw)) throw new Error("Invalid Modal response: not an object");
  const hook = raw.hook;
  const body = raw.body;
  const hashtags = raw.hashtags;
  const cringe_score = raw.cringe_score;
  const share_title = raw.share_title;
  if (typeof hook !== "string" || typeof body !== "string" || typeof share_title !== "string") {
    throw new Error("Invalid Modal response: missing string fields");
  }
  if (!Array.isArray(hashtags) || !hashtags.every((t) => typeof t === "string")) {
    throw new Error("Invalid Modal response: hashtags must be string[]");
  }
  if (typeof cringe_score !== "number" || Number.isNaN(cringe_score)) {
    throw new Error("Invalid Modal response: cringe_score must be a number");
  }
  return { hook, body, hashtags, cringe_score, share_title };
}

export async function callModalGenerate(params: {
  achievement: string;
  drama_level: number;
  buzzword_density: BuzzwordDensity;
  post_length: PostLength;
}): Promise<ModalResponse> {
  const url = process.env.MODAL_API_URL;
  const isDev = process.env.NODE_ENV === "development";

  if (!url) {
    if (!isDev) {
      throw new Error("MODAL_API_URL is not configured");
    }
    return mockModalResponse(params);
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      achievement: params.achievement,
      drama_level: params.drama_level,
      buzzword_density: params.buzzword_density,
      post_length: params.post_length,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Modal error ${res.status}: ${text.slice(0, 500)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error("Modal response was not valid JSON");
  }

  return parseModalJson(parsed);
}

function mockModalResponse(params: {
  achievement: string;
  drama_level: number;
  buzzword_density: BuzzwordDensity;
  post_length: PostLength;
}): ModalResponse {
  const buzz =
    params.buzzword_density === "max"
      ? "synergy, thought leadership, and paradigm-shifting intentionality"
      : params.buzzword_density === "medium"
        ? "alignment, outcomes, and stakeholder clarity"
        : "focus and consistency";
  const len =
    params.post_length === "long"
      ? " After a rigorous retrospective, I can confidently say this moment reframes how I show up for my community—on and off the feed."
      : params.post_length === "medium"
        ? " Sharing this in case it helps someone else on the journey."
        : "";
  return {
    hook: `Honored to announce a milestone that will echo across industries: ${params.achievement}.`,
    body: `This wasn’t luck—it was ${buzz} at a ${params.drama_level}/10 intensity.${len}`,
    hashtags: ["HypeItUp", "GrowthMindset", "Leadership", "Grateful"],
    cringe_score: Math.min(100, 40 + params.drama_level * 5),
    share_title: "A milestone worth the timeline",
  };
}
