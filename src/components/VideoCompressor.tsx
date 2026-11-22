import { useEffect, useRef, useState } from 'preact/hooks';

export default function VideoCompressor() {
  const [hydrated, setHydrated] = useState(false);
  const [file, setFile] = useState<File>();
  const [target, setTarget] = useState('8');
  const [message,setMessage] = useState('');
  const [result,setResult] = useState<{url:string;size:number;ext:string}>();
  const [busy,setBusy] = useState(false);
  const stop = useRef<(() => void) | undefined>(undefined);
  useEffect(() => { setHydrated(true); }, []);
  useEffect(()=>()=>stop.current?.(),[]);
  useEffect(()=>()=>{if(result)URL.revokeObjectURL(result.url);},[result]);
  async function run() {
    if (!file || busy || !(Number(target)>0)) return;
    setBusy(true);setResult(undefined);setMessage('Preparing video…');
    const v=document.createElement('video');v.playsInline=true;v.muted=true;
    const src=URL.createObjectURL(file);
    let ac:AudioContext|undefined, stream:MediaStream|undefined, timer:number|undefined, recorder:MediaRecorder|undefined;
    let cancelled=false;
    try {
      if (typeof MediaRecorder==='undefined') throw Error('Recording is unavailable in this browser.');
      ac=new AudioContext(); await ac.resume();
      await new Promise<void>((resolve,reject)=>{v.onloadedmetadata=()=>resolve();v.onerror=()=>reject(Error('This video format cannot be played.'));v.src=src;});
      if (!Number.isFinite(v.duration)||v.duration<=0) throw Error('A video with a known duration is required.');
      const type=['video/webm;codecs=vp8,opus','video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t));if(!type)throw Error('No supported output video format.');
      const canvas=document.createElement('canvas');const scale=Math.min(1,1280/Math.max(v.videoWidth,v.videoHeight));
      canvas.width=Math.max(2,2*Math.round(v.videoWidth*scale/2));canvas.height=Math.max(2,2*Math.round(v.videoHeight*scale/2));
      const ctx=canvas.getContext('2d')!;stream=canvas.captureStream(24);
      const audio=ac.createMediaStreamDestination();ac.createMediaElementSource(v).connect(audio);v.muted=false;
      audio.stream.getTracks().forEach(t=>stream!.addTrack(t));
      const bitrate=Math.min(5000000,Math.max(64000,Math.floor(Number(target)*8000000*0.92/v.duration)-64000));
      recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:bitrate,audioBitsPerSecond:64000});
      const chunks:Blob[]=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      const finished=new Promise<void>((resolve,reject)=>{recorder!.onstop=()=>resolve();recorder!.onerror=()=>reject(Error('Video recording failed.'));});
      stop.current=()=>{cancelled=true;v.pause();if(recorder?.state==='recording')recorder.stop();};
      v.onended=()=>{if(recorder?.state==='recording')recorder.stop();};
      v.onerror=()=>stop.current?.();
      await v.play();ctx.drawImage(v,0,0,canvas.width,canvas.height);recorder.start();
      timer=window.setInterval(()=>{ctx.drawImage(v,0,0,canvas.width,canvas.height);setMessage('Encoding '+Math.floor(v.currentTime/v.duration*100)+'%');},1000/24);
      await finished;
      if(cancelled){setMessage('Encoding stopped.');return;}
      const blob=new Blob(chunks,{type});if(!blob.size)throw Error('No video was recorded.');
      setResult({url:URL.createObjectURL(blob),size:blob.size,ext:type.includes('mp4')?'mp4':'webm'});setMessage(blob.size>=file.size?'Output is larger. Keep the original for the smaller copy.':'Encoding complete. Preview the result before saving.');
    } catch(e){setMessage(e instanceof Error?e.message:'Encoding failed.');}
    finally {stop.current=undefined;clearInterval(timer);v.pause();v.removeAttribute('src');v.load();stream?.getTracks().forEach(t=>t.stop());await ac?.close();URL.revokeObjectURL(src);setBusy(false);}
  }
  return <section data-hydrated={hydrated ? 'true' : undefined} class="my-6 space-y-4 rounded-2xl border bg-white p-6">
    <label class="block">Video file<input class="block" disabled={busy} type="file" accept="video/*" onChange={e=>{setFile(e.currentTarget.files?.[0]);setResult(undefined);setMessage('');}}/></label>
    <label class="block">Target size in MB <input class="w-24 rounded border p-2" type="number" min="0.01" step="any" disabled={busy} value={target} onInput={e=>{setTarget(e.currentTarget.value);setResult(undefined);setMessage('');}}/></label>
    <button class="rounded bg-emerald-700 px-4 py-2 text-white" disabled={!file||busy||!(Number(target)>0)} onClick={run}>Compress video</button>
    {busy&&<button class="ml-3 underline" onClick={()=>stop.current?.()}>Stop encoding</button>}
    <p role="status">{message}</p>{file&&<p>Original: {file.size.toLocaleString()} bytes</p>}
    {result&&<div class="space-y-3"><p>Output: {result.size.toLocaleString()} bytes</p><video controls src={result.url} class="max-h-64 max-w-full"/><a class="underline text-emerald-800" href={result.url} download={'compressed.'+result.ext}>Download compressed video</a></div>}
  </section>;
}
