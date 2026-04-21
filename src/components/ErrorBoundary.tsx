import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // تحديث الـ state عشان نعرض شاشة الخطأ البديلة (Fallback UI)
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // هنا ممكن نربط لاحقاً بـ Sentry أو أي خدمة تتبع أخطاء
    console.error('تم اصطياد خطأ في النظام:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 font-tajawal text-center" dir="rtl">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-red-100 max-w-md w-full animate-in zoom-in duration-300">
            <div className="bg-red-50 text-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h1 className="text-2xl font-black text-gray-800 mb-2">عذراً، حدث خطأ غير متوقع!</h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">
              واجه النظام مشكلة تقنية أثناء تحميل هذه الصفحة. لا تقلق، بياناتك في أمان.
            </p>
            <button
              onClick={() => window.location.replace('/')}
              className="w-full bg-forest text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-forest/90 transition-colors shadow-lg shadow-forest/20"
            >
              <Home size={20} />
              العودة للرئيسية
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;