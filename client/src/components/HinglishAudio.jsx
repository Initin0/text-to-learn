import { useEffect, useRef, useState } from 'react';
import { useApi } from '../hooks/useApi.js';

// Hinglish explanation: Gemini writes the script and Gemini TTS voices it.
// If server TTS is unavailable (501/502), the browser's own speech engine reads the script.
export default function HinglishAudio({ lessonId }) {
  const api = useApi();
  const [status, setStatus] = useState('idle'); // idle | script | audio | ready | browser | error
  const [script, setScript] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [showScript, setShowScript] = useState(false);
  const urlRef = useRef(null);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      window.speechSynthesis?.cancel();
    },
    []
  );

  // reset when moving to another lesson
  useEffect(() => {
    setStatus('idle');
    setScript('');
    setAudioUrl(null);
    setError(null);
    setShowScript(false);
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, [lessonId]);

  const start = async () => {
    setError(null);
    try {
      setStatus('script');
      const { text } = await api.getHinglish(lessonId);
      setScript(text);
      setStatus('audio');
      try {
        const blob = await api.getAudio(lessonId);
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setAudioUrl(url);
        setStatus('ready');
      } catch (err) {
        if ([501, 502, 503].includes(err.status) && 'speechSynthesis' in window) {
          setStatus('browser');
          setShowScript(true);
        } else throw err;
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  const speak = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(script);
    const voices = synth.getVoices();
    u.voice = voices.find((v) => v.lang === 'hi-IN') || voices.find((v) => v.lang === 'en-IN') || null;
    u.lang = u.voice?.lang || 'hi-IN';
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.speak(u);
    setSpeaking(true);
  };

  if (status === 'idle' || status === 'error')
    return (
      <div>
        <button onClick={start} className="inline-flex items-center gap-2 rounded-lg border border-line bg-sheet px-3 py-2 text-sm font-semibold hover:bg-pen-soft">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
          </svg>
          Listen in Hinglish
        </button>
        {error && <p className="mt-1 text-xs text-bad">{error}</p>}
      </div>
    );

  if (status === 'script' || status === 'audio')
    return (
      <p className="inline-flex items-center gap-2 rounded-lg border border-line bg-sheet px-3 py-2 text-sm text-muted" role="status">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-pen/25 border-t-pen" aria-hidden="true" />
        {status === 'script' ? 'Writing the Hinglish explanation…' : 'Recording the voice…'}
      </p>
    );

  return (
    <div className="w-full rounded-lg border border-line bg-sheet p-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-semibold">Hinglish explanation</p>
        {status === 'ready' && (
          <>
            <audio controls src={audioUrl} className="h-10 max-w-full flex-1" autoPlay />
            <a href={audioUrl} download={`lesson-hinglish.wav`} className="text-sm font-semibold text-pen hover:underline">
              Download .wav
            </a>
          </>
        )}
        {status === 'browser' && (
          <button onClick={speak} className="rounded-md bg-pen px-3 py-1.5 text-sm font-semibold text-on-pen hover:bg-pen-strong">
            {speaking ? 'Stop' : 'Play with browser voice'}
          </button>
        )}
        <button onClick={() => setShowScript((s) => !s)} className="ml-auto text-sm text-muted hover:text-ink" aria-expanded={showScript}>
          {showScript ? 'Hide transcript' : 'Show transcript'}
        </button>
      </div>
      {status === 'browser' && <p className="mt-2 text-xs text-muted">Server voice is not configured, so your browser is reading the script.</p>}
      {showScript && <p className="mt-3 whitespace-pre-line leading-relaxed">{script}</p>}
    </div>
  );
}
