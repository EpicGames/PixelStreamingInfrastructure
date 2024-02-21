/**
 * All Pixel Streaming messages should adhere to this interface.
 */
export interface BaseMessage {
    // the type of the message
    type: string;
    // the player id that this message is related to (usually describes the target of the message)
    playerId?: string;
} 
