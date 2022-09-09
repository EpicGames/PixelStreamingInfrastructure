import { Logger } from "../Logger/Logger";

export class FileLogic {
    file: FileTemplate;

    constructor() {
        this.file = new FileTemplate();
    }

    processFileExtension(view: any) {
        // Reset file if we got a file message and we are not "receiving" it yet
        if (!this.file.receiving) {
            this.file.mimetype = "";
            this.file.extension = "";
            this.file.receiving = true;
            this.file.valid = false;
            this.file.size = 0;
            this.file.data = [];
            this.file.timestampStart = (new Date()).getTime();
            Logger.Log(Logger.GetStackTrace(), 'Received first chunk of file', 6);
        }

        let extensionAsString = new TextDecoder("utf-16").decode(view.slice(1));
        Logger.Log(Logger.GetStackTrace(), extensionAsString, 6);
        this.file.extension = extensionAsString;
    }


    processFileMimeType(view: any) {
        // Reset file if we got a file message and we are not "receiving" it yet
        if (!this.file.receiving) {
            this.file.mimetype = "";
            this.file.extension = "";
            this.file.receiving = true;
            this.file.valid = false;
            this.file.size = 0;
            this.file.data = [];
            this.file.timestampStart = (new Date()).getTime();
            Logger.Log(Logger.GetStackTrace(), 'Received first chunk of file', 6);
        }

        let mimeAsString = new TextDecoder("utf-16").decode(view.slice(1));
        Logger.Log(Logger.GetStackTrace(), mimeAsString, 6);
        this.file.mimetype = mimeAsString;
    }


    processFileContents(view: any) {
        // If we haven't received the initial setup instructions, return
        if (!this.file.receiving) return;

        // Extract the total size of the file (across all chunks)
        this.file.size = Math.ceil((new DataView(view.slice(1, 5).buffer)).getInt32(0, true) / 16379 /* The maximum number of payload bits per message*/);

        // Get the file part of the payload
        let fileBytes = view.slice(1 + 4);

        // Append to existing data that holds the file
        this.file.data.push(fileBytes);

        // Uncomment for debug
        Logger.Log(Logger.GetStackTrace(), `Received file chunk: ${this.file.data.length}/${this.file.size}`, 6);

        if (this.file.data.length === this.file.size) {
            this.file.receiving = false;
            this.file.valid = true;
            Logger.Log(Logger.GetStackTrace(), "Received complete file", 6);
            const transferDuration = ((new Date()).getTime() - this.file.timestampStart);
            const transferBitrate = Math.round(this.file.size * 16 * 1024 / transferDuration);
            Logger.Log(Logger.GetStackTrace(), `Average transfer bitrate: ${transferBitrate}kb/s over ${transferDuration / 1000} seconds`, 6);

            // File reconstruction
            /**
             * Example code to reconstruct the file
             * 
             * This code reconstructs the received data into the original file based on the mime type and extension provided and then downloads the reconstructed file
             */
            var received = new Blob(this.file.data, { type: this.file.mimetype });
            var a = document.createElement('a');
            a.setAttribute('href', URL.createObjectURL(received));
            a.setAttribute('download', `transfer.${this.file.extension}`);
            document.body.append(a);
            // if you are so inclined to make it auto-download, do something like: a.click();
            a.remove();
        }
        else if (this.file.data.length > this.file.size) {
            this.file.receiving = false;
            Logger.Error(Logger.GetStackTrace(), `Received bigger file than advertised: ${this.file.data.length}/${this.file.size}`);
        }
    }
}

export class FileTemplate {
    mimetype: string = "";
    extension: string = "";
    receiving: boolean = false;
    size: number = 0;
    data: Array<any> = [];
    valid: boolean = false;
    timestampStart: any = undefined;

    constructor() { }
}