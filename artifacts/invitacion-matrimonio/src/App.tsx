import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Gift, Image as ImageIcon, Landmark, LocateFixed, MapPin, Menu, Music2, Pause, Play, Send, Share2, Sparkles, Star, Users, Volume2, X } from 'lucide-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import heroImage from './assets/wedding-hero.png';

const queryClient = new QueryClient();

type ModuleKey = 'cover' | 'story' | 'details' | 'itinerary' | 'rsvp' | 'location' | 'gallery' | 'gift' | 'music';
type ModuleSettings = Record<ModuleKey, boolean>;

const defaultModules: ModuleSettings = {
  cover: true, story: true, details: true, itinerary: true, rsvp: true,
  location: true, gallery: true, gift: true, music: true,
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

const galleryItems = [
  { title: 'La calma antes del sí', className: 'gallery-tall' },
  { title: 'Un paseo sin prisa', className: 'gallery-small' },
  { title: 'Donde todo empezó', className: 'gallery-wide' },
  { title: 'Risas de domingo', className: 'gallery-small' },
  { title: 'Siempre del mismo lado', className: 'gallery-tall' },
];

function useCountdown() {
  const eventDate = useMemo(() => new Date('2026-07-18T17:00:00'), []);
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
    try { return { ...defaultModules, ...JSON.parse(localStorage.getItem('luna-modules') || '{}') }; }
    catch { return defaultModules; }
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const [shared, setShared] = useState(false);
  const [rsvpSent, setRsvpSent] = useState(() => localStorage.getItem('luna-rsvp') === 'yes');
  const countdown = useCountdown();
  const audioRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const toggleModule = (key: ModuleKey) => {
    const next = { ...modules, [key]: !modules[key] };
    setModules(next);
    localStorage.setItem('luna-modules', JSON.stringify(next));
  };

  const toggleMusic = () => {
    if (!musicOn) {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const context = audioRef.current || new AudioContextClass();
        audioRef.current = context;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 261.63;
        gain.gain.value = 0.018;
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillatorRef.current = oscillator;
      }
      setMusicOn(true);
    } else {
      oscillatorRef.current?.stop();
      oscillatorRef.current = null;
      setMusicOn(false);
    }
  };

  const shareInvitation = async () => {
    const shareData = { title: 'Luna & Mateo — Nos casamos', text: 'Te esperamos para celebrar con nosotros.', url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(window.location.href);
    } catch { /* share dismissed */ }
    setShared(true);
    window.setTimeout(() => setShared(false), 2200);
  };

  useEffect(() => () => {
    oscillatorRef.current?.stop();
    audioRef.current?.close();
  }, []);

  return (
    <main className="paper-grain min-h-[100dvh] overflow-hidden bg-[#f3eee6]">
      <TopBar onEdit={() => setEditorOpen(true)} onShare={shareInvitation} shared={shared} />
      <div className="mx-auto max-w-[1320px] px-4 pb-16 sm:px-8 lg:px-14">
        {modules.cover && <Cover countdown={countdown} onMusic={toggleMusic} musicOn={musicOn} />}
        <AnchorRail />
        {modules.story && <Story />}
        {modules.details && <Details />}
        {modules.itinerary && <Itinerary />}
        {modules.rsvp && <Rsvp sent={rsvpSent} onSent={() => { setRsvpSent(true); localStorage.setItem('luna-rsvp', 'yes'); }} />}
        {modules.location && <LocationSection />}
        {modules.gallery && <Gallery onOpen={setActivePhoto} />}
        {modules.gift && <GiftSection />}
        {modules.music && <MusicSection musicOn={musicOn} onMusic={toggleMusic} />}
        <footer className="mt-20 border-t border-[#cfc2b2] py-12 text-center">
          <div className="serif text-4xl italic text-[#31503d]">Luna <span className="text-[#bb745b]">&</span> Mateo</div>
          <p className="mt-2 text-[11px] uppercase tracking-[.28em] text-[#8f8276]">18 · 07 · 2026 · San Miguel de Allende</p>
          <p className="mt-8 text-sm text-[#8f8276]">Gracias por acompañarnos en este capítulo.</p>
        </footer>
      </div>
      <button onClick={() => setEditorOpen(true)} data-testid="button-open-editor" className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-[#cdbba7] bg-[#f7f2ea]/95 px-4 py-3 text-xs font-semibold text-[#31503d] shadow-[0_8px_25px_rgba(61,45,33,.12)] backdrop-blur-md transition hover:-translate-y-0.5">
        <Menu size={15} /> Editar invitación
      </button>
      {editorOpen && <EditorPanel modules={modules} onToggle={toggleModule} onClose={() => setEditorOpen(false)} />}
      {activePhoto !== null && <Lightbox index={activePhoto} onClose={() => setActivePhoto(null)} onPrev={() => setActivePhoto((activePhoto + galleryItems.length - 1) % galleryItems.length)} onNext={() => setActivePhoto((activePhoto + 1) % galleryItems.length)} />}
    </main>
  );
}

function TopBar({ onEdit, onShare, shared }: { onEdit: () => void; onShare: () => void; shared: boolean }) {
  return (
    <header className="mx-auto flex max-w-[1320px] items-center justify-between px-4 py-5 sm:px-8 lg:px-14">
      <a href="#inicio" data-testid="link-home" className="group flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#b7a794] font-serif text-lg italic text-[#31503d] transition group-hover:rotate-12">L</span>
        <span className="hidden text-[11px] font-semibold uppercase tracking-[.24em] text-[#655b52] sm:block">Luna & Mateo</span>
      </a>
      <nav className="hidden items-center gap-6 text-[11px] uppercase tracking-[.2em] text-[#8a7b6e] md:flex">
        <a href="#historia" data-testid="link-story" className="transition hover:text-[#bb745b]">Historia</a>
        <a href="#celebracion" data-testid="link-details" className="transition hover:text-[#bb745b]">Celebración</a>
        <a href="#galeria" data-testid="link-gallery" className="transition hover:text-[#bb745b]">Galería</a>
      </nav>
      <div className="flex items-center gap-2">
        <button onClick={onShare} data-testid="button-share" className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[#31503d] transition hover:bg-[#e6ded4]">
          {shared ? <Check size={15} /> : <Share2 size={15} />}<span className="hidden sm:inline">{shared ? 'Enlace copiado' : 'Compartir'}</span>
        </button>
        <button onClick={onEdit} data-testid="button-top-editor" className="rounded-full bg-[#31503d] px-4 py-2.5 text-xs font-semibold text-[#f7f1e7] transition hover:bg-[#243e2f]">Vista de edición</button>
      </div>
    </header>
  );
}

function Cover({ countdown, onMusic, musicOn }: { countdown: ReturnType<typeof useCountdown>; onMusic: () => void; musicOn: boolean }) {
  return (
    <section id="inicio" className="relative grid min-h-[720px] overflow-hidden rounded-[2rem] bg-[#31503d] text-[#f8f1e7] shadow-paper lg:grid-cols-[1fr_1.1fr]">
      <div className="relative z-10 flex flex-col justify-between p-7 sm:p-12 lg:p-16">
        <div className="reveal flex items-center gap-3 text-[10px] uppercase tracking-[.32em] text-[#d8c19e]"><span className="h-px w-8 bg-[#d8c19e]" /> Invitación privada <span className="h-px w-8 bg-[#d8c19e]" /></div>
        <div className="my-12">
          <p className="reveal reveal-delay-1 mb-5 text-xs uppercase tracking-[.3em] text-[#d8c19e]">Con el corazón lleno</p>
          <h1 className="reveal reveal-delay-2 max-w-[550px] font-serif text-[clamp(4.8rem,11vw,9.5rem)] leading-[.78] tracking-[-.06em]">Luna <span className="ml-10 text-[#d3987b]">&</span><br /><em className="ml-5">Mateo</em></h1>
          <p className="reveal reveal-delay-3 mt-10 max-w-xs text-sm leading-6 text-[#d9d5ca]">Hay historias que merecen celebrarse despacio. La nuestra empieza aquí.</p>
        </div>
        <div className="reveal reveal-delay-3 flex items-end justify-between border-t border-[#718272] pt-5">
          <div><p className="text-[10px] uppercase tracking-[.22em] text-[#d8c19e]">Sábado</p><p className="serif mt-1 text-3xl">18.07.26</p></div>
          <button onClick={onMusic} data-testid="button-music-cover" className="flex items-center gap-2 rounded-full border border-[#718272] px-3 py-2 text-xs text-[#f8f1e7] transition hover:bg-[#41634d]">{musicOn ? <Pause size={14} /> : <Play size={14} />} {musicOn ? 'Pausar' : 'Nuestra melodía'}</button>
        </div>
      </div>
      <div className="relative min-h-[390px] overflow-hidden lg:min-h-0">
        <img src={heroImage} alt="Luna y Mateo abrazados al atardecer" className="photo-wash absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#31503d] via-transparent to-[#31503d]/10 lg:bg-gradient-to-r lg:from-[#31503d]/50 lg:to-transparent" />
        <div className="absolute bottom-8 left-7 right-7 flex items-end justify-between sm:bottom-12 sm:left-12 sm:right-12">
          <div><p className="text-[10px] uppercase tracking-[.3em] text-[#f5dfbb]">Faltan</p><div className="mt-3 grid grid-cols-4 gap-3 sm:gap-5">{[['días', countdown.days], ['horas', countdown.hours], ['min', countdown.minutes], ['seg', countdown.seconds]].map(([label, value]) => <div key={String(label)}><p className="mono text-2xl text-[#fff7e7] sm:text-3xl">{String(value).padStart(2, '0')}</p><p className="mt-1 text-[9px] uppercase tracking-[.2em] text-[#e6d4b7]">{label}</p></div>)}</div></div>
          <a href="#historia" data-testid="link-scroll-story" className="breathe flex h-11 w-11 items-center justify-center rounded-full border border-[#ead9bd] text-[#fff5e3]"><ChevronDown size={18} /></a>
        </div>
      </div>
    </section>
  );
}

function AnchorRail() {
  const anchors = [['#historia', 'Historia'], ['#celebracion', 'Celebración'], ['#itinerario', 'Itinerario'], ['#confirmacion', 'Confirmar'], ['#galeria', 'Galería']];
  return <div className="sticky top-0 z-30 -mx-4 my-3 flex gap-1 overflow-x-auto border-b border-[#d7cbbb]/80 bg-[#f3eee6]/90 px-4 py-3 backdrop-blur-md sm:-mx-8 sm:px-8 lg:-mx-14 lg:px-14">{anchors.map(([href, label]) => <a key={href} href={href} data-testid={`link-anchor-${label.toLowerCase()}`} className="shrink-0 rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#8a7b6e] transition hover:bg-[#e7ded4] hover:text-[#31503d]">{label}</a>)}</div>;
}

function SectionHeading({ eyebrow, title, intro, align = 'left' }: { eyebrow: string; title: ReactNode; intro?: string; align?: 'left' | 'center' }) {
  return <div className={`${align === 'center' ? 'mx-auto text-center' : ''} max-w-xl`}><p className="mb-3 text-[10px] font-semibold uppercase tracking-[.28em] text-[#bb745b]">{eyebrow}</p><h2 className="serif text-5xl leading-[.9] tracking-[-.03em] text-[#31503d] sm:text-6xl">{title}</h2>{intro && <p className="mt-5 max-w-md text-sm leading-6 text-[#786d61]">{intro}</p>}</div>;
}

function Story() {
  return <section id="historia" className="grid scroll-mt-20 gap-12 py-24 sm:py-32 lg:grid-cols-[.8fr_1.2fr] lg:gap-24"><div className="lg:pt-12"><SectionHeading eyebrow="Una pequeña historia" title={<>Todo comenzó<br /><em>sin buscarlo.</em></>} intro="Nos conocimos una tarde cualquiera y, sin darnos cuenta, empezamos a elegirnos todos los días." /><div className="mt-10 flex items-center gap-3 text-xs text-[#8a7b6e]"><span className="h-px w-12 bg-[#bb745b]" /> 2019 — hasta siempre</div></div><div className="relative min-h-[420px]"><div className="absolute left-8 top-0 h-[330px] w-[75%] rotate-[-4deg] overflow-hidden rounded-[1.5rem] bg-[#d4c3ad] shadow-paper"><img src={heroImage} alt="Una pareja compartiendo un momento" className="photo-wash h-full w-full object-cover object-[35%]" /></div><div className="absolute bottom-0 right-1 h-[215px] w-[52%] rotate-[5deg] rounded-[1.5rem] border-[12px] border-[#f3eee6] bg-[#c59a7e] shadow-paper"><div className="h-full w-full bg-[radial-gradient(circle_at_65%_30%,#dfc09c_0_14%,transparent_15%),linear-gradient(145deg,#8b6b5c,#c79e7c_45%,#e2c69f)]" /></div><div className="float-slow absolute bottom-8 left-0 flex h-20 w-20 items-center justify-center rounded-full bg-[#d3987b] text-center text-[10px] uppercase leading-4 tracking-[.12em] text-[#fff6e7]">hechos<br />para<br />reír</div></div></section>;
}

function Details() {
  const items = [{ icon: CalendarDays, label: 'La fecha', value: 'Sábado 18 de julio, 2026' }, { icon: Clock3, label: 'La hora', value: '5:00 de la tarde' }, { icon: Landmark, label: 'El lugar', value: 'Casa de la Luz · San Miguel de Allende' }, { icon: Users, label: 'Vestimenta', value: 'Formal relajado · tonos naturales' }];
  return <section id="celebracion" className="scroll-mt-20 rounded-[2rem] bg-[#ebe2d7] px-6 py-16 sm:px-12 sm:py-20"><div className="flex flex-col justify-between gap-10 lg:flex-row"><SectionHeading eyebrow="El día que imaginamos" title={<>Detalles para<br /><em>llegar al corazón.</em></>} intro="Guarda esta fecha. Lo demás lo vamos a celebrar juntos." /><div className="grid w-full max-w-xl gap-0 sm:grid-cols-2">{items.map(({ icon: Icon, label, value }) => <div key={label} className="border-t border-[#cbbcac] py-6 sm:px-5 first:sm:pl-0"><Icon size={19} strokeWidth={1.5} className="text-[#bb745b]" /><p className="mt-4 text-[10px] font-semibold uppercase tracking-[.2em] text-[#9b8978]">{label}</p><p className="mt-2 max-w-[190px] text-sm leading-5 text-[#4b443d]">{value}</p></div>)}</div></div></section>;
}

function Itinerary() {
  const events = [['17:00', 'Ceremonia', 'Nos prometemos una vida con más domingos juntos.'], ['18:30', 'Cóctel de bienvenida', 'Una copa, algo de música y abrazos pendientes.'], ['20:00', 'Cena bajo las estrellas', 'La mesa está lista para contar historias.'], ['22:00', 'Baile', 'Zapatos cómodos, corazón abierto.']];
  return <section id="itinerario" className="scroll-mt-20 py-24 sm:py-32"><div className="grid gap-14 lg:grid-cols-[.65fr_1fr]"><SectionHeading eyebrow="El ritmo del día" title={<>Un día para<br /><em>quedarnos.</em></>} intro="Ven a vivir cada momento. Sin prisas, sin poses, con la gente que queremos." /><div className="relative border-l border-[#cbbcac] pl-7 sm:pl-12">{events.map(([time, title, text], i) => <div key={time} className="relative pb-10 last:pb-0"><span className="absolute -left-[34px] top-0 h-4 w-4 rounded-full border-4 border-[#f3eee6] bg-[#bb745b] sm:-left-[57px]" /><div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-8"><span className="mono text-xs text-[#bb745b]">{time}</span><h3 className="serif text-3xl text-[#31503d]">{title}</h3></div><p className="mt-2 max-w-md text-sm leading-6 text-[#786d61]">{text}</p>{i === 2 && <div className="absolute -right-8 top-3 hidden h-14 w-14 rotate-12 items-center justify-center rounded-full border border-[#d5b87f] text-[#a48a55] lg:flex"><Star size={16} /></div>}</div>)}</div></div></section>;
}

function Rsvp({ sent, onSent }: { sent: boolean; onSent: () => void }) {
  const [name, setName] = useState('');
  const [attendance, setAttendance] = useState('Sí, ahí estaré');
  const [guests, setGuests] = useState('1 persona');
  if (sent) return <section id="confirmacion" className="scroll-mt-20 rounded-[2rem] bg-[#31503d] px-6 py-16 text-center text-[#f8f1e7] sm:px-12 sm:py-20"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#b7c6b2] text-[#d8c19e]"><Check size={23} /></div><p className="mt-6 text-[10px] uppercase tracking-[.3em] text-[#d8c19e]">Gracias por confirmar</p><h2 className="serif mt-3 text-5xl italic">Nos vemos en la pista.</h2><p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#d9d5ca]">Tu respuesta ha quedado guardada en esta invitación. Estamos felices de contar contigo.</p><button onClick={() => { localStorage.removeItem('luna-rsvp'); window.location.reload(); }} data-testid="button-edit-rsvp" className="mt-8 border-b border-[#b7c6b2] pb-1 text-xs uppercase tracking-[.16em] text-[#e1d6c1]">Cambiar respuesta</button></section>;
  return <section id="confirmacion" className="scroll-mt-20 grid overflow-hidden rounded-[2rem] bg-[#d5a083] lg:grid-cols-[.8fr_1.2fr]"><div className="relative min-h-[270px] overflow-hidden"><img src={heroImage} alt="" className="photo-wash absolute inset-0 h-full w-full object-cover object-[70%]" /><div className="absolute inset-0 bg-[#bb745b]/40" /></div><div className="p-7 sm:p-12"><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#fff1df]">Tu lugar está esperando</p><h2 className="serif mt-3 text-5xl leading-[.9] text-[#fff8eb]">¿Vienes a<br /><em>celebrar?</em></h2><form onSubmit={(event) => { event.preventDefault(); if (name.trim()) onSent(); }} className="mt-8 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="sr-only">Nombre completo</span><input required value={name} onChange={(event) => setName(event.target.value)} data-testid="input-rsvp-name" placeholder="Tu nombre completo" className="w-full border-b border-[#efd0bb] bg-transparent px-0 py-3 text-sm text-[#fff8eb] outline-none placeholder:text-[#f6d9c7] focus:border-[#fff8eb]" /></label><label><span className="sr-only">Asistencia</span><select value={attendance} onChange={(event) => setAttendance(event.target.value)} data-testid="select-rsvp-attendance" className="w-full border-b border-[#efd0bb] bg-transparent py-3 text-sm text-[#fff8eb] outline-none"><option className="text-[#31503d]">Sí, ahí estaré</option><option className="text-[#31503d]">No podré acompañarlos</option></select></label><label><span className="sr-only">Acompañantes</span><select value={guests} onChange={(event) => setGuests(event.target.value)} data-testid="select-rsvp-guests" className="w-full border-b border-[#efd0bb] bg-transparent py-3 text-sm text-[#fff8eb] outline-none"><option className="text-[#31503d]">1 persona</option><option className="text-[#31503d]">2 personas</option><option className="text-[#31503d]">3 personas</option></select></label><button type="submit" data-testid="button-submit-rsvp" className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#31503d] px-5 py-3 text-xs font-semibold text-[#f7f1e7] transition hover:bg-[#243e2f] sm:col-span-2 sm:justify-self-start">Enviar confirmación <Send size={14} /></button></form></div></section>;
}

function LocationSection() {
  return <section id="ubicacion" className="scroll-mt-20 grid gap-10 py-24 sm:py-32 lg:grid-cols-[1fr_1fr] lg:items-center"><div><SectionHeading eyebrow="Nos encontramos aquí" title={<>Una casa<br /><em>llena de luz.</em></>} intro="Casa de la Luz, una pausa entre bugambilias y atardeceres. Te recomendamos llegar con tiempo para disfrutar el camino." /><a href="https://maps.google.com/?q=Casa+de+la+Luz+San+Miguel+de+Allende" target="_blank" rel="noreferrer" data-testid="link-maps" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#31503d] px-5 py-3 text-xs font-semibold text-[#f8f1e7] transition hover:bg-[#243e2f]">Abrir en Maps <LocateFixed size={15} /></a></div><div className="relative min-h-[330px] overflow-hidden rounded-[2rem] bg-[#d9c9b8] p-5 shadow-paper"><div className="relative h-full min-h-[290px] overflow-hidden rounded-[1.25rem] border border-[#c1ad99] bg-[#e4d5c5]"><div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(35deg, transparent 45%, #b5a999 46%, #b5a999 48%, transparent 49%), linear-gradient(120deg, transparent 44%, #c0b2a5 45%, #c0b2a5 47%, transparent 48%), linear-gradient(#d2c3b4 1px, transparent 1px), linear-gradient(90deg, #d2c3b4 1px, transparent 1px)', backgroundSize: '100% 100%,100% 100%,34px 34px,34px 34px' }} /><div className="absolute left-[53%] top-[42%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#bb745b] text-[#fff6e7] shadow-lg"><MapPin size={22} /></span><span className="mt-2 rounded-full bg-[#31503d] px-3 py-1 text-[10px] uppercase tracking-[.12em] text-[#f7f1e7]">Casa de la Luz</span></div><div className="absolute bottom-5 left-5 text-[10px] uppercase tracking-[.2em] text-[#8b7968]">San Miguel de Allende · GTO</div></div></div></section>;
}

function Gallery({ onOpen }: { onOpen: (index: number) => void }) {
  return <section id="galeria" className="scroll-mt-20 py-10 sm:py-16"><div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><SectionHeading eyebrow="Fragmentos de nosotros" title={<>Antes de<br /><em>este día.</em></>} /><p className="max-w-[220px] text-sm leading-6 text-[#786d61]">Algunas escenas de nuestra historia, para que nos conozcas un poquito más.</p></div><div className="gallery-grid">{galleryItems.map((item, index) => <button key={item.title} onClick={() => onOpen(index)} data-testid={`button-gallery-${index}`} className={`${item.className} group relative overflow-hidden rounded-[1.25rem] bg-[#c59a7e] text-left shadow-paper`}><div className={`gallery-art gallery-art-${index} h-full w-full`} /><div className="absolute inset-0 bg-gradient-to-t from-[#31503d]/75 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" /><span className="absolute bottom-5 left-5 translate-y-3 text-xs text-[#fff8eb] opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">{item.title}</span><span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#f7f1e7]/80 text-[#31503d] opacity-0 transition group-hover:opacity-100"><ImageIcon size={14} /></span></button>)}</div></section>;
}

function GiftSection() {
  return <section className="my-20 rounded-[2rem] border border-[#ccbca9] px-6 py-16 text-center sm:px-12"><Gift className="mx-auto text-[#bb745b]" size={24} strokeWidth={1.5} /><p className="mt-5 text-[10px] font-semibold uppercase tracking-[.28em] text-[#bb745b]">El mejor regalo</p><h2 className="serif mt-3 text-5xl text-[#31503d]">Es compartir este día</h2><p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#786d61]">Tu presencia es todo lo que necesitamos. Si quieres tener un detalle, una aportación para nuestra nueva aventura nos hará sonreír.</p><div className="mx-auto mt-7 h-px w-16 bg-[#d5b87f]" /></section>;
}

function MusicSection({ musicOn, onMusic }: { musicOn: boolean; onMusic: () => void }) {
  return <section className="flex flex-col items-center justify-between gap-6 border-y border-[#d5c6b5] py-8 sm:flex-row"><div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d5a083] text-[#fff8eb]">{musicOn ? <Volume2 size={18} /> : <Music2 size={18} />}</div><div><p className="text-[10px] uppercase tracking-[.24em] text-[#bb745b]">Nuestra banda sonora</p><p className="mt-1 text-sm text-[#4b443d]">Una melodía para abrir la invitación</p></div></div><button onClick={onMusic} data-testid="button-music" className="flex items-center gap-2 rounded-full border border-[#31503d] px-5 py-2.5 text-xs font-semibold text-[#31503d] transition hover:bg-[#31503d] hover:text-[#f8f1e7]">{musicOn ? <Pause size={14} /> : <Play size={14} />}{musicOn ? 'Pausar música' : 'Reproducir música'}</button></section>;
}

function EditorPanel({ modules, onToggle, onClose }: { modules: ModuleSettings; onToggle: (key: ModuleKey) => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-50"><button aria-label="Cerrar editor" data-testid="button-close-editor-overlay" onClick={onClose} className="absolute inset-0 cursor-default bg-[#24362c]/40 backdrop-blur-[2px]" /><aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#f7f1e7] shadow-2xl"><div className="flex items-start justify-between border-b border-[#d6c8b8] p-6"><div><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#bb745b]">Editor local</p><h2 className="serif mt-2 text-4xl text-[#31503d]">Tu invitación</h2><p className="mt-2 text-sm leading-5 text-[#786d61]">Enciende o apaga módulos y mira cómo cambia la vista de tus invitados.</p></div><button onClick={onClose} data-testid="button-close-editor" className="rounded-full p-2 text-[#786d61] transition hover:bg-[#e9dfd2]"><X size={20} /></button></div><div className="flex-1 overflow-y-auto p-6"><div className="mb-6 flex items-center gap-2 rounded-xl bg-[#e6eee5] p-3 text-xs text-[#31503d]"><Sparkles size={15} /> Los cambios se guardan automáticamente en este dispositivo.</div><div className="space-y-2">{(Object.keys(moduleLabels) as ModuleKey[]).map((key) => <button key={key} onClick={() => onToggle(key)} data-testid={`button-toggle-${key}`} className="flex w-full items-center justify-between rounded-xl border border-[#ddd0c1] bg-[#fbf7f0] p-4 text-left transition hover:border-[#bb745b]"><span><span className="block text-sm font-semibold text-[#4b443d]">{moduleLabels[key].label}</span><span className="mt-1 block text-xs text-[#9a8978]">{moduleLabels[key].note}</span></span><span className={`relative h-6 w-11 rounded-full transition ${modules[key] ? 'bg-[#31503d]' : 'bg-[#cfc3b5]'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-[#f8f1e7] transition-transform ${modules[key] ? 'translate-x-6' : 'translate-x-1'}`} /></span></button>)}</div></div><div className="border-t border-[#d6c8b8] p-6"><button onClick={onClose} data-testid="button-return-preview" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#31503d] py-3 text-xs font-semibold text-[#f8f1e7]"><ChevronLeft size={15} /> Volver a la vista previa</button></div></aside></div>;
}

function Lightbox({ index, onClose, onPrev, onNext }: { index: number; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  return <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-[#24362c]/90 p-5 backdrop-blur-sm"><button onClick={onClose} data-testid="button-close-lightbox" className="absolute right-5 top-5 rounded-full border border-[#a8b4a8] p-2 text-[#f8f1e7]"><X size={20} /></button><button onClick={onPrev} data-testid="button-previous-photo" className="absolute left-4 rounded-full border border-[#a8b4a8] p-2 text-[#f8f1e7] sm:left-8"><ChevronLeft size={22} /></button><div className="w-full max-w-3xl"><div className={`lightbox-art lightbox-art-${index} mx-auto aspect-[4/3] max-h-[75vh] rounded-2xl shadow-2xl`} /><div className="mt-5 flex items-center justify-between text-[#f8f1e7]"><p className="serif text-3xl italic">{galleryItems[index].title}</p><span className="mono text-xs text-[#c5d0c4]">{String(index + 1).padStart(2, '0')} / {String(galleryItems.length).padStart(2, '0')}</span></div></div><button onClick={onNext} data-testid="button-next-photo" className="absolute right-4 rounded-full border border-[#a8b4a8] p-2 text-[#f8f1e7] sm:right-8"><ChevronRight size={22} /></button></div>;
}

export default App;