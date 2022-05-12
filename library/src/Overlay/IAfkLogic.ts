import { afk } from "./AfkLogic";

/**
 * The interface for AfkLogic 
 */
export interface IAfkLogic {

   afk: afk;

   /**
    * An override method for setting the Afk Overlay 
    */
   setOverlay(): void;

   /**
    * An override method for hiding the Afk overlay
    */
   hideOverlay(): void;

   /**
    * An override method for closing the websocket within the AfkLogic
    */
   closeWs(): void;
}