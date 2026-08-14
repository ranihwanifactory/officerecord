import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check, PenTool, Stamp } from 'lucide-react';

interface SignatureModalProps {
  workerName: string;
  initialSignature?: string;
  onSave: (signatureDataUrl: string) => void;
  onClose: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  workerName,
  initialSignature,
  onSave,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [penColor, setPenColor] = useState('#0f172a'); // default black/slate-900

  // Canvas Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI display
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const width = 500;
    const height = 220;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = penColor;

    // If initial signature exists, load it
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        setHasContent(true);
      };
      img.src = initialSignature;
    } else {
      // Clear canvas to transparent
      ctx.clearRect(0, 0, width, height);
    }
  }, []);

  // Update pen color
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = penColor;
  }, [penColor]);

  // Coordinate helper
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasContent(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    setHasContent(false);
  };

  // Generate a realistic Korean red circle seal / stamp
  const handleGenerateStamp = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const width = 500;
    const height = 220;

    // Clear first
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 58;

    // Red circle border
    ctx.save();
    ctx.strokeStyle = '#dc2626'; // red-600
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner subtle circle
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 4, 0, Math.PI * 2);
    ctx.stroke();

    // Text: Name + 印 (e.g., "이성복印")
    const cleanName = (workerName || '인부').trim().slice(0, 4);
    const stampText = cleanName.length <= 3 ? `${cleanName}印` : cleanName;

    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (stampText.length === 4) {
      // 2x2 grid typical Korean seal style
      ctx.font = 'bold 22px "Batang", "Gungsuh", serif';
      ctx.fillText(stampText[0], centerX + 16, centerY - 16);
      ctx.fillText(stampText[1], centerX + 16, centerY + 16);
      ctx.fillText(stampText[2], centerX - 16, centerY - 16);
      ctx.fillText(stampText[3], centerX - 16, centerY + 16);
    } else {
      // Horizontal or stacked
      ctx.font = 'bold 20px "Batang", "Gungsuh", serif';
      ctx.fillText(stampText, centerX, centerY);
    }

    ctx.restore();
    setHasContent(true);
  };

  const handleComplete = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!hasContent) {
      // Allow saving empty or confirm
      onSave('');
      onClose();
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                위임인 서명 / 날인
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-blue-600 dark:text-blue-400">{workerName || '인부'}</span> 님의 서명을 마우스나 터치로 입력해 주세요.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Signature Canvas Box */}
        <div className="space-y-2">
          <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/50 flex flex-col items-center justify-center overflow-hidden touch-none select-none">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="cursor-crosshair block w-full max-w-[500px] h-[220px]"
              style={{ touchAction: 'none' }}
            />

            {!hasContent && !isDrawing && (
              <div className="absolute pointer-events-none text-slate-400 dark:text-slate-600 text-xs font-semibold flex flex-col items-center space-y-1">
                <PenTool className="w-6 h-6 stroke-[1.5]" />
                <span>여기에 마우스 또는 손가락으로 서명하세요</span>
              </div>
            )}
          </div>

          {/* Quick Tools Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPenColor('#0f172a')}
                className={`w-6 h-6 rounded-full bg-slate-900 border-2 transition-all ${
                  penColor === '#0f172a' ? 'ring-2 ring-blue-500 ring-offset-1 border-white' : 'border-transparent opacity-60'
                }`}
                title="검정 펜"
              />
              <button
                type="button"
                onClick={() => setPenColor('#2563eb')}
                className={`w-6 h-6 rounded-full bg-blue-600 border-2 transition-all ${
                  penColor === '#2563eb' ? 'ring-2 ring-blue-500 ring-offset-1 border-white' : 'border-transparent opacity-60'
                }`}
                title="파랑 펜"
              />
              <button
                type="button"
                onClick={() => setPenColor('#dc2626')}
                className={`w-6 h-6 rounded-full bg-red-600 border-2 transition-all ${
                  penColor === '#dc2626' ? 'ring-2 ring-blue-500 ring-offset-1 border-white' : 'border-transparent opacity-60'
                }`}
                title="빨강 펜 (인감색)"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleGenerateStamp}
                className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                title="자동 도장 인감 날인 생성"
              >
                <Stamp className="w-3.5 h-3.5" />
                <span>도장 날인 생성</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>다시 쓰기</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleComplete}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>서명 날인 완료</span>
          </button>
        </div>

      </div>
    </div>
  );
};
