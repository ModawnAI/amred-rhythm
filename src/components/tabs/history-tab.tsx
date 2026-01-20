'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CaretLeft,
  CaretRight,
  CalendarBlank,
  Sparkle,
} from '@phosphor-icons/react';
import { useLifelogStore } from '@/store/lifelog-store';

export function HistoryTab() {
  const { logs, feedbacks, selectedDate, setSelectedDate } = useLifelogStore();
  const [viewDate, setViewDate] = useState(new Date());

  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1
  ).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDateString = (day: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return date.toISOString().split('T')[0];
  };

  const hasLogs = (day: number) => {
    const dateStr = getDateString(day);
    return logs.some((log) => log.date === dateStr);
  };

  const hasFeedback = (day: number) => {
    const dateStr = getDateString(day);
    return feedbacks.some((f) => f.date === dateStr);
  };

  const selectedDayLogs = logs.filter((log) => log.date === selectedDate);
  const selectedDayFeedback = feedbacks.filter((f) => f.date === selectedDate);

  return (
    <div className="flex flex-col px-4 py-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">히스토리</h1>
        <CalendarBlank size={24} className="text-[#665DC6]" />
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('prev')}
            >
              <CaretLeft size={20} />
            </Button>
            <CardTitle className="text-base">
              {viewDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
              })}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('next')}
            >
              <CaretRight size={20} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <div
                key={day}
                className="text-center text-xs text-muted-foreground py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const dateStr = getDateString(day);
              const isSelected = dateStr === selectedDate;
              const isToday =
                dateStr === new Date().toISOString().split('T')[0];
              const logged = hasLogs(day);
              const analyzed = hasFeedback(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
                    isSelected
                      ? 'bg-[#665DC6] text-white'
                      : isToday
                      ? 'bg-[#665DC6]/10 text-[#665DC6]'
                      : logged
                      ? 'bg-gray-50 hover:bg-gray-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={isSelected ? 'font-medium' : ''}>{day}</span>
                  {(logged || analyzed) && !isSelected && (
                    <div className="flex gap-0.5 mt-0.5">
                      {logged && (
                        <div className="w-1 h-1 rounded-full bg-[#665DC6]" />
                      )}
                      {analyzed && (
                        <div className="w-1 h-1 rounded-full bg-green-500" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-[#665DC6]" />
              <span>기록</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>AI 분석</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {new Date(selectedDate).toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}
            의 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDayLogs.length > 0 ? (
            <div className="space-y-2">
              {selectedDayLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-[#665DC6]/10 flex items-center justify-center">
                    <span className="text-sm">
                      {log.type === 'diet'
                        ? '🍽️'
                        : log.type === 'sleep'
                        ? '😴'
                        : log.type === 'activity'
                        ? '🏃'
                        : log.type === 'weight'
                        ? '⚖️'
                        : '😊'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{log.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.metadata.description || `${log.value}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              이 날의 기록이 없어요
            </p>
          )}

          {selectedDayFeedback.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Sparkle size={16} className="text-[#665DC6]" />
                <span className="text-sm font-medium">AI 피드백</span>
              </div>
              {selectedDayFeedback.map((feedback) => (
                <div
                  key={feedback.id}
                  className="p-3 bg-[#665DC6]/5 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {feedback.type === 'morning'
                        ? '아침'
                        : feedback.type === 'evening'
                        ? '저녁'
                        : '경고'}
                    </Badge>
                    {feedback.riskLevel && (
                      <Badge
                        variant={
                          feedback.riskLevel === 'high'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {feedback.riskLevel === 'high'
                          ? '주의필요'
                          : feedback.riskLevel === 'medium'
                          ? '관찰필요'
                          : '양호'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{feedback.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
