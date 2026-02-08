
export enum HeadType {
  HEX = 'HEX',
  HEX_SOCKET = 'HEX_SOCKET',
  TORX = 'TORX',
  ROUND_SLOT = 'ROUND_SLOT',
  ROUND_PHILLIPS = 'ROUND_PHILLIPS',
  SQUARE = 'SQUARE'
}

export enum TipType {
  FLAT = 'FLAT',
  POINTED = 'POINTED',
  DOG_POINT = 'DOG_POINT'
}

export interface BoltParams {
  d: number;           // nominal diameter
  pitch: number;       // thread pitch
  headS: number;       // head size (width)
  headH: number;       // head height
  length: number;      // shaft length
  threadDepth: number; // thread depth
  headType: HeadType;
  tipType: TipType;
  tipLength: number;   // only used if tipType is POINTED or DOG_POINT
  // Production params
  quantity: number;    
  hasNut: boolean;     
  nutHeight: number;   
  hasWasher: boolean;  
  washerThickness: number;
  washerOuterD: number;
}
