package services

import (
	"fmt"
	"log"
	"movie-app-go/internal/enums"
	"movie-app-go/internal/jobs"
	"movie-app-go/internal/models"
	notificationServices "movie-app-go/internal/modules/notification/services"
	"movie-app-go/internal/modules/order/repositories"
	"movie-app-go/internal/modules/order/requests"
	promoRequests "movie-app-go/internal/modules/promo/requests"
	promoServices "movie-app-go/internal/modules/promo/services"
	"movie-app-go/internal/repository"
	"movie-app-go/internal/utils"
	"os"
	"strconv"
	"time"

	"gorm.io/gorm"
)

type TransactionService struct {
	TransactionRepo     *repositories.TransactionRepository
	QueueService        *jobs.QueueService
	PromoService        *promoServices.PromoService
	NotificationService *notificationServices.NotificationService
}

func NewTransactionService(
	transactionRepo *repositories.TransactionRepository,
	queueService *jobs.QueueService,
	promoService *promoServices.PromoService,
	notificationService *notificationServices.NotificationService,
) *TransactionService {
	return &TransactionService{
		TransactionRepo:     transactionRepo,
		QueueService:        queueService,
		PromoService:        promoService,
		NotificationService: notificationService,
	}
}

// ========== Safe Condition ==========
// func (s *TransactionService) CreateTransaction(userID uint, req *requests.CreateTransactionRequest) error {
// 	var transaction *models.Transaction

// 	err := s.TransactionRepo.WithTransaction(func(tx *gorm.DB) error {
// 		var pendingCount int64
// 		if err := tx.Model(&models.Transaction{}).
// 			Where("user_id = ? AND payment_status = ?", userID, enums.PaymentStatusPending).
// 			Count(&pendingCount).Error; err != nil {
// 			return err
// 		}
// 		if pendingCount > 0 {
// 			return utils.ErrPendingTransactionExists
// 		}

// 		schedule, err := s.TransactionRepo.GetScheduleWithMovieAndStudio(req.ScheduleID)
// 		if err != nil {
// 			if err == gorm.ErrRecordNotFound {
// 				return utils.ErrScheduleNotFound
// 			}
// 			return err
// 		}

// 		if len(req.SeatNumbers) > int(schedule.Studio.SeatCapacity) {
// 			return fmt.Errorf("seat numbers exceed studio capacity")
// 		}

// 		existingTickets, err := s.TransactionRepo.CountExistingTickets(req.ScheduleID, req.SeatNumbers)
// 		if err != nil {
// 			return err
// 		}
// 		if existingTickets > 0 {
// 			return fmt.Errorf("some seats are already booked")
// 		}

// 		for _, seatNum := range req.SeatNumbers {
// 			if seatNum < 1 || seatNum > schedule.Studio.SeatCapacity {
// 				return fmt.Errorf("invalid seat number: %d", seatNum)
// 			}
// 		}

// 		originalAmount := float64(len(req.SeatNumbers)) * schedule.Price
// 		finalAmount := originalAmount
// 		discountAmount := float64(0)
// 		var promoID *uint

// 		if req.PromoCode != "" && s.PromoService != nil {
// 			promoValidation := &promoRequests.ValidatePromoRequest{
// 				PromoCode:   req.PromoCode,
// 				TotalAmount: originalAmount,
// 				MovieIDs:    []uint{schedule.MovieID},
// 				SeatNumbers: req.SeatNumbers,
// 			}

// 			result, err := s.PromoService.ValidatePromo(userID, promoValidation)
// 			if err != nil || !result.IsValid {
// 				return fmt.Errorf("invalid promo: %s", result.Message)
// 			}

// 			discountAmount = result.DiscountAmount
// 			finalAmount = result.FinalAmount

// 			promo, err := s.PromoService.GetPromoByCode(req.PromoCode)
// 			if err == nil {
// 				promoID = &promo.ID
// 			}
// 		}

// 		transaction = &models.Transaction{
// 			UserID:         userID,
// 			TotalAmount:    finalAmount,
// 			OriginalAmount: &originalAmount,
// 			DiscountAmount: discountAmount,
// 			PaymentMethod:  req.PaymentMethod,
// 			PaymentStatus:  enums.PaymentStatusPending,
// 			PromoID:        promoID,
// 		}

// 		if err := s.TransactionRepo.CreateTransaction(transaction); err != nil {
// 			return err
// 		}

