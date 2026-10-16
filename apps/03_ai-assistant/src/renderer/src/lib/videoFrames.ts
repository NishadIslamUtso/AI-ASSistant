/**
 * Video, as the engine can read it: evenly spaced still frames.
 *
 * No engine takes a video file on its wire; every engine reads pictures.
 * So a clip is decoded by the window's own player onto a canvas and sent as
 * its story in stills. The seek points are pure (`framePoints` in shared
 * media) and tested; this piece is the browser work around them.
 */
import { framePoints } from '../../../shared/lib/media'

export async function extractFrames(file: File, count = 4): Promise<File[]> {
  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement('video')
    video.muted = true
    video.src = url
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error(`${file.name}: this window could not open the video.`))
    })
    const points = framePoints(video.duration, count)
    if (!points.length) throw new Error(`${file.name}: the video has no readable length.`)
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 360
    const pen = canvas.getContext('2d')
    const shots: File[] = []
    for (let index = 0; index < points.length; index += 1) {
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve()
        video.currentTime = points[index]
      })
      pen?.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (blob) {
        shots.push(new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-frame-${index + 1}.png`, { type: 'image/png' }))
      }
    }
    if (!shots.length) throw new Error(`${file.name}: no frame could be read from it.`)
    return shots
  } finally {
    URL.revokeObjectURL(url)
  }
}
