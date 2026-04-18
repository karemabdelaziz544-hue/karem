import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, Profile } from '../contexts/AuthContext';
import { User, Camera, Lock, Save, Loader2 } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);

    // بيانات النموذج
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        if (!user?.id) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
            setProfile(data);
            setFullName(data.full_name || '');
            setAvatarUrl(data.avatar_url);
        }
    };

    // 1. تحديث البيانات الشخصية والصورة
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!user?.id) return;

        try {
            const updates = {
                id: user.id,
                full_name: fullName,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            toast.success("تم تحديث الملف الشخصي بنجاح! 🎉");
        } catch (error: any) {
            toast.error("فشل التحديث: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // 2. رفع الصورة
    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        setLoading(true);

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            // رفع الصورة
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // الحصول على الرابط
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
            toast.success("تم رفع الصورة، اضغط حفظ لتأكيد التغيير.");

        } catch (error: any) {
            toast.error("فشل رفع الصورة: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // 3. تغيير كلمة المرور
    const handleChangePassword = async () => {
        if (!newPassword) return;
        if (newPassword !== confirmPassword) return toast.error("كلمات المرور غير متطابقة");
        if (newPassword.length < 6) return toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success("تم تغيير كلمة المرور بنجاح! 🔒");
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error("فشل التغيير: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-500 pb-20">
            <h1 className="text-3xl font-extrabold text-forest mb-8">إعدادات الحساب</h1>

            {/* قسم الصورة والاسم */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 mb-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-orange/20 shadow-lg">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-forest text-white flex items-center justify-center text-4xl font-bold">
                                    {fullName?.[0]}
                                </div>
                            )}
                        </div>
                        {/* طبقة تظهر عند التحويم */}
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={32} />
                        </div>
                        {loading && (
                            <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                                <Loader2 className="text-orange animate-spin" size={32} />
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleAvatarUpload}
                        accept="image/*"
                    />
                    <p className="text-gray-400 text-xs mt-3">اضغط على الصورة للتغيير</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <Input label="الاسم بالكامل" value={fullName} onChange={e => setFullName(e.target.value)} />

                    <div className="pt-2">
                        <Input label="البريد الإلكتروني" value={user?.email || ''} disabled className="opacity-60 cursor-not-allowed bg-gray-50" />
                        <p className="text-xs text-gray-400 -mt-3 mr-1">لا يمكن تغيير البريد الإلكتروني</p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button className="px-8" disabled={loading}>
                            <Save size={18} className="ml-2" />
                            حفظ التغييرات
                        </Button>
                    </div>
                </form>
            </div>

            {/* قسم الأمان (كلمة المرور) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-forest mb-6 flex items-center gap-2">
                    <Lock className="text-orange" /> الأمان وكلمة المرور
                </h3>

                <div className="space-y-4">
                    <Input
                        label="كلمة المرور الجديدة"
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                    <Input
                        label="تأكيد كلمة المرور"
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                    />

                    <div className="flex justify-end pt-2">
                        <Button variant="outline" onClick={handleChangePassword} disabled={loading || !newPassword}>
                            تحديث كلمة المرور
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;