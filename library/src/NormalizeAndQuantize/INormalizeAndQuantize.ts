import { NormaliseAndQuantiseSigned, NormaliseAndQuantiseUnsigned, UnquantisedAndDenormaliseUnsigned } from "./NormalizeAndQuantize";

export interface INormalizeAndQuantize {

    /**
     * Normalize And Quantize Unsigned
     * @param x - x axis point
     * @param y - y axis point 
     */
    normalizeAndQuantizeUnsigned(x: number, y: number): NormaliseAndQuantiseUnsigned;

    /**
     * Unquantize And Denormalize Unsigned
     * @param x - x axis point
     * @param y - y axis point 
     */
    unquantizeAndDenormalizeUnsigned(x: number, y: number): UnquantisedAndDenormaliseUnsigned;

    /**
     * Normalize And Quantize Signed
     * @param x - x axis point
     * @param y - y axis point 
     */
    normalizeAndQuantizeSigned(x: number, y: number): NormaliseAndQuantiseSigned;
}