import React, { createContext, useState, useContext, useCallback } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  title?: string;
  message?: string;
}

interface ToastContextType {
  showToast: (toast: Toast) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC = ({ children }:any) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback(({ type = 'info', title, message }: Toast) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, type, title, message }]);
    
    setTimeout(() => {
      removeToast(id);
    }, 5000);

    return id;
  }, [removeToast]);

  const getIcon = (type: ToastType): JSX.Element => {
    switch (type) {
      case 'success':
        return <FaCheckCircle />;
      case 'error':
      case 'warning':
        return <FaExclamationCircle />;
      case 'info':
      default:
        return <FaInfoCircle />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      <div className="fixed top-5 right-5 z-50 space-y-4">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-start p-4 rounded shadow-lg w-80 mb-4 transition-transform transform ${toast.type === 'success' ? 'bg-green-100 text-green-800' :
              toast.type === 'error' ? 'bg-red-100 text-red-800' :
              toast.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'}`}
          >
            <div className="mr-3 text-2xl">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1">
              {toast.title && <div className="font-semibold mb-1">{toast.title}</div>}
              {toast.message && <div className="text-sm">{toast.message}</div>}
            </div>
            <button onClick={() => removeToast(toast.id)} className="ml-2 text-xl text-gray-500 hover:text-gray-700 focus:outline-none">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
