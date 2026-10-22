import { useEffect, useState } from "react";

type AvatarTransform = {
  breath_chest: number;
  eye_blink_left: number;
  eye_blink_right: number;
  staff_tip_glow: number;
};

type AvatarFrame = { transform: AvatarTransform };

const RESTING: AvatarTransform = {
  breath_chest: 0.5,
  eye_blink_left: 0,
  eye_blink_right: 0,
  staff_tip_glow: 0.55,
};

function previewFrame(seconds: number): AvatarTransform {
  const wave = (value: number) => (1 - Math.cos(2 * Math.PI * value)) / 2;
  const blinkPhase = seconds % 4.6;
  const blink = blinkPhase < 0.18 ? wave(blinkPhase / 0.18) : 0;
  return {
    breath_chest: wave(seconds / 4.2),
    eye_blink_left: blink,
    eye_blink_right: blink,
    staff_tip_glow: 0.15 + 0.85 * wave(seconds / 3.4),
  };
}

export default function ZoeAvatarPanel() {
  const [transform, setTransform] = useState<AvatarTransform>(RESTING);
  const [connection, setConnection] = useState("Lokale Vorschau");

  useEffect(() => {
    let socket: WebSocket | null = null;
    let startedAt = performance.now();
    let live = false;
    const environment = (import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }).env;
    const socketUrl = environment?.VITE_Z1_AVATAR_WS_URL;

    if (socketUrl) {
      try {
        socket = new WebSocket(socketUrl);
        socket.onopen = () => {
          live = true;
          setConnection("Mit Z1-Avatar verbunden");
        };
        socket.onmessage = (event) => {
          try {
            const frame = JSON.parse(String(event.data)) as AvatarFrame;
            if (frame?.transform) {
              setTransform({
                breath_chest: frame.transform.breath_chest,
                eye_blink_left: frame.transform.eye_blink_left,
                eye_blink_right: frame.transform.eye_blink_right,
                staff_tip_glow: frame.transform.staff_tip_glow ?? 0,
              });
            }
          } catch {
            setConnection("Ungültiger Avatar-Frame");
          }
        };
        socket.onerror = () => setConnection("Z1-Verbindung nicht erreichbar");
        socket.onclose = () => {
          live = false;
          setConnection("Lokale Vorschau · Z1 getrennt");
        };
      } catch {
        setConnection("Lokale Vorschau · Z1 getrennt");
      }
    }

    const timer = window.setInterval(() => {
      if (!live) {
        setTransform(previewFrame((performance.now() - startedAt) / 1000));
      }
    }, 33);

    return () => {
      window.clearInterval(timer);
      socket?.close();
    };
  }, []);

  const breathY = (0.5 - transform.breath_chest) * 5;
  const blinkLeft = Math.max(0.04, 1 - transform.eye_blink_left);
  const blinkRight = Math.max(0.04, 1 - transform.eye_blink_right);
  const glow = Math.round(transform.staff_tip_glow * 24);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#deff9a]/25 bg-gradient-to-br from-[#0d1b18] via-zinc-950 to-black shadow-[0_0_35px_rgba(222,255,154,0.08)]">
      <style>{`
        .zoe-eye { transform-box: fill-box; transform-origin: center; transition: transform 70ms linear; }
        .zoe-gem { transition: filter 100ms linear; }
        @media (prefers-reduced-motion: reduce) {
          .zoe-eye, .zoe-gem { transition-duration: 250ms; }
        }
      `}</style>
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:gap-7 md:p-6">
        <div className="relative mx-auto w-full max-w-[250px] shrink-0">
          <div className="absolute inset-3 rounded-full bg-teal-300/10 blur-3xl" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] border border-teal-200/20 bg-[radial-gradient(ellipse_at_50%_40%,rgba(47,158,145,.23),rgba(5,14,16,.94)_67%)]">
            <div className="absolute inset-x-0 top-3 text-center font-mono text-[9px] uppercase tracking-[.28em] text-teal-100/65">Z1 · Avatar</div>
            <svg viewBox="0 0 260 320" className="h-full w-full" role="img" aria-label="Animierte holografische Gestalt mit atmender Brust, zwinkernden Augen und leuchtendem Stab">
              <defs>
                <radialGradient id="zoeFace" cx="50%" cy="36%">
                  <stop offset="0%" stopColor="#f2d6b4" />
                  <stop offset="100%" stopColor="#9d776d" />
                </radialGradient>
                <linearGradient id="zoeRobe" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#b8f5df" stopOpacity=".9" />
                  <stop offset="100%" stopColor="#287a70" stopOpacity=".25" />
                </linearGradient>
                <linearGradient id="zoeStaff" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#fff3b0" />
                  <stop offset="100%" stopColor="#b88334" />
                </linearGradient>
              </defs>
              <ellipse cx="130" cy="289" rx="78" ry="12" fill="#51e5ce" opacity=".12" />
              <g transform="translate(0 0)">
                <path d="M46 44 L55 8 Q76 22 88 47 M172 47 Q186 21 207 8 L215 47" fill="#55b9a8" fillOpacity=".4" stroke="#8ae8d2" strokeWidth="3" />
                <path d="M67 125 Q48 142 35 195 L24 277 Q128 302 236 277 L223 193 Q209 144 187 125 Q165 108 130 109 Q93 109 67 125Z" fill="url(#zoeRobe)" stroke="#8ae8d2" strokeOpacity=".55" strokeWidth="2" />
                <g transform="translate(0 ${breathY})">
                  <ellipse cx="130" cy="83" rx="55" ry="61" fill="url(#zoeFace)" stroke="#e9c89a" strokeWidth="2" />
                  <path d="M78 66 Q81 26 108 23 Q132 7 161 24 Q183 37 183 66 Q158 47 130 48 Q103 48 78 66Z" fill="#243f3d" stroke="#a8e6d4" strokeWidth="2" />
                  <path d="M91 97 Q101 91 112 97 M148 97 Q159 91 169 97" fill="none" stroke="#2a3935" strokeWidth="3" strokeLinecap="round" />
                  <g className="zoe-eye" style={{ transform: "scaleY(" + blinkLeft + ")" }}>
                    <ellipse cx="105" cy="83" rx="8" ry="5" fill="#8de1d2" />
                    <circle cx="105" cy="83" r="2.5" fill="#173a38" />
                  </g>
                  <g className="zoe-eye" style={{ transform: "scaleY(" + blinkRight + ")" }}>
                    <ellipse cx="155" cy="83" rx="8" ry="5" fill="#8de1d2" />
                    <circle cx="155" cy="83" r="2.5" fill="#173a38" />
                  </g>
                  <path d="M126 94 Q130 99 134 94" fill="none" stroke="#725149" strokeWidth="2" strokeLinecap="round" />
                  <path d="M113 116 Q130 125 147 116" fill="none" stroke="#f0c995" strokeWidth="2" />
                </g>
                <path d="M82 174 Q130 193 178 174 M102 198 Q130 211 158 198" fill="none" stroke="#f1d08c" strokeOpacity=".75" strokeWidth="2" />
              </g>
              <g>
                <path d="M39 283 L39 42" stroke="url(#zoeStaff)" strokeWidth="5" strokeLinecap="round" />
                <path d="M39 37 L47 52 L39 67 L31 52 Z" fill="#fff0a7" className="zoe-gem" style={{ filter: "drop-shadow(0 0 " + glow + "px rgba(255,205,92,.95))" }} />
                <circle cx="39" cy="52" r="4" fill="#fff9d5" opacity=".9" />
                <circle cx="39" cy="52" r="20" fill="#f7c96c" opacity={0.06 + transform.staff_tip_glow * 0.2} />
              </g>
            </svg>
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-teal-100/15 bg-black/50 px-3 py-1.5 text-[10px] text-teal-50/80">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-300" /> {connection}
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[#deff9a]">
            <span className="text-lg">✦</span>
            <h2 className="font-orbitron text-lg font-bold uppercase tracking-wider">Zoë · persönliche KI-Begleiterin</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#daffde]/75">
            Eine sichtbare Avatar-Oberfläche für Z1. Die Figur atmet, zwinkert und lässt den Edelstein an der Stabspitze pulsieren. Sobald die Avatar-WebSocket-Adresse konfiguriert ist, übernimmt sie die Bewegungswerte aus Z1.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-teal-100/10 bg-black/30 p-2">
              <div className="text-[9px] uppercase tracking-wider text-teal-100/50">Atmung</div>
              <div className="mt-1 text-xs font-semibold text-teal-100">Sanft</div>
            </div>
            <div className="rounded-lg border border-teal-100/10 bg-black/30 p-2">
              <div className="text-[9px] uppercase tracking-wider text-teal-100/50">Augen</div>
              <div className="mt-1 text-xs font-semibold text-teal-100">Zwinkern</div>
            </div>
            <div className="rounded-lg border border-teal-100/10 bg-black/30 p-2">
              <div className="text-[9px] uppercase tracking-wider text-teal-100/50">Stab</div>
              <div className="mt-1 text-xs font-semibold text-teal-100">Lichtpuls</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
