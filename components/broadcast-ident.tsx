/** A lightweight optical ident. No video downloads or additional playback controls. */
export function BroadcastIdent() {
  return (
    <div className="broadcast-ident" role="img" aria-label="CIRCUS17 television ident">
      <div className="ident-optic" aria-hidden="true">
        <div className="ident-orbit" />
        <div className="ident-disc" />
        <div className="ident-square" />
        <div className="ident-triangle" />
        <div className="ident-star">✦</div>
      </div>
      <span className="ident-wordmark" aria-hidden="true">CIRCUS17</span>
    </div>
  )
}
