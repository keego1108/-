import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "@/lib/anthropic";
import { requireEntitledTenantForApi } from "@/lib/tenant";
import { getIngredients } from "@/lib/data";
import type { OcrExtractedItem } from "@/types";

const OcrResultSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe("食材名（日本語）"),
      unitPrice: z.number().describe("金額（円、数値のみ）"),
      unitLabel: z
        .string()
        .describe(
          "単価の基準になる数量と単位。例: kg, 1kg, 100g, 個, L。「1kgで1400円」なら unitLabel は 1kg"
        ),
      matchedIngredientId: z
        .string()
        .nullable()
        .describe(
          "渡された食材マスタ一覧の中に、表記ゆれ（例:「たまねぎ」と「玉ねぎ」）を考慮しても同じ食材と判断できるものがあれば、そのID。無い・自信が持てない場合はnull。一覧に存在しないIDを作ってはいけない"
        ),
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

  const allIngredients = await getIngredients(tenant.ctx.restaurantId);
  const validIds = new Set(allIngredients.map((i) => i.id));

  const client = getAnthropicClient();

  if (!client) {
    // デモモード: 少し待ってからサンプルデータを返す（同名の食材があれば照合済みとして返す）。
    await new Promise((resolve) => setTimeout(resolve, 900));
    const nameToId = new Map(allIngredients.map((i) => [i.name, i.id]));
    return NextResponse.json({
      items: DEMO_RESULT.map((item) => ({
        ...item,
        matchedIngredientId: nameToId.get(item.name) ?? null,
      })),
      demo: true,
    });
  }

  const ingredientList = allIngredients
    .map((i) => `- id: ${i.id} / 名前: ${i.name}`)
    .join("\n");

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
              text: `この納品書・値札の写真から、食材名・単価・単位を読み取ってください。金額は数値のみ（円記号やカンマなし）。文字が不鮮明で読み取りに自信がない項目は confidence を low にしてください。
単価は、unitLabel に書いた数量・単位あたりの金額にしてください（例:「豚バラ 1kg 1,400円」→ unitPrice 1400, unitLabel 1kg）。単位の表記は「k」→ kg のようにそろえてください。

この店舗の食材マスタ一覧です。表記ゆれ（送り仮名・ひらがな/カタカナ・部位表記など）を考慮して同じ食材があれば matchedIngredientId にそのIDを入れてください。該当が無ければnullにしてください。一覧に無いIDを作ってはいけません。
${ingredientList || "（登録済みの食材はまだありません）"}`,
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

    // モデルが一覧に無いIDを返した場合に備えて、実在するIDかどうかを念のため検証する。
    const items = response.parsed_output.items.map((item) => ({
      ...item,
      matchedIngredientId:
        item.matchedIngredientId && validIds.has(item.matchedIngredientId)
          ? item.matchedIngredientId
          : null,
    }));

    return NextResponse.json({ items, demo: false });
  } catch (err) {
    console.error("OCR request failed", err);
    return NextResponse.json(
      { error: "読み取り中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
