'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sun,
  Moon,
  Lightning,
  Warning,
  CaretRight,
  Sparkle,
  SpinnerGap,
  TrendUp,
  TrendDown,
  Fire,
  Drop,
  Heart,
  Timer,
} from '@phosphor-icons/react';
import { useLifelogStore } from '@/store/lifelog-store';

export function HomeTab() {
  const { selectedDate, logs, profile, getLogsByDate, getFeedbackByDate, setActiveTab, addFeedback } =
    useLifelogStore();
  const todayLogs = getLogsByDate(selectedDate);
  const todayFeedback = getFeedbackByDate(selectedDate);
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekLogs = logs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= weekAgo && logDate <= today;
    });

    const weightLogs = weekLogs.filter((l) => l.type === 'weight').sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const sleepLogs = weekLogs.filter((l) => l.type === 'sleep');
    const activityLogs = weekLogs.filter((l) => l.type === 'activity');
    const moodLogs = weekLogs.filter((l) => l.type === 'mood');

    const latestWeight = weightLogs[0]?.value;
    const oldestWeight = weightLogs[weightLogs.length - 1]?.value;
    const weightChange = latestWeight && oldestWeight ? latestWeight - oldestWeight : 0;

    const avgSleep = sleepLogs.length > 0
      ? sleepLogs.reduce((sum, l) => sum + l.value, 0) / sleepLogs.length
      : 0;

    const totalActivity = activityLogs.reduce((sum, l) => sum + (l.metadata.duration || 0), 0);

    const avgMood = moodLogs.length > 0
      ? moodLogs.reduce((sum, l) => sum + l.value, 0) / moodLogs.length
      : 0;

    return {
      latestWeight,
      weightChange,
      avgSleep: Math.round(avgSleep * 10) / 10,
      totalActivity,
      avgMood: Math.round(avgMood * 10) / 10,
      totalLogs: weekLogs.length,
    };
  }, [logs]);

  // Get recent logs for timeline
  const recentLogs = useMemo(() => {
    return [...logs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [logs]);

  // Determine feedback type based on time of day
  const getFeedbackType = useCallback((): 'morning' | 'evening' => {
    const hour = new Date().getHours();
    return hour < 18 ? 'morning' : 'evening';
  }, []);

  // Auto-generate feedback if there are logs but no feedback for today
  const generateFeedback = useCallback(async () => {
    const feedbackType = getFeedbackType();
    const existingFeedback = todayFeedback.find((f) => f.type === feedbackType);

    if (todayLogs.length > 0 && !existingFeedback && !isGenerating) {
      setIsGenerating(true);
      try {
        const response = await fetch('/api/analyze/daily', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            logs,
            feedbackType,
            userId: 'user-1',
            date: selectedDate,
          }),
        });

        if (response.ok) {
          const { feedback } = await response.json();
          addFeedback(feedback);
        }
      } catch (error) {
        console.error('Failed to generate feedback:', error);
      } finally {
        setIsGenerating(false);
      }
    }
  }, [todayLogs, todayFeedback, isGenerating, getFeedbackType, logs, selectedDate, addFeedback]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today && todayLogs.length > 0) {
      const timeoutId = setTimeout(() => {
        generateFeedback();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedDate, todayLogs.length, generateFeedback]);

  const morningFeedback = todayFeedback.find((f) => f.type === 'morning');
  const eveningFeedback = todayFeedback.find((f) => f.type === 'evening');
  const warnings = todayFeedback.filter((f) => f.type === 'warning');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: '좋은 아침이에요', Icon: Sun };
    if (hour < 18) return { text: '좋은 오후예요', Icon: Sun };
    return { text: '좋은 저녁이에요', Icon: Moon };
  };

  const greeting = getGreeting();
  const formattedDate = new Date(selectedDate).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'diet': return '🍽️';
      case 'sleep': return '😴';
      case 'activity': return '🏃';
      case 'weight': return '⚖️';
      case 'mood': return '😊';
      default: return '📝';
    }
  };

  const getLogDescription = (log: typeof logs[0]) => {
    switch (log.type) {
      case 'diet':
        return log.metadata.mealDescription || `${log.metadata.mealType} 식사`;
      case 'sleep':
        return `${log.value}시간 수면`;
      case 'activity':
        return `${log.metadata.activityType} ${log.metadata.duration}분`;
      case 'weight':
        return `${log.value}kg`;
      case 'mood':
        return log.metadata.moodNote || `기분 ${log.value}/5`;
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col px-4 py-6 gap-4 pb-8">
      {/* Header with Profile */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {profile?.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.name}
              width={48}
              height={48}
              className="rounded-full object-cover border-2 border-[#665DC6]/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#665DC6]/10 flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
            <div className="flex items-center gap-1">
              <greeting.Icon size={18} className="text-[#665DC6]" weight="fill" />
              <h1 className="text-lg font-semibold">
                {profile?.name ? `${profile.name}님, ${greeting.text}` : greeting.text}
              </h1>
            </div>
          </div>
        </div>
        <Image
          src="/amred-logo.png"
          alt="AMRED Clinic"
          width={70}
          height={28}
          className="object-contain"
        />
      </div>

      {/* Weekly Stats Overview */}
      <Card className="bg-gradient-to-r from-[#665DC6]/5 via-purple-50/50 to-pink-50/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {weeklyStats.weightChange < 0 ? (
                  <TrendDown size={16} className="text-green-500" />
                ) : weeklyStats.weightChange > 0 ? (
                  <TrendUp size={16} className="text-red-500" />
                ) : null}
                <span className="text-xs text-muted-foreground">체중</span>
              </div>
              <p className="text-lg font-bold text-[#665DC6]">
                {weeklyStats.latestWeight ? `${weeklyStats.latestWeight}kg` : '-'}
              </p>
              {weeklyStats.weightChange !== 0 && (
                <p className={`text-[10px] ${weeklyStats.weightChange < 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {weeklyStats.weightChange > 0 ? '+' : ''}{weeklyStats.weightChange.toFixed(1)}kg
                </p>
              )}
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Moon size={16} className="text-blue-500" />
                <span className="text-xs text-muted-foreground">수면</span>
              </div>
              <p className="text-lg font-bold text-blue-600">
                {weeklyStats.avgSleep ? `${weeklyStats.avgSleep}h` : '-'}
              </p>
              <p className="text-[10px] text-muted-foreground">평균</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Fire size={16} className="text-orange-500" />
                <span className="text-xs text-muted-foreground">활동</span>
              </div>
              <p className="text-lg font-bold text-orange-600">
                {weeklyStats.totalActivity ? `${weeklyStats.totalActivity}m` : '-'}
              </p>
              <p className="text-[10px] text-muted-foreground">이번 주</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Heart size={16} className="text-pink-500" />
                <span className="text-xs text-muted-foreground">기분</span>
              </div>
              <p className="text-lg font-bold text-pink-600">
                {weeklyStats.avgMood ? `${weeklyStats.avgMood}` : '-'}
              </p>
              <p className="text-[10px] text-muted-foreground">/5점</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning Alert */}
      {warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-start gap-3 p-4">
              <Warning
                size={24}
                className="text-destructive shrink-0"
                weight="fill"
              />
              <div className="flex-1">
                <p className="font-medium text-destructive">
                  주의가 필요해요
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {warnings[0].content}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* AI Prescription Card */}
      <Card className="border-[#665DC6]/20 bg-gradient-to-br from-[#665DC6]/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkle size={20} className="text-[#665DC6]" weight="fill" />
            <CardTitle className="text-base">오늘의 AI 처방</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isGenerating ? (
            <div className="text-center py-4">
              <SpinnerGap size={32} className="mx-auto text-[#665DC6] animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">
                AI가 맞춤 처방을 생성하고 있어요...
              </p>
            </div>
          ) : morningFeedback ? (
            <>
              <p className="text-sm text-muted-foreground">
                {morningFeedback.content}
              </p>
              {morningFeedback.prescriptions &&
                morningFeedback.prescriptions.length > 0 && (
                  <div className="space-y-2">
                    {morningFeedback.prescriptions.map((task, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#665DC6]/10"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#665DC6] text-white flex items-center justify-center text-xs font-medium">
                          {idx + 1}
                        </div>
                        <span className="text-sm flex-1">{task}</span>
                      </div>
                    ))}
                  </div>
                )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                오늘의 기록을 입력하면
                <br />
                AI가 맞춤 처방을 제공해요
              </p>
              <Button
                onClick={() => setActiveTab('logs')}
                className="mt-3 bg-[#665DC6] hover:bg-[#5248A8]"
              >
                <Lightning size={16} className="mr-1" />
                기록 시작하기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">오늘의 기록 현황</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('logs')}
              className="text-[#665DC6] h-auto p-0"
            >
              전체보기
              <CaretRight size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {[
              { type: 'diet', label: '식사', emoji: '🍽️' },
              { type: 'sleep', label: '수면', emoji: '😴' },
              { type: 'activity', label: '활동', emoji: '🏃' },
              { type: 'weight', label: '체중', emoji: '⚖️' },
              { type: 'mood', label: '기분', emoji: '😊' },
            ].map(({ type, label, emoji }) => {
              const hasLog = todayLogs.some((log) => log.type === type);
              return (
                <div
                  key={type}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                    hasLog ? 'bg-[#665DC6]/10' : 'bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span
                    className={`text-xs ${
                      hasLog ? 'text-[#665DC6] font-medium' : 'text-gray-400'
                    }`}
                  >
                    {label}
                  </span>
                  {hasLog && (
                    <Badge
                      variant="secondary"
                      className="h-4 px-1 text-[10px] bg-[#665DC6] text-white"
                    >
                      ✓
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Timer size={18} className="text-[#665DC6]" />
              최근 기록
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('history')}
              className="text-[#665DC6] h-auto p-0"
            >
              전체보기
              <CaretRight size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-lg">{getLogIcon(log.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{getLogDescription(log)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                아직 기록이 없어요
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Health Goals */}
      {profile?.healthGoals && profile.healthGoals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">건강 목표</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.healthGoals.map((goal, idx) => (
                <Badge key={idx} variant="outline" className="text-sm py-1 px-3 border-[#665DC6]/30 text-[#665DC6]">
                  {goal}
                </Badge>
              ))}
            </div>
            {profile.targetWeight && weeklyStats.latestWeight && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">목표 체중까지</span>
                  <span className="text-sm font-medium">
                    {(weeklyStats.latestWeight - profile.targetWeight).toFixed(1)}kg
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#665DC6] h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((70 - weeklyStats.latestWeight) / (70 - profile.targetWeight)) * 100))}%`
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">시작 70kg</span>
                  <span className="text-xs text-[#665DC6] font-medium">목표 {profile.targetWeight}kg</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evening Review */}
      {eveningFeedback && (
        <Card className="border-blue-200/50 bg-blue-50/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Moon size={20} className="text-blue-600" weight="fill" />
              <CardTitle className="text-base">저녁 리뷰</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {eveningFeedback.content}
            </p>
            {eveningFeedback.factors && eveningFeedback.factors.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {eveningFeedback.factors.map((factor) => (
                  <Badge
                    key={factor.id}
                    variant={
                      factor.impact === 'positive'
                        ? 'default'
                        : factor.impact === 'negative'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className="text-xs"
                  >
                    {factor.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
