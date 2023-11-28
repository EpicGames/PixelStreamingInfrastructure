export class DeviceUtils {
    static isIos = () => navigator && /iPhone|iPod/i.test(navigator.userAgent);
    static isIpad = () =>
        navigator &&
        /Macintosh|iPad/i.test(navigator.userAgent) &&
        navigator.maxTouchPoints &&
        navigator.maxTouchPoints > 1;
    static isAndroid = () => navigator && /Android/i.test(navigator.userAgent);
    static isMobile = () => this.isIos() || this.isAndroid() || this.isIpad();
}
