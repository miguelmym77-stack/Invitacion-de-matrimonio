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
  MapPin,
  Menu,
  Music2,
  Pause,
  Play,
  Send,
  Share2,
  Sparkles,
  Star,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import heroImage from './assets/wedding-cover.jpg';
import weddingMelody from './assets/wedding-melody.wav';

const queryClient = new QueryClient();

type ModuleKey = 'cover' | 'story' | 'details' | 'itinerary' | 'rsvp' | 'location' | 'gallery' | 'gift' | 'music';
type ModuleSettings = Record<ModuleKey, boolean>;

const defaultModules: ModuleSettings = {
  cover: true,
  story: true,
  details: true,
  itinerary: true,
  rsvp: true,
  location: true,
  gallery: true,
  gift: true,
  music: true,
};

const moduleLabels: Record<ModuleKey, { label: string; note: string }> = {
  cover: { label: 'Portada y cuenta regresiva', note: 'La primera impresión' },
  story: { label: 'Nuestra historia', note: 'Un pedacito de nosotros' },
  details: { label: 'Detalles del evento', note: 'Fecha, hora y celebración' },
  itinerary: { label: 'Itinerario', note: 'Para vivir el día juntos' },
  rsvp: { label: 'Confirmación', note: 'Respuesta de tus invitados' },
  location: { label: 'Ubicación', note: 'Cómo llegar' },
  gallery: { label: 'Galería', note: 'Momentos que nos inspiran' },
  gift: { label: 'Sugerencia de regalo', note: 'Un gesto desde el corazón' },
  music: { label: 'Música', note: 'La banda sonora de este día' },
};

const pageOrder: Array<{ key: ModuleKey; id: string; label: string }> = [
  { key: 'cover', id: 'inicio', label: 'Portada' },
  { key: 'story', id: 'historia', label: 'Historia' },
  { key: 'details', id: 'celebracion', label: 'Celebración' },
  { key: 'itinerary', id: 'itinerario', label: 'Itinerario' },
  { key: 'rsvp', id: 'confirmacion', label: 'Confirmar' },
  { key: 'location', id: 'ubicacion', label: 'Ubicación' },
  { key: 'gallery', id: 'galeria', label: 'Galería' },
  { key: 'gift', id: 'regalo', label: 'Regalo' },
  { key: 'music', id: 'musica', label: 'Música' },
];