// 		tickets := make([]models.Ticket, 0, len(req.SeatNumbers))
// 		for _, seatNum := range req.SeatNumbers {
// 			tickets = append(tickets, models.Ticket{
// 				TransactionID: transaction.ID,
// 				ScheduleID:    req.ScheduleID,
// 				SeatNumber:    seatNum,
// 				Status:        enums.TicketStatusPending,
// 				Price:         schedule.Price,
// 			})
// 		}

// 		if err := s.TransactionRepo.CreateTickets(tickets); err != nil {
// 			return err
// 		}

// 		return nil
// 	})

// 	if err != nil {
// 		return err
// 	}

// 	if v := os.Getenv("PAYMENT_TIMEOUT_MINUTES"); v != "" {
// 		if m, err := strconv.Atoi(v); err == nil && m > 0 {
// 			delay := time.Duration(m) * time.Minute
// 			if err := s.QueueService.SchedulePaymentTimeout(transaction.ID, delay); err != nil {
// 				fmt.Printf("Failed to schedule payment timeout job: %v\n", err)
// 			}
// 		} else {
// 			// invalid value or non-positive => do not schedule
// 			fmt.Println("PAYMENT_TIMEOUT_MINUTES is invalid or non-positive; skipping payment timeout scheduling")
// 		}
// 	} else {
// 		// env not set => no payment timeout
// 		fmt.Println("PAYMENT_TIMEOUT_MINUTES not set; payment timeout disabled")
// 	}

// 	return nil
// }

// ========== Vurnerability Condition ==========
// Detail: skip per-user pending transaction check AND do NOT persist the transaction record.
// This allows multiple pending "orders" to be created and bypasses the DB guard that
// would be used to detect existing pending transactions. Tickets are created referencing
// an in-memory transaction (transaction.ID == 0) — intentionally insecure for demo.
func (s *TransactionService) CreateTransaction(userID uint, req *requests.CreateTransactionRequest) error {
	var transaction *models.Transaction

	err := s.TransactionRepo.WithTransactionNoTx(func(tx *gorm.DB) error {
		// ===== Vulnerable: no pending-check here (commented out in safe) =====

		schedule, err := s.TransactionRepo.GetScheduleWithMovieAndStudio(req.ScheduleID)
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				return utils.ErrScheduleNotFound
			}
			return err
		}

		if len(req.SeatNumbers) > int(schedule.Studio.SeatCapacity) {
			return fmt.Errorf("seat numbers exceed studio capacity")
		}

		existingTickets, err := s.TransactionRepo.CountExistingTickets(req.ScheduleID, req.SeatNumbers)
		if err != nil {
			return err
		}
		if existingTickets > 0 {
			return fmt.Errorf("some seats are already booked")
		}

		for _, seatNum := range req.SeatNumbers {
			if seatNum < 1 || seatNum > schedule.Studio.SeatCapacity {
				return fmt.Errorf("invalid seat number: %d", seatNum)
			}
		}

		originalAmount := float64(len(req.SeatNumbers)) * schedule.Price
		finalAmount := originalAmount
		discountAmount := float64(0)
		var promoID *uint

		if req.PromoCode != "" && s.PromoService != nil {
			promoValidation := &promoRequests.ValidatePromoRequest{
				PromoCode:   req.PromoCode,
				TotalAmount: originalAmount,
				MovieIDs:    []uint{schedule.MovieID},
				SeatNumbers: req.SeatNumbers,
			}

			result, err := s.PromoService.ValidatePromo(userID, promoValidation)
			if err != nil || !result.IsValid {
				return fmt.Errorf("invalid promo: %s", result.Message)
			}

			discountAmount = result.DiscountAmount
			finalAmount = result.FinalAmount

			promo, err := s.PromoService.GetPromoByCode(req.PromoCode)
			if err == nil {
				promoID = &promo.ID
			}
		}

		// Build in-memory transaction but DO NOT persist it (vulnerable)
		transaction = &models.Transaction{
			UserID:         userID,
			TotalAmount:    finalAmount,
			OriginalAmount: &originalAmount,
			DiscountAmount: discountAmount,
			PaymentMethod:  req.PaymentMethod,
			PaymentStatus:  enums.PaymentStatusPending,
			PromoID:        promoID,
		}

		// NEW: persist the transaction so tickets can reference a real ID
		if err := s.TransactionRepo.CreateTransactionNoTx(transaction); err != nil {
			return err
		}

		// Vulnerable: skip r.CreateTransaction(transaction)
		// Create tickets referencing the (non-persisted) transaction
		tickets := make([]models.Ticket, 0, len(req.SeatNumbers))
		for _, seatNum := range req.SeatNumbers {
			tickets = append(tickets, models.Ticket{
				TransactionID: transaction.ID, // will be zero
				ScheduleID:    req.ScheduleID,
				SeatNumber:    seatNum,
				Status:        enums.TicketStatusPending,
				Price:         schedule.Price,
			})
		}

		if err := s.TransactionRepo.CreateTicketsNoTx(tickets); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return err
	}

	// Attempt to schedule payment timeout for the (non-persisted) transaction.
	// This will schedule with ID==0 (intended for the vulnerability demo).
	if transaction != nil {
		if v := os.Getenv("PAYMENT_TIMEOUT_MINUTES"); v != "" {
			if m, err := strconv.Atoi(v); err == nil && m > 0 {
				delay := time.Duration(m) * time.Minute
				if err := s.QueueService.SchedulePaymentTimeout(transaction.ID, delay); err != nil {
					fmt.Printf("Failed to schedule payment timeout job: %v\n", err)
				}
			} else {
				// invalid value or non-positive => do not schedule
				fmt.Println("PAYMENT_TIMEOUT_MINUTES is invalid or non-positive; skipping payment timeout scheduling")
			}
		} else {
			// env not set => no payment timeout
			fmt.Println("PAYMENT_TIMEOUT_MINUTES not set; payment timeout disabled")
		}
	}

	return nil
}

