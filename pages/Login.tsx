
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../services/store';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Camera, Upload, ChevronLeft } from 'lucide-react';

const InputField = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="relative">
      <input 
          {...props}
          className="w-full p-4 border border-gray-300 rounded-xl focus:border-black focus:ring-1 focus:ring-black outline-none transition text-gray-800 placeholder-gray-500 bg-white"
      />
  </div>
);

const PrimaryButton = ({ children, onClick, className, type = "button" }: any) => (
    <button 
      type={type}
      onClick={onClick}
      className={`w-full bg-[#FF385C] text-white py-3.5 rounded-xl font-bold text-lg hover:bg-[#D90B3E] transition active:scale-[0.98] shadow-md ${className}`}
    >
        {children}
    </button>
);

export const Login: React.FC = () => {
  const { login, register, firstTimeSetup, checkEmailForSetup, showToast, currentUser } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'SETUP'>('LOGIN');
  
  // Login State
  const [lUser, setLUser] = useState('');
  const [lPass, setLPass] = useState('');
  
  // Register State
  const [rEmail, setREmail] = useState('');
  const [rCode, setRCode] = useState('');

  // Setup State
  const [sEmail, setSEmail] = useState('');
  const [sUser, setSUser] = useState('');
  const [sPass, setSPass] = useState('');
  const [sAvatar, setSAvatar] = useState('https://picsum.photos/200');
  const [emailVerified, setEmailVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if logged in
  useEffect(() => {
    if (currentUser) {
        navigate('/home');
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if(!lUser || !lPass) return showToast("請輸入用戶名和密碼", 'error');
    
    const res = await login(lUser, lPass);
    if (res.success) {
        showToast("登入成功", 'success');
        // Navigation handled by useEffect
    } else {
        showToast(res.message || "登入失敗", 'error');
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if(!rEmail || !rCode) return showToast("請填寫所有欄位", 'error');

    const res = await register(rEmail, rCode);
    if (res.success) {
      showToast('註冊申請已提交，請等待批准', 'success');
      setMode('LOGIN');
      setREmail('');
      setRCode('');
    } else {
      showToast(res.message, 'error');
    }
  };

  const verifySetupEmail = (e?: React.FormEvent) => {
      e?.preventDefault();
      if(!sEmail) return showToast("請輸入電郵", 'error');
      const isValid = checkEmailForSetup(sEmail);
      if (isValid) {
          setEmailVerified(true);
          showToast("電郵驗證成功", 'success');
      } else {
          showToast("電郵未找到或不處於等待設置狀態", 'error');
      }
  };

  const handleSetup = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if(!sUser || !sPass) return showToast("請填寫所有資料", 'error');
      if (sPass.length < 8) return showToast("密碼需最少8位", 'error');
      
      const res = await firstTimeSetup(sEmail, sUser, sPass, sAvatar);
      if (res.success) {
          showToast("激活成功，正在登入...", 'success');
          // Navigation handled by useEffect
      } else {
          showToast(res.message, 'error');
      }
  };

  // Avatar randomize
  const randomizeAvatar = () => {
    setSAvatar(`https://picsum.photos/seed/${Math.random()}/200`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setSAvatar(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-2">
            {mode !== 'LOGIN' && (
                <button type="button" onClick={() => setMode('LOGIN')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full w-fit">
                    <ChevronLeft size={24} className="text-gray-800" />
                </button>
            )}
            <img 
              src="http://ranger4s.com/wp-content/uploads/2025/11/RANGER-scaled.png" 
              alt="App Logo" 
              className="h-16 w-auto object-contain -ml-1 mb-2" 
            />
            <h2 className="text-3xl font-bold text-gray-900">
                {mode === 'LOGIN' ? 'BURROW創新精英團' : mode === 'REGISTER' ? '加入我們' : '設置你的帳戶'}
            </h2>
        </div>

        {mode === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
                <InputField 
                    type="text" placeholder="用戶名" 
                    value={lUser} onChange={e => setLUser(e.target.value)}
                />
                <InputField 
                    type="password" placeholder="密碼" 
                    value={lPass} onChange={e => setLPass(e.target.value)}
                />
            </div>
            
            <PrimaryButton type="submit">
              登入
            </PrimaryButton>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                 <button 
                    type="button"
                    onClick={() => { setMode('REGISTER'); setREmail(''); setRCode(''); }}
                    className="text-sm font-semibold text-gray-800 hover:underline text-left"
                 >
                    沒有帳號？註冊
                 </button>
                 <button 
                    type="button"
                    onClick={() => { setMode('SETUP'); setSEmail(''); setEmailVerified(false); }}
                    className="text-sm font-semibold text-gray-800 hover:underline text-right"
                 >
                    第一次登錄？
                 </button>
            </div>
          </form>
        )}

        {mode === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-6">
            <p className="text-gray-500">請輸入你的公司電郵以及管理員提供的驗證碼以建立帳戶。</p>
            <div className="space-y-4">
                <InputField 
                    type="email" placeholder="公司電郵" 
                    value={rEmail} onChange={e => setREmail(e.target.value)}
                />
                <InputField 
                    type="text" placeholder="驗證碼" 
                    value={rCode} onChange={e => setRCode(e.target.value)}
                />
            </div>
            <PrimaryButton type="submit">
              提交申請
            </PrimaryButton>
          </form>
        )}

        {mode === 'SETUP' && (
          <form onSubmit={emailVerified ? handleSetup : verifySetupEmail} className="space-y-6 animate-fade-in">
             {!emailVerified ? (
                 <>
                    <p className="text-gray-500">輸入已獲批准的電郵地址以激活你的帳戶。</p>
                    <div className="flex gap-2">
                        <input 
                            type="email" placeholder="公司電郵" 
                            className="flex-1 p-4 border border-gray-300 rounded-xl outline-none focus:border-black"
                            value={sEmail} onChange={e => setSEmail(e.target.value)}
                        />
                        <button type="submit" className="bg-black text-white px-6 rounded-xl font-bold">驗證</button>
                    </div>
                 </>
             ) : (
                 <>
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl justify-center font-medium border border-green-100">
                        <CheckCircle size={20} />
                        <span>電郵已驗證，請完善資料</span>
                    </div>
                    
                    <div className="flex flex-col items-center gap-4 py-2">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <img src={sAvatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                            <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <Upload className="text-white" size={24} />
                            </div>
                        </div>
                        <div className="flex gap-3">
                             <button type="button" onClick={randomizeAvatar} className="flex items-center gap-1 text-xs font-bold border border-gray-300 px-3 py-1.5 rounded-full hover:bg-gray-50">
                                <Camera size={14} /> 隨機
                            </button>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                    <div className="space-y-3">
                        <InputField 
                            type="text" placeholder="設置用戶名" 
                            value={sUser} onChange={e => setSUser(e.target.value)}
                        />
                        <InputField 
                            type="password" placeholder="設置密碼 (最少8位)" 
                            value={sPass} onChange={e => setSPass(e.target.value)}
                        />
                    </div>
                    
                    <PrimaryButton type="submit">
                        完成設置並登入
                    </PrimaryButton>
                 </>
             )}
          </form>
        )}
      </div>
    </div>
  );
};
