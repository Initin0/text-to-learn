import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi.js';

export default function VideoBlock({ query }) {
  const api = useApi();
  const [state, setState] = useState({ loading: true, videos: [], fallbackUrl: null });
  const [active, setActive] = useState(0);

  useEffect(() => {
    let alive = true;
    setState({ loading: true, videos: [], fallbackUrl: null });
    api
      .searchYouTube(query)
      .then((r) => alive && setState({ loading: false, videos: r.videos || [], fallbackUrl: r.fallbackUrl }))
      .catch(() => alive && setState({ loading: false, videos: [], fallbackUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` }));
    return () => {
      alive = false;
    };
  }, [api, query]);

  const video = state.videos[active];

  return (
    <section className="my-8" aria-label="Video">
      <p className="mb-2 text-sm font-semibold text-muted">Watch: {query}</p>
      {state.loading ? (
        <div className="aspect-video w-full animate-pulse rounded-lg bg-line" />
      ) : video ? (
        <>
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-line bg-black">
            <iframe
              key={video.id}
              src={`${video.embedUrl}?rel=0`}
              title={video.title}
              className="h-full w-full"
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          {state.videos.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {state.videos.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setActive(i)}
                  className={`w-44 shrink-0 rounded-md border p-1 text-left text-xs ${i === active ? 'border-pen' : 'border-line hover:border-pen/50'}`}
                  aria-pressed={i === active}
                >
                  {v.thumbnail && <img src={v.thumbnail} alt="" className="aspect-video w-full rounded object-cover" />}
                  <span className="mt-1 line-clamp-2 block">{v.title}</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <a href={state.fallbackUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-dashed border-line px-4 py-4 hover:border-pen">
          <span className="grid h-10 w-14 place-items-center rounded-md bg-[#e62117] text-white" aria-hidden="true">
            ▶
          </span>
          <span>
            <span className="block font-semibold text-pen">Search YouTube for this lesson</span>
            <span className="text-sm text-muted">Opens in a new tab</span>
          </span>
        </a>
      )}
    </section>
  );
}
