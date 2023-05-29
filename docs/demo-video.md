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
    - Imgur doesn't convert `.mp4` to `.gif` upon upload
    - Directly outputting a `.gif` results in low quality palette
3. Crop + output as `.png`: `mkdir frames; ffmpeg -i cinnamon-....webm -filter:v "crop=960:900:960:50" -y 'frames/out%04d.png'`
    - https://stackoverflow.com/a/47486545/1960509
4. Combine images into HQ GIF yet size limited GIF: `gifski -o out.gif frames/*.png`
4. Generate a full size GIF as well for posterity: `gifski -o full.gif -H 900 frames/*.png`
5. Upload all `.mp4` and `.gif` to <https://imgur.com/>
6. Update references in `README.md`
