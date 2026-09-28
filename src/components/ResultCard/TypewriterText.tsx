import React, { useEffect, useState } from 'react';
import { Text, type TextStyle, type StyleProp } from 'react-native';

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  speed?: number;
  startDelay?: number;
  onDone?: () => void;
};

export function TypewriterText({
  text,
  style,
  speed = 24,
  startDelay = 0,
  onDone,
}: Props) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    setShown('');
    let idx = 0;
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        idx += 1;
        setShown(text.slice(0, idx));
        if (idx >= text.length) {
          if (interval) clearInterval(interval);
          onDone?.();
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, speed, startDelay, onDone]);

  return <Text style={style}>{shown}</Text>;
}
