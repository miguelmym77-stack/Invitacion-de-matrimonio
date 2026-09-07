import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gift,
  Image as ImageIcon,
  Landmark,
  LocateFixed,
  Mail,
  MapPin,
  Menu,
  Music2,
  Palette,
  Pause,
  Play,
  Plus,
  Phone,
  Send,
  Share2,
  Shirt,
  Sparkles,
  Star,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import heroImage from './assets/wedding-cover.jpg';
import weddingMelody from './assets/wedding-melody.mp3';

const queryClient = new QueryClient();

type ModuleKey = 'envelope' | 'cover' | 'story' | 'details' | 'dresscode' | 'itinerary' | 'rsvp' | 'location' | 'gallery' | 'gift' | 'music' | 'sparkles';
type ModuleSettings = Record<ModuleKey, boolean>;
type Guest = { id: string; names: string; phone: string };
type RsvpResponse = 'yes' | 'no';
const coupleWhatsAppNumbers = [
  { name: 'Miguel', number: '573223075274' },
  { name: 'Daniela', number: '573203812448' },
] as const;

const defaultModules: ModuleSettings = {
  envelope: true,
  cover: true,
  story: true,
  details: true,
  dresscode: true,
  itinerary: true,
  rsvp: true,
  location: true,
  gallery: true,
  gift: true,
  music: true,
  sparkles: true,
};

const moduleLabels: Record<ModuleKey, { label: string; note: string }> = {
  envelope: { label: 'Sobre de invitación', note: 'La bienvenida personalizada' },
  cover: { label: 'Portada y cuenta regresiva', note: 'La primera impresión' },
  story: { label: 'Nuestra historia', note: 'Un pedacito de nosotros' },
  details: { label: 'Detalles del evento', note: 'Fecha, hora y celebración' },
  dresscode: { label: 'Código de vestuario', note: 'La guía para vestir ese día' },
  itinerary: { label: 'Itinerario', note: 'Para vivir el día juntos' },
  rsvp: { label: 'Confirmación', note: 'Respuesta de tus invitados' },
  location: { label: 'Ubicación', note: 'Cómo llegar' },
  gallery: { label: 'Galería', note: 'Momentos que nos inspiran' },
  gift: { label: 'Sugerencia de regalo', note: 'Un gesto desde el corazón' },
  music: { label: 'Música', note: 'La banda sonora de este día' },
  sparkles: { label: 'Destellos plateados', note: 'Pequeños brillos que titilan como estrellas lejanas' },
};

const pageOrder: Array<{ key: ModuleKey; id: string; label: string }> = [
  { key: 'envelope', id: 'sobre', label: 'Sobre' },
  { key: 'cover', id: 'inicio', label: 'Portada' },
  { key: 'story', id: 'historia', label: 'Historia' },
  { key: 'details', id: 'celebracion', label: 'Celebración' },
  { key: 'dresscode', id: 'vestuario', label: 'Vestuario' },
  { key: 'itinerary', id: 'itinerario', label: 'Itinerario' },
  { key: 'rsvp', id: 'confirmacion', label: 'Confirmar' },
  { key: 'location', id: 'ubicacion', label: 'Ubicación' },
  { key: 'gallery', id: 'galeria', label: 'Galería' },
  { key: 'gift', id: 'regalo', label: 'Regalo' },
  { key: 'music', id: 'musica', label: 'Música' },
];

function loadGuests(): Guest[] {
  try {
    const value = JSON.parse(localStorage.getItem('daniela-miguel-guests') || '[]');
    return Array.isArray(value) ? value.filter((guest): guest is Guest => Boolean(guest?.id && guest?.names)) : [];
  } catch {
    return [];
  }
}

function initialPageKey(): ModuleKey {
  const hash = window.location.hash.replace('#', '');
  return pageOrder.find((page) => page.id === hash)?.key ?? pageOrder[0].key;
}

