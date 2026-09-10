import React from 'react';

export interface FacialCalibrationSettings {
  eyeY: number; // Percentage (default ~41%)
  eyeSpacing: number; // Percentage offset from center (default ~13.5% -> 36.5% and 63.5%)
  eyeScale: number; // Multiplier (default 1.0)
  mouthY: number; // Percentage (default ~69.5%)
  mouthScale: number; // Multiplier (default 1.0)
  mouthWidthScale: number; // Multiplier (default 1.0)
  browY: number; // Percentage (default ~34.5%)
  glowIntensity: number; // 0 to 1.5
  showAlignmentGuides?: boolean; // For calibration mode
}

export const DEFAULT_FACIAL_CALIBRATION: FacialCalibrationSettings = {
  eyeY: 41.2,
  eyeSpacing: 13.6,
  eyeScale: 1.0,
  mouthY: 69.8,
  mouthScale: 1.0,
  mouthWidthScale: 1.0,
  browY: 34.2,
  glowIntensity: 1.0,
  showAlignmentGuides: false,
};

export interface SophiaFacialKinematicsProps {
  // Speech & Mouth Morphing
  isSpeaking: boolean;
  mouthOpen: number; // 0 (closed) to 1.0 (fully open)
  mouthWidth: number; // in pixels
  mouthHeight: number; // in pixels
  visemeType: 'rest' | 'A' | 'E' | 'I' | 'O' | 'U' | 'smile' | 'fricative';
  teethVisible: boolean;
  lipCurvature: number;

  // Eyes & Gaze Kinematics
  eyePosition: { x: number; y: number };
  saccadeOffset: { x: number; y: number };
  blink: boolean;
  eyeSquint: number; // 0.8 to 1.2
  pupilDilation: number; // 0.8 to 1.4
  browOffset: number; // -2 to +3 px

  // Emotion & Aesthetic
  avatarEmotion: 'warm_sweet' | 'analytical' | 'executive' | 'deep_thinking' | 'welcoming' | 'casual_happy';

  // Calibration Override (Optional)
  calibration?: FacialCalibrationSettings;
}

