# Video Service

A NestJS microservice for processing puzzle tutorial and replay videos.

## Features

- Upload video assets and metadata
- Transcode source videos into multiple resolutions with FFmpeg
- Stream encoded renditions by resolution
- Track playback analytics and view metrics

## Endpoints

- `POST /videos/upload` — upload a video file
- `POST /videos/:id/transcode` — transcode an uploaded video to available resolutions
- `GET /videos/:id/stream/:resolution` — stream a transcoded video
- `GET /videos/:id/analytics` — retrieve analytics for the video
- `POST /videos/:id/analytics` — emit analytics events (`view`, `playback_start`, `watch_time`)

## Environment

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `PORT`
- `FFMPEG_PATH`
