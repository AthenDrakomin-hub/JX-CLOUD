
import React, { useState } from 'react';
import { HotelRoom, RoomStatus } from '../types';
import { 
  QrCode, Printer, Download, Sparkles, Scan
} from 'lucide-react';
import { translations, Language } from '../translations';
import { QRCodeSVG } from 'qrcode.react';

interface RoomGridProps {
  rooms: HotelRoom[];
  onUpdateRoom: (room: HotelRoom) => void; // 保留接口以防后续点餐触发状态
  lang: Language;
}

const RoomGrid: React.FC<RoomGridProps> = ({ rooms, lang }) => {
  const [qrState, setQrState] = useState<{ isOpen: boolean; roomId?: string }>({ isOpen: false });
  
  const t = (key: keyof typeof translations.zh) => translations[lang][key] || key;
  
  const floors = Array.from(new Set(rooms.map(r => r.id.substring(0, 2)))).sort();

  const getQRUrl = (id: string) => `${window.location.origin}${window.location.pathname}?room=${id}`;

  return (
    <div className="space-y-16">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('integratedSpaceRegistry')}</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">{t('stationManagement')}</h2>
           <p className="text-xs text-slate-400 font-medium tracking-widest max-w-md leading-relaxed">
             {t('stationDesc')}
           </p>
        </div>
        <div className="flex items-center space-x-4">
           <button className="flex items-center space-x-3 px-8 py-4 bg-white border border-slate-100 text-slate-500 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              <Printer size={16} />
              <span>{t('bulkPrintQR')}</span>
           </button>
           <button className="flex items-center space-x-3 px-8 py-4 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#d4af37] transition-all shadow-2xl active:scale-95">
              <Download size={16} />
              <span>{t('syncAllData')}</span>
           </button>
        </div>
      </div>

      {floors.map(floor => (
        <div key={floor} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center space-x-6">
             <div className="px-8 py-2.5 bg-[#0f172a] text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-lg">{t('zone')} {floor}</div>
             <div className="h-[1px] flex-1 bg-slate-100" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-8">
            {rooms.filter(r => r.id.startsWith(floor)).map(room => {
              return (
                <div key={room.id} className="group relative">
                  <button
                    onClick={() => setQrState({ isOpen: true, roomId: room.id })}
                    className="w-full flex flex-col items-center p-8 rounded-[3.5rem] border border-slate-100 bg-white transition-all duration-700 group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] group-hover:-translate-y-3"
                  >
                    <div className="p-4 rounded-2xl transition-all text-slate-400 bg-slate-50 group-hover:bg-white group-hover:shadow-inner mb-6">
                      <QrCode size={22} />
                    </div>

                    <span className="text-3xl font-black tracking-tighter text-slate-900">{room.id}</span>
                    <span className="text-[9px] uppercase font-black mt-1 text-slate-300 tracking-[0.2em]">{t('station')}</span>
                    
                    <div className="mt-8 p-3 bg-white rounded-2xl border border-slate-50 shadow-sm opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                       <QRCodeSVG 
                          value={getQRUrl(room.id)} 
                          size={48} 
                          level="M"
                          includeMargin={false}
                          className="grayscale group-hover:grayscale-0 transition-all duration-700"
                       />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {qrState.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xl animate-in fade-in duration-500" onClick={() => setQrState({ isOpen: false })} />
          
          <div className="relative w-full max-w-lg bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
             <div className="h-2 w-full bg-[#d4af37]" />
             
             <div className="p-16 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-[#0f172a] rounded-[2.5rem] flex items-center justify-center text-[#d4af37] shadow-2xl mb-10 relative">
                   <QrCode size={48} />
                   <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#d4af37] rounded-2xl flex items-center justify-center text-[#0f172a] shadow-lg border-4 border-white">
                      <Scan size={18} />
                   </div>
                </div>
                
                <h3 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">{t('station')} {qrState.roomId}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mb-12">Universal Ordering Protocol • Secure Link</p>
                
                <div className="relative group p-12 bg-slate-50 rounded-[4rem] shadow-inner border border-slate-100 mb-12">
                   <QRCodeSVG 
                      value={getQRUrl(qrState.roomId || '')} 
                      size={240} 
                      level="H"
                      className="group-hover:scale-105 transition-transform duration-700"
                   />
                </div>
                
                <div className="w-full space-y-4">
                   <button 
                     onClick={() => {
                        const canvas = document.querySelector('svg');
                        if (canvas) {
                          const svgData = new XMLSerializer().serializeToString(canvas);
                          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                          const url = URL.createObjectURL(svgBlob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `QR_Room_${qrState.roomId}.svg`;
                          link.click();
                        }
                     }}
                     className="w-full py-6 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-[#d4af37] transition-all active:scale-[0.98]"
                   >
                     {t('downloadVector')}
                   </button>
                   <button 
                     onClick={() => setQrState({ isOpen: false })} 
                     className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 hover:text-slate-900 transition-colors py-4"
                   >
                     {t('closeTerminal')}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomGrid;