const galleryItems = [
  { title: 'Nuestro sí', position: 'object-[50%_38%]' },
  { title: 'Un día para recordar', position: 'object-[48%_46%]' },
  { title: 'Juntos', position: 'object-[64%_48%]' },
  { title: 'El comienzo de siempre', position: 'object-[35%_45%]' },
  { title: 'Con todo nuestro amor', position: 'object-[58%_62%]' },
];

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
  const [rsvpSent, setRsvpSent] = useState(() => localStorage.getItem('daniela-miguel-rsvp') === 'yes');
  const countdown = useCountdown();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visiblePages = pageOrder.filter(({ key }) => modules[key]);

  const toggleModule = (key: ModuleKey) => {
    const next = { ...modules, [key]: !modules[key] };
    setModules(next);
    localStorage.setItem('daniela-miguel-modules', JSON.stringify(next));
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
  }, []);

  return (
    <main className="paper-grain min-h-[100dvh] overflow-hidden bg-[#eef1f3]">
      <TopBar
        onEdit={() => setEditorOpen(true)}
        onShare={shareInvitation}
        shared={shared}
        homeHref={`#${visiblePages[0]?.id ?? 'inicio'}`}
      />
      <div className="mx-auto max-w-[1320px] px-4 pb-16 sm:px-8 lg:px-14">
        {modules.cover && (
          <PageFrame pageKey="cover" nextPage={visiblePages[1]}>
            <Cover countdown={countdown} onMusic={toggleMusic} musicOn={musicOn} />
          </PageFrame>
        )}
        {modules.story && (
          <PageFrame pageKey="story" nextPage={visiblePages[visiblePages.findIndex((page) => page.key === 'story') + 1]}>
            <Story />
          </PageFrame>
        )}
        {modules.details && (
          <PageFrame pageKey="details" nextPage={visiblePages[visiblePages.findIndex((page) => page.key === 'details') + 1]}>
            <Details />
          </PageFrame>
        )}
        {modules.itinerary && (
          <PageFrame pageKey="itinerary" nextPage={visiblePages[visiblePages.findIndex((page) => page.key === 'itinerary') + 1]}>
            <Itinerary />
          </PageFrame>
        )}
        {modules.rsvp && (
          <PageFrame pageKey="rsvp" nextPage={visiblePages[visiblePages.findIndex((page) => page.key === 'rsvp') + 1]}>
            <Rsvp
              sent={rsvpSent}
              onSent={() => {
                setRsvpSent(true);
                localStorage.setItem('daniela-miguel-rsvp', 'yes');
              }}
            />
          </PageFrame>
        )}
        {modules.location && (
          <PageFrame pageKey="location" nextPage={visiblePages[visiblePages.findIndex((page) => page.key === 'location') + 1]}>
            <LocationSection />
          </PageFrame>
        )}
        {modules.gallery && (
          <PageFrame pageKey="gallery" nextPage={visiblePages[visiblePages.findIndex((page) => page.key === 'gallery') + 1]}>
            <Gallery onOpen={setActivePhoto} />
          </PageFrame>
        )}
        {modules.gift && (
          <PageFrame pageKey="gift" nextPage={visiblePages[visiblePages.findIndex((page) => page.key === 'gift') + 1]}>
            <GiftSection />
          </PageFrame>
        )}
        {modules.music && (
          <PageFrame pageKey="music" nextPage={visiblePages[visiblePages.findIndex((page) => page.key === 'music') + 1]}>
            <MusicSection musicOn={musicOn} onMusic={toggleMusic} />
          </PageFrame>
        )}
        <footer className="border-t border-[#cbd2d7] py-12 text-center">
          <div className="script text-5xl text-[#62707b]">Miguel Ángel <span className="text-[#aab4bc]">&</span> Daniela</div>
          <p className="mt-3 text-[11px] uppercase tracking-[.28em] text-[#77838d]">07 · 11 · 2026 · Sabaneta, Antioquia</p>
          <p className="mt-8 text-sm text-[#7d8790]">Gracias por ser parte de nuestra historia.</p>
        </footer>
      </div>
      <button
        onClick={() => setEditorOpen(true)}
        data-testid="button-open-editor"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-[#c5cdd3] bg-white/95 px-4 py-3 text-xs font-semibold text-[#5b6872] shadow-[0_8px_25px_rgba(84,96,105,.16)] backdrop-blur-md transition hover:-translate-y-0.5"
      >
        <Menu size={15} /> Editar invitación
      </button>
      {editorOpen && <EditorPanel modules={modules} onToggle={toggleModule} onClose={() => setEditorOpen(false)} />}
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

function PageFrame({ pageKey, nextPage, children }: { pageKey: ModuleKey; nextPage?: { id: string; label: string }; children: ReactNode }) {
  const current = pageOrder.find((page) => page.key === pageKey);
  return (
    <section className="page-frame snap-start" aria-label={current?.label}>
      <div className="page-frame__content">{children}</div>
      <a href={`#${nextPage?.id ?? 'inicio'}`} data-testid={`button-next-${pageKey}`} className="page-next">
        <span>{nextPage ? `Siguiente: ${nextPage.label}` : 'Volver al inicio'}</span>
        {nextPage ? <ChevronDown size={16} /> : <ChevronDown size={16} className="rotate-180" />}
      </a>
    </section>
  );
}

function TopBar({ onEdit, onShare, shared, homeHref }: { onEdit: () => void; onShare: () => void; shared: boolean; homeHref: string }) {
  return (
    <header className="mx-auto flex max-w-[1320px] items-center justify-between px-4 py-5 sm:px-8 lg:px-14">
      <a href={homeHref} data-testid="link-home" className="group flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#bfc8cf] script text-2xl text-[#687680] transition group-hover:rotate-12">M</span>
        <span className="hidden text-[11px] font-semibold uppercase tracking-[.24em] text-[#687680] sm:block">Miguel Ángel & Daniela</span>
      </a>
      <nav className="hidden items-center gap-6 text-[11px] uppercase tracking-[.2em] text-[#7f8a93] md:flex">
        <a href="#historia" data-testid="link-story" className="transition hover:text-[#5f6d77]">Historia</a>
        <a href="#celebracion" data-testid="link-details" className="transition hover:text-[#5f6d77]">Celebración</a>
        <a href="#galeria" data-testid="link-gallery" className="transition hover:text-[#5f6d77]">Galería</a>
      </nav>
      <div className="flex items-center gap-2">
        <button onClick={onShare} data-testid="button-share" className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[#5b6872] transition hover:bg-white">
          {shared ? <Check size={15} /> : <Share2 size={15} />}
          <span className="hidden sm:inline">{shared ? 'Enlace copiado' : 'Compartir'}</span>
        </button>
        <button onClick={onEdit} data-testid="button-top-editor" className="rounded-full bg-[#aeb8bf] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#97a3ac]">
          Vista de edición
        </button>
      </div>
    </header>
  );
}

function Cover({ countdown, onMusic, musicOn }: { countdown: ReturnType<typeof useCountdown>; onMusic: () => void; musicOn: boolean }) {
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
          <a href="#historia" data-testid="link-scroll-story" className="flex items-center gap-2 rounded-full border border-white/75 bg-white/10 px-4 py-2 text-[10px] uppercase tracking-[.14em] text-white transition hover:bg-white/25">
            Comenzar <ChevronDown size={14} />
          </a>
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
          <img src={heroImage} alt="Daniela y Miguel Ángel juntos" className="photo-wash h-full w-full object-cover object-[35%]" />
        </div>
        <div className="absolute bottom-0 right-0 h-[190px] w-[48%] overflow-hidden rounded-full border-[10px] border-white bg-[#dfe4e8] shadow-paper sm:right-4">
          <img src={heroImage} alt="" className="h-full w-full object-cover object-[68%_48%] grayscale-[.2]" />
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
    { icon: Users, label: 'Vestimenta', value: 'Vestimenta formal' },
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

function Rsvp({ sent, onSent }: { sent: boolean; onSent: () => void }) {
  const [name, setName] = useState('');
  const [attendance, setAttendance] = useState('Sí, ahí estaré');
  const [guests, setGuests] = useState('1 persona');

  if (sent) {
    return (
      <section id="confirmacion" className="rounded-[2rem] border border-[#d3d9de] bg-white px-6 py-16 text-center sm:px-12 sm:py-20">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#bfc8cf] text-[#71808a]"><Check size={23} /></div>
        <p className="mt-6 text-[10px] uppercase tracking-[.3em] text-[#7d8992]">Gracias por confirmar</p>
        <h2 className="script mt-3 text-6xl text-[#5d6a74]">Nos vemos en la celebración.</h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#74808a]">Tu respuesta ha quedado guardada en esta invitación. Estamos felices de contar contigo.</p>
        <button onClick={() => { localStorage.removeItem('daniela-miguel-rsvp'); window.location.reload(); }} data-testid="button-edit-rsvp" className="mt-8 border-b border-[#aeb8bf] pb-1 text-xs uppercase tracking-[.16em] text-[#6f7c86]">Cambiar respuesta</button>
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
        <p className="mt-5 text-sm text-[#74808a]">Por favor confirma tu asistencia antes del 15 de octubre de 2026.</p>
        <form onSubmit={(event) => { event.preventDefault(); if (name.trim()) onSent(); }} className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="sr-only">Nombre completo</span>
            <input required value={name} onChange={(event) => setName(event.target.value)} data-testid="input-rsvp-name" placeholder="Tu nombre completo" className="w-full border-b border-[#c7d0d6] bg-transparent px-0 py-3 text-sm text-[#5e6b75] outline-none placeholder:text-[#9aa5ad] focus:border-[#7d8992]" />
          </label>
          <label>
            <span className="sr-only">Asistencia</span>
            <select value={attendance} onChange={(event) => setAttendance(event.target.value)} data-testid="select-rsvp-attendance" className="w-full border-b border-[#c7d0d6] bg-transparent py-3 text-sm text-[#66737d] outline-none">
              <option>Sí, ahí estaré</option><option>No podré acompañarlos</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Acompañantes</span>
            <select value={guests} onChange={(event) => setGuests(event.target.value)} data-testid="select-rsvp-guests" className="w-full border-b border-[#c7d0d6] bg-transparent py-3 text-sm text-[#66737d] outline-none">
              <option>1 persona</option><option>2 personas</option><option>3 personas</option>
            </select>
          </label>
          <button type="submit" data-testid="button-submit-rsvp" className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#aeb8bf] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#98a5ae] sm:col-span-2 sm:justify-self-start">Confirmar por WhatsApp <Send size={14} /></button>
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
          <button key={item.title} onClick={() => onOpen(index)} data-testid={`button-gallery-${index}`} className={`${index === 0 || index === 4 ? 'gallery-tall' : index === 2 ? 'gallery-wide' : ''} group relative overflow-hidden rounded-[1.25rem] border border-[#d3d9de] bg-[#e4e9ec] text-left shadow-paper`}>
            <img src={heroImage} alt={item.title} className={`gallery-photo h-full w-full object-cover ${item.position}`} />
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
        <div><p className="text-[10px] uppercase tracking-[.24em] text-[#7d8992]">Nuestra banda sonora</p><p className="mt-1 text-sm text-[#687680]">Melodía original de muestra, libre para usar</p></div>
      </div>
      <button onClick={onMusic} data-testid="button-music" className="flex items-center gap-2 rounded-full border border-[#aeb8bf] px-5 py-2.5 text-xs font-semibold text-[#64717b] transition hover:bg-[#eef1f3]">{musicOn ? <Pause size={14} /> : <Play size={14} />}{musicOn ? 'Pausar música' : 'Reproducir música'}</button>
    </section>
  );
}

function EditorPanel({ modules, onToggle, onClose }: { modules: ModuleSettings; onToggle: (key: ModuleKey) => void; onClose: () => void }) {
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
        <img src={heroImage} alt={galleryItems[index].title} className="mx-auto aspect-[4/3] max-h-[75vh] w-full rounded-2xl object-cover object-[50%_38%] shadow-2xl" />
        <div className="mt-5 flex items-center justify-between text-white"><p className="script text-5xl">{galleryItems[index].title}</p><span className="mono text-xs text-[#e6ebee]">{String(index + 1).padStart(2, '0')} / {String(galleryItems.length).padStart(2, '0')}</span></div>
      </div>
      <button onClick={onNext} data-testid="button-next-photo" className="absolute right-4 rounded-full border border-white/80 p-2 text-white sm:right-8"><ChevronRight size={22} /></button>
    </div>
  );
}

export default App;