func (s *TransactionService) GetTransactionsByUser(userID uint, page, perPage int) (repository.PaginationResult[models.Transaction], error) {
	return s.TransactionRepo.GetByUserIDPaginated(userID, page, perPage)
}

func (s *TransactionService) GetAllTransactions(page, perPage int) (repository.PaginationResult[models.Transaction], error) {
	return s.TransactionRepo.GetAllPaginated(page, perPage)
}

func (s *TransactionService) GetTransactionByID(id uint, userID *uint) (*models.Transaction, error) {
	if userID != nil {
		return s.TransactionRepo.GetByIDWithUserFilter(id, *userID)
	}
	return s.TransactionRepo.GetByID(id)
}

func (s *TransactionService) ProcessPayment(id uint, req *requests.ProcessPaymentRequest) error {
	var transaction *models.Transaction

	err := s.TransactionRepo.WithTransaction(func(tx *gorm.DB) error {
		var err error
		transaction, err = s.TransactionRepo.GetByID(id)
		if err != nil {
			return err
		}

		if transaction.PaymentStatus != enums.PaymentStatusPending {
			return fmt.Errorf("transaction already failed or timed out")
		}

		transaction.PaymentStatus = req.PaymentStatus
		if err := s.TransactionRepo.UpdateTransaction(transaction); err != nil {
			return err
		}

		if req.PaymentStatus == enums.PaymentStatusSuccess {
			if err := s.TransactionRepo.UpdateTicketsByTransactionID(id, enums.TicketStatusActive); err != nil {
				return err
			}
		} else if req.PaymentStatus == enums.PaymentStatusFailed {
			if err := s.TransactionRepo.UpdateTicketsByTransactionID(id, enums.TicketStatusCancelled); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return err
	}

	if req.PaymentStatus == enums.PaymentStatusSuccess {
		schedule, err := s.TransactionRepo.GetScheduleByTransactionID(id)
		if err != nil {
			log.Printf("Failed to get schedule for transaction %d: %v", id, err)
		} else {
			go func() {
				if err := s.NotificationService.CreateBookingConfirmationNotification(
					transaction.UserID,
					transaction.ID,
					schedule.Movie.Title,
					transaction.TotalAmount,
				); err != nil {
					log.Printf("Failed to create booking confirmation: %v", err)
				}
			}()

			go func() {
				if err := s.NotificationService.CreateMovieReminderNotification(
					transaction.UserID,
					schedule.Movie.Title,
					schedule.StartTime.Format("2006-01-02 15:04:05"),
					schedule.MovieID,
				); err != nil {
					log.Printf("Failed to create movie reminder: %v", err)
				}
			}()
		}
	}

	return nil
}
