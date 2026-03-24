import { useState, useEffect, useRef, useCallback } from 'react';

const useVoiceRecognition = (onFinalResult, onInterimResult) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Check for browser support
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const supported = Boolean(SpeechRecognition);

  useEffect(() => {
    if (!supported) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript && onInterimResult) {
        onInterimResult(interimTranscript);
      }
      if (finalTranscript && onFinalResult) {
        onFinalResult(finalTranscript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.warn('SpeechRecognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [supported]); // eslint-disable-line react-hooks/exhaustive-deps

  const startListening = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // Already started — ignore
    }
  }, [supported]);

  const stopListening = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, [supported]);

  return { isListening, supported, startListening, stopListening };
};

export default useVoiceRecognition;
