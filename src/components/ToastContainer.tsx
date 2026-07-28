import React from 'react';
import type { ToastMessage } from '../types';
import '../styles.css';

interface ToastContainerProps {
  toasts: ToastMessage[];
}

const toastColors: Record<ToastMessage['type'], string> = {
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  warning: 'var(--color-warning)',
  info: 'var(--color-primary)'
};

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '16px',
    right: '16px',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const toastItemStyle = (type: ToastMessage['type']): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    color: 'white',
    boxShadow: 'var(--shadow-md)',
    background: toastColors[type]
  });

  return (
    <div style={containerStyle}>
      {toasts.map((toast) => (
        <div key={toast.id} style={toastItemStyle(toast.type)}>
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;