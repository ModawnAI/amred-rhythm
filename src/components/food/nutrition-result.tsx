'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Fire,
  Barbell,
  Bread,
  Drop,
  Sparkle,
  PencilSimple,
  Check,
  Info,
  CaretDown,
  CaretUp,
} from '@phosphor-icons/react';
import type { FoodAnalysisResult } from '@/app/api/analyze/food/route';
import type { MealType } from '@/types';

interface NutritionResultProps {
  result: FoodAnalysisResult;
  photoUrl?: string;
  onConfirm: (data: {
    mealType: MealType;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
    photoUrl?: string;
  }) => void;
  onEdit: () => void;
}

const mealTypeLabels: Record<MealType, { label: string; emoji: string }> = {
  breakfast: { label: '아침', emoji: '🌅' },
  lunch: { label: '점심', emoji: '☀️' },
  dinner: { label: '저녁', emoji: '🌙' },
  snack: { label: '간식', emoji: '🍪' },
};

const confidenceColors = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-red-100 text-red-700',
};

const confidenceLabels = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export function NutritionResult({
  result,
  photoUrl,
  onConfirm,
  onEdit,
}: NutritionResultProps) {
  const [mealType, setMealType] = useState<MealType>(
    result.suggestedMealType || 'lunch'
  );
  const [nutrition, setNutrition] = useState(result.totalNutrition);
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleConfirm = () => {
    onConfirm({
      mealType,
      description: result.description,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      sodium: nutrition.sodium,
      photoUrl,
    });
  };

  const nutritionItems = [
    {
      key: 'calories',
      label: '칼로리',
      value: nutrition.calories,
      unit: 'kcal',
      icon: Fire,
      color: '#F59E0B',
    },
    {
      key: 'protein',
      label: '단백질',
      value: nutrition.protein,
      unit: 'g',
      icon: Barbell,
      color: '#EF4444',
    },
    {
      key: 'carbs',
      label: '탄수화물',
      value: nutrition.carbs,
      unit: 'g',
      icon: Bread,
      color: '#8B5CF6',
    },
    {
      key: 'fat',
      label: '지방',
      value: nutrition.fat,
      unit: 'g',
      icon: Drop,
      color: '#F97316',
    },
  ];

  return (
    <div className="space-y-4">
      {/* AI Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkle size={16} className="text-[#665DC6]" weight="fill" />
          <span className="text-sm font-medium text-[#665DC6]">
            AI 분석 결과
          </span>
        </div>
        <div
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${confidenceColors[result.confidence]}`}
        >
          신뢰도: {confidenceLabels[result.confidence]}
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-800">{result.description}</p>
        {result.foods.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-[#665DC6] mt-2"
          >
            <span>상세 분석 보기</span>
            {showDetails ? <CaretUp size={12} /> : <CaretDown size={12} />}
          </button>
        )}

        {/* Food details */}
        {showDetails && result.foods.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-3 pt-3 border-t border-gray-200 space-y-2"
          >
            {result.foods.map((food, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-gray-600">
                  {food.nameKr} ({food.portion})
                </span>
                <span className="text-gray-800 font-medium">
                  {food.calories}kcal
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Meal Type Selection */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">식사 종류</label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(mealTypeLabels) as MealType[]).map((type) => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                mealType === type
                  ? 'border-[#665DC6] bg-[#665DC6]/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <span className="text-lg">{mealTypeLabels[type].emoji}</span>
              <span className="text-xs font-medium">
                {mealTypeLabels[type].label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Nutrition Summary */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500">영양 정보</label>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 text-xs text-[#665DC6]"
          >
            <PencilSimple size={12} />
            <span>{isEditing ? '완료' : '수정'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {nutritionItems.map(({ key, label, value, unit, icon: Icon, color }) => (
            <div
              key={key}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon size={18} style={{ color }} weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) =>
                      setNutrition({
                        ...nutrition,
                        [key]: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full text-lg font-bold text-gray-800 bg-transparent border-b border-[#665DC6] focus:outline-none"
                  />
                ) : (
                  <p className="text-lg font-bold text-gray-800">
                    {value}
                    <span className="text-xs font-normal text-gray-500 ml-0.5">
                      {unit}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sodium (small display) */}
        <div className="mt-2 flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500">나트륨</span>
          {isEditing ? (
            <input
              type="number"
              value={nutrition.sodium}
              onChange={(e) =>
                setNutrition({
                  ...nutrition,
                  sodium: Number(e.target.value) || 0,
                })
              }
              className="w-20 text-sm font-medium text-right bg-transparent border-b border-[#665DC6] focus:outline-none"
            />
          ) : (
            <span className="text-sm font-medium">
              {nutrition.sodium}
              <span className="text-xs text-gray-500">mg</span>
            </span>
          )}
        </div>
      </div>

      {/* Info note */}
      {result.confidence !== 'high' && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
          <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            AI 추정치입니다. 실제 영양 정보와 다를 수 있으니 필요시 수정해주세요.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onEdit}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          다시 촬영
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#665DC6] text-white hover:bg-[#5248A8] transition-colors text-sm font-medium"
        >
          <Check size={16} weight="bold" />
          <span>저장하기</span>
        </button>
      </div>
    </div>
  );
}
