import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn } from 'lucide-react';

const ImageCropper = ({ image, aspect, onCropDone, onCancel }: any) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-2xl h-[400px] md:h-[500px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="mt-6 flex flex-col items-center gap-6 w-full max-w-md">
        <div className="flex items-center gap-4 w-full bg-white/10 p-3 rounded-2xl backdrop-blur-md">
          <ZoomIn size={20} className="text-white/50" />
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-forest"
          />
        </div>

        <div className="flex gap-4 w-full">
          <button
            onClick={() => onCropDone(croppedAreaPixels)}
            className="flex-1 bg-forest text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-white hover:text-forest transition-all"
          >
            <Check size={20} /> تأكيد القص
          </button>
          <button
            onClick={onCancel}
            className="px-8 bg-white/10 text-white py-4 rounded-2xl font-black hover:bg-red-500 transition-all"
          >
            <X size={20} /> إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;