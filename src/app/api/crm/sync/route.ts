import { NextRequest, NextResponse } from 'next/server';
import type { LifelogEntry, AIFeedback, CRMRecord, Factor } from '@/types';

interface CRMSyncRequest {
  userId: string;
  logs: LifelogEntry[];
  feedbacks: AIFeedback[];
  dateRange?: {
    from: string;
    to: string;
  };
}

interface CRMSyncResponse {
  success: boolean;
  recordsCreated: number;
  records: CRMRecord[];
  syncedAt: string;
}

// Generate CRM-ready records from lifelog data
function generateCRMRecords(
  userId: string,
  logs: LifelogEntry[],
  feedbacks: AIFeedback[]
): CRMRecord[] {
  // Group logs by date
  const logsByDate = logs.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = [];
    }
    acc[log.date].push(log);
    return acc;
  }, {} as Record<string, LifelogEntry[]>);

  const records: CRMRecord[] = [];

  for (const [date, dayLogs] of Object.entries(logsByDate)) {
    const dayFeedbacks = feedbacks.filter((f) => f.date === date);
    const hasWarning = dayFeedbacks.some((f) => f.type === 'warning');
    const highestRisk = dayFeedbacks.reduce((max, f) => {
      if (!f.riskLevel) return max;
      const riskOrder = { low: 1, medium: 2, high: 3 };
      return riskOrder[f.riskLevel] > riskOrder[max] ? f.riskLevel : max;
    }, 'low' as 'low' | 'medium' | 'high');

    // Generate summary
    const summary = generateDaySummary(dayLogs);

    // Collect all factors from feedbacks
    const allFactors: Factor[] = dayFeedbacks.flatMap((f) => f.factors);

    // Generate recommended action
    const recommendations = dayFeedbacks
      .flatMap((f) => f.prescriptions || [])
      .filter(Boolean);

    // Create message log (structured text for CRM)
    const messageLog = formatMessageLog(dayLogs, dayFeedbacks);

    records.push({
      id: `crm-${userId}-${date}`,
      userId,
      date,
      summary,
      riskFlag: hasWarning || highestRisk === 'high',
      riskLevel: highestRisk,
      recommendedAction: recommendations[0] || '특별한 조치 필요 없음',
      messageLog,
      factors: allFactors,
      createdAt: new Date().toISOString(),
    });
  }

  return records.sort((a, b) => b.date.localeCompare(a.date));
}

function generateDaySummary(logs: LifelogEntry[]): string {
  const parts: string[] = [];

  const sleepLog = logs.find((l) => l.type === 'sleep');
  if (sleepLog) {
    parts.push(`수면 ${sleepLog.value}시간`);
  }

  const activityLogs = logs.filter((l) => l.type === 'activity');
  if (activityLogs.length > 0) {
    const totalMinutes = activityLogs.reduce(
      (acc, l) => acc + ((l.metadata.duration as number) || 0),
      0
    );
    parts.push(`활동 ${totalMinutes}분`);
  }

  const weightLog = logs.find((l) => l.type === 'weight');
  if (weightLog) {
    parts.push(`체중 ${weightLog.value}kg`);
  }

  const moodLog = logs.find((l) => l.type === 'mood');
  if (moodLog) {
    const moodScore = (moodLog.metadata.moodScore as number) || moodLog.value;
    parts.push(`기분 ${moodScore}/5`);
  }

  const dietLogs = logs.filter((l) => l.type === 'diet');
  if (dietLogs.length > 0) {
    parts.push(`식사 ${dietLogs.length}회`);
  }

  return parts.join(' | ') || '기록 없음';
}

function formatMessageLog(
  logs: LifelogEntry[],
  feedbacks: AIFeedback[]
): string {
  const lines: string[] = [];

  // Add log entries
  lines.push('=== 일일 기록 ===');
  for (const log of logs) {
    const time = new Date(log.timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const typeLabel = {
      diet: '식사',
      sleep: '수면',
      activity: '활동',
      weight: '체중',
      mood: '기분',
    }[log.type];
    const desc = log.metadata.description || `${log.value}`;
    lines.push(`[${time}] ${typeLabel}: ${desc}`);
  }

  // Add AI feedback if any
  if (feedbacks.length > 0) {
    lines.push('');
    lines.push('=== AI 분석 ===');
    for (const feedback of feedbacks) {
      lines.push(`[${feedback.type}] ${feedback.content}`);
      if (feedback.prescriptions && feedback.prescriptions.length > 0) {
        lines.push(`처방: ${feedback.prescriptions.join(', ')}`);
      }
    }
  }

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CRMSyncRequest;
    const { userId, logs, feedbacks, dateRange } = body;

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // Filter logs by date range if provided
    let filteredLogs = logs;
    let filteredFeedbacks = feedbacks;

    if (dateRange) {
      filteredLogs = logs.filter(
        (log) => log.date >= dateRange.from && log.date <= dateRange.to
      );
      filteredFeedbacks = feedbacks.filter(
        (f) => f.date >= dateRange.from && f.date <= dateRange.to
      );
    }

    // Generate CRM records
    const records = generateCRMRecords(userId, filteredLogs, filteredFeedbacks);

    // In production, this would send data to actual CRM system
    // For POC, we return the structured data
    const response: CRMSyncResponse = {
      success: true,
      recordsCreated: records.length,
      records,
      syncedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('CRM Sync Error:', error);
    return NextResponse.json(
      { error: 'CRM 동기화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve sync status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: '사용자 ID가 필요합니다.' },
      { status: 400 }
    );
  }

  // In production, this would check actual CRM sync status
  return NextResponse.json({
    userId,
    lastSyncAt: null,
    status: 'ready',
    message: 'CRM 동기화 준비 완료',
  });
}
