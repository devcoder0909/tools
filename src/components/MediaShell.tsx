import { useState, useEffect, useRef } from 'preact/hooks';

interface MediaShellProps {
  toolId: string;
  toolName: string;
}

export default function MediaShell({ toolId }: MediaShellProps) {
  // --- 1. Text to Speech State ---
  const [ttsText, setTtsText] = useState('Hello and welcome to Best Converter! All tools process your data privately inside your browser.');
  const [ttsVoices, setTtsVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [ttsRate, setTtsRate] = useState(1);
  const [ttsPitch, setTtsPitch] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        setTtsVoices(v);
        if (v.length > 0 && !selectedVoice) setSelectedVoice(v[0].name);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window) || !ttsText.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ttsText);
    utterance.rate = ttsRate;
    utterance.pitch = ttsPitch;
    const voiceObj = ttsVoices.find((v) => v.name === selectedVoice);
    if (voiceObj) utterance.voice = voiceObj;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopTts = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // --- 2. Screen Recorder State ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const startScreenRecord = async () => {
    try {
      setRecordedVideoUrl(null);
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Screen record error:', err);
      alert('Screen recording was cancelled or not supported by your browser.');
    }
  };

  const stopScreenRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // --- 3. Online Timer & Stopwatch State ---
  const [timerMode, setTimerMode] = useState<'timer' | 'stopwatch'>('timer');
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Stopwatch
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => setTimerSecondsLeft((prev) => prev - 1), 1000);
    } else if (timerSecondsLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      alert('Timer finished!');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSecondsLeft]);

  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => setStopwatchMs((prev) => prev + 10), 10);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatStopwatch = (totalMs: number) => {
    const mins = Math.floor(totalMs / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = Math.floor((totalMs % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  // --- 4. Typing Test State ---
  const testSample = 'The quick brown fox jumps over the lazy dog. Fast in-browser file converters protect your data by keeping processing 100% client side without server uploads.';
  const [typingInput, setTypingInput] = useState('');
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [typingEndTime, setTypingEndTime] = useState<number | null>(null);

  const typingStats = () => {
    if (!typingStartTime) return { wpm: 0, accuracy: 100 };
    const elapsedMinutes = ((typingEndTime || Date.now()) - typingStartTime) / 60000;
    const wordsTyped = typingInput.trim().split(/\s+/).filter(Boolean).length;
    const wpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0;

    let correctChars = 0;
    for (let i = 0; i < typingInput.length; i++) {
      if (typingInput[i] === testSample[i]) correctChars++;
    }
    const accuracy = typingInput.length > 0 ? Math.round((correctChars / typingInput.length) * 100) : 100;
    return { wpm, accuracy };
  };

  // --- 5. Image Resizer & Photo Editor State ---
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [targetWidth, setTargetWidth] = useState(800);
  const [targetHeight, setTargetHeight] = useState(600);
  const [aspectRatio, setAspectRatio] = useState(800 / 600);
  const [lockAspect, setLockAspect] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sepia, setSepia] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- 6. Meme Generator State ---
  const [topText, setTopText] = useState('ONE DOES NOT SIMPLY');
  const [bottomText, setBottomText] = useState('UPLOAD SENSITIVE FILES');
  const memeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [memeUrl, setMemeUrl] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    const img = new Image();
    img.onload = () => {
      setTargetWidth(img.naturalWidth);
      setTargetHeight(img.naturalHeight);
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    };
    img.src = url;
  };

  // Render Image Editor / Resizer
  useEffect(() => {
    if (!imageSrc || (toolId !== 'image-resizer' && toolId !== 'photo-editor')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const w = toolId === 'image-resizer' ? targetWidth : img.naturalWidth;
      const h = toolId === 'image-resizer' ? targetHeight : img.naturalHeight;
      canvas.width = w;
      canvas.height = h;

      ctx.save();
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) grayscale(${grayscale}%)`;
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();

      setProcessedUrl(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageSrc;
  }, [imageSrc, targetWidth, targetHeight, brightness, contrast, saturation, sepia, grayscale, toolId]);

  // Render Meme Generator
  useEffect(() => {
    if (toolId !== 'meme-generator') return;
    const canvas = memeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 600;
    const h = 450;
    canvas.width = w;
    canvas.height = h;

    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, h);
        drawMemeCaptions();
      };
      img.src = imageSrc;
    } else {
      ctx.fillStyle = '#222222';
      ctx.fillRect(0, 0, w, h);
      drawMemeCaptions();
    }

    function drawMemeCaptions() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.font = 'bold 36px Impact, Arial Black, sans-serif';
      ctx.textAlign = 'center';

      if (topText) {
        ctx.strokeText(topText.toUpperCase(), w / 2, 50);
        ctx.fillText(topText.toUpperCase(), w / 2, 50);
      }
      if (bottomText) {
        ctx.strokeText(bottomText.toUpperCase(), w / 2, h - 25);
        ctx.fillText(bottomText.toUpperCase(), w / 2, h - 25);
      }
      setMemeUrl(canvas.toDataURL('image/png'));
    }
  }, [toolId, imageSrc, topText, bottomText]);

  return (
    <div class="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-10">
      {/* 1. Text to Speech */}
      {toolId === 'text-to-speech' && (
        <div class="space-y-6 max-w-xl mx-auto">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Text to Speak</label>
            <textarea
              rows={4}
              value={ttsText}
              onInput={(e) => setTtsText((e.target as HTMLTextAreaElement).value)}
              placeholder="Type or paste any text to hear it spoken aloud..."
              class="w-full text-sm p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-2xs font-semibold text-gray-600 mb-1">Voice</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice((e.target as HTMLSelectElement).value)}
                class="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white"
              >
                {ttsVoices.map((v) => (
                  <option value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>
            <div>
              <label class="block text-2xs font-semibold text-gray-600 mb-1">Speed Rate ({ttsRate}x)</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={ttsRate}
                onInput={(e) => setTtsRate(Number((e.target as HTMLInputElement).value))}
                class="w-full accent-green-600"
              />
            </div>
            <div>
              <label class="block text-2xs font-semibold text-gray-600 mb-1">Pitch ({ttsPitch})</label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={ttsPitch}
                onInput={(e) => setTtsPitch(Number((e.target as HTMLInputElement).value))}
                class="w-full accent-green-600"
              />
            </div>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              onClick={handleSpeak}
              class="flex-1 py-3 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition cursor-pointer"
            >
              {isSpeaking ? 'Restarting Speech...' : 'Play Audio Voice'}
            </button>
            <button
              type="button"
              onClick={handleStopTts}
              class="px-5 py-3 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition cursor-pointer"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* 2. Screen Recorder */}
      {toolId === 'screen-recorder' && (
        <div class="space-y-6 max-w-xl mx-auto text-center">
          <div class="p-8 bg-gray-50 border border-gray-200 rounded-2xl">
            <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class={`w-4 h-4 rounded-full ${isRecording ? 'bg-red-600 animate-ping' : 'bg-red-600'}`} />
            </div>
            <h2 class="text-xl font-bold text-gray-900 mb-2">Browser Screen & Audio Recorder</h2>
            <p class="text-xs text-gray-500 max-w-md mx-auto mb-6">
              Record full desktop screen, specific app windows, or Chrome tabs with microphone audio. Processed 100% locally with zero server uploads.
            </p>

            {!isRecording ? (
              <button
                type="button"
                onClick={startScreenRecord}
                class="px-8 py-3 text-sm font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition shadow-xs cursor-pointer"
              >
                Start Recording Screen
              </button>
            ) : (
              <button
                type="button"
                onClick={stopScreenRecord}
                class="px-8 py-3 text-sm font-bold rounded-xl bg-gray-900 text-white hover:bg-black transition shadow-xs cursor-pointer"
              >
                Stop Recording & Save
              </button>
            )}
          </div>

          {recordedVideoUrl && (
            <div class="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
              <video src={recordedVideoUrl} controls class="w-full max-h-72 rounded-lg bg-black" />
              <a
                href={recordedVideoUrl}
                download={`screen-record-${Date.now()}.webm`}
                class="inline-block px-6 py-2.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition shadow-xs"
              >
                Download Recording (WebM)
              </a>
            </div>
          )}
        </div>
      )}

      {/* 3. Online Timer & Stopwatch */}
      {toolId === 'online-timer' && (
        <div class="space-y-6 max-w-md mx-auto text-center">
          <div class="flex justify-center gap-2 border-b border-gray-200 pb-3">
            <button
              type="button"
              onClick={() => setTimerMode('timer')}
              class={`px-4 py-1.5 text-xs font-semibold rounded-lg ${timerMode === 'timer' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Countdown Timer
            </button>
            <button
              type="button"
              onClick={() => setTimerMode('stopwatch')}
              class={`px-4 py-1.5 text-xs font-semibold rounded-lg ${timerMode === 'stopwatch' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Stopwatch
            </button>
          </div>

          {timerMode === 'timer' ? (
            <div class="space-y-6">
              <div class="text-6xl font-extrabold font-mono text-gray-900 tracking-tight">
                {formatTimer(timerSecondsLeft)}
              </div>

              {/* Presets */}
              <div class="flex justify-center gap-2">
                {[1, 5, 10, 15, 25].map((m) => (
                  <button
                    type="button"
                    onClick={() => {
                      setTimerMinutes(m);
                      setTimerSecondsLeft(m * 60);
                      setIsTimerRunning(false);
                    }}
                    class={`px-3 py-1 text-xs font-semibold rounded-lg border ${timerMinutes === m ? 'border-green-600 text-green-700 bg-green-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {m}m
                  </button>
                ))}
              </div>

              <div class="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  class="px-6 py-2.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
                >
                  {isTimerRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSecondsLeft(timerMinutes * 60);
                  }}
                  class="px-4 py-2.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <div class="space-y-6">
              <div class="text-6xl font-extrabold font-mono text-gray-900 tracking-tight">
                {formatStopwatch(stopwatchMs)}
              </div>

              <div class="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                  class="px-6 py-2.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
                >
                  {isStopwatchRunning ? 'Stop' : 'Start'}
                </button>
                <button
                  type="button"
                  disabled={!isStopwatchRunning}
                  onClick={() => setLaps((prev) => [...prev, stopwatchMs])}
                  class="px-4 py-2.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Lap
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsStopwatchRunning(false);
                    setStopwatchMs(0);
                    setLaps([]);
                  }}
                  class="px-4 py-2.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>

              {laps.length > 0 && (
                <div class="max-h-40 overflow-y-auto divide-y divide-gray-200 border border-gray-200 rounded-lg text-xs">
                  {laps.map((lap, idx) => (
                    <div class="flex justify-between p-2 font-mono">
                      <span>Lap {idx + 1}</span>
                      <span>{formatStopwatch(lap)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Typing Test */}
      {toolId === 'typing-test' && (
        <div class="space-y-6 max-w-xl mx-auto">
          <div class="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-mono text-gray-700 leading-relaxed select-none">
            {testSample}
          </div>

          <textarea
            rows={4}
            value={typingInput}
            onInput={(e) => {
              if (!typingStartTime) setTypingStartTime(Date.now());
              const val = (e.target as HTMLTextAreaElement).value;
              setTypingInput(val);
              if (val.length >= testSample.length) setTypingEndTime(Date.now());
            }}
            placeholder="Start typing the text above to begin test..."
            class="w-full text-sm font-mono p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />

          <div class="grid grid-cols-2 gap-4 text-center">
            <div class="p-4 bg-green-50 border border-green-200 rounded-xl">
              <span class="text-xs uppercase font-semibold text-gray-500">Speed (WPM)</span>
              <p class="text-3xl font-extrabold text-green-700">{typingStats().wpm}</p>
            </div>
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <span class="text-xs uppercase font-semibold text-gray-500">Accuracy</span>
              <p class="text-3xl font-extrabold text-blue-700">{typingStats().accuracy}%</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setTypingInput('');
              setTypingStartTime(null);
              setTypingEndTime(null);
            }}
            class="w-full py-2 text-xs font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Reset Typing Test
          </button>
        </div>
      )}

      {/* 5. Image Resizer & Photo Editor */}
      {(toolId === 'image-resizer' || toolId === 'photo-editor') && (
        <div class="space-y-6">
          {!imageSrc ? (
            <label class="border-2 border-dashed border-gray-300 hover:border-green-500 rounded-xl p-8 block text-center bg-gray-50 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.currentTarget.files?.[0]) handleImageUpload(e.currentTarget.files[0]);
                }}
                class="hidden"
              />
              <p class="text-sm font-bold text-gray-900 mb-1">Click to select an image</p>
              <p class="text-xs text-gray-500">JPG, PNG, or WebP. 100% in-browser processing.</p>
            </label>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div class="space-y-4">
                {toolId === 'image-resizer' && (
                  <div class="space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-2xs font-semibold text-gray-600 mb-1">Target Width (px)</label>
                        <input
                          type="number"
                          value={targetWidth}
                          onInput={(e) => {
                            const w = Number((e.target as HTMLInputElement).value);
                            setTargetWidth(w);
                            if (lockAspect && aspectRatio) setTargetHeight(Math.round(w / aspectRatio));
                          }}
                          class="w-full text-xs p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label class="block text-2xs font-semibold text-gray-600 mb-1">Target Height (px)</label>
                        <input
                          type="number"
                          value={targetHeight}
                          onInput={(e) => {
                            const h = Number((e.target as HTMLInputElement).value);
                            setTargetHeight(h);
                            if (lockAspect && aspectRatio) setTargetWidth(Math.round(h * aspectRatio));
                          }}
                          class="w-full text-xs p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <label class="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={lockAspect}
                        onChange={(e) => setLockAspect((e.target as HTMLInputElement).checked)}
                        class="rounded text-green-600 focus:ring-green-500"
                      />
                      <span>Lock aspect ratio</span>
                    </label>
                  </div>
                )}

                {toolId === 'photo-editor' && (
                  <div class="space-y-3">
                    <div>
                      <div class="flex justify-between text-2xs font-semibold text-gray-600 mb-1">
                        <span>Brightness</span>
                        <span>{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={brightness}
                        onInput={(e) => setBrightness(Number((e.target as HTMLInputElement).value))}
                        class="w-full accent-green-600"
                      />
                    </div>
                    <div>
                      <div class="flex justify-between text-2xs font-semibold text-gray-600 mb-1">
                        <span>Contrast</span>
                        <span>{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={contrast}
                        onInput={(e) => setContrast(Number((e.target as HTMLInputElement).value))}
                        class="w-full accent-green-600"
                      />
                    </div>
                    <div>
                      <div class="flex justify-between text-2xs font-semibold text-gray-600 mb-1">
                        <span>Saturation</span>
                        <span>{saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={saturation}
                        onInput={(e) => setSaturation(Number((e.target as HTMLInputElement).value))}
                        class="w-full accent-green-600"
                      />
                    </div>
                    <div>
                      <div class="flex justify-between text-2xs font-semibold text-gray-600 mb-1">
                        <span>Sepia</span>
                        <span>{sepia}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sepia}
                        onInput={(e) => setSepia(Number((e.target as HTMLInputElement).value))}
                        class="w-full accent-green-600"
                      />
                    </div>
                    <div>
                      <div class="flex justify-between text-2xs font-semibold text-gray-600 mb-1">
                        <span>Grayscale</span>
                        <span>{grayscale}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={grayscale}
                        onInput={(e) => setGrayscale(Number((e.target as HTMLInputElement).value))}
                        class="w-full accent-green-600"
                      />
                    </div>
                  </div>
                )}

                <div class="flex gap-2">
                  <a
                    href={processedUrl || ''}
                    download={`edited-image.jpg`}
                    class="flex-1 py-2 text-center text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
                  >
                    Download Image
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setImageSrc(null);
                      setProcessedUrl(null);
                    }}
                    class="px-4 py-2 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div class="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                <canvas ref={canvasRef} class="max-w-full max-h-72 rounded-lg shadow-xs bg-white" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Meme Generator */}
      {toolId === 'meme-generator' && (
        <div class="space-y-6 max-w-xl mx-auto">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Top Caption</label>
              <input
                type="text"
                value={topText}
                onInput={(e) => setTopText((e.target as HTMLInputElement).value)}
                placeholder="TOP CAPTION"
                class="w-full text-xs p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Bottom Caption</label>
              <input
                type="text"
                value={bottomText}
                onInput={(e) => setBottomText((e.target as HTMLInputElement).value)}
                placeholder="BOTTOM CAPTION"
                class="w-full text-xs p-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div class="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200">
            <canvas ref={memeCanvasRef} class="max-w-full rounded-lg shadow-xs mb-4" />
            <a
              href={memeUrl || ''}
              download="custom-meme.png"
              class="px-6 py-2.5 text-xs font-bold rounded-xl bg-green-600 text-white hover:bg-green-700 transition"
            >
              Download Meme PNG
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
