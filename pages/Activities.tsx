
import React, { useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useApp } from '../services/store';
import { Check, X, MapPin, Clock, DollarSign, Users, Calendar as CalIcon, ChevronLeft, ChevronRight, ArrowRight, Upload, Camera } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, isSameDay, isWithinInterval, isBefore, isToday } from 'date-fns';

export const Activities: React.FC = () => {
  const { activities, createActivity, rsvpActivity, currentUser, users, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');

  // CREATE STATE
  const [step, setStep] = useState<'DATE' | 'DETAILS'>('DATE');
  
  // Date Picker State (Similar to Leave)
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form Details
  const [form, setForm] = useState({
      title: '', 
      startTime: '10:00', // HH:mm
      endTime: '18:00',   // HH:mm
      location: '', 
      maxPeople: 10, 
      description: '', 
      totalPrice: '', 
      isPublic: true,
      banner: '' // Base64
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const today = new Date();

  // Calendar Logic (Reused from Leave.tsx for consistency)
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

  const handleCreate = () => {
      if(!form.title || !form.location || !dateRange.start) {
          return showToast("請填寫所有必要欄位（標題、地點、日期）", 'error');
      }

      // Construct Dates
      const startDate = dateRange.start;
      const endDate = dateRange.end || dateRange.start; // Default to same day if single click

      const startDateTimeStr = format(startDate, 'yyyy-MM-dd') + 'T' + form.startTime;
      const endDateTimeStr = format(endDate, 'yyyy-MM-dd') + 'T' + form.endTime;

      if(new Date(endDateTimeStr) <= new Date(startDateTimeStr)) {
          return showToast("結束時間必須晚於開始時間", 'error');
      }

      createActivity({ 
        title: form.title,
        description: form.description,
        location: form.location,
        start: startDateTimeStr,
        end: endDateTimeStr,
        maxPeople: form.maxPeople,
        totalPrice: form.totalPrice,
        isPublic: form.isPublic,
        banner: form.banner,
        targetUserIds: selectedUsers 
      });

      showToast("活動已創建", 'success');
      // Reset
      setActiveTab('LIST');
      setStep('DATE');
      setForm({ title: '', startTime: '10:00', endTime: '18:00', location: '', maxPeople: 10, description: '', totalPrice: '', isPublic: true, banner: '' });
      setDateRange({ start: null, end: null });
      setSelectedUsers([]);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setForm(prev => ({ ...prev, banner: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const toggleUser = (id: string) => {
    if (selectedUsers.includes(id)) setSelectedUsers(selectedUsers.filter(u => u !== id));
    else setSelectedUsers([...selectedUsers, id]);
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

                      if (isSelected) {
                          btnClass = 'bg-pink-600 text-white shadow-md hover:bg-pink-700'; // Pink for activities
                      } else if (isInRange) {
                          containerClass = 'bg-pink-50';
                          btnClass = 'text-gray-900';
                      } else if (disabled) {
                          btnClass = 'text-gray-300 line-through cursor-not-allowed';
                      } else if (!isCurrentMonth) {
                          btnClass = 'text-gray-300';
                      }

                      if (isSelectedStart && dateRange.end) containerClass += ' rounded-l-full bg-pink-50';
                      if (isSelectedEnd && dateRange.start) containerClass += ' rounded-r-full bg-pink-50';

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

  const visibleActivities = activities.filter(a => 
    a.isPublic || a.targetUserIds.includes(currentUser?.id || '') || a.creatorId === currentUser?.id
  ).sort((a,b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Layout title="一齊玩" back>
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setActiveTab('LIST'); setStep('DATE'); }} className={`flex-1 py-2 rounded-lg font-medium ${activeTab === 'LIST' ? 'bg-pink-100 text-pink-700' : 'bg-white'}`}>活動列表</button>
        <button onClick={() => setActiveTab('CREATE')} className={`flex-1 py-2 rounded-lg font-medium ${activeTab === 'CREATE' ? 'bg-pink-100 text-pink-700' : 'bg-white'}`}>發起活動</button>
      </div>

      {activeTab === 'LIST' && (
          <div className="space-y-4">
              {visibleActivities.map(a => {
                  const creator = users.find(u => u.id === a.creatorId);
                  const myRsvp = a.attendees.find(att => att.userId === currentUser?.id)?.status;
                  const acceptedCount = a.attendees.filter(att => att.status === 'ACCEPTED').length;
                  const isFull = acceptedCount >= a.maxPeople;

                  return (
                      <div key={a.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                          {a.banner && (
                              <div className="w-full h-32 bg-gray-200">
                                  <img src={a.banner} className="w-full h-full object-cover" alt="Event Banner" />
                              </div>
                          )}
                          <div className="p-4 border-b border-gray-100">
                               <div className="flex justify-between items-start">
                                  <h3 className="text-lg font-bold text-gray-800">{a.title}</h3>
                                  <span className={`text-xs px-2 py-1 rounded bg-gray-100 font-bold text-gray-600`}>
                                      {a.totalPrice ? `$${a.totalPrice}` : 'Free'}
                                  </span>
                               </div>
                               <p className="text-gray-500 text-sm mt-1">{a.description}</p>
                               <div className="mt-3 space-y-1 text-sm text-gray-600">
                                   <div className="flex items-center gap-2"><Clock size={14}/> {new Date(a.start).toLocaleString()}</div>
                                   <div className="flex items-center gap-2"><MapPin size={14}/> {a.location}</div>
                                   <div className="flex items-center gap-2"><Users size={14}/> {acceptedCount} / {a.maxPeople} 人參加</div>
                               </div>
                          </div>
                          
                          {/* Attendees Section */}
                          <div className="p-3 bg-gray-50 flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-gray-400">已參加</span>
                                    <div className="flex -space-x-2 overflow-hidden pl-2">
                                        {a.attendees.filter(at => at.status === 'ACCEPTED').map(at => {
                                            const u = users.find(usr => usr.id === at.userId);
                                            return <img key={at.userId} src={u?.avatar} className="w-8 h-8 rounded-full border-2 border-white" title={u?.username} />;
                                        })}
                                        {a.attendees.filter(at => at.status === 'ACCEPTED').length === 0 && <span className="text-xs text-gray-400 pl-0">暫無人參加</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => rsvpActivity(a.id, 'REJECTED')}
                                        className={`p-2 rounded-full ${myRsvp === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-white text-gray-400 border'}`}
                                    >
                                        <X size={20} />
                                    </button>
                                    <button 
                                        onClick={() => rsvpActivity(a.id, 'ACCEPTED')}
                                        disabled={isFull && myRsvp !== 'ACCEPTED'}
                                        className={`p-2 rounded-full ${myRsvp === 'ACCEPTED' ? 'bg-green-500 text-white' : 'bg-white text-gray-400 border'} ${isFull && myRsvp !== 'ACCEPTED' ? 'opacity-50' : ''}`}
                                    >
                                        <Check size={20} />
                                    </button>
                                </div>
                              </div>
                              
                              {/* Rejected Users Section */}
                              {a.attendees.some(at => at.status === 'REJECTED') && (
                                  <div className="flex flex-col gap-1 pt-2 border-t border-gray-200">
                                      <span className="text-xs font-bold text-gray-400">已拒絕</span>
                                      <div className="flex -space-x-2 overflow-hidden pl-2">
                                          {a.attendees.filter(at => at.status === 'REJECTED').map(at => {
                                              const u = users.find(usr => usr.id === at.userId);
                                              return (
                                                <div key={at.userId} className="relative">
                                                     <img src={u?.avatar} className="w-6 h-6 rounded-full border-2 border-white grayscale opacity-70" title={u?.username} />
                                                     <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-[2px] border border-white">
                                                         <X size={6} className="text-white" />
                                                     </div>
                                                </div>
                                              );
                                          })}
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
      )}

      {activeTab === 'CREATE' && (
          <div className="pb-20">
              {/* CREATE STEP 1: DATE */}
              {step === 'DATE' && (
                <div className="relative">
                     <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
                            <span className="font-bold text-lg text-gray-800">{format(currentMonth, 'MMMM yyyy')}</span>
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
                        </div>
                        {renderCalendar(currentMonth)}
                        <p className="text-xs text-center text-gray-400 mt-2">請選擇活動日期</p>
                    </div>

                    {dateRange.start && (
                        <button 
                            onClick={() => setStep('DETAILS')}
                            className="w-full bg-pink-600 text-white py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 font-bold hover:bg-pink-700 transition"
                        >
                            下一步：填寫詳情 <ArrowRight size={18} />
                        </button>
                    )}
                </div>
              )}

              {/* CREATE STEP 2: DETAILS */}
              {step === 'DETAILS' && (
                  <div className="bg-white p-5 rounded-xl shadow-sm space-y-4">
                      {/* Banner Upload */}
                      <div 
                        className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden relative"
                        onClick={() => bannerInputRef.current?.click()}
                      >
                          {form.banner ? (
                              <img src={form.banner} className="w-full h-full object-cover" />
                          ) : (
                              <div className="text-gray-400 flex flex-col items-center">
                                  <Upload size={24} />
                                  <span className="text-xs mt-1">上傳 Banner</span>
                              </div>
                          )}
                          <div className="absolute bottom-2 right-2 bg-black/50 p-1 rounded-full text-white">
                             <Camera size={14} />
                          </div>
                      </div>
                      <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />

                      {/* Date Display */}
                      <div className="flex items-center gap-2 bg-pink-50 p-3 rounded-lg text-pink-700 text-sm font-bold">
                           <CalIcon size={16}/>
                           <span>
                               {dateRange.start && format(dateRange.start, 'yyyy/MM/dd')} 
                               {dateRange.end && dateRange.end !== dateRange.start && ` - ${format(dateRange.end, 'yyyy/MM/dd')}`}
                           </span>
                      </div>

                      <input type="text" placeholder="活動標題" className="w-full p-3 border rounded-lg bg-gray-50" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                      
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-xs text-gray-500 mb-1 block">開始時間</label>
                              <input type="time" className="w-full p-2 border rounded-lg" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-xs text-gray-500 mb-1 block">結束時間</label>
                              <input type="time" className="w-full p-2 border rounded-lg" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
                          </div>
                      </div>

                      <textarea placeholder="描述" className="w-full p-3 border rounded-lg bg-gray-50 min-h-[80px]" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                      
                      <div className="relative">
                          <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                          <input type="text" placeholder="地點" className="w-full pl-10 p-3 border rounded-lg bg-gray-50" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <div>
                             <label className="text-xs text-gray-500 mb-1 block">所需人數</label>
                             <input type="number" placeholder="10" className="p-3 border rounded-lg w-full bg-gray-50" value={form.maxPeople} onChange={e => setForm({...form, maxPeople: parseInt(e.target.value)})} />
                          </div>
                          <div>
                             <label className="text-xs text-gray-500 mb-1 block">活動價錢</label>
                             <input type="text" placeholder="免費" className="p-3 border rounded-lg w-full bg-gray-50" value={form.totalPrice} onChange={e => setForm({...form, totalPrice: e.target.value})} />
                          </div>
                      </div>

                      {/* Public Toggle */}
                      <div>
                        <label className="flex items-center gap-2 mb-2">
                            <input type="checkbox" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})} />
                            <span className="text-gray-700 text-sm font-bold">公開給所有人</span>
                        </label>
                        {!form.isPublic && (
                            <div className="border rounded-lg p-2 max-h-40 overflow-y-auto bg-gray-50">
                                {users.filter(u => u.id !== currentUser?.id).map(u => (
                                    <div key={u.id} className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded" onClick={() => toggleUser(u.id)}>
                                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedUsers.includes(u.id) ? 'bg-pink-500 border-pink-500' : 'bg-white'}`}>
                                            {selectedUsers.includes(u.id) && <Check size={10} className="text-white" />}
                                        </div>
                                        <img src={u.avatar} className="w-6 h-6 rounded-full" />
                                        <span className="text-sm">{u.username}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                          <button onClick={() => setStep('DATE')} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold">上一步</button>
                          <button onClick={handleCreate} className="flex-1 bg-pink-600 text-white font-bold py-3 rounded-xl hover:bg-pink-700 shadow-lg">發布活動</button>
                      </div>
                  </div>
              )}
          </div>
      )}
    </Layout>
  );
};
