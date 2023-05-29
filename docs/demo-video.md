# Demo Video
1. Recorded via Gnome Screen Recording
    - Important moments:
    - Showing original
    - Pressing button
    - Pressing "Refresh" button explicitly, not using shortcut
    - Showing no original
    - Moving to open tab with original showing
    - Pressing "Refresh" button
    - Showing no original
2. Cropped via `ffmpeg` trial/error:
    `ffmpeg -i cinnamon-....webm -filter:v "crop=960:900:960:50" -y out.mp4`
3. Upload to <https://imgur.com/>
