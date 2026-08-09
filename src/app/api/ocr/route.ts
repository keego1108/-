import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "@/lib/anthropic";
import { requireEntitledTenantForApi } from "@/lib/tenant";
import type { OcrExtractedItem } from "@/types";

const OcrResultSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe("食材名（日本語）"),
      unitPrice: z.number().describe("金額（円、数値のみ）"),
      unitLabel: z.string().describe("単位。例: g, kg, 個, L, 本"),
      confidence: z
        .enum(["high", "low"])
        .describe("読み取りの確信度。文字が不鮮明・欠けている場合はlow"),
    })
  ),
});

const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// ANTHROPIC_API_KEY 未設定時に画面の動作確認をできるようにするデモデータ。
const DEMO_RESULT: OcrExtractedItem[] = [
  { name: "豚バラ肉", unitPrice: 1400, unitLabel: "1kg", confidence: "high" },
  { name: "玉ねぎ", unitPrice: 28, unitLabel: "個", confidence: "high" },
  { name: "濃口しょうゆ", unitPrice: 420, unitLabel: "1L", confidence: "low" },
];

export async function POST(request: NextRequest) {
  const tenant = await requireEntitledTenantForApi();
  if (!tenant.ok) return tenant.response;

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "画像が見つかりません" }, { status: 400 });
  }
  if (!SUPPORTED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "対応していない画像形式です（JPEG/PNG/WebP/GIFのみ）" },
      { status: 400 }
    );
  }

  const client = getAnthropicClient();

  if (!client) {
    // デモモード: 少し待ってからサンプルデータを返す。
    await new Promise((resolve) => setTimeout(resolve, 900));
    return NextResponse.json({
      items: DEMO_RESULT,
      demo: true,
    });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2048,
      output_config: {
        effort: "low",
        format: zodOutputFormat(OcrResultSchema),
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: file.type as
                  | "image/jpeg"
                  | "image/png"
                  | "image/webp"
                  | "image/gif",
                data: base64,
              },
            },
            {
              type: "text",
              text: "この納品書・値札の写真から、食材名・単価・単位を読み取ってください。金額は数値のみ（円記号やカンマなし）。文字が不鮮明で読み取りに自信がない項目は confidence を low にしてください。",
            },
          ],
        },
      ],
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        { error: "読み取りに失敗しました。もう一度お試しください。" },
        { status: 502 }
      );
    }

    return NextResponse.json({ items: response.parsed_output.items, demo: false });
  } catch (err) {
    console.error("OCR request failed", err);
    return NextResponse.json(
      { error: "読み取り中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
