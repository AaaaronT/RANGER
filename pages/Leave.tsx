import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { useApp } from '../services/store';
import { LeaveType, RequestStatus } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, isSameDay, isWithinInterval, isBefore, isToday } from 'date-fns';
import { Clock, Calendar as CalIcon, ArrowRight, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export const Leave: React.FC = () => {
  const { createLeave, leaves, currentUser, showToast } = useApp();
  const [step, setStep] = useState<'HISTORY' | 'DATE' | 'DETAILS'>('DATE');

  // Form State
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [formData, setFormData] = useState({
    type: LeaveType.PERSONAL,
    allowedBy: '',
    comment: ''
  });

  const myLeaves = leaves.filter(l => l.userId === currentUser?.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  const today = new Date();

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
      if (!dateRange.start || !dateRange.end) return;
      if (formData.type === LeaveType.ALLOWED && !formData.allowedBy) {
        return showToast("請輸入批准人姓名", 'error');
      }
      
      // Default times: Start at 09:00, End at 18:00
      const startStr = format(dateRange.start, "yyyy-MM-dd'T'09:00");
      const endStr = format(dateRange.end, "yyyy-MM-dd'T'18:00");

      createLeave({
          startDate: startStr,
          endDate: endStr,
          type: formData.type,
          allowedBy: formData.allowedBy,
          comment: formData.comment
      });

      showToast("假期申請已提交", 'success');
      setStep('HISTORY');
      setDateRange({ start: null, end: null });
      setFormData({ type: LeaveType.PERSONAL, allowedBy: '', comment: '' });
  };

  const getStatusColor = (status: RequestStatus, endDate: string) => {
    // Check for expired pending requests visually
    if (status === RequestStatus.PENDING && new Date(endDate) < new Date()) {
        return 'text-gray-500 bg-gray-100 border-gray-200'; // Expired visually
    }

    switch(status) {
        case RequestStatus.APPROVED: return 'text-green-600 bg-green-50 border-green-200';
        case RequestStatus.PENDING: return 'text-orange-600 bg-orange-50 border-orange-200';
        case RequestStatus.REJECTED: return 'text-pink-600 bg-pink-50 border-pink-200';
        case RequestStatus.EXPIRED: return 'text-gray-500 bg-gray-100 border-gray-200';
        default: return 'text-gray-500';
    }
  };

  const getStatusLabel = (status: RequestStatus, endDate: string) => {
      if (status === RequestStatus.PENDING && new Date(endDate) < new Date()) {
          return '已過期';
      }
      return status;
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
                          btnClass = 'bg-black text-white shadow-md hover:bg-gray-800';
                      } else if (isInRange) {
                          containerClass = 'bg-gray-100';
                          btnClass = 'text-gray-900';
                      } else if (disabled) {
                          btnClass = 'text-gray-300 line-through cursor-not-allowed';
                      } else if (!isCurrentMonth) {
                          btnClass = 'text-gray-300';
                      }

                      // Rounding logic for range background
                      if (isSelectedStart && dateRange.end) containerClass += ' rounded-l-full bg-gray-100';
                      if (isSelectedEnd && dateRange.start) containerClass += ' rounded-r-full bg-gray-100';

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
    <Layout title="請假申請" back>
      {/* Header Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button 
            onClick={() => setStep('DATE')} 
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${step !== 'HISTORY' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
          >
            新申請
          </button>
          <button 
            onClick={() => setStep('HISTORY')} 
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${step === 'HISTORY' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
          >
            查看紀錄
          </button>
      </div>

      {/* STEP 1: DATE SELECTION */}
      {step === 'DATE' && (
        <div className="pb-20 relative">
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800">選擇日期</h2>
                <p className="text-gray-500 text-sm">請選擇開始和結束日期</p>
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
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-black rounded-full"></div> 選擇</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-100 rounded-full"></div> 區間</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 border border-gray-300 rounded-full"></div> 今天</div>
            </div>

            {dateRange.start && dateRange.end && (
                 <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-sm px-4">
                     <button 
                        onClick={() => setStep('DETAILS')}
                        className="w-full bg-orange-600 text-white py-3 rounded-xl shadow-xl flex items-center justify-center gap-2 font-bold hover:bg-orange-700 transition"
                     >
                        下一步：填寫詳情 <ArrowRight size={18} />
                     </button>
                 </div>
            )}
        </div>
      )}

      {/* STEP 2: DETAILS */}
      {step === 'DETAILS' && (
          <div className="pb-20">
              <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border-l-4 border-orange-500">
                  <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wide">已選日期</h3>
                  <div className="flex items-center gap-2 mt-1">
                       <CalIcon size={18} className="text-orange-500"/>
                       <span className="text-lg font-bold text-gray-800">
                           {dateRange.start && format(dateRange.start, 'yyyy/MM/dd')} 
                           <span className="mx-2 text-gray-400">→</span>
                           {dateRange.end && format(dateRange.end, 'yyyy/MM/dd')}
                       </span>
                  </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm space-y-5">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">假期類型</label>
                      <div className="grid grid-cols-2 gap-2">
                          {Object.values(LeaveType).map(type => (
                              <button
                                key={type}
                                onClick={() => setFormData({...formData, type})}
                                className={`py-2 px-3 rounded-lg text-sm font-medium border text-left flex items-center justify-between transition-all ${formData.type === type ? 'border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                              >
                                  {type}
                                  {formData.type === type && <Check size={14} />}
                              </button>
                          ))}
                      </div>
                  </div>

                  {formData.type === LeaveType.ALLOWED && (
                      <div className="animate-fade-in">
                          <label className="block text-sm font-bold text-gray-700 mb-2">批准人 (必須填寫)</label>
                          <input 
                              type="text" 
                              placeholder="e.g. AaronTsang"
                              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                              value={formData.allowedBy}
                              onChange={e => setFormData({...formData, allowedBy: e.target.value})}
                          />
                      </div>
                  )}

                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">備註 (選填)</label>
                      <textarea 
                          placeholder="請輸入請假原因..."
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none min-h-[100px]"
                          value={formData.comment}
                          onChange={e => setFormData({...formData, comment: e.target.value})}
                      />
                  </div>
              </div>

              <div className="mt-6 flex gap-3">
                  <button onClick={() => setStep('DATE')} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold">上一步</button>
                  <button onClick={handleSubmit} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg">提交申請</button>
              </div>
          </div>
      )}

      {/* STEP 3: HISTORY */}
      {step === 'HISTORY' && (
          <div className="space-y-3">
              {myLeaves.length === 0 && (
                  <div className="text-center py-10">
                      <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CalIcon size={32} className="text-gray-400" />
                      </div>
                      <p className="text-gray-400">暫無請假紀錄</p>
                  </div>
              )}
              
              {myLeaves.map(leave => (
                  <div key={leave.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-gray-800 text-lg">{leave.type}</span>
                          <span className={`px-2 py-1 text-xs font-bold rounded border ${getStatusColor(leave.status, leave.endDate)}`}>
                              {getStatusLabel(leave.status, leave.endDate)}
                          </span>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                              <span>開始：</span>
                              <span className="font-mono font-medium">{format(new Date(leave.startDate), 'yyyy/MM/dd HH:mm')}</span>
                          </div>
                          <div className="flex justify-between">
                              <span>結束：</span>
                              <span className="font-mono font-medium">{format(new Date(leave.endDate), 'yyyy/MM/dd HH:mm')}</span>
                          </div>
                          {leave.allowedBy && (
                              <div className="flex justify-between text-orange-600">
                                  <span>批准人：</span>
                                  <span>{leave.allowedBy}</span>
                              </div>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      )}
    </Layout>
  );
};