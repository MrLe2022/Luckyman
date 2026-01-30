import React, { useState, useEffect, useRef } from 'react';
import { GiftIcon, UsersIcon, TrashIcon, HistoryIcon, UploadIcon, DownloadIcon } from './components/Icons';

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
  const [currentPrize, setCurrentPrize] = useState<string>('Giải Khuyến Khích');
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [displayParticipant, setDisplayParticipant] = useState<string>('---');
  const [winner, setWinner] = useState<Winner | null>(null);
  const [newName, setNewName] = useState<string>('');
  
  // Settings
  const [spinDuration, setSpinDuration] = useState<number>(3); // Seconds
  const [spinSpeedLevel, setSpinSpeedLevel] = useState<number>(5); // 1-10

  const timerRef = useRef<any>(null);

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
      setDisplayParticipant('---');
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
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-600 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
               <GiftIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Lucky Draw Pro</h1>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
             <label className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md cursor-pointer transition text-sm font-medium">
                <UploadIcon className="w-4 h-4" />
                <span>Nhập Excel</span>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
             </label>
             <button onClick={handleExportHistory} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-md transition text-sm font-medium shadow-sm">
                <DownloadIcon className="w-4 h-4" />
                <span>Xuất Kết Quả</span>
             </button>
             <button onClick={handleResetAll} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-md transition text-sm font-medium shadow-sm">
                <TrashIcon className="w-4 h-4" />
                <span>Reset</span>
             </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Participants */}
        <div className="lg:w-1/4 flex flex-col gap-4 order-2 lg:order-1">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col h-[500px] lg:h-auto">
                <h2 className="font-bold text-gray-700 flex items-center gap-2 mb-3">
                    <UsersIcon className="w-5 h-5 text-blue-500" />
                    Danh Sách ({participants.length})
                </h2>
                <form onSubmit={handleAddParticipant} className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Thêm tên..." 
                        className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 font-bold shadow-sm transition">+</button>
                </form>
                <div className="flex-1 overflow-y-auto border-t border-gray-100 pt-2 custom-scrollbar">
                    {participants.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
                            <UsersIcon className="w-8 h-8 mb-2 opacity-20" />
                            <p>Danh sách trống</p>
                        </div>
                    ) : (
                        <ul className="space-y-1">
                            {participants.map((p, idx) => (
                                <li key={p.id} className="text-sm px-3 py-2 hover:bg-blue-50 rounded-md border-b border-gray-50 last:border-0 flex justify-between items-center group transition-colors">
                                    <span className="truncate flex-1 font-medium text-gray-700">{idx + 1}. {p.name}</span>
                                    <button 
                                        onClick={() => handleRemoveParticipant(p.id)}
                                        className="ml-2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
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
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                 {/* Prize Input */}
                 <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Giải thưởng hiện tại</label>
                    <input 
                        type="text" 
                        value={currentPrize}
                        onChange={(e) => setCurrentPrize(e.target.value)}
                        className="w-full text-xl font-bold text-blue-900 border-b-2 border-blue-100 px-2 py-1 focus:border-blue-500 outline-none bg-transparent transition-colors placeholder-blue-200"
                        placeholder="Nhập tên giải thưởng..."
                    />
                 </div>

                 {/* Display Stage - The "Exciting" Part */}
                 <div className="relative mb-8 group">
                    {/* Decorative lights/glow */}
                    <div className={`absolute -inset-1 rounded-2xl opacity-75 blur transition duration-500 ${isSpinning ? 'bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 animate-pulse' : 'bg-gray-200'}`}></div>
                    
                    <div className="relative bg-gray-900 rounded-xl p-10 md:p-14 text-center border-4 border-gray-800 shadow-2xl flex flex-col items-center justify-center min-h-[250px] overflow-hidden">
                        
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2px)', backgroundSize: '20px 20px'}}></div>

                        {/* Status Text */}
                        <p className={`relative z-10 text-xs font-bold uppercase tracking-[0.2em] mb-4 transition-colors ${isSpinning ? 'text-yellow-400 animate-pulse' : 'text-gray-500'}`}>
                            {isSpinning ? 'Đang quay...' : 'Người may mắn'}
                        </p>

                        {/* Main Name Display */}
                        <div className={`relative z-10 text-4xl md:text-6xl font-black text-white tracking-wide break-words drop-shadow-lg transition-all duration-75 ${isSpinning ? 'blur-[1px] scale-105' : ''}`}>
                            {displayParticipant}
                        </div>
                    </div>
                 </div>

                 {/* Settings Sliders */}
                 <div className="grid grid-cols-2 gap-6 mb-6 px-2">
                    <div>
                        <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                            <span>Tốc độ</span>
                            <span className="text-blue-600">{spinSpeedLevel}/10</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" max="10" 
                            value={spinSpeedLevel} 
                            onChange={(e) => setSpinSpeedLevel(parseInt(e.target.value))}
                            disabled={isSpinning}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                            <span>Thời gian</span>
                            <span className="text-blue-600">{spinDuration}s</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" max="10" 
                            step="0.5"
                            value={spinDuration} 
                            onChange={(e) => setSpinDuration(parseFloat(e.target.value))}
                            disabled={isSpinning}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 disabled:opacity-50"
                        />
                    </div>
                 </div>

                 {/* Main Button */}
                 <button 
                    onClick={handleDraw}
                    disabled={isSpinning || participants.length === 0}
                    className={`w-full py-4 rounded-xl text-xl font-black tracking-widest text-white shadow-xl transform transition-all active:scale-95 ${
                        isSpinning 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 hover:shadow-2xl hover:-translate-y-1'
                    }`}
                 >
                    {isSpinning ? 'ĐANG QUAY...' : 'BẮT ĐẦU QUAY'}
                 </button>
            </div>

            {/* Winner Notification Popup */}
            {winner && !isSpinning && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 p-6 rounded-xl shadow-lg text-center transform animate-[bounce_1s_infinite]">
                    <div className="inline-block p-3 bg-yellow-100 rounded-full mb-2">
                        <TrophyIcon className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h3 className="text-yellow-800 font-bold text-lg uppercase tracking-wide">Xin chúc mừng</h3>
                    <p className="text-3xl font-black text-gray-900 my-2">{winner.name}</p>
                    <div className="inline-block bg-white px-4 py-1 rounded-full border border-yellow-200 text-sm font-medium text-yellow-700 shadow-sm">
                        {winner.prize}
                    </div>
                </div>
            )}
        </div>

        {/* Right Column: History */}
        <div className="lg:w-1/4 order-3">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col h-[500px] lg:h-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2">
                        <HistoryIcon className="w-5 h-5 text-orange-500" />
                        Lịch Sử
                    </h2>
                    {history.length > 0 && (
                        <button onClick={handleResetHistory} className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition">
                            Xóa hết
                        </button>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {history.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
                            <HistoryIcon className="w-8 h-8 mb-2 opacity-20" />
                            <p>Chưa có kết quả</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((h, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100 relative group hover:shadow-md transition-all hover:bg-white hover:border-blue-200">
                                    <div className="flex justify-between items-start mb-1">
                                         <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{h.timestamp.split(' ')[1]}</span>
                                    </div>
                                    <div className="font-bold text-blue-800 text-lg mb-1">{h.name}</div>
                                    <div className="text-xs font-medium text-orange-600 bg-orange-50 inline-block px-2 py-1 rounded border border-orange-100">
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

      <footer className="mt-12 py-6 text-center text-gray-400 text-xs">
        <p>&copy; {new Date().getFullYear()} Lucky Draw App</p>
      </footer>
      
      {/* CSS Utilities for hide scrollbar but keep functionality if needed */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af; 
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
