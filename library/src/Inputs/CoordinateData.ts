/**
 * Normalised and Quantised Unsigned Data
 */
export interface NormaliseAndQuantiseUnsigned {
	inRange: boolean;
	x: number;
	y: number;
}

/**
 * Denormalised and unquantised Unsigned Data
 */
export interface UnquantisedAndDenormaliseUnsigned {
	x: number;
	y: number;
}

/**
 * Normalised and Quantised Signed Data
 */
export interface NormaliseAndQuantiseSigned {
	x: number;
	y: number;
}