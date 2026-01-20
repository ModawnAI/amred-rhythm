'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendUp,
  TrendDown,
  Lightbulb,
  ArrowRight,
  SpinnerGap,
  Brain,
} from '@phosphor-icons/react';
import { useLifelogStore } from '@/store/lifelog-store';
import { analyzePatterns } from '@/lib/ai/analyzer';

export function InsightsTab() {
  const { logs, addFeedback, selectedDate } = useLifelogStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    patterns: string[];
    factors: Array<{
      name: string;
      impact: 'positive' | 'negative' | 'neutral';
      evidence: string;
    }>;
    recommendations: string[];
  } | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzePatterns(logs);
      setAnalysis(result);

      // Save as feedback
      addFeedback({
        userId: 'user-1',
        date: selectedDate,
        type: 'morning',
        content: result.patterns.join(' '),
        factors: result.factors.map((f, idx) => ({
          id: `factor-${idx}`,
          name: f.name,
          description: f.evidence,
          evidence: f.evidence,
          impact: f.impact,
        })),
        prescriptions: result.recommendations,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate some basic stats from logs
  const last7Days = logs.filter((log) => {
    const logDate = new Date(log.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  });

  const weightLogs = last7Days.filter((l) => l.type === 'weight');
  const sleepLogs = last7Days.filter((l) => l.type === 'sleep');
  const activityLogs = last7Days.filter((l) => l.type === 'activity');

  const avgSleep =
    sleepLogs.length > 0
      ? sleepLogs.reduce((acc, l) => acc + l.value, 0) / sleepLogs.length
      : 0;

  const totalActivity =
    activityLogs.length > 0
      ? activityLogs.reduce(
          (acc, l) => acc + ((l.metadata.duration as number) || 0),
          0
        )
      : 0;

  const weightChange =
    weightLogs.length >= 2
      ? weightLogs[weightLogs.length - 1].value - weightLogs[0].value
      : 0;

  return (
    <div className="flex flex-col px-4 py-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">AI 분석</h1>
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || logs.length === 0}
          className="bg-[#665DC6] hover:bg-[#5248A8]"
        >
          {isAnalyzing ? (
            <>
              <SpinnerGap size={16} className="animate-spin mr-1" />
              분석 중...
            </>
          ) : (
            <>
              <Brain size={16} className="mr-1" />
              분석하기
            </>
          )}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">평균 수면</p>
            <p className="text-lg font-semibold text-[#665DC6]">
              {avgSleep.toFixed(1)}시간
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">주간 활동</p>
            <p className="text-lg font-semibold text-green-600">
              {totalActivity}분
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">체중 변화</p>
            <p
              className={`text-lg font-semibold flex items-center justify-center gap-1 ${
                weightChange > 0 ? 'text-red-500' : 'text-green-500'
              }`}
            >
              {weightChange > 0 ? (
                <TrendUp size={16} />
              ) : (
                <TrendDown size={16} />
              )}
              {Math.abs(weightChange).toFixed(1)}kg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Results */}
      {analysis ? (
        <>
          {/* Pattern Summary */}
          <Card className="border-[#665DC6]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb size={20} className="text-[#665DC6]" />
                패턴 요약
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.patterns.map((pattern, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <ArrowRight
                    size={16}
                    className="text-[#665DC6] mt-0.5 shrink-0"
                  />
                  <p className="text-sm">{pattern}</p>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Key Factors */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">주요 영향 요인</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.factors.map((factor, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <Badge
                    variant={
                      factor.impact === 'positive'
                        ? 'default'
                        : factor.impact === 'negative'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {factor.impact === 'positive' ? '+' : factor.impact === 'negative' ? '-' : '•'}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{factor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {factor.evidence}
                    </p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="border-green-200/50 bg-green-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-green-700">
                추천 행동
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg border border-green-100"
                >
                  <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </div>
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Brain size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-muted-foreground">
              {logs.length === 0
                ? '기록된 데이터가 없어요.\n먼저 라이프로그를 기록해주세요.'
                : 'AI 분석 버튼을 눌러\n나의 건강 패턴을 확인해보세요.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
