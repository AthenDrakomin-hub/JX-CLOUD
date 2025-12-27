import React, { useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { HotelRoom } from '../types';
import { translations, Language } from '../translations';

interface RoomQRCodeProps {
  room: HotelRoom;
  baseUrl: string;
  lang: Language;
}

const RoomQRCode: React.FC<RoomQRCodeProps> = ({ room, baseUrl, lang }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)?.[key] || (translations.zh as any)[key] || key;

  const roomUrl = `${baseUrl}?room=${room.id}`;
  
  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `room-${room.id}-qrcode.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {t('station')} {room.id}
        </h3>
        <p className="text-slate-500 text-sm">
          {t('scanToMenu')}
        </p>
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-white rounded-2xl shadow-lg">
          <QRCodeCanvas
            id="qrCode"
            value={roomUrl}
            size={200}
            level="H"
            includeMargin={true}
            className="border-4 border-slate-100 rounded-xl"
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-xs text-slate-400 mb-4 break-words px-4">
          {roomUrl}
        </p>
        <button
          onClick={handleDownload}
          className="px-6 py-3 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-colors"
        >
          {t('downloadVector')}
        </button>
      </div>
    </div>
  );
};

export default RoomQRCode;