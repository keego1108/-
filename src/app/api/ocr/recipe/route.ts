import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "@/lib/anthropic";
import { requireEntitledTenantForApi } from "@/lib/tenant";
import { getIngredients } from "@/lib/data";
import type { RecipeOcrItem } from "@/types";

const RecipeOcrSchema = z.object({
  menuName: z.string().describe("料理名"),
  sellPrice: z
    .number()
    .nullable()
    .describe("売価（円、数値のみ）。レシピに記載がなければnull"),
  items: z.array(
    z.object({
      rawName: z.string().describe("レシピに書かれていた食材名（そのまま、日本語）"),
      matchedIngredientId: z
        .string()
        .nullable()
        .describe(
          "渡された食材マスタ一覧の中に、表記ゆれ（例:「たまねぎ」と「玉ねぎ」）を考慮しても該当すると判断できるものがあれば、そのID。無い・自信が持てない場合はnull。一覧に存在しないIDを作ってはいけない"
        ),
      quantity: z.number().describe("使用量（数値のみ）"),
      unitLabel: z.string().describe("単位。例: g, kg, 個, L, 本"),
      unitPrice: z
        .number()
        .nullable()
        .describe(
          "レシピ表に単価の列があれば、その数値（その行の単位1あたりの金額）。列が無い・空欄・「####」など読めない場合はnull。推測して数値を作ってはいけない"
        ),
      confidence: z
        .enum(["high", "low"])
        .describe("読み取り・食材マッチングの確信度。不鮮明・判断に迷う場合はlow"),
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
// 既存の食材マスタに同名のものがあれば、実際にマッチングされた状態を再現する。
function demoResult(nameToId: Record<string, string>): {
  menuName: string;
  sellPrice: number | null;
  items: RecipeOcrItem[];
} {
  return {
    menuName: "生姜焼き定食",
    sellPrice: 950,
    items: [
      {
        rawName: "豚バラ肉",
        matchedIngredientId: nameToId["豚バラ肉"] ?? null,
        quantity: 120,
        unitLabel: "g",
        unitPrice: 1.57,
        confidence: "high",
      },
      {
        rawName: "キャベツ",
        matchedIngredientId: nameToId["キャベツ"] ?? null,
        quantity: 80,
        unitLabel: "g",
        unitPrice: 0.4,
        confidence: "high",
      },
      {
        rawName: "生姜（すりおろし）",
        matchedIngredientId: null,
        quantity: 10,
        unitLabel: "g",
        unitPrice: null,
        confidence: "low",
      },
    ],
  };
}

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
    const nameToId = Object.fromEntries(allIngredients.map((i) => [i.name, i.id]));
    await new Promise((resolve) => setTimeout(resolve, 900));
    return NextResponse.json({ ...demoResult(nameToId), demo: true });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");

  const ingredientList = allIngredients
    .map((i) => `- id: ${i.id} / 名前: ${i.name} / 単位: ${i.unitLabel}`)
    .join("\n");

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2048,
      output_config: {
        effort: "low",
        format: zodOutputFormat(RecipeOcrSchema),
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
              text: `このレシピ（手書き・印刷どちらも可）の写真から、料理名・売価（記載があれば）・使用する食材と分量を読み取ってください。
金額・分量は数値のみ（円記号やカンマ、単位の文字は含めない）。
単位は表記ゆれをそろえてください（「k」「ｋ」「キロ」→ kg、「ｇ」→ g、「l」「リットル」→ L、「ml」「cc」→ ml）。
写真に手書きのメモや、レシピ本体と関係ない数字が混ざっていても、レシピ表の中の食材・分量だけを読み取ってください。
分量が個数と思われるのに単位が空欄や「0」など不明な場合は、単位を「個」にしてください。
同じ食材が複数行に出てくる場合も、写真のとおり1行ずつ返してください。

この店舗の食材マスタ一覧です。表記ゆれ（送り仮名・ひらがな/カタカナ・部位表記など）を考慮して該当するものがあれば matchedIngredientId にそのIDを入れてください。該当が無ければnullにしてください。一覧に無いIDを作ってはいけません。
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
    const sanitizedItems = response.parsed_output.items.map((item) => ({
      ...item,
      matchedIngredientId:
        item.matchedIngredientId && validIds.has(item.matchedIngredientId)
          ? item.matchedIngredientId
          : null,
    }));

    return NextResponse.json({
      ...response.parsed_output,
      items: sanitizedItems,
      demo: false,
    });
  } catch (err) {
    console.error("Recipe OCR request failed", err);
    return NextResponse.json(
      { error: "読み取り中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
