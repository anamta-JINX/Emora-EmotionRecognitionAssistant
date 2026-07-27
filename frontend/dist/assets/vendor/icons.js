
import React from 'react';
const paths = {
  ArrowRight: ['M5 12h14','m13 6 6 6-6 6'], ArrowUpRight: ['M7 17 17 7','M7 7h10v10'], ArrowDown: ['M12 5v14','m6-6-6 6-6-6'],
  Check: ['m5 12 4 4L19 6'], CheckCircle2: ['M22 11.1V12a10 10 0 1 1-5.9-9.1','m9 11 3 3L22 4'], X: ['M6 6l12 12','M18 6 6 18'], Menu: ['M4 7h16','M4 12h16','M4 17h16'],
  ChevronDown: ['m6 9 6 6 6-6'], AlertCircle: ['M12 8v4','M12 16h.01','M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0'], CircleDot: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0','M12 12h.01'],
  Camera: ['M14.5 4 16 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z','M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],
  CameraOff: ['m2 2 20 20','M10.7 6H8l-1.5 3H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12','M14.9 14.9A4 4 0 0 1 9.1 9.1','M14 6h3l1.5 3H20a2 2 0 0 1 2 2v5.5'],
  Mail: ['M4 4h16v16H4z','m4 7 8 6 8-6'], Github: ['M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.2-3.4-1.2-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 1.6.7 2 .1.1-.7.4-1.1.7-1.4-2.2-.3-4.5-1.1-4.5-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.5 9.5 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.7.7 1 1.6 1 2.7 0 3.8-2.3 4.6-4.5 4.9.4.3.7 1 .7 2v3c0 .3.2.6.7.5A10 10 0 0 0 12 2'],
  Heart: ['M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8'],
  Eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12','M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],
  UserRound: ['M18 20a6 6 0 0 0-12 0','M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
  Trash2: ['M3 6h18','M8 6V4h8v2','M19 6l-1 14H6L5 6','M10 11v5','M14 11v5'],
  RefreshCw: ['M20 6v6h-6','M4 18v-6h6','M18.5 9a7 7 0 0 0-12-2.5L4 12','M5.5 15a7 7 0 0 0 12 2.5L20 12'],
  Wifi: ['M5 12.5a10 10 0 0 1 14 0','M8.5 16a5 5 0 0 1 7 0','M12 20h.01'], WifiOff: ['m2 2 20 20','M8.5 16a5 5 0 0 1 3.5-1.5','M5 12.5a10 10 0 0 1 6-2.5','M12 20h.01'],
  UploadCloud: ['M16 16l-4-4-4 4','M12 12v9','M20.4 17.5A5 5 0 0 0 18 8.2 7 7 0 0 0 4.3 10.5 4.5 4.5 0 0 0 5 19h2'],
  Save: ['M5 4h12l2 2v14H5z','M8 4v6h8V4','M8 20v-6h8v6'],
  Moon: ['M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8'],
  Type: ['M4 6V4h16v2','M9 20h6','M12 4v16'],
  Sparkles: ['m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2z','m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z','m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8z'],
  LockKeyhole: ['M6 10V7a6 6 0 0 1 12 0v3','M5 10h14v11H5z','M12 14v3'],
  ScanFace: ['M3 7V4h3','M18 4h3v3','M21 17v3h-3','M6 20H3v-3','M9 10h.01','M15 10h.01','M9.5 15a4 4 0 0 0 5 0'],
  Image: ['M3 5h18v14H3z','m3 16 5-5 4 4 3-3 6 6','M15 9h.01'], ImageUp: ['M3 5h18v14H3z','m3 16 5-5 4 4 3-3 6 6','M15 9h.01','M12 13V7','m9 10 3-3 3 3'], FileImage: ['M6 2h9l5 5v15H6z','M14 2v6h6','m8 18 3-3 2 2 2-2 3 3','M10 12h.01'], ImagePlus: ['M3 5h18v14H3z','m3 16 5-5 4 4 3-3 6 6','M15 9h.01','M12 8v4','M10 10h4'],
  Lightbulb: ['M9 18h6','M10 22h4','M8.5 14.5A6 6 0 1 1 15.5 14.5C14.5 15.5 14 16 14 18h-4c0-2-.5-2.5-1.5-3.5'],
  Database: ['M4 6c0-2 16-2 16 0s-16 2-16 0','M4 6v6c0 2 16 2 16 0V6','M4 12v6c0 2 16 2 16 0v-6'],
  Target: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20','M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12','M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4'],
  ShieldCheck: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10','m9 12 2 2 4-4'],
  BrainCircuit: ['M9.5 4.5A3 3 0 0 0 5 7v1a3 3 0 0 0 0 6v1a3 3 0 0 0 4.5 2.5','M14.5 4.5A3 3 0 0 1 19 7v1a3 3 0 0 1 0 6v1a3 3 0 0 1-4.5 2.5','M9 9h6','M9 15h6','M12 6v12'],
  Code2: ['m9 18-6-6 6-6','m15 6 6 6-6 6'],
  Layers3: ['m12 2 9 5-9 5-9-5z','m3 12 9 5 9-5','m3 17 9 5 9-5'],
  Send: ['m22 2-7 20-4-9-9-4z','M22 2 11 13'],
  Bug: ['M8 2l1.5 2','M16 2l-1.5 2','M7 8h10v8a5 5 0 0 1-10 0z','M3 13h4','M17 13h4','M5 7l2 2','M19 7l-2 2'],
  Accessibility: ['M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4','M5 8h14','M12 8v5','m8 22 4-9 4 9','M7 13h10'],
  CircleGauge: ['M21 12a9 9 0 1 1-18 0','M12 12l4-4','M7 16h.01','M17 16h.01'],
  MonitorSmartphone: ['M3 4h14v12H3z','M7 20h6','M19 8h3v12h-6v-2'],
  SlidersHorizontal: ['M4 6h16','M4 12h16','M4 18h16','M8 4v4','M16 10v4','M10 16v4'],
  RotateCcw: ['M3 12a9 9 0 1 0 3-6.7L3 8','M3 3v5h5'],
  HelpCircle: ['M9.5 9a3 3 0 1 1 4.8 2.4c-1.3 1-2.3 1.5-2.3 3.1','M12 18h.01','M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0'],
  HeartHandshake: ['M12 20 4.5 13A5 5 0 0 1 11 5l1 1 1-1a5 5 0 0 1 6.5 8z','M8 12l2 2 4-4'],
  MessageCircleHeart: ['M21 12a9 9 0 0 1-13 8l-5 1 1-5a9 9 0 1 1 17-4','M12 15s-4-2.4-4-5a2.2 2.2 0 0 1 4-1.2A2.2 2.2 0 0 1 16 10c0 2.6-4 5-4 5'],
  MessageSquareHeart: ['M4 4h16v13H8l-4 4z','M12 14s-3-1.8-3-3.8a1.8 1.8 0 0 1 3-1.2 1.8 1.8 0 0 1 3 1.2C15 12.2 12 14 12 14'],
  WandSparkles: ['m15 4 5 5L8 21l-5-5z','m14 8-2-2','m19 2 .5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5z']
};
function fallback(name) { return ['M5 5h14v14H5z','M8 12h8','M12 8v8']; }
function makeIcon(name) {
  function Icon({ size = 24, strokeWidth = 2, className = '', ...props }) {
    const entries = paths[name] || fallback(name);
    return React.createElement('svg', { ...props, className, width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': props['aria-label'] ? undefined : 'true' }, entries.map((d, i) => React.createElement('path', { d, key: i })));
  }
  Icon.displayName = name;
  return Icon;
}
export const Accessibility = makeIcon('Accessibility');
export const AlertCircle = makeIcon('AlertCircle');
export const ArrowDown = makeIcon('ArrowDown');
export const ArrowRight = makeIcon('ArrowRight');
export const ArrowUpRight = makeIcon('ArrowUpRight');
export const BrainCircuit = makeIcon('BrainCircuit');
export const Bug = makeIcon('Bug');
export const Camera = makeIcon('Camera');
export const CameraOff = makeIcon('CameraOff');
export const Check = makeIcon('Check');
export const CheckCircle2 = makeIcon('CheckCircle2');
export const ChevronDown = makeIcon('ChevronDown');
export const CircleDot = makeIcon('CircleDot');
export const CircleGauge = makeIcon('CircleGauge');
export const Code2 = makeIcon('Code2');
export const Database = makeIcon('Database');
export const Eye = makeIcon('Eye');
export const FileImage = makeIcon('FileImage');
export const Github = makeIcon('Github');
export const Heart = makeIcon('Heart');
export const HeartHandshake = makeIcon('HeartHandshake');
export const HelpCircle = makeIcon('HelpCircle');
export const Image = makeIcon('Image');
export const ImagePlus = makeIcon('ImagePlus');
export const ImageUp = makeIcon('ImageUp');
export const Layers3 = makeIcon('Layers3');
export const Lightbulb = makeIcon('Lightbulb');
export const LoaderCircle = makeIcon('LoaderCircle');
export const LockKeyhole = makeIcon('LockKeyhole');
export const Mail = makeIcon('Mail');
export const Menu = makeIcon('Menu');
export const MessageCircleHeart = makeIcon('MessageCircleHeart');
export const MessageSquareHeart = makeIcon('MessageSquareHeart');
export const MonitorSmartphone = makeIcon('MonitorSmartphone');
export const Moon = makeIcon('Moon');
export const RefreshCw = makeIcon('RefreshCw');
export const RotateCcw = makeIcon('RotateCcw');
export const Save = makeIcon('Save');
export const ScanFace = makeIcon('ScanFace');
export const Send = makeIcon('Send');
export const ShieldCheck = makeIcon('ShieldCheck');
export const SlidersHorizontal = makeIcon('SlidersHorizontal');
export const Sparkles = makeIcon('Sparkles');
export const Target = makeIcon('Target');
export const Trash2 = makeIcon('Trash2');
export const Type = makeIcon('Type');
export const UploadCloud = makeIcon('UploadCloud');
export const UserRound = makeIcon('UserRound');
export const WandSparkles = makeIcon('WandSparkles');
export const Wifi = makeIcon('Wifi');
export const WifiOff = makeIcon('WifiOff');
export const X = makeIcon('X');
