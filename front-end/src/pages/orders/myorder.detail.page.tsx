import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../config/api.config';
import PaymentModal from '../../components/payment.modal';

interface TransactionDetail {
  id: number;
  user_id: number;
  total_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'success' | 'failed';
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  tickets: Array<{
    id: number;
    seat_number: number;
    status: string;
    price: number;
    schedule: {
      id: number;
      start_time: string;
      end_time: string;
      date: string;
      movie: {
        id: number;
        title: string;
        duration: number;
      };
      studio: {
        id: number;
        name: string;
        seat_capacity: number;
      };
    };
  }>;
}

const MyOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchTransaction = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/transactions/${id}`);
      setTransaction(res.data.data);
    } catch (err: unknown) {
      console.error(err);
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 404) {
        setError('Transaction not found');
      } else {
        setError('Failed to load transaction details');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  const handlePaymentSuccess = () => {
    // Refresh transaction data after successful payment
    fetchTransaction();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-900/30 border-green-700';
      case 'pending': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      case 'failed': return 'text-red-400 bg-red-900/30 border-red-700';
      default: return 'text-gray-400 bg-gray-800 border-gray-600';
    }
  };

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'used': return 'text-blue-400';
      case 'cancelled': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) return <div className="p-6 text-gray-300">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!transaction) return <div className="p-6 text-gray-300">Transaction not found</div>;

  const movie = transaction.tickets[0]?.schedule?.movie;
  const studio = transaction.tickets[0]?.schedule?.studio;
  const schedule = transaction.tickets[0]?.schedule;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/orders')}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
        >
          ← Back to Orders
        </button>
        <h1 className="text-3xl font-bold text-white">Order #{transaction.id}</h1>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{movie?.title}</h2>
            <p className="text-gray-400">
              {studio?.name} • {new Date(schedule?.start_time || '').toLocaleString()}
            </p>
            <p className="text-gray-300">
              Duration: {movie?.duration} minutes
            </p>
          </div>
          <div className="text-right">
            <div className={`px-4 py-2 rounded-full text-sm border ${getStatusColor(transaction.payment_status)} mb-2`}>
              {transaction.payment_status.toUpperCase()}
            </div>
            <p className="text-gray-400">
              {transaction.payment_method === 'credit_card' ? 'Credit Card' : 'E-Wallet'}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Tickets ({transaction.tickets.length})</h3>
          <div className="grid gap-3">
            {transaction.tickets.map(ticket => (
              <div key={ticket.id} className="bg-gray-800 rounded p-4 flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">Seat {ticket.seat_number}</p>
                  <p className={`text-sm ${getTicketStatusColor(ticket.status)}`}>
                    {ticket.status.toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">Rp {ticket.price.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">Ticket #{ticket.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-400">Order Date</p>
              <p className="text-white">{new Date(transaction.created_at).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-white">Rp {transaction.total_amount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {transaction.payment_status === 'pending' && (
          <div className="border-t border-gray-800 pt-6 mt-6">
            <button 
              onClick={() => setShowPaymentModal(true)}
              className="w-full py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-500"
            >
              Bayar Sekarang
            </button>
            <p className="text-center text-gray-400 text-sm mt-2">
              Complete payment within 2 minutes to secure your seats
            </p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {transaction && (
        <PaymentModal
          open={showPaymentModal}
          transactionId={transaction.id}
          totalAmount={transaction.total_amount}
          paymentMethod={transaction.payment_method}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default MyOrderDetailPage;