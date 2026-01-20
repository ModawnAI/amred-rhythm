import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { LifelogEntry } from '@/types';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { logs } = (await request.json()) as { logs: LifelogEntry[] };

    if (!logs || logs.length === 0) {
      return NextResponse.json(
        { error: '분석할 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // Prepare data summary for AI
    const last7Days = logs.filter((log) => {
      const logDate = new Date(log.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    });

    const dataSummary = {
      총_기록_수: last7Days.length,
      식사_기록: last7Days.filter((l) => l.type === 'diet').length,
      수면_기록: last7Days.filter((l) => l.type === 'sleep'),
      활동_기록: last7Days.filter((l) => l.type === 'activity'),
      체중_기록: last7Days.filter((l) => l.type === 'weight'),
      기분_기록: last7Days.filter((l) => l.type === 'mood'),
    };

    const prompt = `당신은 건강 관리 AI 어시스턴트입니다. 사용자의 라이프로그 데이터를 분석하여 건강 패턴과 개선점을 찾아주세요.

## 사용자 데이터 (최근 7일):
${JSON.stringify(dataSummary, null, 2)}

## 상세 로그:
${JSON.stringify(last7Days, null, 2)}

## 분석 요청:
1. 패턴 요약: 데이터에서 발견된 건강 패턴을 2-3문장으로 요약해주세요.
2. 주요 영향 요인: 사용자의 건강에 영향을 미치는 상위 3가지 요인을 찾아주세요. 각 요인에 대해:
   - 요인명
   - 긍정적/부정적 영향 여부
   - 데이터 근거
3. 행동 처방: 오늘 실천할 수 있는 1-2가지 구체적인 행동을 제안해주세요.

## 응답 형식 (반드시 이 JSON 형식으로 응답):
{
  "patterns": ["패턴 설명 1", "패턴 설명 2"],
  "factors": [
    {"name": "요인명", "impact": "positive 또는 negative", "evidence": "근거 설명"}
  ],
  "recommendations": ["행동 제안 1", "행동 제안 2"]
}

Korean response only. JSON 형식으로만 응답하세요.`;

    const config = {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH,
      },
    };

    const model = 'gemini-3-flash-preview';
    const contents = [
      {
        role: 'user' as const,
        parts: [{ text: prompt }],
      },
    ];

    // Collect streamed response
    let fullText = '';
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    for await (const chunk of response) {
      if (chunk.text) {
        fullText += chunk.text;
      }
    }

    // Parse JSON from response
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 응답 파싱 실패');
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Analysis Error:', error);

    // Fallback to mock analysis
    return NextResponse.json({
      patterns: [
        '데이터 분석 중 오류가 발생했어요. 기본 분석 결과를 제공합니다.',
        '더 많은 데이터를 기록하면 정확한 분석이 가능해요.',
      ],
      factors: [
        {
          name: '데이터 축적 필요',
          impact: 'neutral' as const,
          evidence: '충분한 데이터가 모이면 상세 분석을 제공해드릴게요.',
        },
      ],
      recommendations: [
        '매일 꾸준히 기록하는 습관을 만들어보세요.',
        '물을 충분히 마시고 규칙적인 생활을 유지하세요.',
      ],
    });
  }
}
