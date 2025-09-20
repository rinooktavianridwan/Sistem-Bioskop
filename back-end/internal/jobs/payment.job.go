package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"movie-app-go/internal/enums"
	"movie-app-go/internal/models"
	"time"

	"github.com/hibiken/asynq"
	"gorm.io/gorm"
)

type PaymentTimeoutJob struct {
	TransactionID uint `json:"transaction_id"`
}

type PaymentJobHandler struct {
	DB *gorm.DB
}

func NewPaymentJobHandler(db *gorm.DB) *PaymentJobHandler {
	return &PaymentJobHandler{DB: db}
}

func (h *PaymentJobHandler) HandlePaymentTimeout(ctx context.Context, t *asynq.Task) error {
	var payload PaymentTimeoutJob
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v", err)
	}

	log.Printf("Processing payment timeout for transaction ID: %d", payload.TransactionID)

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var transaction models.Transaction
		if err := tx.First(&transaction, payload.TransactionID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				log.Printf("Transaction %d not found, might be already processed", payload.TransactionID)
				return nil
			}
			return err
		}

		if transaction.PaymentStatus != enums.PaymentStatusPending {
			log.Printf("Transaction %d status is %s, skipping", payload.TransactionID, transaction.PaymentStatus)
			return nil
		}

		transaction.PaymentStatus = enums.PaymentStatusFailed
		if err := tx.Save(&transaction).Error; err != nil {
			return err
		}

		if err := tx.Model(&models.Ticket{}).
			Where("transaction_id = ?", payload.TransactionID).
			Update("status", enums.TicketStatusCancelled).Error; err != nil {
			return err
		}

		log.Printf("Transaction %d marked as failed and tickets cancelled", payload.TransactionID)
		return nil
	})

	return err
}

func CreatePaymentTimeoutPayload(transactionID uint) ([]byte, error) {
	payload := PaymentTimeoutJob{
		TransactionID: transactionID,
	}
	return json.Marshal(payload)
}

// StartPendingCleaner menjalankan goroutine yang memeriksa transaksi pending.
// interval: durasi antara pemeriksaan (mis. 1*time.Minute).
// stopCh: channel untuk menghentikan cleaner.
func StartPendingCleaner(db *gorm.DB, interval time.Duration, stopCh <-chan struct{}) {
	ticker := time.NewTicker(interval)

	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				if err := cleanPending(db); err != nil {
					log.Printf("pending cleaner error: %v", err)
				}
			case <-stopCh:
				log.Println("stopping pending cleaner")
				return
			}
		}
	}()
}

func cleanPending(db *gorm.DB) error {
	now := time.Now()
	return db.Transaction(func(tx *gorm.DB) error {
		// Cari transactions pending yang memiliki tiket untuk schedule yang sudah mulai
		var transactions []models.Transaction
		// JOIN tickets -> schedules, grup by transactions.id
		err := tx.Model(&models.Transaction{}).
			Select("transactions.*").
			Joins("JOIN tickets ON tickets.transaction_id = transactions.id").
			Joins("JOIN schedules ON tickets.schedule_id = schedules.id").
			Where("transactions.payment_status = ? AND schedules.start_time <= ? AND transactions.deleted_at IS NULL", enums.PaymentStatusPending, now).
			Group("transactions.id").
			Find(&transactions).Error
		if err != nil {
			return err
		}

		for _, t := range transactions {
			// Tandai transaction failed
			if err := tx.Model(&models.Transaction{}).
				Where("id = ?", t.ID).
				Update("payment_status", enums.PaymentStatusFailed).Error; err != nil {
				return err
			}

			// Batalkan tiket terkait
			if err := tx.Model(&models.Ticket{}).
				Where("transaction_id = ?", t.ID).
				Update("status", enums.TicketStatusCancelled).Error; err != nil {
				return err
			}

			log.Printf("auto-cancelled pending transaction %d (showtime passed)", t.ID)
		}

		return nil
	})
}
