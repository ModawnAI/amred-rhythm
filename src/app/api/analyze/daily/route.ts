import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { LifelogEntry, AIFeedback, Factor } from '@/types';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

interface DailyAnalysisRequest {
  logs: LifelogEntry[];
  feedbackType: 'morning' | 'evening';
  userId: string;
  date: string;
}

interface DailyAnalysisResponse {
  feedback: Omit<AIFeedback, 'id' | 'createdAt'>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DailyAnalysisRequest;
    const { logs, feedbackType, userId, date } = body;

    // Get logs from last 24-48 hours for daily analysis
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 48);

    const recentLogs = logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= cutoffDate;
    });

    if (recentLogs.length === 0) {
      return NextResponse.json({
        feedback: generateDefaultFeedback(userId, date, feedbackType),
      });
    }

    const prompt = generatePrompt(recentLogs, feedbackType, date);

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

    const result = JSON.parse(jsonMatch[0]) as {
      content: string;
      factors: Array<{
        name: string;
        impact: 'positive' | 'negative' | 'neutral';
        evidence: string;
      }>;
      prescriptions: string[];
      riskLevel?: 'low' | 'medium' | 'high';
      riskReason?: string;
    };

    // Convert to AIFeedback format
    const feedback: Omit<AIFeedback, 'id' | 'createdAt'> = {
      userId,
      date,
      type: feedbackType,
      content: result.content,
      factors: result.factors.map((f, idx) => ({
        id: `factor-${idx}`,
        name: f.name,
        description: f.evidence,
        evidence: f.evidence,
        impact: f.impact,
      })),
      prescriptions: result.prescriptions,
      riskLevel: result.riskLevel,
      riskReason: result.riskReason,
    };

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Daily Analysis Error:', error);

    // Return fallback feedback
    const body = (await request.clone().json()) as DailyAnalysisRequest;
    return NextResponse.json({
      feedback: generateDefaultFeedback(
        body.userId,
        body.date,
        body.feedbackType
      ),
    });
  }
}

function generatePrompt(
  logs: LifelogEntry[],
  feedbackType: 'morning' | 'evening',
  date: string
): string {
  const logSummary = logs.map((log) => ({
    type: log.type,
    value: log.value,
    time: new Date(log.timestamp).toLocaleTimeString('ko-KR'),
    metadata: log.metadata,
  }));

  if (feedbackType === 'morning') {
    return `당신은 친절한 건강 관리 AI 코치입니다. 사용자의 최근 기록을 바탕으로 오늘 하루를 시작하는 아침 인사와 조언을 제공해주세요.

## 오늘 날짜: ${date}
## 최근 기록:
${JSON.stringify(logSummary, null, 2)}

## 아침 피드백 요청:
1. 어제/최근 데이터를 바탕으로 오늘 집중해야 할 점을 알려주세요.
2. 오늘 실천할 수 있는 구체적인 행동 1-2가지를 제안해주세요.
3. 위험 신호가 있다면 알려주세요 (예: 수면 부족 지속, 체중 급변동).

## 응답 형식 (반드시 이 JSON 형식으로):
{
  "content": "아침 인사와 오늘의 조언 (2-3문장, 해요체 사용)",
  "factors": [
    {"name": "요인명", "impact": "positive 또는 negative 또는 neutral", "evidence": "근거"}
  ],
  "prescriptions": ["오늘 할 일 1", "오늘 할 일 2"],
  "riskLevel": "low 또는 medium 또는 high (위험 시에만)",
  "riskReason": "위험 이유 (위험 시에만)"
}

Korean response only. 친근하고 따뜻한 해요체를 사용하세요.`;
  } else {
    return `당신은 친절한 건강 관리 AI 코치입니다. 사용자의 오늘 하루 기록을 바탕으로 저녁 리뷰를 제공해주세요.

## 오늘 날짜: ${date}
## 오늘의 기록:
${JSON.stringify(logSummary, null, 2)}

## 저녁 피드백 요청:
1. 오늘 하루를 종합적으로 평가해주세요.
2. 잘한 점과 개선할 점을 알려주세요.
3. 내일을 위한 간단한 조언을 제공해주세요.

## 응답 형식 (반드시 이 JSON 형식으로):
{
  "content": "저녁 리뷰와 격려 (2-3문장, 해요체 사용)",
  "factors": [
    {"name": "요인명", "impact": "positive 또는 negative 또는 neutral", "evidence": "근거"}
  ],
  "prescriptions": ["내일을 위한 조언 1"],
  "riskLevel": "low 또는 medium 또는 high (문제 시에만)",
  "riskReason": "문제 이유 (문제 시에만)"
}

Korean response only. 친근하고 따뜻한 해요체를 사용하세요.`;
  }
}

function generateDefaultFeedback(
  userId: string,
  date: string,
  feedbackType: 'morning' | 'evening'
): Omit<AIFeedback, 'id' | 'createdAt'> {
  if (feedbackType === 'morning') {
    return {
      userId,
      date,
      type: 'morning',
      content:
        '좋은 아침이에요! 오늘 하루도 건강하게 시작해보세요. 기록을 남기면 맞춤 조언을 받을 수 있어요.',
      factors: [],
      prescriptions: [
        '아침 식사를 챙겨 드세요',
        '물 한 잔으로 하루를 시작하세요',
      ],
    };
  } else {
    return {
      userId,
      date,
      type: 'evening',
      content:
        '오늘 하루 수고하셨어요! 내일을 위해 충분한 휴식을 취하세요.',
      factors: [],
      prescriptions: ['일찍 잠자리에 드세요'],
    };
  }
}
