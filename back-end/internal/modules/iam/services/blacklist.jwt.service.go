package services

import (
    "context"
    "os"
    "time"

    "github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

func InitRedis() {
    addr := os.Getenv("REDIS_ADDR")
    if addr == "" {
        addr = "localhost:6379"
    }
    db := 0
    RedisClient = redis.NewClient(&redis.Options{
        Addr: addr,
        DB:   db,
    })
}

func BlacklistToken(token string, exp time.Duration) error {
    ctx := context.Background()
    return RedisClient.Set(ctx, "blacklist:"+token, "1", exp).Err()
}

func IsTokenBlacklisted(token string) (bool, error) {
    ctx := context.Background()
    val, err := RedisClient.Get(ctx, "blacklist:"+token).Result()
    if err == redis.Nil {
        return false, nil
    }
    return val == "1", err
}