'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Gear,
  Export,
  Trash,
  CaretRight,
  Database,
  Shield,
  CloudArrowUp,
  SpinnerGap,
  TestTube,
} from '@phosphor-icons/react';
import { loadMockDataToStore } from '@/lib/mock-data-loader';
import { useLifelogStore } from '@/store/lifelog-store';
import { toast } from 'sonner';

export function ProfileTab() {
  const { profile, setProfile, updateProfile, logs, feedbacks, clearAllData, addLog, addFeedback } =
    useLifelogStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingMock, setIsLoadingMock] = useState(false);
  const [editData, setEditData] = useState({
    name: profile?.name || '',
    age: profile?.age || '',
    height: profile?.height || '',
    targetWeight: profile?.targetWeight || '',
  });

  const handleSaveProfile = () => {
    if (!profile) {
      setProfile({
        id: 'user-1',
        name: editData.name,
        age: editData.age ? Number(editData.age) : undefined,
        height: editData.height ? Number(editData.height) : undefined,
        targetWeight: editData.targetWeight
          ? Number(editData.targetWeight)
          : undefined,
        createdAt: new Date().toISOString(),
      });
    } else {
      updateProfile({
        name: editData.name,
        age: editData.age ? Number(editData.age) : undefined,
        height: editData.height ? Number(editData.height) : undefined,
        targetWeight: editData.targetWeight
          ? Number(editData.targetWeight)
          : undefined,
      });
    }
    setIsEditing(false);
    toast.success('프로필이 저장되었어요!');
  };

  const handleExportData = () => {
    const exportData = {
      profile,
      logs,
      feedbacks,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amred-rhythm-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('데이터가 내보내졌어요!');
  };

  const handleClearData = () => {
    if (
      window.confirm(
        '모든 데이터가 삭제됩니다. 정말 삭제하시겠어요?'
      )
    ) {
      clearAllData();
      toast.success('모든 데이터가 삭제되었어요');
    }
  };

  const handleCRMSync = async () => {
    if (logs.length === 0) {
      toast.error('동기화할 데이터가 없어요');
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/api/crm/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-1',
          logs,
          feedbacks,
        }),
      });

      if (!response.ok) {
        throw new Error('CRM 동기화 실패');
      }

      const result = await response.json();
      toast.success(`${result.recordsCreated}개의 기록이 CRM에 동기화되었어요!`);
    } catch (error) {
      console.error('CRM Sync Error:', error);
      toast.error('CRM 동기화 중 오류가 발생했어요');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadMockData = () => {
    if (
      logs.length > 0 &&
      !window.confirm(
        '기존 데이터가 삭제되고 테스트 데이터로 대체됩니다. 계속하시겠어요?'
      )
    ) {
      return;
    }

    setIsLoadingMock(true);
    try {
      const { logsCount, feedbacksCount } = loadMockDataToStore(setProfile, addLog, addFeedback, clearAllData);
      toast.success(`${logsCount}개의 기록과 ${feedbacksCount}개의 AI 분석이 로드되었어요!`);
    } catch (error) {
      console.error('Mock Data Load Error:', error);
      toast.error('테스트 데이터 로드 중 오류가 발생했어요');
    } finally {
      setIsLoadingMock(false);
    }
  };

  return (
    <div className="flex flex-col px-4 py-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">프로필</h1>
        <Gear size={24} className="text-[#665DC6]" />
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">내 정보</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="text-[#665DC6]"
            >
              {isEditing ? '취소' : '편집'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                {profile?.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.name}
                    width={80}
                    height={80}
                    className="rounded-full object-cover border-4 border-[#665DC6]/20"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#665DC6]/10 flex items-center justify-center">
                    <User size={40} className="text-[#665DC6]" />
                  </div>
                )}
              </div>
              <div>
                <Label>이름</Label>
                <Input
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  placeholder="홍길동"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>나이</Label>
                  <Input
                    type="number"
                    value={editData.age}
                    onChange={(e) =>
                      setEditData({ ...editData, age: e.target.value })
                    }
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label>키 (cm)</Label>
                  <Input
                    type="number"
                    value={editData.height}
                    onChange={(e) =>
                      setEditData({ ...editData, height: e.target.value })
                    }
                    placeholder="170"
                  />
                </div>
              </div>
              <div>
                <Label>목표 체중 (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editData.targetWeight}
                  onChange={(e) =>
                    setEditData({ ...editData, targetWeight: e.target.value })
                  }
                  placeholder="65"
                />
              </div>
              <Button
                onClick={handleSaveProfile}
                className="w-full bg-[#665DC6] hover:bg-[#5248A8]"
              >
                저장하기
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  width={64}
                  height={64}
                  className="rounded-full object-cover border-2 border-[#665DC6]/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#665DC6]/10 flex items-center justify-center">
                  <User size={32} className="text-[#665DC6]" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {profile?.name || '이름을 입력해주세요'}
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profile?.age && (
                    <Badge variant="secondary">{profile.age}세</Badge>
                  )}
                  {profile?.height && (
                    <Badge variant="secondary">{profile.height}cm</Badge>
                  )}
                  {profile?.targetWeight && (
                    <Badge variant="secondary">
                      목표 {profile.targetWeight}kg
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database size={20} className="text-[#665DC6]" />
            데이터 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-[#665DC6]">{logs.length}</p>
              <p className="text-xs text-muted-foreground">총 기록 수</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">
                {feedbacks.length}
              </p>
              <p className="text-xs text-muted-foreground">AI 분석 수</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button
            onClick={handleCRMSync}
            disabled={isSyncing}
            className="w-full flex items-center gap-3 p-3 hover:bg-[#665DC6]/5 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSyncing ? (
              <SpinnerGap size={20} className="text-[#665DC6] animate-spin" />
            ) : (
              <CloudArrowUp size={20} className="text-[#665DC6]" />
            )}
            <span className="flex-1 text-left text-sm">
              {isSyncing ? 'CRM 동기화 중...' : 'CRM 동기화'}
            </span>
            <CaretRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleLoadMockData}
            disabled={isLoadingMock}
            className="w-full flex items-center gap-3 p-3 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoadingMock ? (
              <SpinnerGap size={20} className="text-purple-600 animate-spin" />
            ) : (
              <TestTube size={20} className="text-purple-600" />
            )}
            <span className="flex-1 text-left text-sm">
              {isLoadingMock ? '테스트 데이터 로드 중...' : '테스트 데이터 로드'}
            </span>
            <CaretRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleExportData}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Export size={20} className="text-[#665DC6]" />
            <span className="flex-1 text-left text-sm">데이터 내보내기</span>
            <CaretRight size={16} className="text-gray-400" />
          </button>

          <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <Shield size={20} className="text-[#665DC6]" />
            <span className="flex-1 text-left text-sm">개인정보 처리방침</span>
            <CaretRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleClearData}
            className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-red-500"
          >
            <Trash size={20} />
            <span className="flex-1 text-left text-sm">모든 데이터 삭제</span>
            <CaretRight size={16} />
          </button>
        </CardContent>
      </Card>

      {/* App Info */}
      <div className="flex flex-col items-center gap-2 mt-6">
        <Image
          src="/amred-logo.png"
          alt="AMRED Clinic"
          width={100}
          height={40}
          className="object-contain opacity-60"
        />
        <p className="text-xs text-muted-foreground">Rhythm v1.0.0</p>
      </div>
    </div>
  );
}
