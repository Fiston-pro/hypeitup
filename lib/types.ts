export type BuzzwordDensity = "low" | "medium" | "max";
export type PostLength = "short" | "medium" | "long";

export type ModalResponse = {
  hook: string;
  body: string;
  hashtags: string[];
  cringe_score: number;
  share_title: string;
};

export type GenerateRequestBody = {
  achievement: string;
  drama_level: number;
  buzzword_density: BuzzwordDensity;
  post_length: PostLength;
  session_id: string;
};
