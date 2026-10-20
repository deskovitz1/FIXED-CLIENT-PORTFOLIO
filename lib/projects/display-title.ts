/** Public editorial titles; original database records stay intact. */
export function projectDisplayTitle(video: {id: number; title: string}) {
  return video.id === 21 ? "SEPTEMBER NOVEMBER" : video.title
}
