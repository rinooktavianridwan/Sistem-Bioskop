package responses

import (
    "movie-app-go/internal/models"
    movieResponses "movie-app-go/internal/modules/movie/responses"
    studioResponses "movie-app-go/internal/modules/studio/responses"
    "time"
)

type ScheduleResponse struct {
    ID        uint                      `json:"id"`
    MovieID   uint                      `json:"movie_id"`
    StudioID  uint                      `json:"studio_id"`
    StartTime time.Time                 `json:"start_time"`
    EndTime   time.Time                 `json:"end_time"`
    Date      time.Time                 `json:"date"`
    Price     float64                   `json:"price"`
    Movie     movieResponses.MovieResponse  `json:"movie"`
    Studio    studioResponses.StudioResponse `json:"studio"`
}

type PaginatedScheduleResponse struct {
    Page      int                `json:"page"`
    PerPage   int                `json:"per_page"`
    Total     int64              `json:"total"`
    TotalPage int                `json:"total_page"`
    Data      []ScheduleResponse `json:"data"`
}

func ToScheduleResponse(schedule *models.Schedule) ScheduleResponse {
    return ScheduleResponse{
        ID:        schedule.ID,
        MovieID:   schedule.MovieID,
        StudioID:  schedule.StudioID,
        StartTime: schedule.StartTime,
        EndTime:   schedule.EndTime,
        Date:      schedule.Date,
        Price:     schedule.Price,
        Movie:     movieResponses.ToMovieResponse(&schedule.Movie),
        Studio:    studioResponses.ToStudioResponse(&schedule.Studio),
    }
}

func ToScheduleResponses(schedules []models.Schedule) []ScheduleResponse {
    resp := make([]ScheduleResponse, len(schedules))
    for i, s := range schedules {
        resp[i] = ToScheduleResponse(&s)
    }
    return resp
}
