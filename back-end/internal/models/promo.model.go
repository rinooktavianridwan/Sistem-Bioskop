package models

import (
	"time"

	"gorm.io/gorm"
)

type Promo struct {
	gorm.Model
	Name          string    `json:"name" gorm:"not null"`
	Code          string    `json:"code" gorm:"uniqueIndex;not null"`
	Description   string    `json:"description"`
	DiscountType  string    `json:"discount_type" gorm:"not null"`
	DiscountValue float64   `json:"discount_value" gorm:"not null"`
	MinTickets    int       `json:"min_tickets" gorm:"default:1"`
	MaxDiscount   *float64  `json:"max_discount"`
	UsageLimit    *int      `json:"usage_limit"`
	IsActive      bool      `json:"is_active" gorm:"default:true"`
	ValidFrom     time.Time `json:"valid_from"`
	ValidUntil    time.Time `json:"valid_until"`

	PromoMovies []PromoMovie `json:"promo_movies,omitempty" gorm:"foreignKey:PromoID"`
}

type PromoMovie struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	PromoID   uint      `json:"promo_id" gorm:"not null"`
	MovieID   uint      `json:"movie_id" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`

	Promo Promo `json:"promo,omitempty" gorm:"foreignKey:PromoID"`
	Movie Movie `json:"movie,omitempty" gorm:"foreignKey:MovieID"`
}
