# Vintage TV reel

The TV plays `director-reel-tv.mp4`: a lightweight 960×720 H.264 copy with no audio and fast-start streaming. It autoplays muted and loops. `director-reel-poster.jpg` displays the opening frame while decoding starts. No static animation is used.

The original upload remains `director-reel.mp4`. After replacing it, regenerate the TV copy and poster:

```sh
ffmpeg -i public/videos/director-reel.mp4 -map 0:v:0 -vf "scale=960:720,fps=30" -c:v libx264 -preset fast -crf 26 -pix_fmt yuv420p -g 30 -an -movflags +faststart -y public/videos/director-reel-tv.mp4
ffmpeg -i public/videos/director-reel.mp4 -frames:v 1 -vf scale=960:-1 -q:v 2 -y public/videos/director-reel-poster.jpg
```

Refresh http://localhost:3002/menu. The wheel still selects project videos. The phone homepage still skips the spinner/TV.
