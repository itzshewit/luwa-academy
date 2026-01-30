
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GlassCard } from './GlassCard';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { ICONS } from '../constants';
import { decodeAudioData, decodeBase64, encodeBase64 } from '../services/audioService';

export const LuwaLive: React.FC = () => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('Standby');
  const [volume, setVolume] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Cleanup effect to stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.then((s: any) => {
          try { s.close(); } catch (e) {}
        });
      }
      audioContextRef.current?.close().catch(() => {});
      outputContextRef.current?.close().catch(() => {});
      sourcesRef.current.forEach(s => {
        try { s.stop(); } catch(e) {}
      });
    };
  }, []);

  const stopLive = useCallback(() => {
    setActive(false);
    setStatus('Terminated');
    if (sessionRef.current) {
        sessionRef.current.then((s: any) => s.close());
    }
    audioContextRef.current?.close();
    outputContextRef.current?.close();
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
  }, []);

  const startLive = async () => {
    try {
      setActive(true);
      setStatus('Initializing Neural Link...');

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('Link Established');
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Visualization Scaling
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.min(100, Math.sqrt(sum / inputData.length) * 300));

              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              const pcmBlob = {
                data: encodeBase64(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000'
              };

              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(processor);
            processor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioBase64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioBase64 && outputContextRef.current) {
              setStatus('Co-pilot Speaking...');
              const bytes = decodeBase64(audioBase64);
              const buffer = await decodeAudioData(bytes, outputContextRef.current, 24000, 1);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
              const source = outputContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputContextRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0 && active) setStatus('Listening...');
              };
              sourcesRef.current.add(source);
            }

            if (msg.serverContent?.interrupted) {
              setStatus('User Interrupt Detected');
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => { 
            console.error(e); 
            setStatus('Link Failed'); 
            stopLive(); 
          },
          onclose: () => { 
            setStatus('Session Closed'); 
            stopLive(); 
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are the Luwa Live Assistant, a real-time vocal co-pilot for high-level Ethiopian scholars. Use scholarly academic tone. Handle barge-ins gracefully.'
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setStatus('Hardware Access Denied');
      setActive(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 animate-fade-in">
      <h2 className="text-2xl font-black flex items-center gap-2 uppercase tracking-tighter">
        <ICONS.Mic className="luwa-gold" />
        Luwa Live (Native Audio)
      </h2>
      
      <GlassCard className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-black/40 border-white/5">
        {/* Synapse Ripple Background */}
        {active && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
             <div className="absolute w-[300px] h-[300px] bg-luwa-gold rounded-full animate-ping opacity-10" />
             <div className="absolute w-[200px] h-[200px] bg-luwa-gold rounded-full animate-pulse opacity-20" />
          </div>
        )}
        
        {/* Dynamic Waveform Visualizer */}
        <div className="flex items-end justify-center gap-1.5 mb-16 h-32 relative z-10">
          {[...Array(16)].map((_, i) => (
            <div 
              key={i} 
              className="w-2.5 bg-luwa-gold rounded-full transition-all duration-75"
              style={{ 
                height: active ? `${10 + (Math.sin(Date.now()/100 + i) * 10) + (volume * Math.random() * 0.8)}%` : '6px',
                opacity: active ? 0.4 + (i/16)*0.6 : 0.05
              }}
            />
          ))}
        </div>

        <div className="text-center relative z-10">
          <h3 className="text-2xl font-black mb-2 uppercase tracking-[0.3em] text-white">{status}</h3>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-12 max-w-xs mx-auto leading-relaxed">
            Bi-directional neural dialogue.<br/>Zero-latency cognitive synchronization.
          </p>
        </div>

        <button 
          onClick={active ? stopLive : startLive}
          className={`group relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl z-20 ${active ? 'bg-red-500 text-white hover:bg-red-600 scale-95' : 'bg-luwa-gold text-black hover:scale-110 shadow-luwa-gold/30'}`}
        >
          {active ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          ) : (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-black/10 animate-spin group-hover:duration-75" />
              <ICONS.Mic className="w-12 h-12" />
            </>
          )}
        </button>

        {active && (
           <div className="mt-12 flex gap-4 animate-fade-in relative z-10">
              <div className="px-4 py-2 bg-luwa-gold/10 rounded-full border border-luwa-gold/20 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-luwa-gold rounded-full animate-pulse" />
                 <span className="text-[9px] font-black text-luwa-gold uppercase tracking-widest">Omnimodal Sync</span>
              </div>
           </div>
        )}
      </GlassCard>
    </div>
  );
};
