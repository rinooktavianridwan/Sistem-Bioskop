package seed

import (
    "log"
    "math/rand"
    "movie-app-go/internal/models"
    "time"

    "gorm.io/gorm"
)

func SeedSchedules(db *gorm.DB) ([]models.Schedule, error) {
    log.Println("Seeding schedules...")

    // Get movies and studios for relationships
    var movies []models.Movie
    var studios []models.Studio

    if err := db.Find(&movies).Error; err != nil {
        return nil, err
    }
    if err := db.Find(&studios).Error; err != nil {
        return nil, err
    }

    if len(movies) == 0 || len(studios) == 0 {
        log.Println("No movies or studios found, skipping schedule seeding")
        return []models.Schedule{}, nil
    }

    schedules := []models.Schedule{
        // Keep existing schedules for backward compatibility
        // August 2025 schedules
        {
            MovieID:   movies[0].ID,
            StudioID:  studios[0].ID,
            StartTime: time.Date(2025, 8, 20, 14, 0, 0, 0, time.UTC),
            EndTime:   time.Date(2025, 8, 20, 17, 0, 0, 0, time.UTC),
            Date:      time.Date(2025, 8, 20, 0, 0, 0, 0, time.UTC),
            Price:     75000,
        },
        {
            MovieID:   movies[0].ID,
            StudioID:  studios[0].ID,
            StartTime: time.Date(2025, 8, 20, 18, 0, 0, 0, time.UTC),
            EndTime:   time.Date(2025, 8, 20, 21, 0, 0, 0, time.UTC),
            Date:      time.Date(2025, 8, 20, 0, 0, 0, 0, time.UTC),
            Price:     75000,
        },
        {
            MovieID:   movies[0].ID,
            StudioID:  studios[1].ID,
            StartTime: time.Date(2025, 8, 21, 16, 0, 0, 0, time.UTC),
            EndTime:   time.Date(2025, 8, 21, 19, 0, 0, 0, time.UTC),
            Date:      time.Date(2025, 8, 21, 0, 0, 0, 0, time.UTC),
            Price:     75000,
        },
        {
            MovieID:   movies[0].ID,
            StudioID:  studios[1].ID,
            StartTime: time.Date(2025, 8, 22, 20, 0, 0, 0, time.UTC),
            EndTime:   time.Date(2025, 8, 22, 23, 0, 0, 0, time.UTC),
            Date:      time.Date(2025, 8, 22, 0, 0, 0, 0, time.UTC),
            Price:     75000,
        },
        {
            MovieID:   movies[len(movies)-1].ID,
            StudioID:  studios[0].ID,
            StartTime: time.Date(2025, 8, 21, 12, 0, 0, 0, time.UTC),
            EndTime:   time.Date(2025, 8, 21, 15, 0, 0, 0, time.UTC),
            Date:      time.Date(2025, 8, 21, 0, 0, 0, 0, time.UTC),
            Price:     80000,
        },
        {
            MovieID:   movies[len(movies)-1].ID,
            StudioID:  studios[1].ID,
            StartTime: time.Date(2025, 8, 22, 15, 0, 0, 0, time.UTC),
            EndTime:   time.Date(2025, 8, 22, 18, 0, 0, 0, time.UTC),
            Date:      time.Date(2025, 8, 22, 0, 0, 0, 0, time.UTC),
            Price:     80000,
        },
        {
            MovieID:   movies[0].ID,
            StudioID:  studios[0].ID,
            StartTime: time.Date(2025, 9, 1, 14, 0, 0, 0, time.UTC),
            EndTime:   time.Date(2025, 9, 1, 17, 0, 0, 0, time.UTC),
            Date:      time.Date(2025, 9, 1, 0, 0, 0, 0, time.UTC),
            Price:     75000,
        },
        {
            MovieID:   movies[0].ID,
            StudioID:  studios[1].ID,
            StartTime: time.Date(2025, 9, 2, 18, 0, 0, 0, time.UTC),
            EndTime:   time.Date(2025, 9, 2, 21, 0, 0, 0, time.UTC),
            Date:      time.Date(2025, 9, 2, 0, 0, 0, 0, time.UTC),
            Price:     75000,
        },
        {
            MovieID:   movies[len(movies)-1].ID,
            StudioID:  studios[0].ID,
            StartTime: time.Date(2025, 9, 3, 16, 0, 0, 0, time.UTC),
            EndTime:   time.Date(2025, 9, 3, 19, 0, 0, 0, time.UTC),
            Date:      time.Date(2025, 9, 3, 0, 0, 0, 0, time.UTC),
            Price:     80000,
        },
        {
            MovieID:   movies[0].ID,
            StudioID:  studios[0].ID,
            StartTime: time.Date(2025, 10, 10, 19, 0, 0, 0, time.UTC),
            EndTime:   time.Date(2025, 10, 10, 22, 0, 0, 0, time.UTC),
            Date:      time.Date(2025, 10, 10, 0, 0, 0, 0, time.UTC),
            Price:     85000,
        },
        {
            MovieID:   movies[len(movies)-1].ID,
            StudioID:  studios[1].ID,
            StartTime: time.Date(2025, 10, 15, 21, 0, 0, 0, time.UTC),
            EndTime:   time.Date(2025, 10, 16, 0, 0, 0, 0, time.UTC),
            Date:      time.Date(2025, 10, 15, 0, 0, 0, 0, time.UTC),
            Price:     90000,
        },
    }

    // Add extensive schedule data from October 7, 2025 to December 31, 2025 with randomized movies
    startDate := time.Date(2025, 10, 7, 0, 0, 0, 0, time.UTC)
    endDate := time.Date(2025, 12, 31, 0, 0, 0, 0, time.UTC)

    // Time slots for each day
    timeSlots := []struct {
        hour   int
        minute int
    }{
        {10, 0},  // 10:00 AM
        {14, 30}, // 2:30 PM
        {19, 0},  // 7:00 PM
    }

    // Additional time slots for variety
    extraTimeSlots := []struct {
        hour   int
        minute int
    }{
        {12, 0},  // 12:00 PM
        {16, 30}, // 4:30 PM
        {21, 30}, // 9:30 PM
    }

    // Price ranges
    prices := []float64{50000, 65000, 75000, 85000, 90000, 100000}

    // Helper function to check if time slot conflicts with existing schedules for a studio
    hasConflict := func(studioID uint, startTime, endTime time.Time, existingSchedules []models.Schedule) bool {
        for _, existing := range existingSchedules {
            if existing.StudioID == studioID {
                // Check if times overlap
                if (startTime.Before(existing.EndTime) && endTime.After(existing.StartTime)) {
                    return true
                }
            }
        }
        return false
    }

    // Generate random schedules for the date range
    for currentDate := startDate; !currentDate.After(endDate); currentDate = currentDate.AddDate(0, 0, 1) {
        daySchedules := []models.Schedule{} // Track schedules for this day to avoid conflicts

        // Shuffle movies for each day to ensure randomness
        dayMovies := make([]models.Movie, len(movies))
        copy(dayMovies, movies)
        
        // Shuffle the movies array
        for i := len(dayMovies) - 1; i > 0; i-- {
            j := rand.Intn(i + 1)
            dayMovies[i], dayMovies[j] = dayMovies[j], dayMovies[i]
        }

        // First, schedule main time slots (ensure at least 5 movies)
        movieIndex := 0
        for _, timeSlot := range timeSlots {
            for studioIdx := 0; studioIdx < len(studios) && movieIndex < len(dayMovies); studioIdx++ {
                movie := dayMovies[movieIndex%len(dayMovies)]
                studio := studios[studioIdx]

                // Calculate end time based on movie duration + buffer
                bufferMinutes := 30
                totalMinutes := int(movie.Duration) + bufferMinutes

                startTime := time.Date(
                    currentDate.Year(), currentDate.Month(), currentDate.Day(),
                    timeSlot.hour, timeSlot.minute, 0, 0, time.UTC,
                )
                endTime := startTime.Add(time.Duration(totalMinutes) * time.Minute)

                // Check for conflicts with existing schedules for this studio
                if !hasConflict(studio.ID, startTime, endTime, daySchedules) {
                    // Select price randomly from the range
                    priceIndex := rand.Intn(len(prices))
                    price := prices[priceIndex]

                    schedule := models.Schedule{
                        MovieID:   movie.ID,
                        StudioID:  studio.ID,
                        StartTime: startTime,
                        EndTime:   endTime,
                        Date:      currentDate,
                        Price:     price,
                    }

                    daySchedules = append(daySchedules, schedule)
                    movieIndex++
                }
            }
        }

        // Add extra schedules to ensure variety (different movies in different time slots)
        for _, extraSlot := range extraTimeSlots {
            for studioIdx := 0; studioIdx < len(studios) && movieIndex < len(dayMovies); studioIdx++ {
                movie := dayMovies[movieIndex%len(dayMovies)]
                studio := studios[studioIdx]

                bufferMinutes := 30
                totalMinutes := int(movie.Duration) + bufferMinutes

                startTime := time.Date(
                    currentDate.Year(), currentDate.Month(), currentDate.Day(),
                    extraSlot.hour, extraSlot.minute, 0, 0, time.UTC,
                )
                endTime := startTime.Add(time.Duration(totalMinutes) * time.Minute)

                // Check for conflicts
                if !hasConflict(studio.ID, startTime, endTime, daySchedules) {
                    priceIndex := rand.Intn(len(prices))
                    price := prices[priceIndex]

                    schedule := models.Schedule{
                        MovieID:   movie.ID,
                        StudioID:  studio.ID,
                        StartTime: startTime,
                        EndTime:   endTime,
                        Date:      currentDate,
                        Price:     price,
                    }

                    daySchedules = append(daySchedules, schedule)
                    movieIndex++
                }
            }

            // Stop if we have enough variety for the day
            if len(daySchedules) >= 15 {
                break
            }
        }

        // Add the day's schedules to the main schedules slice
        schedules = append(schedules, daySchedules...)
    }

    // Check existing schedules in database to avoid duplicates
    for _, schedule := range schedules {
        var existing models.Schedule
        err := db.Where("movie_id = ? AND studio_id = ? AND start_time = ?",
            schedule.MovieID, schedule.StudioID, schedule.StartTime).First(&existing).Error

        if err == gorm.ErrRecordNotFound {
            if err := db.Create(&schedule).Error; err != nil {
                log.Printf("Error creating schedule: %v", err)
                continue
            }
        }
    }

    // Return created schedules
    var createdSchedules []models.Schedule
    if err := db.Find(&createdSchedules).Error; err != nil {
        return nil, err
    }

    log.Printf("Successfully seeded %d schedules", len(createdSchedules))
    return createdSchedules, nil
}