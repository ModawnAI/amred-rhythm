'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ForkKnife,
  Moon,
  PersonSimpleRun,
  Scales,
  SmileyMeh,
  X,
  Check,
  Plus,
  Lightning,
  Clock,
  Fire,
  Drop,
  Minus,
  CaretUp,
  CaretDown,
  Sparkle,
  Trash,
} from '@phosphor-icons/react';
import { useLifelogStore } from '@/store/lifelog-store';
import { toast } from 'sonner';
import type { LogType, MealType, MoodScore, Intensity } from '@/types';

interface LogCategory {
  type: LogType;
  label: string;
  Icon: typeof ForkKnife;
  color: string;
  quickOptions?: { label: string; value: number; metadata: Record<string, unknown> }[];
}

const logCategories: LogCategory[] = [
  {
    type: 'diet',
    label: '식사',
    Icon: ForkKnife,
    color: '#F59E0B',
    quickOptions: [
      { label: '가벼운 아침', value: 300, metadata: { mealType: 'breakfast', description: '가벼운 아침 식사', calories: 300 } },
      { label: '든든한 점심', value: 700, metadata: { mealType: 'lunch', description: '일반적인 점심 식사', calories: 700 } },
      { label: '저녁 식사', value: 600, metadata: { mealType: 'dinner', description: '저녁 식사', calories: 600 } },
    ]
  },
  {
    type: 'sleep',
    label: '수면',
    Icon: Moon,
    color: '#6366F1',
    quickOptions: [
      { label: '6시간', value: 6, metadata: { description: '6시간 수면', sleepQuality: 3 } },
      { label: '7시간', value: 7, metadata: { description: '7시간 수면', sleepQuality: 4 } },
      { label: '8시간', value: 8, metadata: { description: '8시간 수면', sleepQuality: 5 } },
    ]
  },
  {
    type: 'activity',
    label: '활동',
    Icon: PersonSimpleRun,
    color: '#10B981',
    quickOptions: [
      { label: '30분 걷기', value: 30, metadata: { activityType: '걷기', duration: 30, intensity: 'low', description: '30분 걷기' } },
      { label: '30분 조깅', value: 30, metadata: { activityType: '조깅', duration: 30, intensity: 'medium', description: '30분 조깅' } },
      { label: '1시간 운동', value: 60, metadata: { activityType: '운동', duration: 60, intensity: 'high', description: '1시간 고강도 운동' } },
    ]
  },
  {
    type: 'weight',
    label: '체중',
    Icon: Scales,
    color: '#EC4899',
  },
  {
    type: 'mood',
    label: '기분',
    Icon: SmileyMeh,
    color: '#665DC6',
  },
];

