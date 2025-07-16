import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { Typography, Heading } from './Typography';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconColor: 'text-red-400',
          iconBg: 'bg-red-500/20',
          confirmButton: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
          borderColor: 'border-red-500/30'
        };
      case 'warning':
        return {
          iconColor: 'text-yellow-400',
          iconBg: 'bg-yellow-500/20',
          confirmButton: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500',
          borderColor: 'border-yellow-500/30'
        };
      case 'info':
        return {
          iconColor: 'text-blue-400',
          iconBg: 'bg-blue-500/20',
          confirmButton: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
          borderColor: 'border-blue-500/30'
        };
      default:
        return {
          iconColor: 'text-red-400',
          iconBg: 'bg-red-500/20',
          confirmButton: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
          borderColor: 'border-red-500/30'
        };
    }
  };

  const styles = getTypeStyles();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' && !loading) {
      onConfirm();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}>
              {type === 'danger' ? (
                <Trash2 className={`h-5 w-5 ${styles.iconColor}`} />
              ) : (
                <AlertTriangle className={`h-5 w-5 ${styles.iconColor}`} />
              )}
            </div>
            <Heading level={3} className="text-white">
              {title}
            </Heading>
          </div>
          
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <Typography variant="body" color="secondary" className="leading-relaxed">
            {message}
          </Typography>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800/30">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <Typography variant="button">
              {cancelText}
            </Typography>
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${styles.confirmButton}`}
          >
            <div className="flex items-center gap-2">
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <Typography variant="button">
                {loading ? 'Processing...' : confirmText}
              </Typography>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;