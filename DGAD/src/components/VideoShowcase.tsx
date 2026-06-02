import { PlayCircle } from "lucide-react";
import { videos } from "@/data/site";
import { Reveal } from "./Reveal";

export function VideoShowcase() {
  return (
    <section className="section-shell" id="videos" aria-labelledby="videos-title">
      <Reveal className="section-heading">
        <p className="section-kicker">Vídeos do projeto</p>
        <h2 id="videos-title">A comunicação atual entra no novo site sem carregar o design antigo.</h2>
        <p>
          Os vídeos originais foram preservados e reposicionados em um fluxo de atenção mais limpo, com controles reais
          e carregamento cuidadoso para mobile.
        </p>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-2">
        {videos.map((video, index) => (
          <Reveal key={video.id} delay={index * 0.05}>
            <article className="video-card">
              <div className="video-frame">
                <video
                  aria-label={video.title}
                  controls
                  controlsList="nodownload"
                  playsInline
                  preload="metadata"
                  poster={video.poster}
                  src={video.src}
                />
              </div>
              <div className="flex items-start gap-3">
                <PlayCircle aria-hidden="true" className="mt-1 text-primary" />
                <div>
                  <h3>{video.title}</h3>
                  <p>{video.description}</p>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