export function LogsTab() {
  const [selectedCategory, setSelectedCategory] = useState<LogType | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState<LogType | null>(null);
  const { selectedDate, addLog, getLogsByDate, deleteLog } = useLifelogStore();
  const todayLogs = getLogsByDate(selectedDate);

  const handleQuickLog = (type: LogType, option: { label: string; value: number; metadata: Record<string, unknown> }) => {
    addLog({
      userId: 'user-1',
      date: selectedDate,
      type,
      value: option.value,
      metadata: option.metadata,
    });
    setShowQuickAdd(null);
    toast.success(`${option.label} 기록 완료!`, {
      icon: <Check size={16} className="text-green-500" />,
    });
  };

  const handleLogSubmit = (type: LogType, data: Record<string, unknown>) => {
    addLog({
      userId: 'user-1',
      date: selectedDate,
      type,
      value: (data.value as number) || 0,
      metadata: data.metadata as Record<string, unknown>,
    });
    setSelectedCategory(null);
    toast.success('기록이 저장되었어요!', {
      icon: <Sparkle size={16} className="text-[#665DC6]" weight="fill" />,
    });
  };

  const handleDeleteLog = (id: string) => {
    deleteLog(id);
    toast.success('기록이 삭제되었어요');
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col px-4 py-6 gap-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">기록하기</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(selectedDate).toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}
            {isToday && <Badge variant="secondary" className="ml-2 text-[10px]">오늘</Badge>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">오늘 기록</p>
            <p className="text-lg font-bold text-[#665DC6]">{todayLogs.length}개</p>
          </div>
        </div>
      </div>

      {/* Quick Add Section */}
      <Card className="border-[#665DC6]/20 bg-gradient-to-br from-[#665DC6]/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Lightning size={18} className="text-[#665DC6]" weight="fill" />
            <CardTitle className="text-sm">빠른 기록</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {logCategories
              .filter(c => c.quickOptions)
              .flatMap(category =>
                category.quickOptions!.slice(0, 2).map((option, idx) => (
                  <motion.button
                    key={`${category.type}-${idx}`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickLog(category.type, option)}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-gray-100 hover:border-[#665DC6]/30 transition-all shadow-sm"
                  >
                    <category.Icon size={16} style={{ color: category.color }} weight="fill" />
                    <span className="text-sm whitespace-nowrap">{option.label}</span>
                  </motion.button>
                ))
              )
            }
          </div>
        </CardContent>
      </Card>

      {/* Category Grid */}
      <div className="grid grid-cols-3 gap-3">
        {logCategories.map(({ type, label, Icon, color, quickOptions }) => {
          const logsOfType = todayLogs.filter((log) => log.type === type);
          const hasLog = logsOfType.length > 0;
          return (
            <motion.div key={type} className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => quickOptions ? setShowQuickAdd(type) : setSelectedCategory(type)}
                onDoubleClick={() => setSelectedCategory(type)}
                className={`w-full flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  hasLog
                    ? 'border-[#665DC6]/50 bg-[#665DC6]/5'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center relative"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon size={24} style={{ color }} weight="fill" />
                  {hasLog && logsOfType.length > 1 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#665DC6] text-white text-[10px] flex items-center justify-center font-bold">
                      {logsOfType.length}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium">{label}</span>
                {hasLog ? (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#665DC6] flex items-center justify-center">
                    <Check size={12} className="text-white" weight="bold" />
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                    <Plus size={12} className="text-gray-400" weight="bold" />
                  </div>
                )}
              </motion.button>

              {/* Quick Options Popover */}
              <AnimatePresence>
                {showQuickAdd === type && quickOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 bg-white rounded-xl shadow-lg border border-gray-100 p-2 min-w-[160px]"
                  >
                    <div className="text-xs text-muted-foreground px-2 py-1 mb-1">빠른 선택</div>
                    {quickOptions.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickLog(type, option)}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {option.label}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setShowQuickAdd(null);
                          setSelectedCategory(type);
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors text-[#665DC6] font-medium"
                      >
                        직접 입력하기
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Click outside to close quick add */}
      {showQuickAdd && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowQuickAdd(null)}
        />
      )}

      {/* Recent Logs */}
      {todayLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">오늘 기록</CardTitle>
              <Badge variant="outline" className="text-xs">
                {todayLogs.length}개
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayLogs.map((log, index) => {
              const category = logCategories.find((c) => c.type === log.type);
              if (!category) return null;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <category.Icon
                      size={18}
                      style={{ color: category.color }}
                      weight="fill"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{category.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {log.metadata.description ||
                        (log.type === 'weight' && `${log.value}kg`) ||
                        (log.type === 'sleep' && `${log.value}시간`) ||
                        (log.type === 'mood' && `기분 ${log.value}/5`) ||
                        (log.type === 'diet' && `${log.metadata.calories || log.value}kcal`) ||
                        (log.type === 'activity' && `${log.metadata.duration || log.value}분`)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-50 transition-all"
                    >
                      <Trash size={14} className="text-red-400" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {todayLogs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus size={24} className="text-gray-400" />
            </div>
            <p className="text-muted-foreground text-sm">
              오늘의 첫 기록을 시작해보세요!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              위 카테고리를 탭하면 빠르게 기록할 수 있어요
            </p>
          </CardContent>
        </Card>
      )}

      {/* Input Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <LogInputModal
            type={selectedCategory}
            onClose={() => setSelectedCategory(null)}
            onSubmit={(data) => handleLogSubmit(selectedCategory, data)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface LogInputModalProps {
  type: LogType;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

function LogInputModal({ type, onClose, onSubmit }: LogInputModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isValid, setIsValid] = useState(false);

  // Validate form on change
  useEffect(() => {
    switch (type) {
      case 'diet':
        setIsValid(Boolean((formData.metadata as Record<string, unknown>)?.mealType));
        break;
      case 'sleep':
        setIsValid(Boolean(formData.value && (formData.value as number) > 0));
        break;
      case 'activity':
        setIsValid(Boolean((formData.metadata as Record<string, unknown>)?.duration));
        break;
      case 'weight':
        setIsValid(Boolean(formData.value && (formData.value as number) > 0));
        break;
      case 'mood':
        setIsValid(Boolean(formData.value));
        break;
      default:
        setIsValid(false);
    }
  }, [formData, type]);

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(formData);
    }
  };

  const renderForm = () => {
    switch (type) {
      case 'diet':
        return <DietForm data={formData} onChange={setFormData} />;
      case 'sleep':
        return <SleepForm data={formData} onChange={setFormData} />;
      case 'activity':
        return <ActivityForm data={formData} onChange={setFormData} />;
      case 'weight':
        return <WeightForm data={formData} onChange={setFormData} />;
      case 'mood':
        return <MoodForm data={formData} onChange={setFormData} />;
      default:
        return null;
    }
  };

  const category = logCategories.find((c) => c.type === type);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[100]"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[430px] bg-white rounded-t-3xl flex flex-col z-[101]"
        style={{
          maxHeight: '85vh',
          height: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {/* Handle bar */}
        <div className="flex-shrink-0 pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto" />
        </div>

        {/* Header - fixed */}
        <div className="flex-shrink-0 px-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {category && (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <category.Icon
                    size={20}
                    style={{ color: category.color }}
                    weight="fill"
                  />
                </div>
              )}
              <h2 className="text-lg font-semibold">{category?.label} 기록</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
          {renderForm()}
        </div>

        {/* Fixed footer with button - always visible */}
        <div
          className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-100"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
        >
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full bg-[#665DC6] hover:bg-[#5248A8] disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base"
          >
            <Check size={18} className="mr-2" />
            저장하기
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface FormProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

// Number Stepper Component
function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit = '',
  size = 'default'
}: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  size?: 'default' | 'large';
}) {
  const buttonClass = size === 'large'
    ? 'w-12 h-12 rounded-xl'
    : 'w-10 h-10 rounded-lg';
  const textClass = size === 'large'
    ? 'text-3xl font-bold min-w-[100px]'
    : 'text-xl font-semibold min-w-[60px]';

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className={`${buttonClass} bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors`}
      >
        <Minus size={20} className="text-gray-600" />
      </button>
      <div className={`${textClass} text-center text-[#665DC6]`}>
        {value.toFixed(step < 1 ? 1 : 0)}{unit}
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className={`${buttonClass} bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors`}
      >
        <Plus size={20} className="text-gray-600" />
      </button>
    </div>
  );
}

function DietForm({ data, onChange }: FormProps) {
  const mealTypes = [
    { value: 'breakfast', label: '아침', emoji: '🌅' },
    { value: 'lunch', label: '점심', emoji: '☀️' },
    { value: 'dinner', label: '저녁', emoji: '🌙' },
    { value: 'snack', label: '간식', emoji: '🍪' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm text-muted-foreground mb-3 block">식사 종류</Label>
        <div className="grid grid-cols-4 gap-2">
          {mealTypes.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() =>
                onChange({
                  ...data,
                  metadata: { ...(data.metadata as object), mealType: value },
                })
              }
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                (data.metadata as Record<string, string>)?.mealType === value
                  ? 'border-[#665DC6] bg-[#665DC6]/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm text-muted-foreground mb-2 block">무엇을 드셨나요?</Label>
        <Textarea
          placeholder="예: 현미밥, 된장찌개, 생선구이..."
          className="min-h-[80px]"
          value={(data.metadata as Record<string, string>)?.mealDescription || ''}
          onChange={(e) =>
            onChange({
              ...data,
              metadata: {
                ...(data.metadata as object),
                mealDescription: e.target.value,
                description: e.target.value,
              },
            })
          }
        />
      </div>

      <div>
        <Label className="text-sm text-muted-foreground mb-3 block">예상 칼로리</Label>
        <NumberStepper
          value={(data.metadata as Record<string, number>)?.calories || 500}
          onChange={(val) =>
            onChange({
              ...data,
              value: val,
              metadata: {
                ...(data.metadata as object),
                calories: val,
              },
            })
          }
          min={0}
          max={3000}
          step={50}
          unit="kcal"
          size="large"
        />
        <div className="flex justify-center gap-2 mt-3">
          {[300, 500, 700, 1000].map((cal) => (
            <button
              key={cal}
              onClick={() =>
                onChange({
                  ...data,
                  value: cal,
                  metadata: { ...(data.metadata as object), calories: cal },
                })
              }
              className="px-3 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {cal}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SleepForm({ data, onChange }: FormProps) {
  const sleepHours = (data.value as number) || 7;

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm text-muted-foreground mb-3 block">수면 시간</Label>
        <NumberStepper
          value={sleepHours}
          onChange={(val) =>
            onChange({
              ...data,
              value: val,
              metadata: {
                ...(data.metadata as object),
                description: `${val}시간 수면`,
              },
            })
          }
          min={0}
          max={24}
          step={0.5}
          unit="시간"
          size="large"
        />
        <div className="flex justify-center gap-2 mt-3">
          {[5, 6, 7, 8, 9].map((h) => (
            <button
              key={h}
              onClick={() =>
                onChange({
                  ...data,
                  value: h,
                  metadata: { ...(data.metadata as object), description: `${h}시간 수면` },
                })
              }
              className="px-3 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {h}시간
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            <Moon size={14} className="inline mr-1" />
            취침
          </Label>
          <Input
            type="time"
            value={(data.metadata as Record<string, string>)?.bedtime || '23:00'}
            onChange={(e) =>
              onChange({
                ...data,
                metadata: { ...(data.metadata as object), bedtime: e.target.value },
              })
            }
            className="text-center"
          />
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            <Clock size={14} className="inline mr-1" />
            기상
          </Label>
          <Input
            type="time"
            value={(data.metadata as Record<string, string>)?.wakeTime || '07:00'}
            onChange={(e) =>
              onChange({
                ...data,
                metadata: { ...(data.metadata as object), wakeTime: e.target.value },
              })
            }
            className="text-center"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm text-muted-foreground mb-3 block">수면 품질</Label>
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5].map((q) => (
            <button
              key={q}
              onClick={() =>
                onChange({
                  ...data,
                  metadata: {
                    ...(data.metadata as object),
                    sleepQuality: q as MoodScore,
                  },
                })
              }
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${
                ((data.metadata as Record<string, number>)?.sleepQuality || 3) === q
                  ? 'bg-[#665DC6] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
          <span>매우 나쁨</span>
          <span>매우 좋음</span>
        </div>
      </div>
    </div>
  );
}

function ActivityForm({ data, onChange }: FormProps) {
  const activityTypes = [
    { value: '걷기', emoji: '🚶' },
    { value: '달리기', emoji: '🏃' },
    { value: '자전거', emoji: '🚴' },
    { value: '수영', emoji: '🏊' },
    { value: '헬스', emoji: '🏋️' },
    { value: '요가', emoji: '🧘' },
  ];

  const intensities: { value: Intensity; label: string; color: string }[] = [
    { value: 'low', label: '가벼움', color: '#10B981' },
    { value: 'medium', label: '보통', color: '#F59E0B' },
    { value: 'high', label: '고강도', color: '#EF4444' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm text-muted-foreground mb-3 block">운동 종류</Label>
        <div className="grid grid-cols-3 gap-2">
          {activityTypes.map(({ value, emoji }) => (
            <button
              key={value}
              onClick={() =>
                onChange({
                  ...data,
                  metadata: {
                    ...(data.metadata as object),
                    activityType: value,
                    description: value,
                  },
                })
              }
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                (data.metadata as Record<string, string>)?.activityType === value
                  ? 'border-[#665DC6] bg-[#665DC6]/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-xs font-medium">{value}</span>
            </button>
          ))}
        </div>
        <Input
          placeholder="또는 직접 입력..."
          className="mt-2"
          value={(data.metadata as Record<string, string>)?.activityType || ''}
          onChange={(e) =>
            onChange({
              ...data,
              metadata: {
                ...(data.metadata as object),
                activityType: e.target.value,
                description: e.target.value,
              },
            })
          }
        />
      </div>

      <div>
        <Label className="text-sm text-muted-foreground mb-3 block">운동 시간</Label>
        <NumberStepper
          value={(data.metadata as Record<string, number>)?.duration || 30}
          onChange={(val) =>
            onChange({
              ...data,
              value: val,
              metadata: {
                ...(data.metadata as object),
                duration: val,
              },
            })
          }
          min={5}
          max={300}
          step={5}
          unit="분"
          size="large"
        />
        <div className="flex justify-center gap-2 mt-3">
          {[15, 30, 45, 60, 90].map((m) => (
            <button
              key={m}
              onClick={() =>
                onChange({
                  ...data,
                  value: m,
                  metadata: { ...(data.metadata as object), duration: m },
                })
              }
              className="px-3 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {m}분
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm text-muted-foreground mb-3 block">운동 강도</Label>
        <div className="grid grid-cols-3 gap-2">
          {intensities.map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() =>
                onChange({
                  ...data,
                  metadata: { ...(data.metadata as object), intensity: value },
                })
              }
              className={`p-3 rounded-xl border-2 transition-all ${
                (data.metadata as Record<string, string>)?.intensity === value
                  ? 'border-[#665DC6] bg-[#665DC6]/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <Fire size={20} style={{ color }} className="mx-auto mb-1" weight="fill" />
              <span className="text-xs font-medium block">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeightForm({ data, onChange }: FormProps) {
  const weight = (data.value as number) || 65;

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm text-muted-foreground mb-3 block">체중</Label>
        <NumberStepper
          value={weight}
          onChange={(val) =>
            onChange({
              ...data,
              value: val,
              metadata: {
                ...(data.metadata as object),
                description: `${val}kg`,
              },
            })
          }
          min={30}
          max={200}
          step={0.1}
          unit="kg"
          size="large"
        />
      </div>

      <div>
        <Label className="text-sm text-muted-foreground mb-3 block">측정 시간</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'am', label: '아침 (기상 후)', emoji: '🌅' },
            { value: 'pm', label: '저녁 (취침 전)', emoji: '🌙' },
          ].map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() =>
                onChange({
                  ...data,
                  metadata: { ...(data.metadata as object), weightTime: value },
                })
              }
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                (data.metadata as Record<string, string>)?.weightTime === value
                  ? 'border-[#665DC6] bg-[#665DC6]/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <span className="text-2xl block mb-1">{emoji}</span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MoodForm({ data, onChange }: FormProps) {
  const moods = [
    { value: 1, emoji: '😢', label: '매우 나쁨', color: '#EF4444' },
    { value: 2, emoji: '😕', label: '나쁨', color: '#F59E0B' },
    { value: 3, emoji: '😐', label: '보통', color: '#6B7280' },
    { value: 4, emoji: '🙂', label: '좋음', color: '#10B981' },
    { value: 5, emoji: '😄', label: '매우 좋음', color: '#665DC6' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm text-muted-foreground mb-4 block text-center">
          오늘 기분은 어떠세요?
        </Label>
        <div className="flex justify-between px-2">
          {moods.map(({ value, emoji, label, color }) => (
            <motion.button
              key={value}
              whileTap={{ scale: 0.9 }}
              onClick={() =>
                onChange({
                  ...data,
                  value,
                  metadata: {
                    ...(data.metadata as object),
                    moodScore: value as MoodScore,
                    description: label,
                  },
                })
              }
              className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                data.value === value
                  ? 'bg-[#665DC6]/10 scale-110'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className={`text-3xl transition-transform ${data.value === value ? 'scale-125' : ''}`}>
                {emoji}
              </span>
              <span className={`text-xs font-medium ${data.value === value ? 'text-[#665DC6]' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm text-muted-foreground mb-2 block">메모 (선택)</Label>
        <Textarea
          placeholder="오늘 기분에 대해 적어보세요..."
          className="min-h-[80px]"
          value={(data.metadata as Record<string, string>)?.moodNote || ''}
          onChange={(e) =>
            onChange({
              ...data,
              metadata: { ...(data.metadata as object), moodNote: e.target.value },
            })
          }
        />
      </div>
    </div>
  );
}
