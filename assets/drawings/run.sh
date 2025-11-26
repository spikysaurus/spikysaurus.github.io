#!/bin/bash

mkdir -p thumbnails

for img in *.jpg *.jpeg *.png *.gif *.webp; do
  [ -e "$img" ] || continue

  base="${img%.*}"
  ext="${img##*.}"
  out="thumbnails/${base}_thumb.${ext}"

  if [[ "$ext" == "gif" ]]; then
    # GIFs: resize to 50% with palette for good colors
    ffmpeg -i "$img" -vf "scale=iw*0.5:ih*0.5,palettegen" -y palette.png
    ffmpeg -i "$img" -i palette.png -lavfi "scale=iw*0.5:ih*0.5 [x]; [x][1:v] paletteuse" -y "$out"
    rm palette.png
  else
    # Static formats: jpg, jpeg, png, webp → resize to 10%
    ffmpeg -i "$img" -vf "scale=iw*0.1:ih*0.1" -y "$out"
  fi

  # Delete the original file after successful conversion
#  rm "$img"
done

