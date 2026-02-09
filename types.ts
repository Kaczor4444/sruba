
export enum HeadType {
  HEX = 'HEX',              // Zewnętrzny sześciokąt
  SQUARE = 'SQUARE',        // Zewnętrzny kwadrat
  ROUND = 'ROUND',          // Okrągły cylindryczny
  BUTTON_HEAD = 'BUTTON_HEAD',      // ISO 7380 - grzybkowy z niskim profilem
  COUNTERSUNK = 'COUNTERSUNK'       // DIN 963/965 - zatopiony stożkowy
}

export enum SocketType {
  NONE = 'NONE',            // Bez zagłębienia
  HEX = 'HEX',              // Hex socket (imbus)
  TORX = 'TORX',            // Torx (gwiazdka)
  PHILLIPS = 'PHILLIPS',    // Phillips (krzyżak)
  SLOT = 'SLOT'             // Slot (płaski)
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
  socketType: SocketType;       // Typ zagłębienia (niezależnie od headType)
  socketDepthPercent: number;   // Głębokość zagłębienia 0-100%
  tipType: TipType;
  tipLength: number;   // only used if tipType is POINTED or DOG_POINT
  // 3D Printing params
  nozzleSize: number;  // nozzle diameter in mm (0.2, 0.4, 0.6, 0.8) - affects tolerances
  // Production params
  quantity: number;
  hasNut: boolean;
  nutHeight: number;
  hasWasher: boolean;
  washerThickness: number;
  washerOuterD: number;
}
