import React from 'react';
import { motion } from 'motion/react';
import { MoodLevel } from '../types';
import { getMoodConfig } from '../data/moodConfigs';

interface MoodAvatarProps {
  mood: MoodLevel;
  isSelected?: boolean;
  size?: number;
}

// Tailored micro-animations per emoji expression
const MOOD_EMOJI_ANIMATIONS: Record<
  MoodLevel,
  {
    selected: {
      scale?: number[];
      y?: number[];
      rotate?: number[];
      transition?: object;
    };
  }
> = {
  happy: {
    selected: {
      scale: [1, 1.15, 1],
      rotate: [0, 6, -6, 0],
      transition: { duration: 1.2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' },
    },
  },
  romantic: {
    selected: {
      scale: [1, 1.22, 1],
      transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  relax: {
    selected: {
      y: [0, -3, 0],
      scale: [1, 1.08, 1],
      transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  neutral: {
    selected: {
      scale: [1, 1.08, 1],
      transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  sleepy: {
    selected: {
      y: [0, 2, 0],
      rotate: [0, -4, 0],
      transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  tired: {
    selected: {
      y: [0, 3, 0],
      scale: [1, 0.96, 1],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  sad: {
    selected: {
      y: [0, 2, 0],
      transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  angry: {
    selected: {
      rotate: [-3, 3, -3],
      scale: [1, 1.12, 1],
      transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  sick: {
    selected: {
      rotate: [-2, 2, -2],
      transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
    },
  },
};

export const MoodAvatar: React.FC<MoodAvatarProps> = ({
  mood,
  isSelected = false,
  size = 64,
}) => {
  const config = getMoodConfig(mood);
  const anim = MOOD_EMOJI_ANIMATIONS[mood]?.selected || {
    scale: [1, 1.1, 1],
    transition: { duration: 1.2, repeat: Infinity },
  };

  // Font size dynamically calculated from container dimensions
  const fontSize = Math.round(size * 0.72);

  return (
    <motion.div
      animate={isSelected ? anim : { scale: 1, y: 0, rotate: 0 }}
      className="relative flex items-center justify-center select-none leading-none pointer-events-none"
      style={{
        width: size,
        height: size,
      }}
      aria-hidden="true"
    >
      <span
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1,
          filter: isSelected ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))',
        }}
      >
        {config.emoji}
      </span>
    </motion.div>
  );
};
