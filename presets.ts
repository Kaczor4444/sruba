import { BoltParams, HeadType, SocketType, TipType } from './types';

export interface BoltPreset {
  name: string;
  description: string;
  standard: string;
  params: BoltParams;
}

// Wymiary według norm ISO 4762 (Socket Head Cap Screw - Imbus)
// d = nominal diameter, headS = head diameter (key size), headH = head height
export const BOLT_PRESETS: Record<string, BoltPreset> = {
  'M3x10': {
    name: 'M3×10',
    description: 'Socket Head Cap Screw',
    standard: 'ISO 4762',
    params: {
      d: 3.0,
      pitch: 0.5,
      headS: 5.5,
      headH: 3.0,
      length: 10.0,
      threadDepth: 0.25,
      headType: HeadType.ROUND,
      socketType: SocketType.HEX,
      socketDepthPercent: 70,
      tipType: TipType.FLAT,
      tipLength: 0,
      quantity: 1,
      hasNut: false,
      nutHeight: 2.4,
      hasWasher: false,
      washerThickness: 0.5,
      washerOuterD: 7.0
    }
  },
  'M3x16': {
    name: 'M3×16',
    description: 'Socket Head Cap Screw',
    standard: 'ISO 4762',
    params: {
      d: 3.0,
      pitch: 0.5,
      headS: 5.5,
      headH: 3.0,
      length: 16.0,
      threadDepth: 0.25,
      headType: HeadType.ROUND,
      socketType: SocketType.HEX,
      socketDepthPercent: 70,
      tipType: TipType.FLAT,
      tipLength: 0,
      quantity: 1,
      hasNut: false,
      nutHeight: 2.4,
      hasWasher: false,
      washerThickness: 0.5,
      washerOuterD: 7.0
    }
  },
  'M4x20': {
    name: 'M4×20',
    description: 'Socket Head Cap Screw',
    standard: 'ISO 4762',
    params: {
      d: 4.0,
      pitch: 0.7,
      headS: 7.0,
      headH: 4.0,
      length: 20.0,
      threadDepth: 0.35,
      headType: HeadType.ROUND,
      socketType: SocketType.HEX,
      socketDepthPercent: 70,
      tipType: TipType.FLAT,
      tipLength: 0,
      quantity: 1,
      hasNut: false,
      nutHeight: 3.2,
      hasWasher: false,
      washerThickness: 0.8,
      washerOuterD: 9.0
    }
  },
  'M4x30': {
    name: 'M4×30',
    description: 'Socket Head Cap Screw',
    standard: 'ISO 4762',
    params: {
      d: 4.0,
      pitch: 0.7,
      headS: 7.0,
      headH: 4.0,
      length: 30.0,
      threadDepth: 0.35,
      headType: HeadType.ROUND,
      socketType: SocketType.HEX,
      socketDepthPercent: 70,
      tipType: TipType.FLAT,
      tipLength: 0,
      quantity: 1,
      hasNut: false,
      nutHeight: 3.2,
      hasWasher: false,
      washerThickness: 0.8,
      washerOuterD: 9.0
    }
  },
  'M5x25': {
    name: 'M5×25',
    description: 'Socket Head Cap Screw',
    standard: 'ISO 4762',
    params: {
      d: 5.0,
      pitch: 0.8,
      headS: 8.0,
      headH: 5.0,
      length: 25.0,
      threadDepth: 0.4,
      headType: HeadType.ROUND,
      socketType: SocketType.HEX,
      socketDepthPercent: 70,
      tipType: TipType.FLAT,
      tipLength: 0,
      quantity: 1,
      hasNut: false,
      nutHeight: 4.7,
      hasWasher: false,
      washerThickness: 1.0,
      washerOuterD: 10.0
    }
  },
  'M5x40': {
    name: 'M5×40',
    description: 'Socket Head Cap Screw',
    standard: 'ISO 4762',
    params: {
      d: 5.0,
      pitch: 0.8,
      headS: 8.0,
      headH: 5.0,
      length: 40.0,
      threadDepth: 0.4,
      headType: HeadType.ROUND,
      socketType: SocketType.HEX,
      socketDepthPercent: 70,
      tipType: TipType.FLAT,
      tipLength: 0,
      quantity: 1,
      hasNut: false,
      nutHeight: 4.7,
      hasWasher: false,
      washerThickness: 1.0,
      washerOuterD: 10.0
    }
  },
  'M6x30': {
    name: 'M6×30',
    description: 'Socket Head Cap Screw',
    standard: 'ISO 4762',
    params: {
      d: 6.0,
      pitch: 1.0,
      headS: 10.0,
      headH: 6.0,
      length: 30.0,
      threadDepth: 0.5,
      headType: HeadType.ROUND,
      socketType: SocketType.HEX,
      socketDepthPercent: 70,
      tipType: TipType.FLAT,
      tipLength: 0,
      quantity: 1,
      hasNut: false,
      nutHeight: 5.2,
      hasWasher: false,
      washerThickness: 1.6,
      washerOuterD: 12.0
    }
  },
  'M6x50': {
    name: 'M6×50',
    description: 'Socket Head Cap Screw',
    standard: 'ISO 4762',
    params: {
      d: 6.0,
      pitch: 1.0,
      headS: 10.0,
      headH: 6.0,
      length: 50.0,
      threadDepth: 0.5,
      headType: HeadType.ROUND,
      socketType: SocketType.HEX,
      socketDepthPercent: 70,
      tipType: TipType.FLAT,
      tipLength: 0,
      quantity: 1,
      hasNut: false,
      nutHeight: 5.2,
      hasWasher: false,
      washerThickness: 1.6,
      washerOuterD: 12.0
    }
  },
  'M8x40': {
    name: 'M8×40',
    description: 'Socket Head Cap Screw',
    standard: 'ISO 4762',
    params: {
      d: 8.0,
      pitch: 1.25,
      headS: 13.0,
      headH: 8.0,
      length: 40.0,
      threadDepth: 0.625,
      headType: HeadType.ROUND,
      socketType: SocketType.HEX,
      socketDepthPercent: 70,
      tipType: TipType.FLAT,
      tipLength: 0,
      quantity: 1,
      hasNut: false,
      nutHeight: 6.8,
      hasWasher: false,
      washerThickness: 1.6,
      washerOuterD: 16.0
    }
  },
  'M8x60': {
    name: 'M8×60',
    description: 'Socket Head Cap Screw',
    standard: 'ISO 4762',
    params: {
      d: 8.0,
      pitch: 1.25,
      headS: 13.0,
      headH: 8.0,
      length: 60.0,
      threadDepth: 0.625,
      headType: HeadType.ROUND,
      socketType: SocketType.HEX,
      socketDepthPercent: 70,
      tipType: TipType.FLAT,
      tipLength: 0,
      quantity: 1,
      hasNut: false,
      nutHeight: 6.8,
      hasWasher: false,
      washerThickness: 1.6,
      washerOuterD: 16.0
    }
  },
  'M10x50': {
    name: 'M10×50',
    description: 'Socket Head Cap Screw',
    standard: 'ISO 4762',
    params: {
      d: 10.0,
      pitch: 1.5,
      headS: 16.0,
      headH: 10.0,
      length: 50.0,
      threadDepth: 0.75,
      headType: HeadType.ROUND,
      socketType: SocketType.HEX,
      socketDepthPercent: 70,
      tipType: TipType.FLAT,
      tipLength: 0,
      quantity: 1,
      hasNut: false,
      nutHeight: 8.4,
      hasWasher: false,
      washerThickness: 2.0,
      washerOuterD: 20.0
    }
  }
};

// Grupowanie dla łatwiejszego wyboru
export const PRESET_GROUPS = {
  'M3': ['M3x10', 'M3x16'],
  'M4': ['M4x20', 'M4x30'],
  'M5': ['M5x25', 'M5x40'],
  'M6': ['M6x30', 'M6x50'],
  'M8': ['M8x40', 'M8x60'],
  'M10': ['M10x50']
};
