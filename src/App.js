import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Target, Dumbbell, Briefcase, Wallet, Users, Plus, ChevronLeft, ChevronRight, Trash2, FileText, Settings, Download, Upload, X } from 'lucide-react';

// --- Компоненты иконок ---
const ICONS = {
  goals: Target,
  sport: Dumbbell,
  work: Briefcase,
  finance: Wallet,
  family: Users
};

const CATEGORIES = [
  { id: 'goals', label: 'Цели' },
  { id: 'sport', label: 'Спорт' },
  { id: 'work', label: 'Работа' },
  { id: 'finance', label: 'Финансы' },
  { id: 'family', label: 'Семья' }
];

// --- Утилиты ---
const formatDateKey = (date) => date.toISOString().split('T')[0];

const triggerHaptic = () => {
  if (navigator.vibrate) {
    navigator.vibrate(10); 
  }
};

const getDatesInRange = (startDate, daysCount) => {
  const dates = [];
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(formatDateKey(d));
  }
  return dates;
};

const getPathData = (points, width, height, padding, maxVal) => {
  if (points.length === 0) return "";
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;
  const stepX = graphWidth / (points.length - 1 || 1);
  const coords = points.map((val, i) => ({
    x: padding + i * stepX,
    y: height - padding - (val / maxVal) * graphHeight
  }));
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? 0 : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

// --- Компонент задачи со свайпом ---
const SwipeableTask = ({ task, onDelete }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const startX = useRef(null);
  
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (startX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    if (diff < 0) setOffsetX(diff);
  };

  const handleTouchEnd = () => {
    if (offsetX < -100) {
      setIsDeleting(true);
      triggerHaptic();
      setTimeout(() => onDelete(task.id), 300);
      setOffsetX(-1000);
    } else {
      setOffsetX(0);
    }
    startX.current = null;
  };

  return (
    <div className={`relative overflow-hidden mb-2 rounded-lg transition-all duration-300 ${isDeleting ? 'max-h-0 opacity-0 mb-0' : 'max-h-20 opacity-100'}`}>
      <div className="absolute inset-0 bg-red-900/30 flex items-center justify-end pr-4 rounded-lg">
        <Trash2 className="text-red-500" size={20} />
      </div>
      <div 
        className="relative bg-black flex items-center justify-between p-3 border-b border-gray-900"
        style={{ transform: `translateX(${offsetX}px)`, transition: startX.current ? 'none' : 'transform 0.3s ease-out' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <span className="text-gray-300 font-light select-none">{task.text}</span>
        <ChevronLeft className="text-gray-700 opacity-30" size={16} />
      </div>
    </div>
  );
};

// --- Основной компонент ---
export default function App() {
  const [data, setData] = useState({});
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week');
  const [showNote, setShowNote] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Инициализация
  useEffect(() => {
    const savedData = localStorage.getItem('dayTrackerData_v2');
    const savedTasks = localStorage.getItem('dayTrackerTasks_v2');
    if (savedData) setData(JSON.parse(savedData));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
  }, []);

  // Сохранение
  useEffect(() => {
    localStorage.setItem('dayTrackerData_v2', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('dayTrackerTasks_v2', JSON.stringify(tasks));
  }, [tasks]);

  const dateKey = formatDateKey(currentDate);
  const dayData = data[dateKey] || { categories: {}, mood: 3, note: '' };

  // Логика действий
  const toggleCategory = (catId) => {
    triggerHaptic();
    const newData = { ...data };
    if (!newData[dateKey]) newData[dateKey] = { categories: {}, mood: 3, note: '' };
    newData[dateKey].categories = { ...newData[dateKey].categories, [catId]: !newData[dateKey].categories[catId] };
    setData(newData);
  };

  const setMood = (val) => {
    const newData = { ...data };
    if (!newData[dateKey]) newData[dateKey] = { categories: {}, mood: 3, note: '' };
    newData[dateKey].mood = Number(val);
    setData(newData);
  };

  const updateNote = (text) => {
    const newData = { ...data };
    if (!newData[dateKey]) newData[dateKey] = { categories: {}, mood: 3, note: '' };
    newData[dateKey].note = text;
    setData(newData);
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask }]);
    setNewTask('');
    triggerHaptic();
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
    setShowNote(false); 
  };

  // Экспорт/Импорт
  const exportData = () => {
    const backup = { data, tasks };
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracker_backup_${formatDateKey(new Date())}.json`;
    a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.data) setData(parsed.data);
        if (parsed.tasks) setTasks(parsed.tasks);
        alert('Данные восстановлены');
        setShowSettings(false);
      } catch (err) {
        alert('Ошибка файла');
      }
    };
    reader.readAsText(file);
  };

  // График
  const chartData = useMemo(() => {
    let labels = [];
    let points = [];
    let moods = [];
    const today = new Date();
    let start, countDays;
    
    if (viewMode === 'week') {
      start = new Date(today);
      start.setDate(today.getDate() - 6);
      countDays = 7;
      const keys = getDatesInRange(start, countDays);
      labels = keys.map(k => k.split('-')[2]);
      points = keys.map(k => data[k] ? Object.values(data[k].categories || {}).filter(Boolean).length : 0);
      moods = keys.map(k => data[k]?.mood || 0);
    } else if (viewMode === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      countDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const keys = getDatesInRange(start, countDays);
      labels = keys.filter((_, i) => i % 5 === 0).map(k => k.split('-')[2]);
      points = keys.map(k => data[k] ? Object.values(data[k].categories || {}).filter(Boolean).length : 0);
      moods = keys.map(k => data[k]?.mood || 0);
    } else if (viewMode === 'year') {
      for (let i = 0; i < 12; i++) {
        labels.push(String(i + 1));
        let totalPoints = 0, totalMood = 0, count = 0;
        const prefix = `${today.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
        Object.keys(data).forEach(key => {
          if (key.startsWith(prefix)) {
            const day = data[key];
            totalPoints += Object.values(day.categories || {}).filter(Boolean).length;
            totalMood += day.mood || 0;
            count++;
          }
        });
        points.push(count ? totalPoints / count : 0);
        moods.push(count ? totalMood / count : 0);
      }
    }
    return { labels, points, moods };
  }, [data, viewMode]);

  const renderChart = () => {
    const height = 150;
    const width = 300;
    const padding = 20;
    const graphHeight = height - padding * 2;
    const graphWidth = width - padding * 2;
    const { points, moods, labels } = chartData;
    if (points.length === 0) return null;

    const stepX = graphWidth / (points.length - 1 || 1);
    const pointsLine = points.map((val, i) => {
        const x = padding + i * stepX;
        const y = height - padding - (val / 5) * graphHeight;
        return `${x},${y}`;
    }).join(' ');

    const moodPath = getPathData(moods, width, height, padding, 5);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 overflow-visible">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#333" strokeWidth="1" />
        <path d={moodPath} fill="none" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline fill="none" stroke="#FFFFFF" strokeWidth="2" points={pointsLine} strokeLinecap="round" strokeLinejoin="round" />
        {viewMode !== 'month' && labels.map((label, i) => (
           <text key={i} x={padding + i * stepX} y={height} fill="#666" fontSize="10" textAnchor="middle">{label}</text>
        ))}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gray-800 touch-pan-y overflow-x-hidden">
      <style>{`
        input[type=range] { -webkit-appearance: none; background: transparent; height: 30px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 28px; width: 28px; border-radius: 50%; background: #ffffff; margin-top: -12px; box-shadow: 0 0 10px rgba(255,255,255,0.3); transition: transform 0.1s ease; }
        input[type=range]:active::-webkit-slider-thumb { transform: scale(1.1); }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: #333; border-radius: 2px; }
      `}</style>

      {/* Модалка настроек */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="w-full max-w-sm border border-gray-800 bg-black p-6 rounded-2xl relative">
              <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-500"><X /></button>
              <h2 className="text-xl mb-6 font-light">Настройки</h2>
              <div className="space-y-4">
                <button onClick={exportData} className="w-full flex items-center justify-center space-x-2 border border-gray-700 p-3 rounded-lg hover:bg-gray-900 active:scale-95 transition-all">
                  <Download size={18} /> <span>Сохранить файл (JSON)</span>
                </button>
                <label className="w-full flex items-center justify-center space-x-2 border border-gray-700 p-3 rounded-lg hover:bg-gray-900 active:scale-95 transition-all cursor-pointer">
                  <Upload size={18} /> <span>Загрузить файл</span>
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>
              <p className="text-xs text-gray-600 mt-6 text-center">Все данные хранятся только на этом устройстве.</p>
           </div>
        </div>
      )}

      {/* Шапка с отступом для iPhone */}
      <header className="p-6 pb-2 flex justify-between items-center border-b border-gray-900 sticky top-0 bg-black z-10 pt-[calc(1.5rem+env(safe-area-inset-top))]">
        <button onClick={() => setShowSettings(true)} className="p-2 text-gray-500 hover:text-white transition-colors">
          <Settings size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-bold tracking-widest uppercase text-gray-400">
            {currentDate.toLocaleDateString('ru-RU', { weekday: 'long' })}
          </h1>
          <div className="text-xl font-light">
            {currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
          </div>
        </div>
        <button onClick={() => setShowNote(!showNote)} className={`p-2 transition-colors ${dayData.note ? 'text-white' : 'text-gray-500 hover:text-white'}`}>
           <FileText size={20} fill={dayData.note ? "white" : "none"} className="transition-all" />
        </button>
      </header>
      
      {/* Навигация */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-900/50 bg-black/50 backdrop-blur-sm sticky top-[calc(73px+env(safe-area-inset-top))] z-10">
         <button onClick={() => changeDate(-1)} className="p-2 text-gray-500 hover:text-white"><ChevronLeft size={20} /></button>
         <span className="text-xs text-gray-600 font-mono uppercase tracking-widest">Навигация</span>
         <button onClick={() => changeDate(1)} className="p-2 text-gray-500 hover:text-white"><ChevronRight size={20} /></button>
      </div>

      {/* MAIN: Добавлен отступ снизу для iPhone (pb) */}
      <main className="max-w-md mx-auto p-6 space-y-10 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        
        {/* Секция Заметок */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showNote ? 'max-h-60 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
          <textarea 
            value={dayData.note}
            onChange={(e) => updateNote(e.target.value)}
            placeholder="Ваши мысли сегодня..."
            className="w-full bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-white text-sm focus:outline-none focus:border-gray-600 min-h-[100px]"
          />
        </div>

        {/* График */}
        <section className="space-y-4">
          <div className="flex justify-center space-x-4 text-xs font-medium text-gray-500 mb-2">
            {['week', 'month', 'year'].map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 rounded-full transition-colors ${viewMode === m ? 'bg-white text-black' : 'hover:text-gray-300'}`}
              >
                {m === 'week' ? 'НЕДЕЛЯ' : m === 'month' ? 'МЕСЯЦ' : 'ГОД'}
              </button>
            ))}
          </div>
          <div className="relative">
             {renderChart()}
             <div className="flex justify-between text-[10px] text-gray-600 mt-2 px-2">
                <span className="text-red-400/70">● Настроение</span>
                <span>● Активность</span>
             </div>
          </div>
        </section>

        {/* Активность */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Активность</h2>
          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const Icon = ICONS[cat.id];
              const isChecked = !!(dayData.categories && dayData.categories[cat.id]);
              return (
                <div 
                  key={cat.id} 
                  onClick={() => toggleCategory(cat.id)}
                  className="flex items-center justify-between group cursor-pointer active:opacity-70 transition-opacity"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full transition-colors ${isChecked ? 'text-white' : 'text-gray-600'}`}>
                      <Icon size={20} strokeWidth={1.5} />
                    </div>
                    <span className={`text-lg font-light transition-colors ${isChecked ? 'text-white' : 'text-gray-500'}`}>
                      {cat.label}
                    </span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center transition-all ${isChecked ? 'bg-white border-white' : 'bg-transparent'}`}>
                    {isChecked && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Задачи */}
        <section>
          <div className="flex justify-between items-end mb-4">
             <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Задачи</h2>
             <span className="text-[10px] text-gray-700">Свайп влево для удаления</span>
          </div>
          <form onSubmit={addTask} className="relative mb-6">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Новая задача..."
              className="w-full bg-transparent border-b border-gray-800 py-3 pr-10 text-white placeholder-gray-700 focus:outline-none focus:border-white transition-colors font-light"
            />
            <button type="submit" className="absolute right-0 top-3 text-gray-500 hover:text-white p-1">
              <Plus size={20} />
            </button>
          </form>
          <div className="space-y-1">
            {tasks.length === 0 && <div className="text-gray-800 text-sm italic py-2">Задач нет</div>}
            {tasks.map(task => (
              <SwipeableTask key={task.id} task={task} onDelete={deleteTask} />
            ))}
          </div>
        </section>

        {/* Настроение */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Настроение</h2>
            <span className={`text-2xl font-mono transition-colors ${dayData.mood >= 4 ? 'text-green-500' : dayData.mood <= 2 ? 'text-red-500' : 'text-white'}`}>
                {dayData.mood}
            </span>
          </div>
          
          <div className="relative h-12 flex items-center">
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={dayData.mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full relative z-20 opacity-0 absolute inset-0 cursor-pointer"
            />
            <div className="w-full h-1 bg-gray-800 rounded-full absolute z-10 pointer-events-none">
                 <div 
                   className="h-full bg-gradient-to-r from-red-900 to-white rounded-full transition-all duration-150 ease-out"
                   style={{ width: `${((dayData.mood - 1) / 4) * 100}%` }}
                 />
            </div>
            <div 
                className="absolute w-8 h-8 bg-white rounded-full shadow-lg z-10 pointer-events-none transition-all duration-150 ease-out flex items-center justify-center"
                style={{ 
                   left: `calc(${((dayData.mood - 1) / 4) * 100}% - 16px)`
                }}
            >
                <div className="w-1 h-1 bg-black rounded-full opacity-50"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-700 mt-2 px-1 font-mono">
            <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
          </div>
        </section>

      </main>
    </div>
  );
}