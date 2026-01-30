import React, { useState, useEffect, useRef } from 'react';
import { GiftIcon, UsersIcon, TrashIcon, HistoryIcon, UploadIcon, DownloadIcon, VolumeIcon, VolumeXIcon } from './components/Icons';

declare const XLSX: any;

const LOCAL_STORAGE_KEY_PARTICIPANTS = 'luckyDraw_participants';
const LOCAL_STORAGE_KEY_HISTORY = 'luckyDraw_history';

interface Participant {
  id: string;
  name: string;
}

interface Winner {
  id: string;
  name: string;
  prize: string;
  timestamp: string;
}

export default function App() {
  // State Data
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [history, setHistory] = useState<Winner[]>([]);
  
  // State Config & UI
  const [currentPrize, setCurrentPrize] = useState<string>('Giải Đặc Biệt');
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [displayParticipant, setDisplayParticipant] = useState<string>('CHÚC MỪNG NĂM MỚI');
  const [winner, setWinner] = useState<Winner | null>(null);
  const [newName, setNewName] = useState<string>('');
  
  // Settings
  const [spinDuration, setSpinDuration] = useState<number>(3); // Seconds
  const [spinSpeedLevel, setSpinSpeedLevel] = useState<number>(5); // 1-10
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context on first interaction
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Sound Effect: Tick (Mechanical Click)
  const playTickSound = () => {
    if (isMuted || !audioContextRef.current) return;
    
    try {
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Woodblock sound simulation for "Tet" vibe
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.error("Audio play error", e);
    }
  };

  // Sound Effect: Win (Fanfare)
  const playWinSound = () => {
    if (isMuted || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      
      const playNote = (freq: number, startTime: number, duration: number, type: OscillatorType = 'triangle') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type; 
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Pentatonic Scale (Asian vibe)
      playNote(523.25, now, 0.3);       // C5
      playNote(587.33, now + 0.1, 0.3); // D5
      playNote(659.25, now + 0.2, 0.3); // E5
      playNote(783.99, now + 0.3, 0.3); // G5
      playNote(880.00, now + 0.4, 0.6, 'sine'); // A5
      playNote(1046.50, now + 0.6, 1.0, 'sine'); // C6
      
    } catch (e) {
      console.error("Audio play error", e);
    }
  };

  // Load data from LocalStorage on mount
  useEffect(() => {
    try {
      const storedParticipants = localStorage.getItem(LOCAL_STORAGE_KEY_PARTICIPANTS);
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY_HISTORY);

      if (storedParticipants) setParticipants(JSON.parse(storedParticipants));
      if (storedHistory) setHistory(JSON.parse(storedHistory));
    } catch (error) {
      console.error("Error loading data from local storage", error);
    }
  }, []);

  // Save data to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_PARTICIPANTS, JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(history));
  }, [history]);

  // Import Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Flatten array and filter valid names
        const names: string[] = jsonData.flat().filter((n: any) => typeof n === 'string' && n.trim() !== '');
        
        const newParticipants: Participant[] = names.map(name => ({
          id: crypto.randomUUID(),
          name: name.trim()
        }));

        setParticipants(prev => [...prev, ...newParticipants]);
        alert(`Đã nhập thành công ${newParticipants.length} người tham gia!`);
      } catch (error) {
        console.error("Excel import error:", error);
        alert("Lỗi khi đọc file Excel. Vui lòng thử lại.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; 
  };

  // Export Excel
  const handleExportHistory = () => {
    if (history.length === 0) {
      alert("Chưa có dữ liệu lịch sử để xuất.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(history.map(h => ({
      "Tên người trúng": h.name,
      "Giải thưởng": h.prize,
      "Thời gian": h.timestamp
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách trúng thưởng");
    XLSX.writeFile(wb, "Ket_qua_boc_tham.xlsx");
  };

  // Add single participant manually
  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setParticipants([...participants, { id: crypto.randomUUID(), name: newName.trim() }]);
    setNewName('');
  };

  // Remove single participant
  const handleRemoveParticipant = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa người này khỏi danh sách?")) {
      setParticipants(prev => prev.filter(p => p.id !== id));
    }
  };

  // Clear all data
  const handleResetAll = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu (Người tham gia và Lịch sử)?")) {
      setParticipants([]);
      setHistory([]);
      setWinner(null);
      setDisplayParticipant('CHÚC MỪNG NĂM MỚI');
    }
  };
  
  // Clear only history
  const handleResetHistory = () => {
     if (confirm("Bạn có chắc chắn muốn xóa lịch sử trúng thưởng?")) {
      setHistory([]);
      setWinner(null);
    }
  }

  // --- Logic Quay Số Nâng Cao ---
  const handleDraw = () => {
    if (participants.length === 0) {
      alert("Danh sách người tham gia đang trống!");
      return;
    }

    if (isSpinning) return;

    // Initialize Audio Context (user gesture)
    initAudio();

    setIsSpinning(true);
    setWinner(null);

    // Tính toán thông số quay
    const baseInterval = 120 - (spinSpeedLevel * 10); // Level 1 = 110ms, Level 10 = 20ms
    const totalDuration = spinDuration * 1000;
    let currentInterval = baseInterval;
    let elapsedTime = 0;
    
    // Hàm quay đệ quy
    const spinLoop = () => {
      // Chọn ngẫu nhiên để hiển thị
      const randomIndex = Math.floor(Math.random() * participants.length);
      const currentName = participants[randomIndex].name;
      setDisplayParticipant(currentName);
      
      // Play Tick Sound
      playTickSound();

      elapsedTime += currentInterval;

      // Logic giảm tốc (Deceleration)
      // Nếu đã quay được 70% thời gian, bắt đầu làm chậm lại
      if (elapsedTime > totalDuration * 0.7) {
         currentInterval = Math.floor(currentInterval * 1.1); // Tăng độ trễ lên 10% mỗi lần
      }

      if (elapsedTime < totalDuration) {
        timerRef.current = setTimeout(spinLoop, currentInterval);
      } else {
        // Kết thúc quay, chốt người đang hiển thị là người thắng
        finishDraw(participants[randomIndex]);
      }
    };

    spinLoop();
  };

  const finishDraw = (selectedWinner: Participant) => {
    // Play Win Sound
    playWinSound();

    // Tạo record người thắng
    const winRecord: Winner = {
      ...selectedWinner,
      prize: currentPrize,
      timestamp: new Date().toLocaleString('vi-VN')
    };

    setWinner(winRecord);
    setHistory(prev => [winRecord, ...prev]); 
    
    // Xóa khỏi danh sách tham gia
    setParticipants(prev => prev.filter(p => p.id !== selectedWinner.id));
    
    setIsSpinning(false);
  };

  return (
    <div className="min-h-screen bg-red-50 text-gray-800 font-sans selection:bg-yellow-200">
      {/* Decorative Tet Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-5 z-0" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d00000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
           }}>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-red-800 via-red-700 to-red-800 text-white p-4 shadow-lg sticky top-0 z-10 border-b-4 border-yellow-500">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4 relative">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded-full shadow-inner border-2 border-yellow-200">
               <GiftIcon className="w-6 h-6 text-red-900" />
            </div>
            <h1 className="text-xl md:text-3xl font-black tracking-tighter uppercase text-yellow-300 drop-shadow-md">
                Lộc Xuân May Mắn
            </h1>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-2">
             <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 bg-red-900/50 hover:bg-red-900 rounded-full transition mr-2 border border-red-400"
                title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
             >
                {isMuted ? <VolumeXIcon className="w-5 h-5 text-yellow-200" /> : <VolumeIcon className="w-5 h-5 text-yellow-200" />}
             </button>

             <label className="flex items-center gap-2 bg-red-900/50 hover:bg-red-900 border border-red-400 px-3 py-1.5 rounded-md cursor-pointer transition text-sm font-bold text-yellow-100 hover:text-white">
                <UploadIcon className="w-4 h-4" />
                <span>Nhập Excel</span>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
             </label>
             <button onClick={handleResetAll} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-md transition text-sm font-bold shadow-sm border border-red-400">
                <TrashIcon className="w-4 h-4" />
                <span>Reset</span>
             </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* Left Column: Participants */}
        <div className="lg:w-1/4 flex flex-col gap-4 order-2 lg:order-1">
            <div className="bg-white p-4 rounded-xl shadow-md border-2 border-red-100 flex flex-col h-[500px] lg:h-auto">
                <h2 className="font-bold text-red-800 flex items-center gap-2 mb-3 border-b border-red-100 pb-2">
                    <UsersIcon className="w-5 h-5 text-red-600" />
                    Danh Sách ({participants.length})
                </h2>
                <form onSubmit={handleAddParticipant} className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Thêm tên..." 
                        className="flex-1 border border-red-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-red-50 placeholder-red-300"
                    />
                    <button type="submit" className="bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700 font-bold shadow-sm transition border-b-2 border-red-800">+</button>
                </form>
                <div className="flex-1 overflow-y-auto pt-2 custom-scrollbar">
                    {participants.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-red-300 text-sm italic">
                            <UsersIcon className="w-8 h-8 mb-2 opacity-30" />
                            <p>Danh sách trống</p>
                        </div>
                    ) : (
                        <ul className="space-y-1">
                            {participants.map((p, idx) => (
                                <li key={p.id} className="text-sm px-3 py-2 hover:bg-yellow-50 rounded-md border-b border-gray-100 last:border-0 flex justify-between items-center group transition-colors">
                                    <span className="truncate flex-1 font-medium text-gray-700">{idx + 1}. {p.name}</span>
                                    <button 
                                        onClick={() => handleRemoveParticipant(p.id)}
                                        className="ml-2 text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                        title="Xóa"
                                    >
                                        <TrashIcon className="w-3.5 h-3.5" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>

        {/* Center Column: Stage */}
        <div className="lg:w-2/4 flex flex-col gap-6 order-1 lg:order-2">
            
            {/* Control Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-yellow-200 relative overflow-hidden">
                 {/* Decorative Corner Flowers (CSS only) */}
                 <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-100 to-transparent rounded-bl-3xl -z-0"></div>
                 <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-red-100 to-transparent rounded-tr-3xl -z-0"></div>

                 {/* Prize Input */}
                 <div className="mb-6 relative z-10">
                    <label className="block text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Giải thưởng</label>
                    <input 
                        type="text" 
                        value={currentPrize}
                        onChange={(e) => setCurrentPrize(e.target.value)}
                        className="w-full text-2xl font-black text-red-700 border-b-2 border-red-200 px-2 py-1 focus:border-red-500 outline-none bg-transparent transition-colors placeholder-red-200 text-center"
                        placeholder="Nhập tên giải..."
                    />
                 </div>

                 {/* Display Stage - The "Tet" Part */}
                 <div className="relative mb-8 group perspective-1000">
                    
                    {/* Lantern strings */}
                    <div className="absolute -top-4 left-4 w-0.5 h-12 bg-red-300 z-20 flex flex-col items-center">
                        <div className="mt-12 w-8 h-10 bg-red-600 rounded-lg shadow-lg border-t-4 border-yellow-400 relative">
                             <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-6 border-l border-r border-yellow-400/50"></div>
                        </div>
                    </div>
                    <div className="absolute -top-8 right-8 w-0.5 h-16 bg-red-300 z-20 flex flex-col items-center">
                        <div className="mt-16 w-10 h-12 bg-red-600 rounded-lg shadow-lg border-t-4 border-yellow-400 relative">
                             <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-5 h-8 border-l border-r border-yellow-400/50"></div>
                        </div>
                    </div>

                    {/* Main Stage Box */}
                    <div className="relative bg-red-900 rounded-2xl p-10 md:p-14 text-center border-[6px] border-yellow-500 shadow-2xl flex flex-col items-center justify-center min-h-[300px] overflow-hidden outline outline-4 outline-red-800 outline-offset-2">
                        
                        {/* Inner corner decorations */}
                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-yellow-400"></div>
                        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-yellow-400"></div>
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-yellow-400"></div>
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-yellow-400"></div>

                        {/* Background Pattern - Tet/Traditional */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" 
                             style={{backgroundImage: 'radial-gradient(circle, #fbbf24 1px, transparent 1px)', backgroundSize: '24px 24px'}}>
                        </div>

                        {/* Background Rays - Dynamic for Winner */}
                        {!isSpinning && winner && (
                            <div className="absolute inset-0 pointer-events-none z-0 opacity-40 animate-[spin_12s_linear_infinite]">
                                <div className="w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,_#FCD34D_0deg,_transparent_30deg,_#FCD34D_120deg,_transparent_150deg,_#FCD34D_240deg,_transparent_270deg,_#FCD34D_360deg)] scale-[2]"></div>
                            </div>
                        )}

                        {/* Status Text */}
                        <p className={`relative z-10 text-xs font-bold uppercase tracking-[0.2em] mb-4 transition-colors ${isSpinning ? 'text-yellow-300 animate-pulse' : 'text-red-300/80'}`}>
                            {isSpinning ? 'Đang tìm chủ nhân...' : 'Xin chúc mừng'}
                        </p>

                        {/* Main Name Display */}
                        <div className={`relative z-10 font-black tracking-wide break-words drop-shadow-2xl transition-all duration-75 
                            ${isSpinning ? 'text-4xl md:text-5xl text-yellow-100 blur-[0.5px]' : ''}
                            ${!isSpinning && winner ? 'text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 animate-winner-pop' : 'text-4xl md:text-6xl text-yellow-50'}
                            ${!isSpinning && !winner ? 'text-white/80' : ''}
                        `}>
                            {displayParticipant}
                        </div>
                    </div>
                 </div>

                 {/* Settings Sliders */}
                 <div className="grid grid-cols-2 gap-6 mb-6 px-2 bg-red-50 p-4 rounded-xl border border-red-100">
                    <div>
                        <div className="flex justify-between text-xs font-bold text-red-600 mb-2">
                            <span>Tốc độ</span>
                            <span className="bg-red-200 px-2 rounded-full">{spinSpeedLevel}</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" max="10" 
                            value={spinSpeedLevel} 
                            onChange={(e) => setSpinSpeedLevel(parseInt(e.target.value))}
                            disabled={isSpinning}
                            className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600 hover:accent-red-500 disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs font-bold text-red-600 mb-2">
                            <span>Thời gian</span>
                            <span className="bg-red-200 px-2 rounded-full">{spinDuration}s</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" max="10" 
                            step="0.5"
                            value={spinDuration} 
                            onChange={(e) => setSpinDuration(parseFloat(e.target.value))}
                            disabled={isSpinning}
                            className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600 hover:accent-red-500 disabled:opacity-50"
                        />
                    </div>
                 </div>

                 {/* Main Button */}
                 <button 
                    onClick={handleDraw}
                    disabled={isSpinning || participants.length === 0}
                    className={`w-full py-4 rounded-xl text-2xl font-black uppercase tracking-widest shadow-[0_4px_0_rgb(180,83,9)] transform transition-all active:shadow-none active:translate-y-[4px] border-2 border-yellow-200 ${
                        isSpinning 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed border-gray-500 shadow-none' 
                        : 'bg-gradient-to-b from-yellow-400 to-yellow-600 text-red-900 hover:from-yellow-300 hover:to-yellow-500'
                    }`}
                 >
                    {isSpinning ? 'ĐANG QUAY...' : 'QUAY THƯỞNG'}
                 </button>
            </div>

            {/* Winner Notification Popup */}
            {winner && !isSpinning && (
                <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-800 border-4 border-yellow-400 p-6 rounded-xl shadow-2xl text-center transform animate-[bounce_1s_infinite]">
                    {/* Confetti effect (simple CSS dots) */}
                    <div className="absolute top-2 left-4 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                    <div className="absolute top-8 right-10 w-3 h-3 bg-white rounded-full animate-bounce"></div>
                    
                    <div className="inline-block p-3 bg-yellow-500 rounded-full mb-3 shadow-lg border-2 border-yellow-200">
                        <TrophyIcon className="w-10 h-10 text-red-900" />
                    </div>
                    <h3 className="text-yellow-200 font-bold text-xl uppercase tracking-wide mb-1">Chúc Mừng Năm Mới</h3>
                    <p className="text-4xl font-black text-white my-3 drop-shadow-md uppercase">{winner.name}</p>
                    <div className="inline-block bg-yellow-100 px-6 py-2 rounded-full border-2 border-yellow-500 text-base font-bold text-red-800 shadow-sm">
                        {winner.prize}
                    </div>
                </div>
            )}
        </div>

        {/* Right Column: History */}
        <div className="lg:w-1/4 order-3">
             <div className="bg-white p-4 rounded-xl shadow-md border-2 border-red-100 flex flex-col h-[500px] lg:h-auto">
                <div className="flex justify-between items-center mb-4 border-b border-red-100 pb-2">
                    <h2 className="font-bold text-red-800 flex items-center gap-2">
                        <HistoryIcon className="w-5 h-5 text-yellow-600" />
                        Lịch Sử
                    </h2>
                    {history.length > 0 && (
                        <button onClick={handleExportHistory} className="flex items-center gap-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded font-bold">
                            <DownloadIcon className="w-3 h-3" /> Xuất Excel
                        </button>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {history.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-red-300 text-sm italic">
                            <HistoryIcon className="w-8 h-8 mb-2 opacity-30" />
                            <p>Chưa có kết quả</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((h, idx) => (
                                <div key={idx} className="bg-red-50 p-3 rounded-lg border border-red-100 relative group hover:shadow-md transition-all hover:bg-white hover:border-yellow-300">
                                    <div className="flex justify-between items-start mb-1">
                                         <span className="text-[10px] font-bold text-red-400 uppercase">Lượt {history.length - idx}</span>
                                         <span className="text-[10px] font-semibold text-gray-400">{h.timestamp.split(' ')[1]}</span>
                                    </div>
                                    <div className="font-bold text-red-800 text-lg mb-1 leading-tight">{h.name}</div>
                                    <div className="text-xs font-bold text-yellow-700 bg-yellow-100 inline-block px-2 py-0.5 rounded border border-yellow-200">
                                        {h.prize}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             </div>
        </div>

      </main>

      <footer className="mt-12 py-6 text-center text-red-400/60 text-xs font-medium relative z-10">
        <p>&copy; {new Date().getFullYear()} Xuân Giáp Thìn - Vạn Sự Như Ý</p>
      </footer>
      
      {/* CSS Utilities */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #fff1f2; /* red-50 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #fca5a5; /* red-300 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ef4444; /* red-500 */
        }

        @keyframes winner-pop {
            0% { transform: scale(0.8); opacity: 0; }
            40% { transform: scale(1.1) rotate(-3deg); opacity: 1; }
            60% { transform: scale(1.1) rotate(3deg); }
            80% { transform: scale(1.1) rotate(-3deg); }
            100% { transform: scale(1) rotate(0); }
        }
        .animate-winner-pop {
            animation: winner-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
            text-shadow: 2px 2px 0px rgba(180, 83, 9, 0.5); /* Shadow for gold text */
        }
      `}</style>
    </div>
  );
}

// Add TropyIcon definition here to ensure it works if missing in Icons file or just to be safe in this full replacement
const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
        <path d="M4 22h16"></path>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.87 18.75 7 20.24 7 22"></path>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.13 18.75 17 20.24 17 22"></path>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
    </svg>
);
