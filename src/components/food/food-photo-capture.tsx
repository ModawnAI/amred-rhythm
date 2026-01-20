'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Image as ImageIcon,
  X,
  ArrowClockwise,
  Sparkle,
  WarningCircle,
} from '@phosphor-icons/react';
import type { FoodAnalysisResult } from '@/app/api/analyze/food/route';

interface FoodPhotoCaptureProps {
  onAnalysisComplete: (result: FoodAnalysisResult) => void;
  onCancel?: () => void;
}

export function FoodPhotoCapture({
  onAnalysisComplete,
  onCancel,
}: FoodPhotoCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setShowCamera(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          setError('이미지 크기는 10MB 이하여야 합니다.');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          setCapturedImage(event.target?.result as string);
          setError(null);
        };
        reader.onerror = () => {
          setError('이미지를 읽을 수 없습니다.');
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const analyzeFood = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedImage }),
      });

      const result: FoodAnalysisResult = await response.json();

      if (result.success) {
        onAnalysisComplete(result);
      } else {
        setError('음식을 인식할 수 없습니다. 다른 사진을 시도해주세요.');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // If showing camera view
  if (showCamera) {
    return (
      <div className="fixed inset-0 z-[200] bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera overlay */}
        <div className="absolute inset-0 flex flex-col">
          {/* Top bar */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
            <button
              onClick={() => {
                stopCamera();
                onCancel?.();
              }}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <X size={24} className="text-white" />
            </button>
            <span className="text-white text-sm font-medium">
              음식을 촬영해주세요
            </span>
            <div className="w-10" />
          </div>

          {/* Center guide */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-[280px] h-[280px] border-2 border-white/50 rounded-3xl" />
          </div>

          {/* Bottom controls */}
          <div className="flex-shrink-0 pb-safe-area-inset-bottom bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex items-center justify-center gap-6 py-8">
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg"
              >
                <div className="w-16 h-16 rounded-full border-4 border-[#665DC6]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If image is captured, show preview
  if (capturedImage) {
    return (
      <div className="space-y-4">
        {/* Image preview */}
        <div className="relative rounded-2xl overflow-hidden bg-gray-100">
          <img
            src={capturedImage}
            alt="Captured food"
            className="w-full aspect-[4/3] object-cover"
          />
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 rounded-full border-3 border-white border-t-transparent"
              />
              <p className="text-white text-sm mt-4 font-medium">
                AI가 음식을 분석하고 있어요...
              </p>
              <p className="text-white/70 text-xs mt-1">잠시만 기다려주세요</p>
            </div>
          )}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600"
            >
              <WarningCircle size={20} weight="fill" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={retake}
            disabled={isAnalyzing}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <ArrowClockwise size={18} />
            <span className="text-sm font-medium">다시 찍기</span>
          </button>
          <button
            onClick={analyzeFood}
            disabled={isAnalyzing}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#665DC6] text-white hover:bg-[#5248A8] transition-colors disabled:opacity-50"
          >
            <Sparkle size={18} weight="fill" />
            <span className="text-sm font-medium">
              {isAnalyzing ? '분석 중...' : 'AI 분석'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Initial state - capture options
  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600"
          >
            <WarningCircle size={20} weight="fill" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo options */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={startCamera}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-[#665DC6]/30 bg-[#665DC6]/5 hover:bg-[#665DC6]/10 transition-colors"
        >
          <div className="w-14 h-14 rounded-full bg-[#665DC6]/20 flex items-center justify-center">
            <Camera size={28} className="text-[#665DC6]" weight="fill" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#665DC6]">카메라</p>
            <p className="text-xs text-gray-500 mt-0.5">음식 촬영하기</p>
          </div>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <ImageIcon size={28} className="text-gray-500" weight="fill" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">앨범</p>
            <p className="text-xs text-gray-500 mt-0.5">사진 선택하기</p>
          </div>
        </motion.button>
      </div>

      {/* Info text */}
      <div className="text-center py-2">
        <p className="text-xs text-gray-400">
          📸 음식 사진을 찍으면 AI가 자동으로 영양 정보를 분석해요
        </p>
      </div>
    </div>
  );
}
