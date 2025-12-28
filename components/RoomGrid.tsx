
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { HotelRoom, Dish, Order, OrderStatus, PaymentMethod, RoomStatus } from '../types';
import { 
  QrCode, Printer, Download, Sparkles, Scan, Copy, Check, ExternalLink, Command, X,
  ShoppingCart, UtensilsCrossed, ArrowRight, ChevronRight, Plus, Minus, Search, Loader2,
  Camera, AlertCircle, RefreshCw, ClipboardList
} from 'lucide-react';
import { translations, Language } from '../translations';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';

interface RoomGridProps {
  rooms: HotelRoom[];
  dishes: Dish[];
  onUpdateRoom: (room: HotelRoom) => void;
  onRefresh: () => void;
  isSyncing?: boolean;
  lang: Language;
}

const RoomGrid: React.FC<RoomGridProps> = ({ rooms, dishes, onUpdateRoom, onRefresh, isSyncing, lang }) => {
  const [activeRoom, setActiveRoom] = useState<HotelRoom | null>(null);
  const [viewMode, setViewMode] = useState<'options' | 'qr' | 'manualOrder' | 'scan' | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Manual Ordering State
  const [cart, setCart] = useState<{ [dishId: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scanner State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const t = (key: string) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;
  
  const floors = useMemo(() => {
    return Array.from(new Set(rooms.map(r => r.id.substring(0, 2)))).sort();
  }, [rooms]);

  const filteredDishes = useMemo(() => {
    return dishes.filter(d => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (d.nameEn || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dishes, searchTerm]);

  const cartItems = useMemo(() => {
    return (Object.entries(cart) as [string, number][])
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const dish = dishes.find(d => d.id === id);
        return { dish, quantity: qty };
      })
      .filter(item => item.dish !== undefined);
  }, [cart, dishes]);

  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.dish!.price * item.quantity), 0);
  }, [cartItems]);

  const getQRUrl = (id: string) => `${window.location.origin}${window.location.pathname}?room=${id}`;

  const handleCopyLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(getQRUrl(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleScanInit = (room: HotelRoom, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveRoom(room);
    setViewMode('scan');
    startCamera();
  };

  const startCamera = async () => {
    setScannerError(null);
    setValidationError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access failed", err);
      setScannerError(t('cameraError'));
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const closeModal = () => {
    stopCamera();
    setActiveRoom(null);
    setViewMode(null);
    setCart({});
    setSearchTerm('');
    setScannerError(null);
    setValidationError(null);
  };

  const simulateScanSuccess = async () => {
    if (!activeRoom) return;
    setIsSubmitting(true);
    setValidationError(null);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (Math.random() < 0.2) {
      setValidationError(t('invalidQrCode'));
      setIsSubmitting(false);
      return;
    }
    
    const updatedRoom: HotelRoom = {
      ...activeRoom,
      status: RoomStatus.ORDERING,
      activeSessionId: `sess-${Date.now()}`
    };
    
    await onUpdateRoom(updatedRoom);
    setIsSubmitting(false);
    closeModal();
    onRefresh();
  };

  const handleBulkPrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const qrCodesHtml = rooms.map(room => {
      const qrUrl = getQRUrl(room.id);
      return `
        <div style="width: 33.33%; padding: 20px; box-sizing: border-box; display: inline-block; text-align: center; border: 1px solid #f1f5f9; page-break-inside: avoid;">
          <div style="font-family: 'serif'; font-style: italic; font-size: 14px; color: #b89531; margin-bottom: 5px;">JX CLOUD</div>
          <div style="font-size: 32px; font-weight: 900; margin-bottom: 15px;">ROOM ${room.id}</div>
          <div id="qr-${room.id}" style="display: flex; justify-content: center; margin-bottom: 15px;"></div>
          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">Scan to Order</div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Bulk QR Codes - ${new Date().toLocaleDateString()}</title>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
          <style>
            @media print { body { margin: 0; padding: 0; } .no-print { display: none; } }
            body { font-family: sans-serif; padding: 20px; }
            .grid { display: flex; flex-wrap: wrap; width: 100%; }
          </style>
        </head>
        <body>
          <div class="grid">${qrCodesHtml}</div>
          <script>
            window.onload = function() {
              const rooms = ${JSON.stringify(rooms.map(r => r.id))};
              const promises = rooms.map(id => {
                return new Promise((resolve) => {
                  const container = document.getElementById('qr-' + id);
                  const canvas = document.createElement('canvas');
                  QRCode.toCanvas(canvas, "${window.location.origin}${window.location.pathname}?room=" + id, { width: 180, margin: 1 }, function (error) {
                    if (error) console.error(error);
                    container.appendChild(canvas);
                    resolve();
                  });
                });
              });
              Promise.all(promises).then(() => {
                setTimeout(() => { window.print(); setTimeout(() => window.close(), 1000); }, 500);
              });
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleManualOrderSubmit = async () => {
    if (!activeRoom || cartItems.length === 0) return;
    setIsSubmitting(true);
    const taxAmount = Math.round(totalAmount * 0.12);
    const finalTotal = Math.round(totalAmount + taxAmount);
    const newOrder: Order = {
      id: `ord-manual-${Date.now()}`,
      roomId: activeRoom.id,
      items: cartItems.map(item => ({ dishId: item.dish!.id, name: item.dish!.name, quantity: item.quantity, price: item.dish!.price })),
      totalAmount: finalTotal,
      taxAmount: taxAmount,
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.CASH,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      await api.orders.create(newOrder);
      onRefresh();
      closeModal();
    } catch (error) {
      console.error('Failed to place manual order', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 bg-white/40 p-10 rounded-[4rem] border border-white shadow-sm backdrop-blur-sm">
        <div className="space-y-3">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Sparkles size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('integratedSpaceRegistry')}</span>
           </div>
           <h2 className="text-6xl font-serif italic text-slate-900 tracking-tighter leading-tight">{t('stationManagement')}</h2>
           <p className="text-sm text-slate-500 font-medium tracking-widest max-w-md leading-relaxed">
             {t('stationDesc')}
           </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           <button 
             onClick={handleBulkPrint}
             className="flex items-center space-x-4 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-[#d4af37] transition-all shadow-2xl group"
           >
              <Printer size={18} className="text-[#d4af37]" />
              <span>{t('bulkPrintQR')}</span>
           </button>
        </div>
      </div>

      {/* Grid */}
      {floors.map((floor, floorIdx) => (
        <div key={floor} className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${floorIdx * 100}ms` }}>
          <div className="flex items-center space-x-8 px-4">
             <div className="px-10 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-xl border border-white/10">
                {t('zone')} {floor}
             </div>
             <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-8">
            {rooms.filter(r => r.id.startsWith(floor)).map((room) => (
              <div key={room.id} className="group relative">
                <div
                  className={`w-full flex flex-col items-center p-8 rounded-[4rem] border-2 transition-all duration-500 hover:-translate-y-2 cursor-pointer 
                    ${room.status === 'ordering' 
                      ? 'bg-amber-50 border-amber-200 shadow-amber-100' 
                      : 'bg-white border-transparent shadow-[0_15px_40px_rgba(0,0,0,0.02)] hover:border-[#d4af37]/20'}`}
                  onClick={() => { setActiveRoom(room); setViewMode('options'); }}
                >
                  <div className="absolute top-6 right-6 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={(e) => handleCopyLink(room.id, e)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${copiedId === room.id ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:text-slate-900'}`}
                      title={lang === 'zh' ? "复制链接" : "Copy Link"}
                    >
                      {copiedId === room.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    {/* Manual Order Shortcut Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveRoom(room); setViewMode('manualOrder'); }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-90 bg-white text-slate-400 hover:text-indigo-600"
                      title={lang === 'zh' ? "人工录单" : "Manual Order"}
                    >
                      <ClipboardList size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleScanInit(room, e)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-90 bg-white text-slate-400 hover:text-[#d4af37]"
                      title={lang === 'zh' ? "扫码激活" : "Scan to Activate"}
                    >
                      <Scan size={16} />
                    </button>
                  </div>

                  <div className={`w-16 h-16 rounded-3xl transition-all flex items-center justify-center mb-6 shadow-inner
                    ${room.status === 'ordering' ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400 group-hover:bg-[#0f172a] group-hover:text-[#d4af37]'}`}>
                    {room.status === 'ordering' ? <ShoppingCart size={28} /> : <QrCode size={28} />}
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-black tracking-tighter text-slate-900">{room.id}</span>
                    <span className="text-[10px] uppercase font-black mt-1 text-slate-300 tracking-[0.3em] font-serif italic">
                      {room.status === 'ordering' ? 'Occupied' : t('station')}
                    </span>
                  </div>
                  
                  <div className={`mt-8 flex items-center justify-center transition-colors
                    ${room.status === 'ordering' ? 'text-amber-300' : 'text-[#d4af37]/20 group-hover:text-[#d4af37]'}`}>
                     {room.status === 'ordering' ? <UtensilsCrossed size={32} strokeWidth={1} /> : <Scan size={32} strokeWidth={1} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Action Selection Modal */}
      {viewMode === 'options' && activeRoom && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl animate-in fade-in duration-500" onClick={closeModal} />
          <div className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
             <div className="p-12 lg:p-16 space-y-10">
                <div className="flex items-center justify-between">
                   <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Room {activeRoom.id}</h3>
                   <button onClick={closeModal} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                      <X size={20} />
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <button 
                     onClick={() => setViewMode('qr')}
                     className="group flex flex-col items-center p-10 bg-slate-50 rounded-[3rem] border-2 border-transparent hover:border-[#d4af37] hover:bg-white transition-all"
                   >
                      <div className="w-20 h-20 bg-white shadow-xl rounded-[2rem] flex items-center justify-center text-slate-900 mb-6 group-hover:bg-[#d4af37] group-hover:text-white transition-all">
                         <QrCode size={32} />
                      </div>
                      <span className="text-sm font-black uppercase tracking-[0.3em] text-slate-900">Guest QR Code</span>
                      <p className="text-[10px] text-slate-400 font-bold mt-2">Display digital ordering link</p>
                   </button>

                   <button 
                     onClick={() => setViewMode('manualOrder')}
                     className="group flex flex-col items-center p-10 bg-slate-50 rounded-[3rem] border-2 border-transparent hover:border-[#d4af37] hover:bg-white transition-all"
                   >
                      <div className="w-20 h-20 bg-white shadow-xl rounded-[2rem] flex items-center justify-center text-slate-900 mb-6 group-hover:bg-[#d4af37] group-hover:text-white transition-all">
                         <ShoppingCart size={32} />
                      </div>
                      <span className="text-sm font-black uppercase tracking-[0.3em] text-slate-900">Manual Order</span>
                      <p className="text-[10px] text-slate-400 font-bold mt-2">Place order for guest</p>
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* QR Modal - Optimally Sized */}
      {viewMode === 'qr' && activeRoom && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl animate-in fade-in duration-500" onClick={closeModal} />
          <div className="relative w-full max-w-sm bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
             <div className="h-2 w-full bg-[#d4af37]" />
             <div className="p-10 lg:p-12 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#0f172a] rounded-[2.5rem] flex items-center justify-center text-[#d4af37] shadow-xl mb-8 relative">
                   <QrCode size={40} />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight leading-none mb-8">
                   Room <span className="font-serif italic text-[#d4af37]">{activeRoom.id}</span>
                </h3>
                <div className="relative p-8 bg-slate-50 rounded-[3rem] mb-10 ring-1 ring-slate-100">
                   <QRCodeSVG value={getQRUrl(activeRoom.id)} size={180} level="H" fgColor="#0f172a" />
                </div>
                <button onClick={closeModal} className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 hover:text-slate-950 transition-colors">Close Terminal</button>
             </div>
          </div>
        </div>
      )}

      {/* Scan Modal */}
      {viewMode === 'scan' && activeRoom && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500" onClick={closeModal} />
          <div className="relative w-full max-w-xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500 flex flex-col">
             <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div>
                   <h3 className="text-2xl font-bold text-slate-900">{lang === 'zh' ? '扫码关联' : 'Scan to Associate'}</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Room {activeRoom.id} • Session Link</p>
                </div>
                <button onClick={closeModal} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                   <X size={24} />
                </button>
             </div>
             <div className="flex-1 p-10 flex flex-col items-center justify-center space-y-8 bg-slate-50/50 min-h-[500px]">
                {scannerError ? (
                  <div className="flex flex-col items-center text-center space-y-6 py-12 animate-in zoom-in duration-300">
                     <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center shadow-inner border border-red-100"><AlertCircle size={40} /></div>
                     <div className="space-y-2">
                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-widest">{lang === 'zh' ? '相机错误' : 'Camera Error'}</h4>
                        <p className="text-sm font-medium text-slate-500 max-w-xs">{scannerError}</p>
                     </div>
                     <button onClick={startCamera} className="px-10 py-4 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#d4af37] transition-all shadow-xl active:scale-95">{lang === 'zh' ? '重新尝试开启相机' : 'Retry Camera Access'}</button>
                  </div>
                ) : (
                  <>
                    {validationError && (
                      <div className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600 animate-shake"><AlertCircle size={18} className="shrink-0" /><span className="text-xs font-bold">{validationError}</span></div>
                    )}
                    <div className="relative w-full aspect-square max-w-[320px] bg-black rounded-[4rem] overflow-hidden border-4 border-white shadow-2xl ring-1 ring-slate-200 group">
                       <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
                       <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
                       <div className="absolute inset-[40px] border-2 border-white/20 rounded-3xl flex items-center justify-center">
                          <div className={`w-48 h-48 border-2 border-dashed rounded-2xl animate-pulse ${validationError ? 'border-red-500' : 'border-[#d4af37]'}`} />
                       </div>
                       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                          <Camera size={14} className={validationError ? "text-red-500" : "text-[#d4af37]"} />
                          <span className="text-[9px] font-black text-white uppercase tracking-widest">{isSubmitting ? (lang === 'zh' ? '正在验证...' : 'Validating...') : (lang === 'zh' ? '正在扫描身份码...' : 'Scanning Identity...')}</span>
                       </div>
                    </div>
                    <div className="text-center space-y-2">
                       <p className="text-xs font-bold text-slate-500">{lang === 'zh' ? '请将摄像头对准客人的身份二维码' : 'Align camera with guest identity QR'}</p>
                       <p className="text-[10px] text-slate-400 italic">Enterprise Cloud Validation Active</p>
                    </div>
                    <button 
                      onClick={simulateScanSuccess}
                      disabled={isSubmitting || !isCameraActive}
                      className={`w-full h-16 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl transition-all flex items-center justify-center space-x-3 disabled:opacity-50 ${validationError ? 'bg-red-600 text-white' : 'bg-slate-900 text-white hover:bg-[#d4af37]'}`}
                    >
                       {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                         <>{validationError ? <RefreshCw size={18} /> : <Check size={18} />}<span>{validationError ? (lang === 'zh' ? '重新扫描' : 'Rescan Code') : (lang === 'zh' ? '手动验证并关联' : 'Manual Validate & Link')}</span></>
                       )}
                    </button>
                  </>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Manual Order Modal */}
      {viewMode === 'manualOrder' && activeRoom && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500" onClick={closeModal} />
          <div className="relative w-full max-w-6xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500 flex flex-col max-h-[90vh]">
             <div className="p-10 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                   <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Manual Order • Room {activeRoom.id}</h3>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Staff-Operated Transaction</p>
                </div>
                <button onClick={closeModal} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"><X size={24} /></button>
             </div>
             <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                <div className="lg:w-2/3 flex flex-col border-r border-slate-100 overflow-hidden bg-slate-50/50">
                   <div className="p-8 shrink-0">
                      <div className="relative">
                         <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <input type="text" placeholder="Search dishes..." className="w-full pl-14 pr-6 py-5 bg-white rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-[#d4af37]/10 transition-all font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-8 pt-0 grid grid-cols-1 md:grid-cols-2 gap-6 no-scrollbar">
                      {filteredDishes.map((dish) => (
                        <div key={dish.id} className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center space-x-4">
                           <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0"><img src={dish.imageUrl} className="w-full h-full object-cover" alt={dish.name} /></div>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-900 truncate">{dish.name}</h4>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">₱{dish.price}</p>
                           </div>
                           <div className="flex items-center space-x-3">
                              {cart[dish.id] ? (
                                <>
                                  <button onClick={() => setCart(p => ({...p, [dish.id]: Math.max(0, (p[dish.id] || 0) - 1)}))} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center hover:bg-slate-200"><Minus size={16} /></button>
                                  <span className="w-6 text-center font-black text-xs">{cart[dish.id]}</span>
                                  <button onClick={() => setCart(p => ({...p, [dish.id]: (p[dish.id] || 0) + 1}))} className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-[#d4af37]"><Plus size={16} /></button>
                                </>
                              ) : (
                                <button onClick={() => setCart(p => ({...p, [dish.id]: 1}))} className="px-6 py-2.5 bg-slate-100 text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#d4af37] hover:text-white transition-all">Add</button>
                              )}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="lg:w-1/3 flex flex-col bg-white overflow-hidden">
                   <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0">
                      <span className="text-sm font-black uppercase tracking-widest">Order Summary</span>
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black">{cartItems.length} Items</span>
                   </div>
                   <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
                      {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 opacity-40"><ShoppingCart size={48} /><p className="text-sm font-black uppercase tracking-widest">Cart is empty</p></div>
                      ) : (
                        cartItems.map(item => (
                          <div key={item.dish!.id} className="flex justify-between items-center py-2">
                             <div className="flex flex-col"><span className="text-sm font-bold text-slate-900">{item.dish!.name}</span><span className="text-[10px] text-slate-400">₱{item.dish!.price} x {item.quantity}</span></div>
                             <span className="font-bold text-slate-900">₱{item.dish!.price * item.quantity}</span>
                          </div>
                        ))
                      )}
                   </div>
                   <div className="p-10 bg-slate-50 border-t border-slate-100 space-y-6 shrink-0">
                      <div className="space-y-3">
                         <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Subtotal</span><span className="font-bold text-slate-900">₱{totalAmount.toFixed(0)}</span></div>
                         <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Tax (12%)</span><span className="font-bold text-slate-900">₱{(totalAmount * 0.12).toFixed(0)}</span></div>
                         <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline"><span className="text-xs font-black uppercase tracking-widest">Total Bill</span><span className="text-3xl font-serif italic text-[#d4af37]">₱{(totalAmount * 1.12).toFixed(0)}</span></div>
                      </div>
                      <button onClick={handleManualOrderSubmit} disabled={cartItems.length === 0 || isSubmitting} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-[#d4af37] transition-all disabled:opacity-50 flex items-center justify-center space-x-3">{isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (<><span>Authorize Order</span><ArrowRight size={18} /></>)}</button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomGrid;
