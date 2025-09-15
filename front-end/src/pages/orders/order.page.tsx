import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Modal from "../../components/modal.component";
import axiosInstance, { buildMediaSrc } from "../../config/api.config";
import type { Schedule as ScheduleType } from "../../types/model.type";

function rowIndexToLetters(idx: number) {
  let s = "";
  let n = idx + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
interface TicketData {
  id: number;
  transaction_id: number;
  schedule_id: number;
  seat_number: number;
  status: 'active' | 'used' | 'pending' | 'cancelled';
  price: number;
  created_at: string;
  transaction: {
    id: number;
    payment_method: string;
    payment_status: 'success' | 'pending' | 'failed';
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
}

interface TicketResponse {
  page: number;
  per_page: number;
  total: number;
  total_page: number;
  data: TicketData[];
}

const OrderNewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scheduleIdStr = searchParams.get("schedule_id") ?? "";
  const scheduleId = Number(scheduleIdStr);
  const [schedule, setSchedule] = useState<ScheduleType | null>(null);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const defaultMaxCols = 20;

  useEffect(() => {
  if (!scheduleId) return;
  const fetch = async () => {
    setLoading(true);
    try {
      const sres = await axiosInstance.get(`/schedules/${scheduleId}`);
      const sched: ScheduleType = sres.data?.data ?? sres.data;
      setSchedule(sched);

      let booked: number[] = [];
      try {
        const tres = await axiosInstance.get(`/tickets/by-schedule/${scheduleId}`);
        const payload = tres.data?.data as TicketResponse | undefined;
        
        if (payload?.data && Array.isArray(payload.data)) {
          booked = payload.data
            .filter((ticket: TicketData) => {
              const status = ticket.status;
              const paymentStatus = ticket.transaction?.payment_status;

              return (
                status === 'active' || 
                status === 'used' || 
                (status === 'pending' && (paymentStatus === 'success' || paymentStatus === 'pending'))
              );
            })
            .map((ticket: TicketData) => Number(ticket.seat_number));
        }
      } catch (err) {
        console.warn("Failed to fetch booked seats for schedule", err);
      }

      setBookedSeats(booked);
    } catch (err) {
      console.error(err);
      setError("Failed to load schedule or booked seats");
    } finally {
      setLoading(false);
    }
  };
  fetch();
}, [scheduleId]);

  // FIX: correct seatCapacity fallback to 0
  const seatCapacity = schedule?.studio?.seat_capacity ?? 0;

  const columns = useMemo(() => {
    if (!seatCapacity) return 10;
    // heuristic: keep columns near sqrt(capacity) but bounded 5..20
    const approx = Math.max(5, Math.round(Math.sqrt(seatCapacity)));
    return Math.min(defaultMaxCols, Math.max(5, approx));
  }, [seatCapacity]);

  const seats = useMemo(() => {
    if (!seatCapacity) return [];
    const arr = Array.from({ length: seatCapacity }, (_, i) => {
      const idx = i + 1; // 1-based seat number (backend expects 1..N)
      const row = Math.floor((idx - 1) / columns);
      const col = ((idx - 1) % columns) + 1;
      const label = `${rowIndexToLetters(row)}${col}`;
      return { seatNumber: idx, label };
    });
    return arr;
  }, [seatCapacity, columns]);

  const onSubmit = async () => {
    if (!selectedSeats.length) {
      setError("Pilih kursi terlebih dahulu");
      return;
    }
    const qs = new URLSearchParams({
      schedule_id: String(scheduleId),
      seats: selectedSeats.join(","),
    });
    navigate(`/orders/checkout?${qs.toString()}`);
  };
  const MAX_TICKETS = 5;
  const [showMaxModal, setShowMaxModal] = useState(false);

  const toggleSeat = (seatNumber: number) => {
    if (bookedSeats.includes(seatNumber)) return;

    setSelectedSeats((prev) => {
      const already = prev.includes(seatNumber);
      if (already) return prev.filter((s) => s !== seatNumber);

      if (prev.length >= MAX_TICKETS) {
        // show modal or error
        setShowMaxModal(true);
        return prev;
      }
      return [...prev, seatNumber];
    });
  };

  const seatDisabledByLimit = (seatNumber: number) =>
    !selectedSeats.includes(seatNumber) && selectedSeats.length >= MAX_TICKETS;

  if (loading) return <div className="p-6 text-gray-300">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!schedule)
    return <div className="p-6 text-gray-300">Schedule not found</div>;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="mb-6 flex gap-6">
        <img
          src={buildMediaSrc(schedule.movie?.poster_url)}
          alt={schedule.movie?.title}
          className="w-40 h-60 object-cover rounded"
        />
        <div>
          <h1 className="text-2xl font-bold text-white">
            {schedule.movie?.title}
          </h1>
          <div className="text-sm text-gray-400">
            {new Date(schedule.start_time).toLocaleString()} •{" "}
            {schedule.studio?.name}
          </div>
          <div className="mt-2 text-gray-300">Price: Rp {schedule.price}</div>
        </div>
      </div>

      <div className="bg-gray-900 p-4 rounded mb-4 text-gray-300">
        <div className="mb-3">Select seats ({selectedSeats.length})</div>
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
            gap: 8,
          }}
        >
          {seats.map((s) => {
            const isBooked = bookedSeats.includes(s.seatNumber);
            const isSelected = selectedSeats.includes(s.seatNumber);
            const disabledByLimit = seatDisabledByLimit(s.seatNumber);
            return (
              <button
                key={s.seatNumber}
                onClick={() => toggleSeat(s.seatNumber)}
                disabled={isBooked || disabledByLimit}
                className={`rounded px-2 py-2 text-sm font-medium ${
                  isBooked
                    ? "bg-red-800 text-white opacity-60 cursor-not-allowed"
                    : isSelected
                    ? "bg-green-600 text-white"
                    : "bg-gray-700 text-gray-100 hover:bg-gray-600"
                } ${disabledByLimit ? "opacity-60 cursor-not-allowed" : ""}`}
                title={isBooked ? `Booked` : s.label}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-sm text-gray-400">
          Legend:{" "}
          <span className="px-2 py-1 bg-green-600 text-white rounded ml-2">
            Selected
          </span>{" "}
          <span className="px-2 py-1 bg-red-800 text-white rounded ml-2">
            Booked
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-300">
            Selected seats:{" "}
            <span className="font-medium text-white">
              {selectedSeats
                .map((n) => {
                  const s = seats.find((x) => x.seatNumber === n);
                  return s?.label ?? n;
                })
                .join(", ")}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Total: Rp {selectedSeats.length * (schedule.price ?? 0)}
          </div>
        </div>

        <div>
          <button
            disabled={selectedSeats.length === 0}
            onClick={onSubmit}
            className={`px-6 py-3 rounded font-medium ${
              selectedSeats.length
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            Pesan Sekarang
          </button>
        </div>
      </div>
      <Modal
        open={showMaxModal}
        title="Batas Pemesanan"
        message={`Maksimum ${MAX_TICKETS} tiket per transaksi.`}
        confirmText="OK"
        onConfirm={() => setShowMaxModal(false)}
        onCancel={() => setShowMaxModal(false)}
      />
    </div>
  );
};

export default OrderNewPage;
