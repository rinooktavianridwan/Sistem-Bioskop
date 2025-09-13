import React, { useState } from 'react';
import Modal from './modal.component';

interface PaymentModalProps {
  open: boolean;
  transactionId: number;
  totalAmount: number;
  paymentMethod: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  transactionId,
  totalAmount,
  paymentMethod,
  onClose,
  onSuccess,
}) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setProcessing(true);
    setError('');

    try {
      const axiosInstance = (await import('../config/api.config')).default;
      
      await axiosInstance.post(`/transactions/${transactionId}/payment`, {
        payment_status: 'success',
        payment_note: `Paid via ${paymentMethod === 'credit_card' ? 'Credit Card' : 'E-Wallet'}`,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(message ?? 'Pembayaran gagal. Silakan coba lagi.');
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentMethodLabel = () => {
    return paymentMethod === 'credit_card' ? 'Credit Card' : 'E-Wallet';
  };

  return (
    <Modal
      open={open}
      title="Konfirmasi Pembayaran"
      onCancel={onClose}
      hideDefaultButtons={true} 
    >
      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Transaction ID:</span>
            <span className="text-white font-mono">#{transactionId}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Payment Method:</span>
            <span className="text-white">{getPaymentMethodLabel()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total Amount:</span>
            <span className="text-white font-bold text-lg">
              Rp {totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-blue-900/30 border border-blue-700 rounded p-3">
          <p className="text-blue-300 text-sm">
            ⚠️ Ini adalah simulasi pembayaran. Dalam aplikasi nyata, Anda akan 
            diarahkan ke gateway pembayaran.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handlePayment}
            disabled={processing}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 flex items-center justify-center"
          >
            {processing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              'Bayar Sekarang'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;