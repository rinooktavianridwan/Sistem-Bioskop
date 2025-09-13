import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../config/api.config";
import { useAuth } from "../../contexts/useAuth.hook";
import type { Schedule as ScheduleType } from "../../types/model.type";
import Modal from "../../components/modal.component";

const PAYMENT_METHODS = [
  { id: "credit_card", label: "Credit Card" },
  { id: "e_wallet", label: "E-Wallet" },
];

interface PromoData {
  id: number;
  name: string;
  code: string;
  description: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  min_tickets: number;
  max_discount?: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
}

const OrderCheckoutPage: React.FC = () => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const scheduleId = Number(searchParams.get("schedule_id") ?? "");
  const seatsParam = searchParams.get("seats") ?? "";
  const seats = useMemo(() => {
    return seatsParam
      ? seatsParam.split(",").map((s) => Number(s)).filter(Boolean)
      : [];
  }, [seatsParam]);

  const [schedule, setSchedule] = useState<ScheduleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Promo states
  const [appliedPromo, setAppliedPromo] = useState<PromoData | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [availablePromos, setAvailablePromos] = useState<PromoData[]>([]);

  useEffect(() => {
    if (!scheduleId) {
      setError("Invalid schedule");
      setLoading(false);
      return;
    }
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/schedules/${scheduleId}`);
        setSchedule(res.data?.data ?? res.data);
      } catch (e) {
        console.error(e);
        setError("Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [scheduleId]);

  const pricePerSeat = schedule?.price ?? 0;
  const subtotal = useMemo(
    () => seats.length * pricePerSeat,
    [seats, pricePerSeat]
  );

  // Calculate discount and final total
  const { discount, total } = useMemo(() => {
    if (!appliedPromo) return { discount: 0, total: subtotal };

    let discountAmount = 0;
    if (appliedPromo.discount_type === "percentage") {
      discountAmount = subtotal * (appliedPromo.discount_value / 100);
      if (
        appliedPromo.max_discount &&
        discountAmount > appliedPromo.max_discount
      ) {
        discountAmount = appliedPromo.max_discount;
      }
    } else {
      discountAmount = appliedPromo.discount_value;
    }

    return {
      discount: discountAmount,
      total: Math.max(0, subtotal - discountAmount),
    };
  }, [subtotal, appliedPromo]);

  const fetchAvailablePromos = async () => {
    try {
      const res = await axiosInstance.get("/promos", {
        params: { is_active: true, per_page: 50 },
      });
      const promos = res.data?.data?.data || res.data?.data || [];
      setAvailablePromos(promos);
    } catch (err) {
      console.warn("Failed to fetch available promos", err);
    }
  };

  const selectPromo = (promo: PromoData) => {
    // Direct apply without backend validation
    setAppliedPromo(promo);
    setShowPromoModal(false);
  };

  const onConfirm = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!paymentMethod) {
      setError("Pilih metode pembayaran");
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        schedule_id: scheduleId,
        seat_numbers: seats,
        payment_method: paymentMethod,
      };

      if (appliedPromo) {
        payload["promo_code"] = appliedPromo.code;
      }

      await axiosInstance.post("/transactions", payload);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      console.error(err);
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(message ?? "Gagal membuat pesanan");
    }
  };

  if (loading) return <div className="p-6 text-gray-300">Loading...</div>;
  if (error && !schedule)
    return <div className="p-6 text-red-400">{error}</div>;
  if (!schedule)
    return <div className="p-6 text-gray-300">Schedule not found</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex gap-6 items-start">
        <img
          src={
            schedule.movie?.poster_url
              ? `${(import.meta.env.VITE_API_URL as string).replace(
                  /\/$/,
                  ""
                )}/${schedule.movie.poster_url}`
              : "/No-Image-Placeholder.png"
          }
          alt={schedule.movie?.title}
          className="w-36 h-52 object-cover rounded"
        />
        <div className="flex-1 text-white">
          <h2 className="text-2xl font-bold">{schedule.movie?.title}</h2>
          <div className="text-sm text-gray-400">
            {new Date(schedule.start_time).toLocaleString()} •{" "}
            {schedule.studio?.name}
          </div>
          <div className="mt-4 text-gray-300">{schedule.movie?.overview}</div>
        </div>
      </div>

      <div className="mt-8 bg-gray-900 p-4 rounded text-gray-300">
        <div className="mb-2">
          Seats:{" "}
          <span className="font-medium text-white">
            {seats
              .map((n) => {
                // map seat numbers to labels same logic as order page
                const cols = Math.min(
                  20,
                  Math.max(
                    5,
                    Math.round(Math.sqrt(schedule?.studio?.seat_capacity ?? 10))
                  )
                );
                const idx = n;
                const row = Math.floor((idx - 1) / cols);
                const col = ((idx - 1) % cols) + 1;
                // convert row number to letters
                let s = "";
                let r = row + 1;
                while (r > 0) {
                  const rem = (r - 1) % 26;
                  s = String.fromCharCode(65 + rem) + s;
                  r = Math.floor((r - 1) / 26);
                }
                return `${s}${col}`;
              })
              .join(", ")}
          </span>
        </div>

        {/* Promo Code Section */}
        <div className="mt-4 border-t border-gray-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Promo Code</span>
            <button
              onClick={() => {
                setShowPromoModal(true);
                fetchAvailablePromos();
              }}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
            >
              Browse Promos
            </button>
          </div>

          {appliedPromo && (
            <div className="bg-green-900/30 border border-green-700 rounded p-3 mb-3">
              <div className="text-green-400 font-medium">
                ✓ {appliedPromo.name}
              </div>
              <div className="text-sm text-green-300">
                {appliedPromo.description}
              </div>
              <div className="text-xs text-green-400 mt-1">
                Code: {appliedPromo.code}
              </div>
              <button
                onClick={() => setAppliedPromo(null)}
                className="text-sm text-red-400 hover:underline mt-2"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-gray-800 pt-4">
          <div className="flex justify-between py-1">
            <span>Subtotal ({seats.length} seats)</span>
            <span>Rp {subtotal.toLocaleString()}</span>
          </div>
          {appliedPromo && discount > 0 && (
            <div className="flex justify-between py-1 text-green-400">
              <span>Discount ({appliedPromo.code})</span>
              <span>-Rp {discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-2 border-t border-gray-800 text-lg font-bold">
            <span>Total</span>
            <span className="text-white">Rp {total.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mt-4">
          <div className="text-sm text-gray-400 mb-2">
            Pilih Metode Pembayaran
          </div>
          <div className="flex gap-3">
            {PAYMENT_METHODS.map((pm) => (
              <label
                key={pm.id}
                className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer ${
                  paymentMethod === pm.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === pm.id}
                  onChange={() => setPaymentMethod(pm.id)}
                />
                <span>{pm.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Only show general errors (not promo-related) */}
        {error &&
          !error.includes("promo") &&
          !error.includes("Failed to validate") && (
            <div className="mt-3 text-red-400 text-sm">{error}</div>
          )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded bg-gray-700 text-gray-200"
          >
            Kembali
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded font-medium ${
              paymentMethod
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
            disabled={!paymentMethod}
          >
            Konfirmasi & Bayar
          </button>
        </div>
      </div>

      {/* Promo List Modal */}
      <Modal
        open={showPromoModal}
        title="Available Promos"
        onCancel={() => setShowPromoModal(false)}
      >
        <div className="max-h-60 overflow-y-auto">
          {availablePromos.length === 0 ? (
            <div className="text-gray-400">
              No promos available for this transaction
            </div>
          ) : (
            availablePromos.map((promo) => (
              <div
                key={promo.id}
                className="border border-gray-700 rounded p-3 mb-2 hover:bg-gray-800 cursor-pointer"
                onClick={() => selectPromo(promo)}
              >
                <div className="font-medium text-white">{promo.name}</div>
                <div className="text-sm text-gray-400">Code: {promo.code}</div>
                <div className="text-sm text-gray-300">{promo.description}</div>
                <div className="text-xs text-blue-400 mt-1">
                  {promo.discount_type === "percentage"
                    ? `${promo.discount_value}% off`
                    : `Rp ${promo.discount_value.toLocaleString()} off`}
                  {promo.max_discount &&
                    promo.discount_type === "percentage" &&
                    ` (max Rp ${promo.max_discount.toLocaleString()})`}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal
        open={showLoginModal}
        title="Harap Login"
        message="Anda harus login untuk melakukan pemesanan. Ingin pergi ke halaman login sekarang?"
        confirmText="Ke Login"
        cancelText="Batal"
        onConfirm={() => {
          setShowLoginModal(false);
          navigate("/login");
        }}
        onCancel={() => setShowLoginModal(false)}
      />

      <Modal
        open={showSuccessModal}
        title="Transaksi Berhasil!"
        message="Pesanan Anda telah berhasil dibuat. Silakan lakukan pembayaran dalam 2 menit."
        confirmText="Lihat Pesanan"
        onConfirm={() => {
          setShowSuccessModal(false);
          navigate("/orders");
        }}
        onCancel={() => {
          setShowSuccessModal(false);
          navigate("/orders");
        }}
      />
    </div>
  );
};

export default OrderCheckoutPage;
