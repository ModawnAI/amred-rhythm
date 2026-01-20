import type { LifelogEntry } from '@/types';

interface AnalysisResult {
  patterns: string[];
  factors: Array<{
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    evidence: string;
  }>;
  recommendations: string[];
}

// Gemini API integration - Primary analysis method
export async function analyzePatterns(
  logs: LifelogEntry[]
): Promise<AnalysisResult> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs }),
    });

    if (!response.ok) {
      throw new Error('AI analysis failed');
    }

    return response.json();
  } catch (error) {
    console.error('Gemini API failed, falling back to local analysis:', error);
    return analyzeLocal(logs);
  }
}

// Local fallback analysis when API is unavailable
function analyzeLocal(logs: LifelogEntry[]): AnalysisResult {
  const last7Days = logs.filter((log) => {
    const logDate = new Date(log.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  });

  const patterns: string[] = [];
  const factors: AnalysisResult['factors'] = [];
  const recommendations: string[] = [];

  // Sleep analysis
  const sleepLogs = last7Days.filter((l) => l.type === 'sleep');
  if (sleepLogs.length > 0) {
    const avgSleep = sleepLogs.reduce((acc, l) => acc + l.value, 0) / sleepLogs.length;
    if (avgSleep < 7) {
      patterns.push(`평균 수면 시간이 ${avgSleep.toFixed(1)}시간으로 권장량(7시간) 미만이에요.`);
      factors.push({
        name: '수면 부족',
        impact: 'negative',
        evidence: `최근 7일 평균 ${avgSleep.toFixed(1)}시간 수면`,
      });
      recommendations.push('오늘은 30분 일찍 잠자리에 들어보세요.');
    } else {
      patterns.push(`평균 수면 시간이 ${avgSleep.toFixed(1)}시간으로 건강한 수면 패턴을 유지하고 있어요!`);
      factors.push({
        name: '충분한 수면',
        impact: 'positive',
        evidence: `최근 7일 평균 ${avgSleep.toFixed(1)}시간 수면`,
      });
    }
  }

  // Activity analysis
  const activityLogs = last7Days.filter((l) => l.type === 'activity');
  if (activityLogs.length > 0) {
    const totalActivity = activityLogs.reduce(
      (acc, l) => acc + ((l.metadata.duration as number) || 0),
      0
    );
    if (totalActivity < 150) {
      patterns.push(`주간 활동량이 ${totalActivity}분으로 권장량(150분) 미만이에요.`);
      factors.push({
        name: '활동량 부족',
        impact: 'negative',
        evidence: `최근 7일 총 ${totalActivity}분 활동`,
      });
      recommendations.push('점심 식사 후 10분 산책을 해보세요.');
    } else {
      factors.push({
        name: '활발한 신체활동',
        impact: 'positive',
        evidence: `최근 7일 총 ${totalActivity}분 활동`,
      });
    }
  } else {
    patterns.push('최근 기록된 활동이 없어요. 가벼운 운동부터 시작해보세요.');
    recommendations.push('오늘 20분 걷기를 목표로 해보세요.');
  }

  // Weight analysis
  const weightLogs = last7Days.filter((l) => l.type === 'weight');
  if (weightLogs.length >= 2) {
    const sortedWeights = weightLogs.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const weightChange =
      sortedWeights[sortedWeights.length - 1].value - sortedWeights[0].value;
    if (Math.abs(weightChange) > 1) {
      if (weightChange > 0) {
        patterns.push(`체중이 ${weightChange.toFixed(1)}kg 증가했어요. 식단과 활동량을 확인해보세요.`);
        factors.push({
          name: '체중 증가',
          impact: 'negative',
          evidence: `최근 7일간 ${weightChange.toFixed(1)}kg 증가`,
        });
        recommendations.push('오후 6시 이후 탄수화물 섭취를 줄여보세요.');
      } else {
        patterns.push(`체중이 ${Math.abs(weightChange).toFixed(1)}kg 감소했어요.`);
        factors.push({
          name: '체중 감량 진행중',
          impact: 'positive',
          evidence: `최근 7일간 ${Math.abs(weightChange).toFixed(1)}kg 감소`,
        });
      }
    }
  }

  // Diet analysis
  const dietLogs = last7Days.filter((l) => l.type === 'diet');
  if (dietLogs.length > 0) {
    const totalCalories = dietLogs.reduce(
      (acc, l) => acc + ((l.metadata.calories as number) || 0),
      0
    );
    const avgCalories = totalCalories / 7;
    if (avgCalories > 2000) {
      patterns.push(`일평균 칼로리 섭취량이 ${Math.round(avgCalories)}kcal이에요.`);
    }
  }

  // Mood analysis
  const moodLogs = last7Days.filter((l) => l.type === 'mood');
  if (moodLogs.length > 0) {
    const avgMood =
      moodLogs.reduce((acc, l) => acc + ((l.metadata.moodScore as number) || l.value), 0) /
      moodLogs.length;
    if (avgMood < 3) {
      patterns.push('최근 기분 상태가 좋지 않은 편이에요.');
      factors.push({
        name: '기분 저하',
        impact: 'negative',
        evidence: `최근 평균 기분 점수 ${avgMood.toFixed(1)}/5`,
      });
      recommendations.push('오늘 좋아하는 활동을 10분간 해보세요.');
    } else if (avgMood >= 4) {
      factors.push({
        name: '긍정적인 기분',
        impact: 'positive',
        evidence: `최근 평균 기분 점수 ${avgMood.toFixed(1)}/5`,
      });
    }
  }

  // Add default recommendations if empty
  if (recommendations.length === 0) {
    recommendations.push('현재 상태를 유지하면서 꾸준히 기록해주세요.');
    recommendations.push('물을 충분히 마시는 것을 잊지 마세요 (하루 2L).');
  }

  // Add default patterns if empty
  if (patterns.length === 0) {
    patterns.push('데이터를 더 모으면 상세한 패턴 분석이 가능해요.');
  }

  return {
    patterns,
    factors: factors.slice(0, 3),
    recommendations: recommendations.slice(0, 2),
  };
}
