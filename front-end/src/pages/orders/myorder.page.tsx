import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../config/api.config";
import PaymentModal from "../../components/payment.modal";

interface TransactionData {
  id: number;
  user_id: number;
  total_amount: number;
  payment_method: string;
  payment_status: "pending" | "success" | "failed";
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
      movie: {
        id: number;
        title: string;
        duration: number;
      };
      studio: {
        id: number;
        name: string;
      };
    };
  }>;
}

interface PaginatedResponse {
  page: number;
  per_page: number;
  total: number;
  total_page: number;
  data: TransactionData[];
}

const MyOrdersPage: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionData | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/transactions/my", {
        params: { page, per_page: 10 },
      });
      const data: PaginatedResponse = res.data.data;
      setTransactions(data.data);
      setPage(data.page);
      setTotalPages(data.total_page);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handlePaymentClick = (transaction: TransactionData) => {
    setSelectedTransaction(transaction);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    // Refresh transactions list
    fetchTransactions();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-400 bg-green-900/30 border-green-700";
      case "pending":
        return "text-yellow-400 bg-yellow-900/30 border-yellow-700";
      case "failed":
        return "text-red-400 bg-red-900/30 border-red-700";
      default:
        return "text-gray-400 bg-gray-800 border-gray-600";
    }
  };

  const getPaymentMethod = (method: string) => {
    return method === "credit_card" ? "Credit Card" : "E-Wallet";
  };

  if (loading) return <div className="p-6 text-gray-300">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">My Orders</h1>

      {transactions.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          <p>No orders found</p>
          <Link
            to="/schedules"
            className="text-blue-400 hover:underline mt-2 inline-block"
          >
            Browse Movies
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {transactions.map((transaction) => {
            const firstTicket = transaction.tickets[0];
            const movie = firstTicket?.schedule?.movie;
            const studio = firstTicket?.schedule?.studio;
            const seatNumbers = transaction.tickets
              .map((t) => t.seat_number)
              .join(", ");

            return (
              <div key={transaction.id} className="bg-gray-900 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {movie?.title || "Unknown Movie"}
                    </h3>
                    <p className="text-gray-400">
                      {studio?.name} •{" "}
                      {new Date(
                        firstTicket?.schedule?.start_time
                      ).toLocaleString()}
                    </p>
                    <p className="text-gray-300 text-sm">
                      Seats: {seatNumbers} • {transaction.tickets.length}{" "}
                      tickets
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(
                        transaction.payment_status
                      )}`}
                    >
                      {transaction.payment_status.toUpperCase()}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      {getPaymentMethod(transaction.payment_method)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      Rp {transaction.total_amount.toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {transaction.payment_status === "pending" && (
                      <button
                        onClick={() => handlePaymentClick(transaction)}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500"
                      >
                        Bayar Sekarang
                      </button>
                    )}
                    <Link
                      to={`/orders/${transaction.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-8">
            <div className="text-gray-400">
              Page {page} of {totalPages} • Total: {total} transactions
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedTransaction && (
        <PaymentModal
          open={showPaymentModal}
          transactionId={selectedTransaction.id}
          totalAmount={selectedTransaction.total_amount}
          paymentMethod={selectedTransaction.payment_method}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedTransaction(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default MyOrdersPage;
