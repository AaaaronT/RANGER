
import React, { useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useApp } from '../services/store';
import { RequestStatus, InventoryItem } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, isSameDay, isWithinInterval, isBefore, isToday } from 'date-fns';
import { Check, Plus, Trash2, Search, ShoppingBag, ArrowRight, Settings, X, Upload, Image as ImageIcon, Calendar as CalIcon, ChevronLeft, ChevronRight, Clock, Info } from 'lucide-react';

type Step = 'SELECT' | 'DATE' | 'DETAILS' | 'HISTORY' | 'ADMIN';

export const Borrow: React.FC = () => {
  const { createLoan, loans, currentUser, showToast, inventory, categories, addCategory, deleteCategory, addInventoryItem, deleteInventoryItem } = useApp();
  const [step, setStep] = useState<Step>('SELECT');

  // Admin States
  const [newCatName, setNewCatName] = useState('');
  const [newItem, setNewItem] = useState<{name: string, categoryId: string, imageUrl: string, note: string}>({ name: '', categoryId: '', imageUrl: '', note: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = currentUser?.username === 'AaronTsang';

  // Selection States
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState<string>('ALL');

  // Date & Time States (Unified UI)
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeRange, setTimeRange] = useState({ startTime: '09:00', endTime: '18:00' });
  const today = new Date();

  const myLoans = loans.filter(l => l.userId === currentUser?.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt));

  const toggleSelect = (item: InventoryItem) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCat === 'ALL' || item.categoryId === filterCat;
    return matchesSearch && matchesCat;
  });

  const handleDateClick = (day: Date) => {
      // Allow selecting today
      if (isBefore(day, today) && !isToday(day)) return;

      if (!dateRange.start || (dateRange.start && dateRange.end)) {
          // Start new selection
          setDateRange({ start: day, end: null });
      } else {
          // End selection
          if (isBefore(day, dateRange.start)) {
              setDateRange({ start: day, end: dateRange.start });
          } else {
              setDateRange({ ...dateRange, end: day });
          }
      }
  };

  const handleSubmit = () => {
    if (selectedItems.length === 0) return showToast("請至少選擇一樣物品", 'error');
    if (!dateRange.start) return showToast("請選擇借用日期", 'error');
    
    // Construct DateTimes
    const startDateObj = dateRange.start;
    const endDateObj = dateRange.end || dateRange.start; // Default to same day if end not selected

    const startDateTimeStr = format(startDateObj, 'yyyy-MM-dd') + 'T' + timeRange.startTime;
    const endDateTimeStr = format(endDateObj, 'yyyy-MM-dd') + 'T' + timeRange.endTime;
    
    const start = new Date(startDateTimeStr);
    const end = new Date(endDateTimeStr);

    if (end <= start) return showToast("歸還時間必須晚於借用時間", 'error');

    // Conflict Detection
    const selectedIds = selectedItems.map(i => i.id);
    const conflictingLoan = loans.find(l => {
        // Check if status means the item is occupied or reserved
        const isActive = [RequestStatus.SUCCESS, RequestStatus.OVERDUE, RequestStatus.PENDING].includes(l.status);
        if (!isActive) return false;

        // Check if items overlap
        const hasItemOverlap = l.itemIds.some(id => selectedIds.includes(id));
        if (!hasItemOverlap) return false;

        // Check if time overlaps
        // (StartA < EndB) and (EndA > StartB)
        const lStart = new Date(l.startDate);
        const lEnd = new Date(l.returnDate);
        return start < lEnd && end > lStart;
    });

    if (conflictingLoan) {
        // Find which item is conflicting
        const conflictItem = selectedItems.find(i => conflictingLoan.itemIds.includes(i.id));
        return showToast(`物品 ${conflictItem?.name || 'Item'} 已經被其他同事借去，暫時無法借用。`, 'error');
    }

    const summaryName = selectedItems.map(i => i.name).join(', ');

    createLoan({
      itemName: summaryName,
      itemIds: selectedIds,
      startDate: startDateTimeStr,
      returnDate: endDateTimeStr
    });

    showToast("借物申請已提交", 'success');
    setSelectedItems([]);
    setDateRange({ start: null, end: null });
    setTimeRange({ startTime: '09:00', endTime: '18:00' });
    setStep('HISTORY');
  };

  // ... Admin Handlers ...
  const handleAddCategory = () => {
    if (!newCatName.trim()) return showToast("請輸入分類名稱", 'error');
    addCategory(newCatName);
    setNewCatName('');
    showToast("分類已新增", 'success');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setNewItem({ ...newItem, imageUrl: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.categoryId || !newItem.imageUrl) return showToast("請填寫所有物品資料及圖片", 'error');
    addInventoryItem(newItem);
    setNewItem({ name: '', categoryId: '', imageUrl: '', note: '' });
    showToast("物品已新增", 'success');
  };

  const getStatusColor = (status: RequestStatus) => {
      switch(status) {
          case RequestStatus.SUCCESS: return 'text-green-600 bg-green-50 border-green-200';
          case RequestStatus.PENDING: return 'text-orange-600 bg-orange-50 border-orange-200';
          case RequestStatus.REJECTED: return 'text-pink-600 bg-pink-50 border-pink-200';
          case RequestStatus.EXPIRED: return 'text-gray-500 bg-gray-100 border-gray-200';
          case RequestStatus.OVERDUE: return 'text-red-600 bg-red-50 border-red-200';
          default: return 'text-gray-500';
      }
  };

  const renderCalendar = (baseDate: Date) => {
      const monthStart = startOfMonth(baseDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      const days = eachDayOfInterval({ start: startDate, end: endDate });

      return (
          <div className="mb-2">
              <div className="grid grid-cols-7 text-center mb-2">
                  {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-xs text-gray-400 font-bold">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-y-2">
                  {days.map(day => {
                      const isSelectedStart = dateRange.start && isSameDay(day, dateRange.start);
                      const isSelectedEnd = dateRange.end && isSameDay(day, dateRange.end);
                      const isSelected = isSelectedStart || isSelectedEnd;
                      const isInRange = dateRange.start && dateRange.end && isWithinInterval(day, { start: dateRange.start, end: dateRange.end });
                      
                      const disabled = isBefore(day, today) && !isToday(day);
                      const isCurrentMonth = day.getMonth() === baseDate.getMonth();

                      let containerClass = '';
                      let btnClass = 'text-gray-700 hover:bg-gray-100';

                      // Blue Theme for Borrow
                      if (isSelected) {
                          btnClass = 'bg-blue-600 text-white shadow-md hover:bg-blue-700';
                      } else if (isInRange) {
                          containerClass = 'bg-blue-50';
                          btnClass = 'text-blue-900 font-medium';
                      } else if (disabled) {
                          btnClass = 'text-gray-300 line-through cursor-not-allowed';
                      } else if (!isCurrentMonth) {
                          btnClass = 'text-gray-300';
                      }

                      // Rounding logic for range background
                      if (isSelectedStart && dateRange.end) containerClass += ' rounded-l-full bg-blue-50';
                      if (isSelectedEnd && dateRange.start) containerClass += ' rounded-r-full bg-blue-50';

                      return (
                          <div key={day.toString()} className={`aspect-square flex items-center justify-center p-0.5 ${containerClass}`}>
                              <button 
                                disabled={disabled}
                                onClick={() => !disabled && handleDateClick(day)}
                                className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-full transition-all ${btnClass}`}
                              >
                                  {format(day, 'd')}
                              </button>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  return (
    <Layout title={step === 'ADMIN' ? '物品管理' : "借物品"} back>
      {/* Header Controls */}
      <div className="flex justify-between mb-4 items-center">
        {step !== 'ADMIN' && (
          <button 
              onClick={() => setStep(step === 'HISTORY' ? 'SELECT' : 'HISTORY')} 
              className="text-sm bg-gray-100 text-gray-800 px-4 py-2 rounded-full font-bold shadow-sm transition hover:bg-gray-200"
          >
              {step === 'HISTORY' ? '返回清單' : '查看紀錄'}
          </button>
        )}
        
        {isAdmin && step !== 'ADMIN' && (
           <button onClick={() => setStep('ADMIN')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
               <Settings size={20} />
           </button>
        )}
        {step === 'ADMIN' && (
           <button onClick={() => setStep('SELECT')} className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-full font-bold">
               完成
           </button>
        )}
      </div>

      {/* STEP: ADMIN MANAGEMENT */}
      {step === 'ADMIN' && (
        <div className="space-y-6 pb-20">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">新增物品 / 套裝</h3>
            <p className="text-xs text-gray-500 mb-4">如果是多件物品組成的套裝（如航拍機套組），請上傳一張代表圖片，並在備註中說明詳情。</p>
            <div className="space-y-4">
                {/* Image Upload Area */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition relative overflow-hidden group"
                >
                    {newItem.imageUrl ? (
                        <>
                            <img src={newItem.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <span className="text-white font-bold flex items-center gap-2"><Upload size={18}/> 更換圖片</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center gap-2">
                            <div className="p-3 bg-gray-100 rounded-full">
                                <ImageIcon size={24} />
                            </div>
                            <span className="font-bold text-sm">點擊上傳圖片</span>
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>

                <input 
                  className="w-full border p-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-black outline-none transition" 
                  placeholder="物品名稱 / 套裝名稱 e.g. DJI Mavic 3 Set" 
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
                
                <select 
                   className="w-full border p-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-black outline-none transition appearance-none"
                   value={newItem.categoryId}
                   onChange={e => setNewItem({...newItem, categoryId: e.target.value})}
                >
                   <option value="">選擇分類</option>
                   {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <textarea
                  className="w-full border p-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-black outline-none transition min-h-[80px]"
                  placeholder="備註 / 套裝內容 / 注意事項 (用戶選擇時會看到) e.g. 包含3顆電池，需另外租借SD卡"
                  value={newItem.note}
                  onChange={e => setNewItem({...newItem, note: e.target.value})}
                />

                <button onClick={handleAddItem} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition">新增物品</button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">管理分類</h3>
            <div className="flex gap-2 mb-4">
               <input 
                  className="flex-1 border p-2 px-3 rounded-xl bg-gray-50" 
                  placeholder="新分類名稱" 
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
               />
               <button onClick={handleAddCategory} className="bg-black text-white px-4 rounded-xl font-bold"><Plus size={20}/></button>
            </div>
            <div className="flex flex-wrap gap-2">
               {categories.map(c => (
                 <div key={c.id} className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium">
                    {c.name}
                    <button onClick={() => deleteCategory(c.id)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 text-lg">現有庫存</h3>
              <div className="space-y-3">
                 {inventory.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition">
                       <div className="flex items-center gap-3">
                          <img src={item.imageUrl} className="w-12 h-12 object-cover rounded-lg bg-gray-200" />
                          <div>
                              <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                              {item.note && <p className="text-xs text-orange-500 flex items-center gap-1 mt-0.5"><Info size={10}/> {item.note}</p>}
                              <p className="text-xs text-gray-400 mt-0.5">{categories.find(c => c.id === item.categoryId)?.name}</p>
                          </div>
                       </div>
                       <button onClick={() => deleteInventoryItem(item.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                    </div>
                 ))}
              </div>
          </div>
        </div>
      )}

      {/* STEP: SELECTION (Airbnb Style) */}
      {step === 'SELECT' && (
        <div className="pb-24">
          {/* Search Bar - White Background */}
          <div className="sticky top-0 bg-white pb-4 z-10 pt-2 -mx-4 px-4 shadow-sm border-b border-gray-50">
              <div className="relative">
                 <div className="absolute left-4 top-3.5 text-gray-500">
                    <Search size={20} />
                 </div>
                 <input 
                    type="text" 
                    placeholder="搜尋物品..." 
                    className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black outline-none font-medium transition"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              
              {/* Category Filter - Scrollable Pills */}
              <div className="flex gap-3 overflow-x-auto pb-1 mt-4 no-scrollbar px-1">
                  <button 
                     onClick={() => setFilterCat('ALL')}
                     className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${filterCat === 'ALL' ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'}`}
                  >
                      全部
                  </button>
                  {categories.map(c => (
                     <button 
                        key={c.id}
                        onClick={() => setFilterCat(c.id)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${filterCat === c.id ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'}`}
                     >
                        {c.name}
                     </button>
                  ))}
              </div>
          </div>

          {/* Grid Layout - 2 Columns (1行兩格) */}
          <div className="grid grid-cols-2 gap-4 mt-4">
             {filteredInventory.map(item => {
                const isSelected = selectedItems.find(i => i.id === item.id);
                const categoryName = categories.find(c => c.id === item.categoryId)?.name;

                return (
                   <div 
                      key={item.id} 
                      onClick={() => toggleSelect(item)}
                      className="group cursor-pointer flex flex-col"
                   >
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 mb-2">
                         <img 
                            src={item.imageUrl} 
                            className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${isSelected ? 'brightness-90' : ''}`} 
                            loading="lazy" 
                            alt={item.name}
                         />

                         {/* Selection Overlay */}
                         {isSelected && (
                             <div className="absolute inset-0 border-4 border-blue-600 rounded-xl pointer-events-none flex items-center justify-center bg-black/10">
                                 <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg">
                                     <Check size={20} strokeWidth={3} />
                                 </div>
                             </div>
                         )}
                      </div>
                      
                      {/* Text Details */}
                      <div>
                         <h4 className="font-bold text-gray-900 leading-tight text-sm line-clamp-2">{item.name}</h4>
                         <p className="text-gray-500 text-xs mt-1">{categoryName}</p>
                         {item.note && (
                             <p className="text-[10px] text-orange-600 mt-1 bg-orange-50 px-1.5 py-0.5 rounded w-fit flex items-center gap-1">
                                 <Info size={10} className="shrink-0"/> {item.note}
                             </p>
                         )}
                      </div>
                   </div>
                );
             })}
          </div>

          {/* Floating Action Bar */}
          {selectedItems.length > 0 && (
             <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-sm px-4 z-50">
                 <button 
                    onClick={() => setStep('DATE')}
                    className="w-full bg-[#222222] text-white py-3.5 rounded-xl shadow-2xl flex items-center justify-between px-6 transition hover:scale-[1.02] active:scale-[0.98]"
                 >
                    <div className="flex items-center gap-3">
                        <span className="bg-white text-black px-2 py-0.5 rounded-md text-sm font-bold">{selectedItems.length}</span>
                        <span className="font-semibold text-sm">已選擇</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-sm">
                        選日期 <ArrowRight size={16} />
                    </div>
                 </button>
             </div>
          )}
        </div>
      )}

      {/* STEP: DATE (New Calendar Step) */}
      {step === 'DATE' && (
        <div className="pb-20 relative animate-fade-in">
             <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800">選擇借用日期</h2>
                <p className="text-gray-500 text-sm">點擊選擇開始和結束日期</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
                    <span className="font-bold text-lg text-gray-800">{format(currentMonth, 'MMMM yyyy')}</span>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
                </div>
                {renderCalendar(currentMonth)}
            </div>

            <div className="mt-4 flex gap-4 text-sm text-gray-500 justify-center">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-600 rounded-full"></div> 選擇</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-50 rounded-full"></div> 區間</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 border border-gray-300 rounded-full"></div> 今天</div>
            </div>

            <div className="mt-8 flex gap-3">
                 <button onClick={() => setStep('SELECT')} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold">上一步</button>
                 <button 
                    onClick={() => setStep('DETAILS')}
                    disabled={!dateRange.start}
                    className={`flex-1 py-3 rounded-xl font-bold shadow-lg transition flex items-center justify-center gap-2 ${!dateRange.start ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                 >
                    下一步 <ArrowRight size={18} />
                 </button>
            </div>
        </div>
      )}

      {/* STEP: DETAILS */}
      {step === 'DETAILS' && (
         <div className="space-y-6 pb-20">
             {/* Selected Date Summary */}
             <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                  <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wide">已選日期</h3>
                  <div className="flex items-center gap-2 mt-1">
                       <CalIcon size={18} className="text-blue-500"/>
                       <span className="text-lg font-bold text-gray-800">
                           {dateRange.start && format(dateRange.start, 'yyyy/MM/dd')} 
                           <span className="mx-2 text-gray-400">→</span>
                           {dateRange.end ? format(dateRange.end, 'yyyy/MM/dd') : (dateRange.start && format(dateRange.start, 'yyyy/MM/dd'))}
                       </span>
                  </div>
              </div>

             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                     <ShoppingBag size={20}/> 借用物品
                 </h3>
                 <div className="space-y-4">
                     {selectedItems.map(item => (
                         <div key={item.id} className="flex flex-col gap-2 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                             <div className="flex items-center gap-4">
                                <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                                <div>
                                    <span className="font-bold text-gray-800 block">{item.name}</span>
                                    <span className="text-xs text-gray-500">{categories.find(c => c.id === item.categoryId)?.name}</span>
                                </div>
                             </div>
                             {item.note && (
                                 <div className="bg-orange-50 p-2 rounded-lg text-xs text-orange-700 flex items-start gap-2">
                                     <Info size={14} className="mt-0.5 shrink-0"/>
                                     <span>{item.note}</span>
                                 </div>
                             )}
                         </div>
                     ))}
                 </div>
             </div>

             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                 <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Clock size={20}/> 設定時間</h3>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">開始時間</label>
                        <input 
                          type="time" 
                          className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-800"
                          value={timeRange.startTime}
                          onChange={e => setTimeRange({...timeRange, startTime: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">歸還時間</label>
                        <input 
                          type="time" 
                          className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-800"
                          value={timeRange.endTime}
                          onChange={e => setTimeRange({...timeRange, endTime: e.target.value})}
                        />
                     </div>
                 </div>
             </div>

             <div className="flex gap-3">
                 <button onClick={() => setStep('DATE')} className="flex-1 py-3.5 rounded-xl font-bold text-gray-800 bg-white border border-gray-200 hover:bg-gray-50">返回日期</button>
                 <button onClick={handleSubmit} className="flex-1 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg hover:shadow-xl">確認借用</button>
             </div>
         </div>
      )}

      {/* STEP: HISTORY */}
      {step === 'HISTORY' && (
        <div className="space-y-4">
           {myLoans.length === 0 && (
               <div className="text-center py-16">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                       <ShoppingBag size={24} className="text-gray-400"/>
                   </div>
                   <p className="text-gray-400 font-medium">還沒有借用紀錄</p>
               </div>
           )}
           {myLoans.map(loan => {
             // Calc dynamic overdue
             let displayStatus = loan.status;
             if (displayStatus === RequestStatus.SUCCESS && new Date(loan.returnDate) < new Date()) {
                 displayStatus = RequestStatus.OVERDUE;
             }

             // Find images
             const loanImages = loan.itemIds.map(id => inventory.find(i => i.id === id)?.imageUrl).filter(Boolean);

             return (
             <div key={loan.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                     <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg leading-tight">{loan.itemName}</h3>
                        <p className="text-xs text-gray-400 mt-1">ID: {loan.id.slice(-6)}</p>
                     </div>
                     <div className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(displayStatus)}`}>
                        {displayStatus}
                    </div>
                </div>

                {/* Show Images in History */}
                {loanImages.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                        {loanImages.map((img, idx) => (
                            <img key={idx} src={img} className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-100" />
                        ))}
                    </div>
                )}

                <div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                        <span>借出：</span>
                        <span className="font-mono font-medium text-gray-900">{format(new Date(loan.startDate), 'MM/dd HH:mm')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>歸還：</span>
                        <span className="font-mono font-medium text-gray-900">{format(new Date(loan.returnDate), 'MM/dd HH:mm')}</span>
                    </div>
                </div>
             </div>
           )})}
        </div>
      )}
    </Layout>
  );
};
