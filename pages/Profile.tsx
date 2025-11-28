
import React, { useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useApp } from '../services/store';
import { Camera, Save, Upload, Eye, EyeOff } from 'lucide-react';

export const Profile: React.FC = () => {
    const { currentUser, updateUserProfile, showToast } = useApp();
    const [username, setUsername] = useState(currentUser?.username || '');
    const [password, setPassword] = useState(currentUser?.password || '');
    const [avatar, setAvatar] = useState(currentUser?.avatar || '');
    const [showPassword, setShowPassword] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        if (!username || !password) return showToast("用戶名和密碼不能為空", "error");
        if (password.length < 8) return showToast("密碼需最少8位", "error");
        
        if (currentUser) {
            updateUserProfile(currentUser.id, { username, password, avatar });
        }
    };

    // Note: randomizing only updates local state 'avatar', it won't persist until 'handleSave' is called.
    // This satisfies the requirement that it shouldn't automatically randomize once saved.
    const randomizeAvatar = () => {
        setAvatar(`https://picsum.photos/seed/${Math.random()}/200`);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Layout title="編輯個人資料" back>
            <div className="bg-white p-6 rounded-2xl shadow-sm space-y-8 mt-4 border border-gray-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                        <img src={avatar} className="w-28 h-28 rounded-full border-4 border-blue-50 object-cover shadow-md" />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow hover:bg-blue-700 transition"
                        >
                            <Camera size={16} />
                        </button>
                    </div>
                    
                    <div className="flex gap-3">
                        <button onClick={randomizeAvatar} className="text-gray-600 text-xs flex items-center gap-1 font-bold bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition">
                            <Camera size={12}/> 隨機生成
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="text-blue-600 text-xs flex items-center gap-1 font-bold bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition">
                            <Upload size={12}/> 上傳圖片
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">登入名稱</label>
                        <input 
                            type="text" 
                            className="w-full p-3.5 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">密碼</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                className="w-full p-3.5 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium pr-12"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                            >
                                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button onClick={handleSave} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:bg-blue-700 transition transform active:scale-[0.98]">
                        <Save size={20} /> 保存更改
                    </button>
                </div>
            </div>
        </Layout>
    );
};
