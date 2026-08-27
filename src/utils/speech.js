import { speak } from '../ai/voice/voiceEngine.js';

export function speakText(text, lang = 'ms-MY') {
  return speak(text, { language: lang });
}

export function beep(type='good'){try{const c=new (window.AudioContext||window.webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value=type==='good'?720:type==='mid'?440:220; g.gain.value=.08; o.start(); setTimeout(()=>{o.stop(); c.close()},180)}catch(e){}}
