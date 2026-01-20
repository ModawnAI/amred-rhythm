import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export interface FoodAnalysisResult {
  success: boolean;
  foods: {
    name: string;
    nameKr: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
  }[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
  };
  description: string;
  confidence: 'high' | 'medium' | 'low';
  suggestedMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: '이미지가 필요합니다.' },
        { status: 400 }
      );
    }

    // Extract base64 data from data URL
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `당신은 전문 영양사 AI입니다. 이 음식 사진을 분석하여 상세한 영양 정보를 제공해주세요.

## 분석 요청:
1. 사진에 보이는 모든 음식을 식별해주세요
2. 각 음식의 예상 양과 영양 성분을 추정해주세요
3. 전체 칼로리와 영양 성분 합계를 계산해주세요
4. 아침/점심/저녁/간식 중 어떤 식사 유형인지 추정해주세요

## 응답 형식 (반드시 이 JSON 형식으로만 응답):
{
  "foods": [
    {
      "name": "English name",
      "nameKr": "한국어 이름",
      "portion": "양 (예: 1인분, 200g)",
      "calories": 숫자,
      "protein": 숫자(g),
      "carbs": 숫자(g),
      "fat": 숫자(g),
      "sodium": 숫자(mg)
    }
  ],
  "totalNutrition": {
    "calories": 총 칼로리,
    "protein": 총 단백질(g),
    "carbs": 총 탄수화물(g),
    "fat": 총 지방(g),
    "sodium": 총 나트륨(mg)
  },
  "description": "음식 설명 (한국어, 20자 이내로 간결하게)",
  "confidence": "high 또는 medium 또는 low",
  "suggestedMealType": "breakfast 또는 lunch 또는 dinner 또는 snack"
}

중요:
- 반드시 JSON 형식으로만 응답하세요
- 숫자 값은 정수 또는 소수점 한 자리까지만 사용
- 식별할 수 없는 음식이 있으면 "알 수 없음"으로 표시
- 영양 성분을 확실히 알 수 없으면 일반적인 추정치를 사용하고 confidence를 "low"로 설정`;

    const model = 'gemini-3-flash-preview';
    const contents = [
      {
        role: 'user' as const,
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
    });

    const text = response.text || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 응답 파싱 실패');
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      ...result,
    } as FoodAnalysisResult);
  } catch (error) {
    console.error('Food Analysis Error:', error);

    // Return fallback response
    return NextResponse.json({
      success: false,
      error: '음식 분석에 실패했습니다. 다시 시도해주세요.',
      foods: [],
      totalNutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        sodium: 0,
      },
      description: '',
      confidence: 'low',
      suggestedMealType: 'snack',
    });
  }
}