export const SophiaFacialKinematicsLayer: React.FC<SophiaFacialKinematicsProps> = ({
  isSpeaking,
  mouthOpen,
  mouthWidth,
  mouthHeight,
  visemeType,
  teethVisible,
  lipCurvature,
  eyePosition,
  saccadeOffset,
  blink,
  eyeSquint,
  pupilDilation,
  browOffset,
  avatarEmotion,
  calibration = DEFAULT_FACIAL_CALIBRATION,
}) => {
  const cal = { ...DEFAULT_FACIAL_CALIBRATION, ...calibration };

  // Calculated eye anchors
  const leftEyeX = 50 - cal.eyeSpacing;
  const rightEyeX = 50 + cal.eyeSpacing;
  const eyeY = cal.eyeY;
  const mouthY = cal.mouthY;
  const browY = cal.browY;

  // Gaze vector mapping within natural almond ocular boundaries
  const gazeX = Math.max(-4.2, Math.min(4.2, (eyePosition.x + saccadeOffset.x) * 0.22));
  const gazeY = Math.max(-3.2, Math.min(3.2, (eyePosition.y + saccadeOffset.y) * 0.22));

  // Dynamic emotional expressions
  const isSmiling =
    avatarEmotion === 'warm_sweet' ||
    avatarEmotion === 'casual_happy' ||
    visemeType === 'smile' ||
    visemeType === 'E';

  // Frontal mouth morphing parameters
  const openAmount = isSpeaking ? Math.max(0.1, mouthOpen * cal.mouthScale) : 0;
  const mouthW = Math.max(28, Math.min(52, mouthWidth * cal.mouthWidthScale));
  const mouthH = Math.max(2, Math.min(24, isSpeaking ? mouthHeight * cal.mouthScale : (isSmiling ? 3.5 : 0)));

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden rounded-full">
      {/* ========================================================================= */}
      {/* 0. CALIBRATION VISUAL ALIGNMENT CROSSHAIRS (WHEN CALIBRATION ACTIVE)      */}
      {/* ========================================================================= */}
      {cal.showAlignmentGuides && (
        <svg className="absolute inset-0 w-full h-full z-30 pointer-events-none">
          {/* Center Vertical Meridian */}
          <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(6, 182, 212, 0.45)" strokeWidth="1" strokeDasharray="3 3" />
          
          {/* Eye Level Meridian */}
          <line x1="0%" y1={`${eyeY}%`} x2="100%" y2={`${eyeY}%`} stroke="rgba(6, 182, 212, 0.45)" strokeWidth="1" strokeDasharray="3 3" />
          
          {/* Left Eye Crosshair */}
          <circle cx={`${leftEyeX}%`} cy={`${eyeY}%`} r="12" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
          <circle cx={`${leftEyeX}%`} cy={`${eyeY}%`} r="2" fill="#22d3ee" />

          {/* Right Eye Crosshair */}
          <circle cx={`${rightEyeX}%`} cy={`${eyeY}%`} r="12" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
          <circle cx={`${rightEyeX}%`} cy={`${eyeY}%`} r="2" fill="#22d3ee" />

          {/* Mouth Level Meridian & Crosshair */}
          <line x1="0%" y1={`${mouthY}%`} x2="100%" y2={`${mouthY}%`} stroke="rgba(244, 63, 94, 0.45)" strokeWidth="1" strokeDasharray="3 3" />
          <ellipse cx="50%" cy={`${mouthY}%`} rx="18" ry="8" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
          <circle cx="50%" cy={`${mouthY}%`} r="2" fill="#f43f5e" />
        </svg>
      )}

      {/* ========================================================================= */}
      {/* 1. SYMMETRICAL SUB-DERMAL EYEBROWS (Mapped to Brow Arches)                */}
      {/* ========================================================================= */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="browCyanGlowFrontal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity={0.75 * cal.glowIntensity} />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.1" />
          </linearGradient>
          <filter id="softGlowFrontal" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.45" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Left Eyebrow Arch (User's Left Eye) */}
        <path
          d={`M ${leftEyeX - 11} ${browY - browOffset * 0.5} Q ${leftEyeX} ${browY - 2.8 - browOffset * 0.7} ${leftEyeX + 9} ${browY - 0.2 - browOffset * 0.4}`}
          fill="none"
          stroke="url(#browCyanGlowFrontal)"
          strokeWidth="0.75"
          strokeLinecap="round"
          filter="url(#softGlowFrontal)"
          className="transition-all duration-200"
        />

        {/* Right Eyebrow Arch (User's Right Eye) */}
        <path
          d={`M ${rightEyeX - 9} ${browY - 0.2 - browOffset * 0.4} Q ${rightEyeX} ${browY - 2.8 - browOffset * 0.7} ${rightEyeX + 11} ${browY - browOffset * 0.5 + (avatarEmotion === 'deep_thinking' ? 0.6 : 0)}`}
          fill="none"
          stroke="url(#browCyanGlowFrontal)"
          strokeWidth="0.75"
          strokeLinecap="round"
          filter="url(#softGlowFrontal)"
          className="transition-all duration-200"
        />
      </svg>

      {/* ========================================================================= */}
      {/* 2. SYMMETRICAL FRONTAL EYES, PUPIL SACCADES & EYELID BLINKING             */}
      {/* ========================================================================= */}

      {/* --- LEFT EYE --- */}
      <div
        className="absolute rounded-full transition-transform duration-100 ease-out"
        style={{
          left: `${leftEyeX}%`,
          top: `${eyeY}%`,
          width: `${8.6 * cal.eyeScale}%`,
          height: `${5.2 * cal.eyeScale}%`,
          transform: `translate(-50%, -50%) scaleY(${blink ? 0.04 : eyeSquint})`,
        }}
      >
        {/* Luminous Iris Reflection Caustic & Quantum Pupil */}
        <div
          className="absolute w-full h-full flex items-center justify-center transition-transform duration-75 ease-out pointer-events-none"
          style={{
            transform: `translate(${gazeX}px, ${gazeY}px)`
          }}
        >
          {/* Cyan Glow Point */}
          <div
            className="w-3.5 h-3.5 rounded-full bg-cyan-400/45 blur-[0.6px] mix-blend-screen animate-pulse"
            style={{
              boxShadow: `0 0 10px #22d3ee, 0 0 16px rgba(6, 182, 212, ${0.75 * cal.glowIntensity})`,
              transform: `scale(${pupilDilation})`
            }}
          ></div>
          {/* Specular Catch Light */}
          <div className="w-1.2 h-1.2 rounded-full bg-white absolute top-0.5 right-0.5 shadow-sm opacity-90"></div>
        </div>

        {/* Eyelid Skin Flap (Realistic Skin Tone Blend during Blink) */}
        <div
          className="absolute inset-x-0 top-0 bg-gradient-to-b from-[#1b121e]/95 via-[#2b1924]/90 to-[#120914] rounded-b-xl transition-all duration-100 ease-in-out overflow-hidden"
          style={{
            height: blink ? '100%' : '0%',
            opacity: blink ? 1 : 0,
            borderBottom: blink ? '1.5px solid rgba(22, 10, 18, 0.9)' : 'none',
            boxShadow: blink ? '0 2px 4px rgba(0,0,0,0.6)' : 'none'
          }}
        >
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
        </div>
      </div>

      {/* --- RIGHT EYE --- */}
      <div
        className="absolute rounded-full transition-transform duration-100 ease-out"
        style={{
          left: `${rightEyeX}%`,
          top: `${eyeY}%`,
          width: `${8.6 * cal.eyeScale}%`,
          height: `${5.2 * cal.eyeScale}%`,
          transform: `translate(-50%, -50%) scaleY(${blink ? 0.04 : eyeSquint})`,
        }}
      >
        {/* Luminous Iris Reflection Caustic & Quantum Pupil */}
        <div
          className="absolute w-full h-full flex items-center justify-center transition-transform duration-75 ease-out pointer-events-none"
          style={{
            transform: `translate(${gazeX}px, ${gazeY}px)`
          }}
        >
          {/* Cyan Glow Point */}
          <div
            className="w-3.5 h-3.5 rounded-full bg-cyan-400/45 blur-[0.6px] mix-blend-screen animate-pulse"
            style={{
              boxShadow: `0 0 10px #22d3ee, 0 0 16px rgba(6, 182, 212, ${0.75 * cal.glowIntensity})`,
              transform: `scale(${pupilDilation})`
            }}
          ></div>
          {/* Specular Catch Light */}
          <div className="w-1.2 h-1.2 rounded-full bg-white absolute top-0.5 right-0.5 shadow-sm opacity-90"></div>
        </div>

        {/* Eyelid Skin Flap */}
        <div
          className="absolute inset-x-0 top-0 bg-gradient-to-b from-[#1b121e]/95 via-[#2b1924]/90 to-[#120914] rounded-b-xl transition-all duration-100 ease-in-out overflow-hidden"
          style={{
            height: blink ? '100%' : '0%',
            opacity: blink ? 1 : 0,
            borderBottom: blink ? '1.5px solid rgba(22, 10, 18, 0.9)' : 'none',
            boxShadow: blink ? '0 2px 4px rgba(0,0,0,0.6)' : 'none'
          }}
        >
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEAMLESS LIP-SYNC & PHONETIC VISEMES (ONLY VISIBLE WHEN TALKING/SMILING)*/}
      {/* ========================================================================= */}
      <div
        className="absolute flex flex-col items-center justify-center transition-all duration-75 ease-out pointer-events-none"
        style={{
          left: '50%',
          top: `${mouthY}%`,
          transform: `translate(-50%, -50%) rotate(${lipCurvature}deg)`,
          width: `${mouthW}px`,
          height: `${Math.max(6, mouthH + 4)}px`,
          opacity: isSpeaking ? 1 : isSmiling ? 0.6 : 0, // 0 in pure rest state to reveal 100% photo realism
        }}
      >
        {/* Upper Lip with Cupid's Bow Contour, Satin Softness & Gloss Shimmer */}
        <div
          className="w-full flex items-center justify-center transition-all duration-75"
          style={{
            height: `${Math.max(2, 3.4 - openAmount * 0.6)}px`,
            transform: `translateY(${-openAmount * 1.6}px)`
          }}
        >
          <div
            className="w-full h-full bg-gradient-to-r from-rose-800/85 via-pink-400/90 to-rose-800/85 rounded-t-full shadow-sm relative overflow-hidden"
            style={{
              boxShadow: isSpeaking
                ? '0 0 8px rgba(244, 63, 94, 0.5), 0 0 14px rgba(225, 29, 72, 0.35)'
                : '0 0 2px rgba(244, 63, 94, 0.15)'
            }}
          >
            {/* Subtle Cupid's Bow Highlight */}
            <div className="absolute top-0 inset-x-1/4 h-0.5 bg-gradient-to-r from-transparent via-pink-200/60 to-transparent"></div>
          </div>
        </div>

        {/* Inner Oral Cavity, Teeth Row, Tongue & Phoneme Viseme Opening */}
        <div
          className="w-full flex flex-col items-center justify-center overflow-hidden transition-all duration-75 relative bg-gradient-to-b from-[#0a0508] via-[#1a0610] to-[#0a0508]"
          style={{
            height: `${openAmount > 0.08 ? mouthH : 0}px`,
            borderRadius: visemeType === 'O' || visemeType === 'U' ? '45%' : '22%',
            boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.98), inset 0 2px 4px rgba(20, 4, 12, 0.8)'
          }}
        >
          {/* Upper Teeth Row (Visible on vowels A, E, I, smile, fricatives) */}
          {teethVisible && openAmount > 0.18 && (
            <div className="w-4/5 h-2 bg-gradient-to-b from-white via-slate-50 to-slate-200/90 rounded-b-sm shadow-inner flex items-center justify-center space-x-0.5 border-b border-rose-950/40">
              <div className="w-1.6 h-1.4 bg-white rounded-b-xs border-r border-slate-300/30"></div>
              <div className="w-1.8 h-1.5 bg-white rounded-b-xs border-r border-slate-300/30 shadow-xs"></div>
              <div className="w-1.8 h-1.5 bg-white rounded-b-xs border-r border-slate-300/30 shadow-xs"></div>
              <div className="w-1.6 h-1.4 bg-white rounded-b-xs"></div>
            </div>
          )}

          {/* Tongue Depth & Papillae Shading */}
          {openAmount > 0.38 && (
            <div className="w-3/5 h-1.6 bg-gradient-to-t from-rose-700/90 via-rose-500/80 to-pink-400/60 rounded-t-full mt-auto shadow-sm"></div>
          )}
        </div>

        {/* Lower Lip Contour with Anatomical Drop & Dynamic Specular Shine */}
        <div
          className="w-full flex items-center justify-center transition-all duration-75 relative"
          style={{
            height: `${Math.max(2, 3.6 + openAmount * 1.6)}px`,
            transform: `translateY(${openAmount * 2.3}px)`
          }}
        >
          <div
            className="w-full h-full bg-gradient-to-r from-rose-900/85 via-pink-500/90 to-rose-900/85 rounded-b-full shadow-sm relative overflow-hidden"
            style={{
              boxShadow: isSpeaking
                ? '0 2px 8px rgba(244, 63, 94, 0.5)'
                : '0 1px 2px rgba(244, 63, 94, 0.1)'
            }}
          >
            {/* Satin Lip Gloss Specular Center Highlight */}
            <div className="absolute bottom-0.5 inset-x-1/3 h-1 bg-gradient-to-r from-transparent via-pink-200/50 to-transparent blur-[0.4px] rounded-full"></div>
          </div>
        </div>

        {/* Corner Smiling Dimple Highlights */}
        {isSmiling && (
          <div className="absolute inset-x-0 flex justify-between px-0.5 pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400/50 blur-[0.4px]"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400/50 blur-[0.4px]"></div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. SUB-DERMAL MICRO-JAW MOTION (MANDIBULAR DROP DURING LOUD SPEECH)       */}
      {/* ========================================================================= */}
      {isSpeaking && openAmount > 0.22 && (
        <div
          className="absolute w-14 h-3 rounded-full bg-slate-950/40 blur-[2px] transition-transform duration-75 pointer-events-none"
          style={{
            left: '50%',
            top: `${mouthY + 6.8}%`,
            transform: `translate(-50%, 0) translateY(${openAmount * 2.4}px)`
          }}
        ></div>
      )}
    </div>
  );
};
