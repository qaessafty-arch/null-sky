import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { Chess } from 'chess.js';

interface VoiceMoveDictatorProps {
  game: Chess;
  onVoiceMove: (from: string, to: string) => void;
  disabled?: boolean;
}

export const VoiceMoveDictator: React.FC<VoiceMoveDictatorProps> = ({ game, onVoiceMove, disabled }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Web Speech API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript.toLowerCase().trim();
      setTranscript(speechToText);
      parseAndExecuteMove(speechToText);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setErrorMsg(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [game]);

  const toggleListen = () => {
    if (disabled) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setErrorMsg('');
      setTranscript('Listening...');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const parseAndExecuteMove = (text: string) => {
    // Basic parser for "knight to f3", "e4", "pawn to e4", "rook to a1"
    try {
      let cleanText = text.replace(/ to /g, '').replace(/ /g, '');
      
      // Try passing the exact SAN first
      const moves = game.moves({ verbose: true });
      let matchedMove = null;
      
      // Heuristic parsing
      for (const move of moves) {
        if (cleanText.includes(move.to)) {
          // If a piece is mentioned (e.g. knightf3 -> nf3)
          if (cleanText.includes('knight') && move.piece === 'n') matchedMove = move;
          else if (cleanText.includes('rook') && move.piece === 'r') matchedMove = move;
          else if (cleanText.includes('bishop') && move.piece === 'b') matchedMove = move;
          else if (cleanText.includes('queen') && move.piece === 'q') matchedMove = move;
          else if (cleanText.includes('king') && move.piece === 'k') matchedMove = move;
          else if (cleanText.includes('pawn') && move.piece === 'p') matchedMove = move;
          else if (cleanText.length <= 3 && move.piece === 'p') matchedMove = move; // just "e4"
        }
      }
      
      if (matchedMove) {
        setTranscript(`Played: ${matchedMove.san}`);
        onVoiceMove(matchedMove.from, matchedMove.to);
      } else {
        setErrorMsg(`Could not parse move: ${text}`);
      }
    } catch (e) {
      setErrorMsg('Invalid voice move.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <button
        onClick={toggleListen}
        disabled={disabled}
        className={`px-4 py-2 w-full rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border ${
          isListening 
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
            : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        <span>{isListening ? 'Listening...' : 'Voice Move'}</span>
      </button>
      
      {transcript && !errorMsg && (
        <span className="text-xs text-emerald-400 font-mono text-center">"{transcript}"</span>
      )}
      {errorMsg && (
        <div className="text-xs text-rose-400 flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
