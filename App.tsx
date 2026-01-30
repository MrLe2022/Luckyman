import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GiftIcon, UsersIcon, TrophyIcon, TrashIcon, RefreshCwIcon, HistoryIcon, UploadIcon, DownloadIcon } from './components/Icons';

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
  // State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [history, setHistory] = useState<Winner[]>([]);
  const [currentPrize, setCurrentPrize] = useState<string>('Giải Khuyến Khích');
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [displayParticipant, setDisplayParticipant] = useState<string>('---');
  const [winner, setWinner] = useState<Winner | null>(null);
  const [newName, setNewName] = useState<string>('');

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
    // Reset input
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

  // Draw Logic
  const handleDraw = () => {
    if (participants.length === 0) {
      alert("Danh sách người tham gia đang trống!");
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setWinner(null);

    // Animation interval
    let counter = 0;
    const intervalTime = 50; // ms
    
    timerRef.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * participants.length);
      setDisplayParticipant(participants[randomIndex].name);
      counter++;
    }, intervalTime);

    // Stop after 3 seconds
    setTimeout(() => {
      clearInterval(timerRef.current);
      finishDraw();
    }, 2000);
  };

  const finishDraw = () => {
    // Pick winner
    const winnerIndex = Math.floor(Math.random() * participants.length);
    const selectedWinner = participants[winnerIndex];

    // Create winner record
    const winRecord: Winner = {
      ...selectedWinner,
      prize: currentPrize,
      timestamp: new Date().toLocaleString('vi-VN')
    };

    setWinner(winRecord);
    setDisplayParticipant(selectedWinner.name);
    setHistory(prev => [winRecord, ...prev]); // Add to top of history
    
    // Remove from participants list so they can't win again
    const newParticipants = [...participants];
    newParticipants.splice(winnerIndex, 1);
    setParticipants(newParticipants);

    setIsSpinning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <GiftIcon className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Bốc Thăm Trúng Thưởng</h1>
          </div>
          <div className="flex gap-2">
             <label className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded cursor-pointer transition">
                <UploadIcon className="w-5 h-5" />
                <span>Nhập Excel</span>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
             </label>
             <button onClick={handleExportHistory} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition">
                <DownloadIcon className="w-5 h-5" />
                <span>Xuất Kết Quả</span>
             </button>
             <button onClick={handleResetAll} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition">
                <TrashIcon className="w-5 h-5" />
                <span>Xóa Hết</span>
             </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Participants */}
        <div className="lg:w-1/4 flex flex-col gap-4">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <h2 className="font-bold text-lg flex items-center gap-2 mb-3 text-gray-700">
                    <UsersIcon className="w-5 h-5 text-blue-500" />
                    Danh Sách ({participants.length})
                </h2>
                <form onSubmit={handleAddParticipant} className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Thêm tên..." 
                        className="flex-1 border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" className="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 font-medium text-sm">+</button>
                </form>
                <div className="overflow-y-auto max-h-[500px] border-t pt-2">
                    {participants.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center italic mt-4">Chưa có người tham gia</p>
                    ) : (
                        <ul className="space-y-1">
                            {participants.map((p, idx) => (
                                <li key={p.id} className="text-sm px-2 py-1.5 hover:bg-gray-100 rounded border-b border-gray-50 last:border-0 flex justify-between items-center group">
                                    <span className="truncate flex-1">{idx + 1}. {p.name}</span>
                                    <button 
                                        onClick={() => handleRemoveParticipant(p.id)}
                                        className="ml-2 text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Xóa người này"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>

        {/* Center Column: Stage */}
        <div className="lg:w-2/4 flex flex-col gap-6">
            
            {/* Control Panel */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                 <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại Giải Thưởng</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={currentPrize}
                            onChange={(e) => setCurrentPrize(e.target.value)}
                            className="flex-1 text-lg border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Ví dụ: Giải Đặc Biệt"
                        />
                    </div>
                 </div>

                 <div className="text-center bg-gray-50 rounded-2xl p-8 mb-6 border-2 border-dashed border-gray-300 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                        <GiftIcon className="w-64 h-64" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Người may mắn</p>
                    <div className={`text-4xl md:text-5xl font-extrabold text-gray-800 break-words transition-all duration-100 ${isSpinning ? 'scale-110 text-blue-600 blur-[1px]' : ''}`}>
                        {displayParticipant}
                    </div>
                 </div>

                 <button 
                    onClick={handleDraw}
                    disabled={isSpinning || participants.length === 0}
                    className={`w-full py-4 rounded-xl text-xl font-bold text-white shadow-lg transform transition active:scale-95 ${
                        isSpinning 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    }`}
                 >
                    {isSpinning ? 'Đang quay...' : 'BỐC THĂM NGAY'}
                 </button>
            </div>

            {/* Winner Notification */}
            {winner && !isSpinning && (
                <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-xl shadow-sm text-center animate-bounce-slow">
                    <h3 className="text-yellow-800 font-bold text-lg mb-1">🎉 Chúc mừng 🎉</h3>
                    <p className="text-2xl font-bold text-gray-900">{winner.name}</p>
                    <p className="text-yellow-700 mt-1">Đã trúng: {winner.prize}</p>
                </div>
            )}
        </div>

        {/* Right Column: History */}
        <div className="lg:w-1/4">
             <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-lg flex items-center gap-2 text-gray-700">
                        <HistoryIcon className="w-5 h-5 text-orange-500" />
                        Lịch Sử Trúng
                    </h2>
                    {history.length > 0 && (
                        <button onClick={handleResetHistory} className="text-xs text-red-500 hover:text-red-700 hover:underline">
                            Xóa lịch sử
                        </button>
                    )}
                </div>
                
                <div className="overflow-y-auto max-h-[600px] pr-1">
                    {history.length === 0 ? (
                         <p className="text-gray-400 text-sm text-center italic mt-4">Chưa có ai trúng thưởng</p>
                    ) : (
                        <div className="space-y-3">
                            {/* Group logic could be added here, for now simple list */}
                            {history.map((h, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-100 relative group hover:shadow-sm transition">
                                    <div className="absolute top-2 right-2 text-xs text-gray-400">{h.timestamp.split(' ')[1]}</div>
                                    <div className="font-bold text-blue-700">{h.name}</div>
                                    <div className="text-xs font-medium text-orange-600 bg-orange-50 inline-block px-1.5 py-0.5 rounded mt-1 border border-orange-100">
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

      <footer className="bg-white border-t mt-12 py-6 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Ứng dụng Bốc Thăm. Được thiết kế đơn giản và hiệu quả.
      </footer>
    </div>
  );
}