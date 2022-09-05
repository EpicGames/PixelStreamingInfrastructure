import { NormaliseAndQuantiseSigned, NormaliseAndQuantiseUnsigned, UnquantisedAndDenormaliseUnsigned } from "./NormalizeAndQuantize";

export interface INormalizeAndQuantize {
    normalizeAndQuantizeUnsigned(x: number, y: number): NormaliseAndQuantiseUnsigned;
    unquantizeAndDenormalizeUnsigned(x: number, y: number): UnquantisedAndDenormaliseUnsigned;
    normalizeAndQuantizeSigned(x: number, y: number): NormaliseAndQuantiseSigned;
}