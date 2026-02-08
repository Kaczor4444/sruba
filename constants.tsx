
import { BoltParams, HeadType, TipType } from './types';

export const DEFAULT_PARAMS: BoltParams = {
  d: 10.0,
  pitch: 1.5,
  headS: 17.0,
  headH: 7.0,
  length: 40.0,
  threadDepth: 0.8,
  headType: HeadType.HEX,
  tipType: TipType.FLAT,
  tipLength: 5.0,
  quantity: 1,
  hasNut: true,
  nutHeight: 8.0,
  hasWasher: true,
  washerThickness: 2.0,
  washerOuterD: 20.0
};
