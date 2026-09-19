import React from 'react';
import { motion } from 'motion/react';
import { MoodLevel } from '../types';

interface MoodAvatarProps {
  mood: MoodLevel;
  isSelected?: boolean;
  size?: number;
}

export const MoodAvatar: React.FC<MoodAvatarProps> = ({ mood, isSelected = false, size = 64 }) => {
  if (mood === 'happy') {
    return (
      <motion.div
        animate={isSelected ? { scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] } : {}}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0, repeatDelay: 2 }}
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Face - Sunny Gold */}
          <circle cx="50" cy="50" r="44" fill="#FEF9C3" stroke="#EAB308" strokeWidth="4" />
          
          {/* Radiant Sun Glow / Cheeks */}
          <circle cx="28" cy="58" r="8" fill="#FDE047" opacity="0.85" />
          <circle cx="72" cy="58" r="8" fill="#FDE047" opacity="0.85" />

          {/* Happy Arched Eyes */}
          <path
            d="M28 42 C32 34, 40 34, 44 42"
            stroke="#854D0E"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M56 42 C60 34, 68 34, 72 42"
            stroke="#854D0E"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Big Warm Smile */}
          <path
            d="M32 54 C36 74, 64 74, 68 54"
            fill="#A16207"
            stroke="#854D0E"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Tongue/Highlight in smile */}
          <path
            d="M42 66 C46 72, 54 72, 58 66"
            fill="#EAB308"
          />
        </svg>
      </motion.div>
    );
  }

  if (mood === 'neutral') {
    return (
      <motion.div
        animate={isSelected ? { y: [0, -3, 0] } : {}}
        transition={{ duration: 2, repeat: isSelected ? Infinity : 0, ease: 'easeInOut' }}
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Face - Soft Gray */}
          <circle cx="50" cy="50" r="44" fill="#F1F5F9" stroke="#64748B" strokeWidth="4" />
          
          {/* Soft Centered Cheeks */}
          <circle cx="26" cy="58" r="7" fill="#E2E8F0" opacity="0.9" />
          <circle cx="74" cy="58" r="7" fill="#E2E8F0" opacity="0.9" />

          {/* Calm Relaxed Eyes */}
          <circle cx="36" cy="44" r="5" fill="#334155" />
          <circle cx="64" cy="44" r="5" fill="#334155" />
          <circle cx="38" cy="42" r="1.5" fill="#FFFFFF" />
          <circle cx="66" cy="42" r="1.5" fill="#FFFFFF" />

          {/* Steady Calm Mouth */}
          <path
            d="M36 60 L64 60"
            stroke="#475569"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    );
  }

  if (mood === 'angry') {
    return (
      <motion.div
        animate={isSelected ? { x: [-2, 2, -2, 2, 0], rotate: [-1, 1, -1, 1, 0] } : {}}
        transition={{ duration: 0.6, repeat: isSelected ? Infinity : 0, repeatDelay: 1.5 }}
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Face - Soft Crimson */}
          <circle cx="50" cy="50" r="44" fill="#FFE4E6" stroke="#E11D48" strokeWidth="4" />
          
          {/* Flushed Hot Cheeks */}
          <circle cx="25" cy="58" r="8" fill="#FECDD3" opacity="0.95" />
          <circle cx="75" cy="58" r="8" fill="#FECDD3" opacity="0.95" />

          {/* Sharp Angled Eyebrows */}
          <path
            d="M26 36 L44 42"
            stroke="#881337"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M74 36 L56 42"
            stroke="#881337"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Intense Focused Eyes */}
          <circle cx="36" cy="46" r="4.5" fill="#881337" />
          <circle cx="64" cy="46" r="4.5" fill="#881337" />
          <circle cx="37" cy="45" r="1.5" fill="#FFFFFF" />
          <circle cx="63" cy="45" r="1.5" fill="#FFFFFF" />

          {/* Gritted / Tense Mouth */}
          <path
            d="M34 64 C38 58, 62 58, 66 64"
            stroke="#9F1239"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Little steam mark at top right */}
          <path
            d="M74 22 C78 20, 80 14, 84 14"
            stroke="#E11D48"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    );
  }

  if (mood === 'tired') {
    return (
      <motion.div
        animate={isSelected ? { y: [0, 3, 0], rotate: [0, -2, 0] } : {}}
        transition={{ duration: 2.2, repeat: isSelected ? Infinity : 0, ease: 'easeInOut' }}
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Face - Deep Lavender */}
          <circle cx="50" cy="50" r="44" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="4" />
          
          {/* Soft Drowsy Cheeks */}
          <circle cx="26" cy="60" r="7" fill="#EDE9FE" opacity="0.9" />
          <circle cx="74" cy="60" r="7" fill="#EDE9FE" opacity="0.9" />

          {/* Sleepy / Half-Closed Eyelids & Lashes */}
          <path
            d="M28 44 C34 48, 42 48, 44 44"
            stroke="#4C1D95"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M56 44 C58 48, 66 48, 72 44"
            stroke="#4C1D95"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Eye bags / tired under-eye curve */}
          <path
            d="M29 50 C35 53, 41 53, 43 50"
            stroke="#C4B5FD"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M57 50 C63 53, 69 53, 71 50"
            stroke="#C4B5FD"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Yawning / Drowsy Mouth */}
          <ellipse cx="50" cy="62" rx="6" ry="7" fill="#5B21B6" />

          {/* Sleepy 'z' symbol */}
          <path
            d="M74 24 L82 24 L74 32 L82 32"
            stroke="#7C3AED"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    );
  }

  if (mood === 'relax') {
    return (
      <motion.div
        animate={isSelected ? { y: [0, -4, 0], scale: [1, 1.04, 1] } : {}}
        transition={{ duration: 2.4, repeat: isSelected ? Infinity : 0, ease: 'easeInOut' }}
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Face - Sage Green */}
          <circle cx="50" cy="50" r="44" fill="#ECFDF5" stroke="#059669" strokeWidth="4" />
          
          {/* Gentle Tranquil Blush */}
          <circle cx="27" cy="56" r="7" fill="#D1FAE5" opacity="0.9" />
          <circle cx="73" cy="56" r="7" fill="#D1FAE5" opacity="0.9" />

          {/* Serene Blissful Closed Eyes (^ ^) */}
          <path
            d="M28 44 C32 38, 40 38, 44 44"
            stroke="#064E3B"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M56 44 C60 38, 68 38, 72 44"
            stroke="#064E3B"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Peaceful Gentle Smile */}
          <path
            d="M36 58 C42 66, 58 66, 64 58"
            stroke="#065F46"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Floating leaf / breeze accent */}
          <path
            d="M74 24 C76 22, 80 22, 82 24"
            stroke="#059669"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M70 18 C72 16, 76 16, 78 18"
            stroke="#059669"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    );
  }

  // Default / Sad mood - Muted Blue
  return (
    <motion.div
      animate={isSelected ? { rotate: [0, -2, 2, 0] } : {}}
      transition={{ duration: 2, repeat: isSelected ? Infinity : 0, ease: 'easeInOut' }}
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base Face - Muted Blue */}
        <circle cx="50" cy="50" r="44" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="4" />
        
        {/* Soft Tender Blush */}
        <circle cx="26" cy="60" r="7" fill="#DBEAFE" opacity="0.9" />
        <circle cx="74" cy="60" r="7" fill="#DBEAFE" opacity="0.9" />

        {/* Pensive Downward Brow (Sloping gently like 😔) */}
        <path
          d="M26 36 C32 40, 40 40, 44 42"
          stroke="#1E3A8A"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M74 36 C68 40, 60 40, 56 42"
          stroke="#1E3A8A"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Closed Pensive Downcast Eyes (similar to 😔) */}
        <path
          d="M28 47 C33 52, 41 51, 44 46"
          stroke="#1E3A8A"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M72 47 C67 52, 59 51, 56 46"
          stroke="#1E3A8A"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Comforting Gentle Downward Mouth */}
        <path
          d="M36 66 C42 60, 58 60, 64 66"
          stroke="#1D4ED8"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Soft teardrop on cheek */}
        <path
          d="M74 54 C74 54, 78 59, 78 62 C78 64, 76 66, 74 66 C72 66, 70 64, 70 62 C70 59, 74 54, 74 54 Z"
          fill="#60A5FA"
          opacity="0.9"
        />
      </svg>
    </motion.div>
  );
};