const galleryImages = Object.entries(
  import.meta.glob('./assets/gallery/*.jpeg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>,
)
  .sort(([first], [second]) => first.localeCompare(second))
  .map(([, source]) => source);

const galleryItems = [
  { sourceIndex: 0, title: 'Nuestro sí', position: 'object-[50%_38%]', layout: 'gallery-tall' },
  { sourceIndex: 1, title: 'Un día para recordar', position: 'object-[48%_46%]', layout: '' },
  { sourceIndex: 2, title: 'Juntos', position: 'object-[64%_48%]', layout: 'gallery-wide' },
  { sourceIndex: 4, title: 'El comienzo de siempre', position: 'object-[50%_48%]', layout: '' },
  { sourceIndex: 8, title: 'Nuestra familia', position: 'object-[50%_50%]', layout: 'gallery-tall' },
  { sourceIndex: 9, title: 'Un amor que crece', position: 'object-[50%_50%]', layout: '' },
  { sourceIndex: 10, title: 'Los que hacen hogar', position: 'object-[50%_50%]', layout: 'gallery-wide' },
  { sourceIndex: 13, title: 'Risas que guardamos', position: 'object-[50%_50%]', layout: '' },
  { sourceIndex: 14, title: 'Compartir la vida', position: 'object-[50%_50%]', layout: '' },
  { sourceIndex: 15, title: 'Juntos somos más', position: 'object-[50%_50%]', layout: 'gallery-tall' },
].map(({ sourceIndex, ...item }) => ({ ...item, src: galleryImages[sourceIndex] }));

const storyImages = [galleryImages[3], galleryImages[16]];

function useCountdown() {
  const eventDate = useMemo(() => new Date('2026-11-07T16:00:00-05:00'), []);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const difference = Math.max(0, eventDate.getTime() - now.getTime());
  return {
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference / 3600000) % 24),
    minutes: Math.floor((difference / 60000) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ErrorBoundary>
            <Switch>
              <Route path="/" component={InvitationPage} />
              <Route component={InvitationPage} />
            </Switch>
          </ErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function InvitationPage() {
  const [modules, setModules] = useState<ModuleSettings>(() => {
    try {
      return { ...defaultModules, ...JSON.parse(localStorage.getItem('daniela-miguel-modules') || '{}') };
    } catch {
      return defaultModules;
    }
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const [shared, setShared] = useState(false);
  const [guests, setGuests] = useState<Guest[]>(loadGuests);
  const queryParams = new URLSearchParams(window.location.search);
  const personalizedNames = queryParams.get('para')?.trim() || '';
  const isPublicInvitation = Boolean(personalizedNames);
  const inviteeNames = personalizedNames || guests[0]?.names?.trim() || 'Familia invitada';
  const rsvpStorageKey = `daniela-miguel-rsvp-${encodeURIComponent(inviteeNames)}`;
  const [rsvpResponse, setRsvpResponse] = useState<RsvpResponse | null>(() => {
    const stored = localStorage.getItem(rsvpStorageKey);
    return stored === 'yes' || stored === 'no' ? stored : null;
  });
  const [activePage, setActivePage] = useState<ModuleKey>(initialPageKey);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'back'>('forward');
  const [isPageLeaving, setIsPageLeaving] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const countdown = useCountdown();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pageTransitionTimer = useRef<number | null>(null);
  const visiblePages = pageOrder.filter(({ key }) => modules[key]);
  const currentPageIndex = Math.max(0, visiblePages.findIndex((page) => page.key === activePage));

  const toggleModule = (key: ModuleKey) => {
    const next = { ...modules, [key]: !modules[key] };
    setModules(next);
    localStorage.setItem('daniela-miguel-modules', JSON.stringify(next));
  };

  const updateGuests = (next: Guest[]) => {
    setGuests(next);
    localStorage.setItem('daniela-miguel-guests', JSON.stringify(next));
  };

  const navigateToPage = (target: string) => {
    const nextPage = visiblePages.find((page) => page.key === target || page.id === target);
    if (!nextPage || nextPage.key === activePage || isPageLeaving) return;
    const nextIndex = visiblePages.findIndex((page) => page.key === nextPage.key);
    setTransitionDirection(nextIndex > currentPageIndex ? 'forward' : 'back');
    setHasNavigated(true);
    setIsPageLeaving(true);
    pageTransitionTimer.current = window.setTimeout(() => {
      setActivePage(nextPage.key);
      setIsPageLeaving(false);
      window.history.replaceState(null, '', `#${nextPage.id}`);
    }, 560);
  };

  const toggleMusic = async () => {
    if (!audioRef.current) {
      const audio = new Audio(weddingMelody);
      audio.loop = true;
      audio.volume = 0.38;
      audioRef.current = audio;
    }

    if (musicOn) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setMusicOn(false);
      return;
    }

    try {
      await audioRef.current.play();
      setMusicOn(true);
    } catch {
      setMusicOn(false);
    }
  };

  const shareInvitation = async () => {
    const shareData = {
      title: 'Miguel Ángel & Daniela — Nos casamos',
      text: 'Te esperamos para celebrar con nosotros.',
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Compartir puede cancelarse sin que sea un error para la invitación.
    }
    setShared(true);
    window.setTimeout(() => setShared(false), 2200);
  };

  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (pageTransitionTimer.current) window.clearTimeout(pageTransitionTimer.current);
  }, []);

  useEffect(() => {
    if (!visiblePages.some((page) => page.key === activePage)) {
      const fallback = visiblePages[0]?.key ?? 'cover';
      setActivePage(fallback);
      window.history.replaceState(null, '', `#${visiblePages[0]?.id ?? 'inicio'}`);
    }
  }, [activePage, visiblePages]);

  useEffect(() => {
    const handleHashChange = () => {
      const hashPage = pageOrder.find((page) => page.id === window.location.hash.replace('#', ''));
      if (hashPage && visiblePages.some((page) => page.key === hashPage.key)) {
        setTransitionDirection(visiblePages.findIndex((page) => page.key === hashPage.key) >= currentPageIndex ? 'forward' : 'back');
        setHasNavigated(true);
        setActivePage(hashPage.key);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentPageIndex, visiblePages]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  const previousPage = visiblePages[(currentPageIndex - 1 + visiblePages.length) % visiblePages.length];
  const nextPage = visiblePages[(currentPageIndex + 1) % visiblePages.length];
  const activeContent = (() => {
    switch (activePage) {
      case 'envelope':
        return <Envelope names={inviteeNames} onOpen={() => navigateToPage(visiblePages[1]?.id ?? 'sobre')} />;
      case 'cover':
        return <Cover countdown={countdown} onMusic={toggleMusic} musicOn={musicOn} onStart={() => navigateToPage(visiblePages[currentPageIndex + 1]?.id ?? 'sobre')} />;
      case 'story':
        return <Story />;
      case 'details':
        return <Details />;
      case 'dresscode':
        return <DressCode />;
      case 'itinerary':
        return <Itinerary />;
      case 'rsvp':
        return (
          <Rsvp
            response={rsvpResponse}
            inviteeNames={inviteeNames}
            onSent={(response) => {
              setRsvpResponse(response);
              localStorage.setItem(rsvpStorageKey, response);
            }}
            onReset={() => {
              localStorage.removeItem(rsvpStorageKey);
              setRsvpResponse(null);
            }}
          />
        );
      case 'location':
        return <LocationSection />;
      case 'gallery':
        return <Gallery onOpen={setActivePhoto} />;
      case 'gift':
        return <GiftSection />;
      case 'music':
        return <MusicSection musicOn={musicOn} onMusic={toggleMusic} />;
      default:
        return <Cover countdown={countdown} onMusic={toggleMusic} musicOn={musicOn} onStart={() => navigateToPage('historia')} />;
    }
  })();

  return (
    <main className={`paper-grain ${modules.sparkles ? 'sparkles-enabled' : 'sparkles-disabled'} min-h-[100dvh] overflow-x-hidden bg-[#eef1f3]`}>
      <TopBar
        onEdit={() => setEditorOpen(true)}
        onShare={shareInvitation}
        shared={shared}
        onNavigate={navigateToPage}
        showEditor={!isPublicInvitation}
      />
      <div className="screen-stage mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-14">
        <div key={activePage} className={`page-transition ${hasNavigated ? `page-transition--${transitionDirection}` : 'page-transition--initial'} ${isPageLeaving ? 'page-transition--leaving' : ''}`}>
          <PageFrame
            pageKey={activePage}
            previousPage={previousPage}
            nextPage={nextPage}
            pageIndex={currentPageIndex}
            pageCount={visiblePages.length}
            onNavigate={navigateToPage}
          >
            {activeContent}
          </PageFrame>
        </div>
      </div>
      <footer className="screen-credit">Miguel Ángel <span>&</span> Daniela · 07 · 11 · 2026</footer>
      {!isPublicInvitation && (
        <>
          <button
            onClick={() => setEditorOpen(true)}
            data-testid="button-open-editor"
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-[#c5cdd3] bg-white/95 px-4 py-3 text-xs font-semibold text-[#5b6872] shadow-[0_8px_25px_rgba(84,96,105,.16)] backdrop-blur-md transition hover:-translate-y-0.5"
          >
            <Menu size={15} /> Editar invitación
          </button>
          {editorOpen && <EditorPanel modules={modules} guests={guests} onToggle={toggleModule} onGuestsChange={updateGuests} onClose={() => setEditorOpen(false)} />}
        </>
      )}
      {activePhoto !== null && (
        <Lightbox
          index={activePhoto}
          onClose={() => setActivePhoto(null)}
          onPrev={() => setActivePhoto((activePhoto + galleryItems.length - 1) % galleryItems.length)}
          onNext={() => setActivePhoto((activePhoto + 1) % galleryItems.length)}
        />
      )}
    </main>
  );
}

function PageFrame({
  pageKey,
  previousPage,
  nextPage,
  pageIndex,
  pageCount,
  onNavigate,
  children,
}: {
  pageKey: ModuleKey;
  previousPage?: { id: string; label: string };
  nextPage?: { id: string; label: string };
  pageIndex: number;
  pageCount: number;
  onNavigate: (target: string) => void;
  children: ReactNode;
}) {
  const current = pageOrder.find((page) => page.key === pageKey);
  return (
    <section className={`page-frame page-frame--${pageKey}`} aria-label={current?.label}>
      <div className="page-frame__content">
        <div className="silver-stars" aria-hidden="true">
          {Array.from({ length: 14 }, (_, index) => <span key={index} className={`silver-star sparkle-${index + 1}`} />)}
        </div>
        {children}
      </div>
      <div className="page-controls">
        <button
          type="button"
          onClick={() => onNavigate(previousPage?.id ?? 'sobre')}
          data-testid={`button-previous-${pageKey}`}
          className="page-control page-control--back"
        >
          <ChevronLeft size={15} />
          <span>{previousPage ? previousPage.label : 'Inicio'}</span>
        </button>
        <span className="page-progress">{String(pageIndex + 1).padStart(2, '0')} / {String(pageCount).padStart(2, '0')}</span>
        <button
          type="button"
          onClick={() => onNavigate(nextPage?.id ?? 'sobre')}
          data-testid={`button-next-${pageKey}`}
          className="page-next"
        >
          <span>{nextPage ? `Siguiente: ${nextPage.label}` : 'Volver al sobre'}</span>
          {nextPage ? <ChevronDown size={16} /> : <ChevronDown size={16} className="rotate-180" />}
        </button>
      </div>
    </section>
  );
}

function TopBar({ onEdit, onShare, shared, onNavigate, showEditor }: { onEdit: () => void; onShare: () => void; shared: boolean; onNavigate: (target: string) => void; showEditor: boolean }) {
  return (
    <header className="mx-auto flex max-w-[1320px] items-center justify-between px-4 py-5 sm:px-8 lg:px-14">
      <button type="button" onClick={() => onNavigate('sobre')} data-testid="link-home" className="group flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#bfc8cf] script text-2xl text-[#687680] transition group-hover:rotate-12">M</span>
        <span className="hidden text-[11px] font-semibold uppercase tracking-[.24em] text-[#687680] sm:block">Miguel Ángel & Daniela</span>
      </button>
      <nav className="hidden items-center gap-6 text-[11px] uppercase tracking-[.2em] text-[#7f8a93] md:flex">
        <button type="button" onClick={() => onNavigate('historia')} data-testid="link-story" className="transition hover:text-[#5f6d77]">Historia</button>
        <button type="button" onClick={() => onNavigate('celebracion')} data-testid="link-details" className="transition hover:text-[#5f6d77]">Celebración</button>
        <button type="button" onClick={() => onNavigate('galeria')} data-testid="link-gallery" className="transition hover:text-[#5f6d77]">Galería</button>
      </nav>
      <div className="flex items-center gap-2">
        <button onClick={onShare} data-testid="button-share" className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[#5b6872] transition hover:bg-white">
          {shared ? <Check size={15} /> : <Share2 size={15} />}
          <span className="hidden sm:inline">{shared ? 'Enlace copiado' : 'Compartir'}</span>
        </button>
        {showEditor && (
          <button onClick={onEdit} data-testid="button-top-editor" className="rounded-full bg-[#aeb8bf] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#97a3ac]">
            Vista de edición
          </button>
        )}
      </div>
    </header>
  );
}

function Envelope({ names, onOpen }: { names: string; onOpen: () => void }) {
  const [isOpening, setIsOpening] = useState(false);
  const nameLines = names.split(',').map((name) => name.trim()).filter(Boolean);
  const openEnvelope = () => {
    if (isOpening) return;
    setIsOpening(true);
    window.setTimeout(onOpen, 1120);
  };

  return (
    <section id="sobre" className={`envelope-page ${isOpening ? 'envelope-page--opening' : ''}`}>
      <div className="envelope-intro">
        <p className="text-[10px] font-semibold uppercase tracking-[.3em] text-[#7d8992]">Una invitación para</p>
        <h1 className="script mt-5 text-7xl leading-[.78] text-[#596873] sm:text-8xl">
          {nameLines.length > 1 ? nameLines.map((name) => <span key={name} className="block">{name}</span>) : names}
        </h1>
        <p className="mx-auto mt-7 max-w-sm text-sm leading-6 text-[#74808a]">Con cariño, hemos preparado este sobre para compartir contigo uno de los días más importantes de nuestra historia.</p>
      </div>
      <div className="envelope-object" aria-label="Sobre de invitación para abrir">
        <div className="envelope-card">
          <div className="envelope-card__paper">
            <Mail size={18} strokeWidth={1.3} />
            <span>Con amor</span>
          </div>
          <div className="envelope-flap" />
          <div className="envelope-seal">M <span>&</span> D</div>
        </div>
        <button type="button" onClick={openEnvelope} disabled={isOpening} data-testid="button-open-envelope" className="envelope-open">
          {isOpening ? 'Abriendo invitación' : 'Abrir invitación'} <ChevronDown size={15} />
        </button>
      </div>
    </section>
  );
}

function Cover({ countdown, onMusic, musicOn, onStart }: { countdown: ReturnType<typeof useCountdown>; onMusic: () => void; musicOn: boolean; onStart: () => void }) {
  return (
    <section id="inicio" className="cover-card cover-hero relative min-h-[calc(100svh-128px)] overflow-hidden rounded-[2rem] border border-[#d0d7dc] text-white shadow-paper">
      <img src={heroImage} alt="Miguel Ángel y Daniela el día de su boda" className="photo-wash absolute inset-0 h-full w-full object-cover object-[50%_38%]" />
      <div className="cover-hero__veil absolute inset-0" />
      <div className="relative z-10 flex min-h-[calc(100svh-128px)] flex-col items-center justify-between px-7 py-8 text-center sm:px-12 sm:py-12 lg:px-20">
        <div className="reveal flex items-center gap-3 text-[10px] uppercase tracking-[.32em] text-white/90">
          <span className="h-px w-8 bg-white/70" /> Nuestra invitación <span className="h-px w-8 bg-white/70" />
        </div>
        <div className="cover-hero__copy absolute bottom-[21%] left-7 right-7 my-0 sm:left-12 sm:right-12 lg:left-20 lg:right-20">
          <p className="reveal reveal-delay-1 mb-5 text-xs uppercase tracking-[.3em] text-white/90">Nos casamos</p>
          <h1 className="script reveal reveal-delay-2 text-[clamp(4rem,12vw,8.6rem)] leading-[.72] tracking-[-.03em] drop-shadow-[0_2px_12px_rgba(80,90,100,.45)]">
            Miguel Ángel <span className="text-[#e4e9ec]">&</span><br /><em>Daniela</em>
          </h1>
        </div>
        <div className="reveal reveal-delay-3 flex w-full max-w-lg flex-wrap items-end justify-center gap-4 border-t border-white/60 pt-5">
          <div>
            <p className="text-[10px] uppercase tracking-[.22em] text-white/85">Sábado · 7 de noviembre · 2026</p>
          </div>
          <div className="cover-countdown rounded-full border border-white/60 bg-white/15 px-3 py-1.5 backdrop-blur-sm">
            <p className="mono text-[11px] tracking-[.12em] text-white">{String(countdown.days).padStart(2, '0')} DÍAS · {String(countdown.hours).padStart(2, '0')} H · {String(countdown.minutes).padStart(2, '0')} M · {String(countdown.seconds).padStart(2, '0')} S</p>
          </div>
          <button onClick={onMusic} data-testid="button-music-cover" className="flex shrink-0 items-center gap-2 rounded-full border border-white/75 bg-white/10 px-4 py-2 text-[10px] uppercase tracking-[.12em] text-white transition hover:bg-white/25 sm:text-xs">
            {musicOn ? <Pause size={14} /> : <Play size={14} />} {musicOn ? 'Pausar melodía' : 'Iniciar melodía'}
          </button>
          <button type="button" onClick={onStart} data-testid="link-scroll-story" className="flex items-center gap-2 rounded-full border border-white/75 bg-white/10 px-4 py-2 text-[10px] uppercase tracking-[.14em] text-white transition hover:bg-white/25">
            Comenzar <ChevronDown size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, intro, align = 'left' }: { eyebrow: string; title: ReactNode; intro?: string; align?: 'left' | 'center' }) {
  return (
    <div className={`${align === 'center' ? 'mx-auto text-center' : ''} max-w-xl`}>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.28em] text-[#7d8992]">{eyebrow}</p>
      <h2 className="script text-6xl leading-[.82] tracking-[-.02em] text-[#5d6a74] sm:text-7xl">{title}</h2>
      {intro && <p className="mt-6 max-w-md text-sm leading-6 text-[#74808a]">{intro}</p>}
    </div>
  );
}

function Story() {
  return (
    <section id="historia" className="grid scroll-mt-20 gap-12 rounded-[2rem] border border-[#d3d9de] bg-white px-6 py-12 sm:px-12 sm:py-16 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
      <div className="lg:pt-12">
        <SectionHeading
          eyebrow="Nuestra historia"
          title={<>Nuestra<br /><em>Historia</em></>}
        />
        <p className="mt-8 max-w-md text-sm leading-7 text-[#74808a]">
          Nuestra historia comenzó de una manera que ninguno de los dos imaginaba. Con el tiempo descubrimos que Dios había estado preparando nuestros caminos para encontrarnos.
        </p>
        <p className="mt-5 max-w-md text-sm leading-7 text-[#74808a]">
          Entre conversaciones, momentos compartidos y muchos recuerdos, nació un amor que fue creciendo cada día. Hoy miramos hacia adelante con ilusión, sabiendo que queremos caminar juntos de la mano de Dios.
        </p>
        <div className="mt-8 text-center sm:text-left">
          <p className="script text-3xl text-[#87939c]">“Y sobre todas estas cosas, vestíos de amor, que es el vínculo perfecto.”</p>
          <p className="mt-2 text-[10px] uppercase tracking-[.2em] text-[#9aa5ad]">Colosenses 3:14</p>
        </div>
      </div>
      <div className="story-photo-grid relative min-h-[380px]">
        <div className="absolute left-0 top-2 h-[310px] w-[76%] overflow-hidden rounded-[1.5rem] border-8 border-white bg-[#e1e6ea] shadow-paper sm:left-6">
          <img src={storyImages[0]} alt="Daniela y Miguel Ángel juntos" className="photo-wash h-full w-full object-cover object-[50%_48%]" />
        </div>
        <div className="absolute bottom-0 right-0 h-[190px] w-[48%] overflow-hidden rounded-full border-[10px] border-white bg-[#dfe4e8] shadow-paper sm:right-4">
          <img src={storyImages[1]} alt="Miguel Ángel y Daniela celebrando su historia" className="h-full w-full object-cover object-[50%_48%] grayscale-[.2]" />
        </div>
        <div className="float-slow absolute bottom-3 left-2 flex h-16 w-16 items-center justify-center rounded-full border border-[#c4ccd2] bg-[#f4f6f7] text-center text-[9px] uppercase leading-4 tracking-[.12em] text-[#697781]">hechos<br />para<br />elegirnos</div>
      </div>
    </section>
  );
}

function Details() {
  const items = [
    { icon: CalendarDays, label: 'Fecha', value: 'Sábado 7 de noviembre de 2026' },
    { icon: Clock3, label: 'Hora', value: '4:00 p. m. · llegada de invitados' },
    { icon: Landmark, label: 'Lugar', value: 'Hacienda Hotel La Extremadura · Casa Principal' },
  ];
  return (
    <section id="celebracion" className="rounded-[2rem] border border-[#d3d9de] bg-white px-6 py-12 sm:px-12 sm:py-16">
      <div className="flex flex-col justify-between gap-10 lg:flex-row">
        <SectionHeading eyebrow="Todo lo que debes saber" title={<>Detalles<br /><em>del evento.</em></>} intro="Guarda esta fecha. Lo demás lo vamos a celebrar juntos." />
        <div className="grid w-full max-w-xl gap-0 sm:grid-cols-2">
          {items.map(({ icon: Icon, label, value }) => (
            <div key={label} className="border-t border-[#d4dade] py-6 sm:px-5 first:sm:pl-0">
              <Icon size={19} strokeWidth={1.5} className="text-[#7d8992]" />
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.2em] text-[#89949d]">{label}</p>
              <p className="mt-2 max-w-[210px] text-sm leading-5 text-[#64717b]">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DressCode() {
  return (
    <section id="vestuario" className="grid gap-12 rounded-[2rem] border border-[#d3d9de] bg-[#f7f9fa] px-6 py-12 sm:px-12 sm:py-16 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
      <div>
        <SectionHeading
          eyebrow="Código de vestuario"
          title={<>Una noche<br /><em>para celebrar.</em></>}
          intro="Queremos compartir este día contigo con elegancia, alegría y mucho amor."
        />
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#cbd3d8] bg-white/75 px-4 py-2.5 text-xs font-semibold uppercase tracking-[.14em] text-[#65747e]">
          <Shirt size={16} strokeWidth={1.5} />
          Vestimenta formal
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[#d3d9de] bg-white p-6 shadow-paper">
          <Shirt size={22} strokeWidth={1.4} className="text-[#7d8992]" />
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[.2em] text-[#89949d]">Vestimenta</p>
          <h3 className="script mt-2 text-5xl leading-none text-[#64717b]">Formal</h3>
          <p className="mt-4 text-sm leading-6 text-[#74808a]">Caballeros: camisa de cuello, pantalón formal y calzado que complemente el atuendo; la corbata es opcional. Damas: vestido largo o conjunto formal de pantalón.</p>
        </div>
        <div className="rounded-[1.5rem] border border-[#d3d9de] bg-white p-6 shadow-paper">
          <Palette size={22} strokeWidth={1.4} className="text-[#7d8992]" />
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[.2em] text-[#89949d]">Colores reservados</p>
          <h3 className="script mt-2 text-5xl leading-none text-[#64717b]">Por favor, no los uses</h3>
          <p className="mt-4 text-sm leading-6 text-[#74808a]">Blanco, gris claro y plateado están reservados para los novios.</p>
        </div>
      </div>
    </section>
  );
}

function Itinerary() {
  const events = [
    ['16:00', 'Llegada de invitados', 'Recibimos a quienes hacen parte de nuestra historia.'],
    ['17:00', 'Ceremonia', 'Nos prometemos una vida con más momentos para compartir.'],
    ['19:00', 'Cena', 'La mesa está lista para contar historias y brindar.'],
  ];
  return (
    <section id="itinerario" className="grid gap-14 rounded-[2rem] border border-[#d3d9de] bg-[#f7f9fa] px-6 py-12 sm:px-12 sm:py-16 lg:grid-cols-[.65fr_1fr]">
      <SectionHeading eyebrow="El ritmo del día" title={<>Un día para<br /><em>recordar.</em></>} intro="Ven a vivir cada momento. Sin prisas, con la gente que queremos." />
      <div className="relative border-l border-[#cbd3d8] pl-7 sm:pl-12">
        {events.map(([time, title, text], i) => (
          <div key={time} className="relative pb-10 last:pb-0">
            <span className="absolute -left-[34px] top-0 h-4 w-4 rounded-full border-4 border-[#f7f9fa] bg-[#aeb8bf] sm:-left-[57px]" />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-8">
              <span className="mono text-xs text-[#7d8992]">{time}</span>
              <h3 className="script text-4xl text-[#64717b]">{title}</h3>
            </div>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#74808a]">{text}</p>
            {i === 2 && <div className="absolute -right-8 top-3 hidden h-14 w-14 rotate-12 items-center justify-center rounded-full border border-[#bfc8cf] text-[#89949d] lg:flex"><Star size={16} /></div>}
          </div>
        ))}
      </div>
    </section>
  );
}

function Rsvp({ response, inviteeNames, onSent, onReset }: { response: RsvpResponse | null; inviteeNames: string; onSent: (response: RsvpResponse) => void; onReset: () => void }) {
  const [attendance, setAttendance] = useState<RsvpResponse>('yes');
  const [whatsappStatus, setWhatsappStatus] = useState<'opened' | 'blocked' | null>(null);

  if (response) {
    return (
      <section id="confirmacion" className="rounded-[2rem] border border-[#d3d9de] bg-white px-6 py-16 text-center sm:px-12 sm:py-20">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#bfc8cf] text-[#71808a]"><Check size={23} /></div>
        <p className="mt-6 text-[10px] uppercase tracking-[.3em] text-[#7d8992]">Respuesta recibida</p>
        <h2 className="script mt-3 text-6xl text-[#5d6a74]">{response === 'yes' ? 'Nos vemos en la celebración.' : 'Gracias por avisarnos.'}</h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#74808a]">{inviteeNames} · Tu respuesta ha quedado guardada en esta invitación.</p>
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[#d7dee2] bg-[#f5f7f8] px-4 py-4 text-left">
          <p className="text-xs leading-5 text-[#74808a]">Se abrieron los chats de WhatsApp de Miguel y Daniela con tu respuesta lista. Pulsa “Enviar” en cada chat para confirmarles.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {coupleWhatsAppNumbers.map((contact) => (
              <a
                key={contact.number}
                href={`https://wa.me/${contact.number}?text=${encodeURIComponent(`Respuesta de ${inviteeNames}: ${response === 'yes' ? 'Sí, asistiré a la celebración.' : 'No podré acompañarlos.'}`)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#bfc8cf] px-3 py-2 text-[10px] font-semibold uppercase tracking-[.1em] text-[#687680] transition hover:bg-white"
              >
                WhatsApp {contact.name}
              </a>
            ))}
          </div>
        </div>
        <button onClick={onReset} data-testid="button-edit-rsvp" className="mt-8 border-b border-[#aeb8bf] pb-1 text-xs uppercase tracking-[.16em] text-[#6f7c86]">Cambiar respuesta</button>
      </section>
    );
  }

  return (
    <section id="confirmacion" className="grid overflow-hidden rounded-[2rem] border border-[#d3d9de] bg-[#e7ecef] lg:grid-cols-[.8fr_1.2fr]">
      <div className="relative min-h-[270px] overflow-hidden">
        <img src={heroImage} alt="" className="photo-wash absolute inset-0 h-full w-full object-cover object-[70%]" />
        <div className="absolute inset-0 bg-white/45" />
      </div>
      <div className="bg-white/80 p-7 sm:p-12">
        <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#7d8992]">Tu lugar está esperando</p>
        <h2 className="script mt-3 text-6xl leading-[.8] text-[#5d6a74]">Confirma tu<br /><em>asistencia.</em></h2>
        <div className="mt-6 rounded-2xl border border-[#d7dee2] bg-[#f5f7f8] px-4 py-4">
          <p className="text-[10px] uppercase tracking-[.2em] text-[#89949d]">Invitación para</p>
          <p className="script mt-2 text-4xl leading-none text-[#66747e]">{inviteeNames}</p>
        </div>
        <p className="mt-5 text-sm text-[#74808a]">Por favor confirma tu asistencia antes del 15 de octubre de 2026.</p>
        <form onSubmit={(event) => {
          event.preventDefault();
          onSent(attendance);
          const message = `Respuesta de ${inviteeNames}: ${attendance === 'yes' ? 'Sí, asistiré a la celebración.' : 'No podré acompañarlos.'}`;
          const openedChats = coupleWhatsAppNumbers
            .map((contact) => window.open(`https://wa.me/${contact.number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer'))
            .filter(Boolean).length;
          setWhatsappStatus(openedChats === coupleWhatsAppNumbers.length ? 'opened' : 'blocked');
        }} className="mt-8 grid gap-4">
          <label>
            <span className="sr-only">Asistencia</span>
            <select value={attendance} onChange={(event) => setAttendance(event.target.value as RsvpResponse)} data-testid="select-rsvp-attendance" className="w-full border-b border-[#c7d0d6] bg-transparent py-3 text-sm text-[#66737d] outline-none">
              <option value="yes">Sí, ahí estaré</option><option value="no">No podré acompañarlos</option>
            </select>
          </label>
          <button type="submit" data-testid="button-submit-rsvp" className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#aeb8bf] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#98a5ae] sm:justify-self-start">Enviar respuestas <Send size={14} /></button>
          {whatsappStatus === 'blocked' && <p className="text-xs leading-5 text-[#8a959d]">El navegador bloqueó una ventana de WhatsApp. La respuesta quedó guardada; usa los botones de WhatsApp que aparecerán en la confirmación.</p>}
        </form>
      </div>
    </section>
  );
}

function LocationSection() {
  return (
    <section id="ubicacion" className="grid gap-10 rounded-[2rem] border border-[#d3d9de] bg-white px-6 py-12 sm:px-12 sm:py-16 lg:grid-cols-2 lg:items-center">
      <div>
        <SectionHeading eyebrow="El lugar que nos reúne" title={<>Hacienda Hotel<br /><em>La Extremadura.</em></>} intro="Casa Principal · Sabaneta, Antioquia. Te esperamos para compartir este día tan especial." />
        <a href="https://maps.google.com/?q=Hacienda+Hotel+La+Extremadura+Sabaneta+Antioquia" target="_blank" rel="noreferrer" data-testid="link-maps" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#aeb8bf] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#98a5ae]">Cómo llegar <LocateFixed size={15} /></a>
      </div>
      <div className="relative min-h-[330px] overflow-hidden rounded-[2rem] bg-[#e2e7ea] p-5 shadow-paper">
        <div className="relative h-full min-h-[290px] overflow-hidden rounded-[1.25rem] border border-[#c7d0d6] bg-[#edf0f2]">
          <iframe
            title="Mapa de Hacienda Hotel La Extremadura"
            src="https://www.google.com/maps?q=Hacienda+Hotel+La+Extremadura,+Sabaneta,+Antioquia&output=embed"
            className="h-full min-h-[290px] w-full border-0 grayscale-[.25]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a href="https://maps.google.com/?q=Hacienda+Hotel+La+Extremadura+Sabaneta+Antioquia" target="_blank" rel="noreferrer" className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#687680] shadow-sm">
            Abrir en Google Maps <MapPin size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}

function Gallery({ onOpen }: { onOpen: (index: number) => void }) {
  return (
    <section id="galeria" className="rounded-[2rem] border border-[#d3d9de] bg-white px-6 py-12 sm:px-12 sm:py-16">
      <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <SectionHeading eyebrow="Fragmentos de nosotros" title={<>Antes de<br /><em>este día.</em></>} />
        <p className="max-w-[220px] text-sm leading-6 text-[#74808a]">Una imagen que guarda la emoción de compartir la vida.</p>
      </div>
      <div className="gallery-grid">
        {galleryItems.map((item, index) => (
          <button key={item.title} onClick={() => onOpen(index)} data-testid={`button-gallery-${index}`} className={`${item.layout} group relative overflow-hidden rounded-[1.25rem] border border-[#d3d9de] bg-[#e4e9ec] text-left shadow-paper`}>
            <img src={item.src} alt={item.title} className={`gallery-photo h-full w-full object-cover ${item.position}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#53616b]/65 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            <span className="absolute bottom-5 left-5 translate-y-3 text-xs text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">{item.title}</span>
            <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-[#61707a] opacity-0 transition group-hover:opacity-100"><ImageIcon size={14} /></span>
          </button>
        ))}
      </div>
    </section>
  );
}

function GiftSection() {
  return (
    <section id="regalo" className="rounded-[2rem] border border-[#d3d9de] bg-white px-6 py-16 text-center sm:px-12">
      <Gift className="mx-auto text-[#7d8992]" size={24} strokeWidth={1.5} />
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.28em] text-[#7d8992]">Lluvia de sobres</p>
      <h2 className="script mt-3 text-6xl text-[#5d6a74]">Lluvia de sobres</h2>
      <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#74808a]">Nuestro mayor regalo es poder compartir este día contigo. Tu presencia es lo que más nos ilusiona, si deseas tener un detalle con nosotros, agradecemos con cariño una lluvia de sobres, sin que sea una obligación</p>
      <div className="mx-auto mt-7 h-px w-16 bg-[#bfc8cf]" />
    </section>
  );
}

function MusicSection({ musicOn, onMusic }: { musicOn: boolean; onMusic: () => void }) {
  return (
    <section id="musica" className="flex flex-col items-center justify-between gap-6 rounded-[2rem] border border-[#d3d9de] bg-white px-6 py-8 sm:flex-row sm:px-10">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e5eaed] text-[#71808a]">{musicOn ? <Volume2 size={18} /> : <Music2 size={18} />}</div>
        <div><p className="text-[10px] uppercase tracking-[.24em] text-[#7d8992]">Nuestra banda sonora</p><p className="mt-1 text-sm text-[#687680]">All of Me · John Legend</p></div>
      </div>
      <button onClick={onMusic} data-testid="button-music" className="flex items-center gap-2 rounded-full border border-[#aeb8bf] px-5 py-2.5 text-xs font-semibold text-[#64717b] transition hover:bg-[#eef1f3]">{musicOn ? <Pause size={14} /> : <Play size={14} />}{musicOn ? 'Pausar música' : 'Reproducir música'}</button>
    </section>
  );
}

function GuestManager({ guests, onChange }: { guests: Guest[]; onChange: (guests: Guest[]) => void }) {
  const [names, setNames] = useState('');
  const [phone, setPhone] = useState('');

  const addGuest = () => {
    if (!names.trim()) return;
    onChange([...guests, { id: `${Date.now()}`, names: names.trim(), phone: phone.trim() }]);
    setNames('');
    setPhone('');
  };

  const updateGuest = (id: string, field: 'names' | 'phone', value: string) => {
    onChange(guests.map((guest) => guest.id === id ? { ...guest, [field]: value } : guest));
  };

  const guestLink = (guest: Guest) => {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = 'sobre';
    url.searchParams.set('para', guest.names);
    return url.toString();
  };

  const sendGuestInvitation = (guest: Guest) => {
    if (!guest.phone.trim()) return;
    const phoneNumber = guest.phone.replace(/\D/g, '');
    const message = `Hola ${guest.names}, queremos compartir contigo nuestra invitación de matrimonio: ${guestLink(guest)}`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="guest-manager mt-8 border-t border-[#d5dce1] pt-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef1f3] text-[#75828b]"><Phone size={16} /></div>
        <div>
          <p className="text-sm font-semibold text-[#63717b]">Invitados y envíos</p>
          <p className="mt-1 text-xs leading-5 text-[#8a959d]">Agrega una familia o grupo y genera su enlace personalizado para compartirlo por WhatsApp.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <input value={names} onChange={(event) => setNames(event.target.value)} data-testid="input-guest-names" placeholder="Nombre o nombres de invitados" className="w-full rounded-xl border border-[#d5dce1] bg-[#fbfcfc] px-3 py-3 text-sm text-[#5e6b75] outline-none focus:border-[#9ba8b0]" />
        <div className="flex gap-2">
          <input value={phone} onChange={(event) => setPhone(event.target.value)} data-testid="input-guest-phone" placeholder="Número de WhatsApp" inputMode="tel" className="min-w-0 flex-1 rounded-xl border border-[#d5dce1] bg-[#fbfcfc] px-3 py-3 text-sm text-[#5e6b75] outline-none focus:border-[#9ba8b0]" />
          <button type="button" onClick={addGuest} data-testid="button-add-guest" className="flex shrink-0 items-center gap-1 rounded-xl bg-[#aeb8bf] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#96a3ac]"><Plus size={15} /> Agregar</button>
        </div>
      </div>
      {guests.length > 0 && (
        <div className="mt-5 space-y-3">
          {guests.map((guest) => (
            <div key={guest.id} className="rounded-xl border border-[#d5dce1] bg-[#fbfcfc] p-3">
              <input value={guest.names} onChange={(event) => updateGuest(guest.id, 'names', event.target.value)} aria-label={`Nombres de ${guest.names}`} className="w-full border-b border-[#d5dce1] bg-transparent pb-2 text-sm font-semibold text-[#63717b] outline-none focus:border-[#9ba8b0]" />
              <div className="mt-2 flex items-center gap-2">
                <Phone size={13} className="shrink-0 text-[#8a959d]" />
                <input value={guest.phone} onChange={(event) => updateGuest(guest.id, 'phone', event.target.value)} aria-label={`Teléfono de ${guest.names}`} placeholder="Sin teléfono" className="min-w-0 flex-1 bg-transparent text-xs text-[#74808a] outline-none" />
                {guest.phone && <button type="button" onClick={() => sendGuestInvitation(guest)} title="Enviar por WhatsApp" aria-label={`Enviar invitación a ${guest.names}`} className="rounded-full p-1.5 text-[#71808a] transition hover:bg-[#e7ecef]"><Send size={14} /></button>}
                <button type="button" onClick={() => onChange(guests.filter((item) => item.id !== guest.id))} title="Eliminar invitado" aria-label={`Eliminar ${guest.names}`} className="rounded-full p-1.5 text-[#9aa5ad] transition hover:bg-[#f1e5e5] hover:text-[#8c6262]"><Trash2 size={14} /></button>
              </div>
              <button type="button" onClick={() => navigator.clipboard?.writeText(guestLink(guest))} className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#7d8992]">Copiar enlace personalizado</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EditorPanel({ modules, guests, onToggle, onGuestsChange, onClose }: { modules: ModuleSettings; guests: Guest[]; onToggle: (key: ModuleKey) => void; onGuestsChange: (guests: Guest[]) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Cerrar editor" data-testid="button-close-editor-overlay" onClick={onClose} className="absolute inset-0 cursor-default bg-[#7a8790]/35 backdrop-blur-[2px]" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#d5dce1] p-6">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#7d8992]">Editor local</p><h2 className="script mt-2 text-6xl leading-[.8] text-[#5d6a74]">Tu invitación</h2><p className="mt-4 text-sm leading-5 text-[#74808a]">Enciende o apaga módulos y mira cómo cambia la vista de tus invitados.</p></div>
          <button onClick={onClose} data-testid="button-close-editor" className="rounded-full p-2 text-[#74808a] transition hover:bg-[#eef1f3]"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-[#eef1f3] p-3 text-xs text-[#687680]"><Sparkles size={15} /> Los cambios se guardan automáticamente en este dispositivo.</div>
          <div className="space-y-2">
            {(Object.keys(moduleLabels) as ModuleKey[]).map((key) => (
              <button key={key} onClick={() => onToggle(key)} data-testid={`button-toggle-${key}`} className="flex w-full items-center justify-between rounded-xl border border-[#d5dce1] bg-[#fbfcfc] p-4 text-left transition hover:border-[#aeb8bf]">
                <span><span className="block text-sm font-semibold text-[#63717b]">{moduleLabels[key].label}</span><span className="mt-1 block text-xs text-[#8a959d]">{moduleLabels[key].note}</span></span>
                <span className={`relative h-6 w-11 rounded-full transition ${modules[key] ? 'bg-[#aeb8bf]' : 'bg-[#d2d9de]'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${modules[key] ? 'translate-x-6' : 'translate-x-1'}`} /></span>
              </button>
            ))}
          </div>
          <GuestManager guests={guests} onChange={onGuestsChange} />
        </div>
        <div className="border-t border-[#d5dce1] p-6"><button onClick={onClose} data-testid="button-return-preview" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#aeb8bf] py-3 text-xs font-semibold text-white"><ChevronLeft size={15} /> Volver a la vista previa</button></div>
      </aside>
    </div>
  );
}

function Lightbox({ index, onClose, onPrev, onNext }: { index: number; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-[#6d7a83]/75 p-5 backdrop-blur-sm">
      <button onClick={onClose} data-testid="button-close-lightbox" className="absolute right-5 top-5 rounded-full border border-white/80 p-2 text-white"><X size={20} /></button>
      <button onClick={onPrev} data-testid="button-previous-photo" className="absolute left-4 rounded-full border border-white/80 p-2 text-white sm:left-8"><ChevronLeft size={22} /></button>
      <div className="w-full max-w-3xl">
        <img src={galleryItems[index].src} alt={galleryItems[index].title} className="mx-auto max-h-[75vh] w-full rounded-2xl object-contain shadow-2xl" />
        <div className="mt-5 flex items-center justify-between text-white"><p className="script text-5xl">{galleryItems[index].title}</p><span className="mono text-xs text-[#e6ebee]">{String(index + 1).padStart(2, '0')} / {String(galleryItems.length).padStart(2, '0')}</span></div>
      </div>
      <button onClick={onNext} data-testid="button-next-photo" className="absolute right-4 rounded-full border border-white/80 p-2 text-white sm:right-8"><ChevronRight size={22} /></button>
    </div>
  );
}

export default App;