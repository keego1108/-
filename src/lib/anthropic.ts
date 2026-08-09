import Anthropic from "@anthropic-ai/sdk";

// ANTHROPIC_API_KEY が未設定の間は null を返す。
// キーが設定されたら自動的に実際のClaude APIが使われるようになる。
export function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic();
}
