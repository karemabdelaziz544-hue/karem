import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageSquare, User, Clock, Send, CheckCircle, Search } from 'lucide-react';
import Button from '../../components/Button';

const MessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    // بنجيب الرسايل ومعاها اسم العميل من جدول البروفايل
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(full_name, phone)')
      .order('created_at', { ascending: false });
    
    setMessages(data || []);
    setLoading(false);
  };

  const sendReply = async (msgId: string) => {
    if (!replyText.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          reply: replyText, 
          status: 'replied' 
        })
        .eq('id', msgId);

      if (error) throw error;

      alert("تم إرسال الرد للعميل بنجاح!");
      setReplyText('');
      setSelectedMsgId(null);
      fetchMessages(); // تحديث القائمة
    } catch (error: any) {
      alert("خطأ: " + error.message);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">جاري تحميل الرسائل...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-extrabold text-forest mb-8 flex items-center gap-2">
        <MessageSquare className="text-orange" /> استفسارات العملاء
      </h1>

      <div className="space-y-6">
        {messages.length === 0 ? (
            <p className="text-gray-400 text-center py-10">لا توجد رسائل جديدة.</p>
        ) : (
            messages.map((msg) => (
                <div key={msg.id} className={`bg-white p-6 rounded-2xl border-2 transition-all ${msg.status === 'pending' ? 'border-orange/20 shadow-md' : 'border-gray-100 opacity-80'}`}>
                    
                    {/* رأس الرسالة */}
                    <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-forest/10 rounded-full flex items-center justify-center text-forest font-bold">
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-forest">{msg.profiles?.full_name || 'عميل غير معروف'}</h3>
                                <p className="text-xs text-gray-400 font-mono">{msg.profiles?.phone}</p>
                            </div>
                        </div>
                        <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                            <Clock size={12} /> {new Date(msg.created_at).toLocaleDateString('ar-EG')}
                        </span>
                    </div>

                    {/* محتوى السؤال */}
                    <div className="mb-4">
                        <h4 className="font-bold text-orange text-sm mb-1">{msg.subject}</h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-xl text-sm leading-relaxed">
                            {msg.content}
                        </p>
                    </div>

                    {/* منطقة الرد */}
                    {msg.status === 'replied' ? (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <h5 className="text-green-800 font-bold text-xs mb-2 flex items-center gap-1">
                                <CheckCircle size={14} /> تم الرد:
                            </h5>
                            <p className="text-green-700 text-sm">{msg.reply}</p>
                        </div>
                    ) : (
                        <div className="mt-4">
                            {selectedMsgId === msg.id ? (
                                <div className="animate-in fade-in">
                                    <textarea 
                                        className="w-full p-3 rounded-xl border-2 border-orange/30 focus:border-orange outline-none text-sm min-h-[100px]"
                                        placeholder="اكتب رد الطبيب هنا..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                    />
                                    <div className="flex gap-2 mt-2 justify-end">
                                        <button onClick={() => setSelectedMsgId(null)} className="text-gray-500 text-sm px-4 py-2 hover:bg-gray-100 rounded-lg">إلغاء</button>
                                        <Button onClick={() => sendReply(msg.id)} className="py-2 text-sm">
                                            <Send size={16} className="ml-2" /> إرسال الرد
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setSelectedMsgId(msg.id)}
                                    className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-orange hover:text-orange hover:bg-orange/5 transition-all font-bold text-sm"
                                >
                                    الرد على الاستفسار
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default MessagesPage;