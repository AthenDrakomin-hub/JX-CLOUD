import React, { useState, useEffect } from 'react';
import { HotelRoom } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, X } from 'lucide-react';
import { translations, Language } from '../translations';

interface QRBatchPrintProps {
  rooms: HotelRoom[];
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const QRBatchPrint: React.FC<QRBatchPrintProps> = ({ rooms, isOpen, onClose, lang }) => {
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const t = (key: string) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  useEffect(() => {
    if (rooms.length > 0 && selectedRooms.length === 0) {
      // 默认选择所有房间
      setSelectedRooms(rooms.map(room => room.id));
      setSelectAll(true);
    }
  }, [rooms, selectedRooms.length]);

  const getQRUrl = (id: string) => `${window.location.origin}${window.location.pathname}?room=${id}`;

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRooms([]);
    } else {
      setSelectedRooms(rooms.map(room => room.id));
    }
    setSelectAll(!selectAll);
  };

  const handleRoomSelect = (roomId: string) => {
    if (selectedRooms.includes(roomId)) {
      setSelectedRooms(selectedRooms.filter(id => id !== roomId));
    } else {
      setSelectedRooms([...selectedRooms, roomId]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // 创建一个临时的下载链接
    const printableContent = document.getElementById('qr-print-content');
    if (printableContent) {
      const htmlContent = `
        <html>
          <head>
            <title>Room QR Codes</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .qr-container { display: inline-block; margin: 20px; text-align: center; }
              .qr-code { margin-bottom: 10px; }
              .room-id { font-weight: bold; }
            </style>
          </head>
          <body>
            ${printableContent.innerHTML}
          </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'room-qr-codes.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  const selectedRoomData = rooms.filter(room => selectedRooms.includes(room.id));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-6xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
        <div className="p-10 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{t('bulkPrintQR')}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{selectedRooms.length} {t('roomsSelected')}</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 border-b border-slate-100 flex flex-wrap gap-4">
          <button 
            onClick={handleSelectAll}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              selectAll 
                ? 'bg-[#d4af37] text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {selectAll ? t('unselectAll') : t('selectAll')}
          </button>
          
          <button 
            onClick={handlePrint}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#d4af37] transition-all flex items-center space-x-2"
          >
            <Printer size={16} />
            <span>{t('print')}</span>
          </button>
          
          <button 
            onClick={handleDownload}
            className="px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center space-x-2"
          >
            <Download size={16} />
            <span>{t('download')}</span>
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {selectedRoomData.map((room) => (
              <div 
                key={room.id} 
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${
                  selectedRooms.includes(room.id) 
                    ? 'border-[#d4af37] bg-amber-50' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => handleRoomSelect(room.id)}
              >
                <div className="flex flex-col items-center">
                  <div className="mb-4 p-4 bg-white rounded-2xl">
                    <QRCodeSVG 
                      value={getQRUrl(room.id)} 
                      size={120} 
                      level="H" 
                      fgColor="#0f172a" 
                    />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-slate-900 text-lg">{room.id}</div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">
                      {room.status === 'ready' ? t('ready') : t('occupied')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Hidden content for printing */}
      <div id="qr-print-content" className="hidden">
        <h1 className="text-3xl font-bold text-center mb-8">{t('hotelRoomQRs')}</h1>
        <div className="grid grid-cols-4 gap-8">
          {selectedRoomData.map((room) => (
            <div key={room.id} className="qr-container">
              <div className="qr-code">
                <QRCodeSVG 
                  value={getQRUrl(room.id)} 
                  size={150} 
                  level="H" 
                  fgColor="#0f172a" 
                />
              </div>
              <div className="room-id text-center font-bold">{room.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QRBatchPrint;