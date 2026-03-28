export default function Loading() {
  return (
    <div
      className="flex min-h-[min(72vh,560px)] w-full flex-col items-center justify-center gap-10 px-6 py-16"
      role="status"
      aria-live="polite"
      aria-label="Загрузка страницы"
    >
      <div className="relative flex flex-col items-center gap-6">
        <div
          className="animate-load-breathe relative h-[4.5rem] w-[4.5rem] rounded-[26px] bg-[radial-gradient(circle_at_top,#ffffff,#eef6ff_55%,#ddd9ff)] shadow-card ring-1 ring-pop-ink/10"
          aria-hidden
        />
        <div className="relative h-2 w-full max-w-[220px] overflow-hidden rounded-full border border-border/80 bg-white/80 shadow-inner">
          <div
            className="animate-load-shimmer absolute inset-y-0 left-0 w-[52%] rounded-full bg-gradient-to-r from-pop-sky via-primary to-pop-plum opacity-90"
            aria-hidden
          />
        </div>
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="animate-load-dot h-2 w-2 rounded-full bg-primary [animation-delay:0ms]" />
          <span className="animate-load-dot h-2 w-2 rounded-full bg-primary [animation-delay:160ms]" />
          <span className="animate-load-dot h-2 w-2 rounded-full bg-primary [animation-delay:320ms]" />
        </div>
        <p className="text-base font-medium text-muted-foreground">Загружаем контент…</p>
      </div>
    </div>
  );
}
