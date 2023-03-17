/** Whether a stream UI element is internally made, externally provided, or disabled. */
export enum UIElementType {
    CreateElement,
    UseExternalElement,
    Disable
}

/**
 * This is used to define settings for a stream-related UI panel:
 * is it created, and if it is, what kind of button is used to show/hide it.
 */
export type PanelConfiguration = {
    // If panel is enabled, HTML elements for it will be created, and funtionality bound
    isEnabled : boolean,
    // (Only relevant if isEnabled) The type of the button to show/hide this panel
    visbilityToggleButtonType? : UIElementType
    // Only relevant if visbilityToggleButtonType is UseExternalElement
    externalButton? : HTMLButtonElement | undefined
}

export function isPanelEnabled(config : PanelConfiguration | undefined) : boolean {
    return !config || (!!config && config.isEnabled);
}