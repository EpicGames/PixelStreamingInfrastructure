/* Copyright Epic Games, Inc. All Rights Reserved. */

import jss from 'jss'
import global from 'jss-plugin-global';
import camelCase from "jss-plugin-camel-case"

export class PixelStreamingApplicationStyle {

	styles = 
	{
		"@global": {
			":root": {
				"--colour1": "#000000",
				"--colour2": "#FFFFFF",
				"--colour3": "#0585fe",
				"--colour4": "#35b350",
				"--colour5": "#ffab00",
				"--colour6": "#1e1d22",
				"--colour7": "#3c3b40"
			},
			".noselect": {
				"userSelect": "none"
			},
			"#playerUI": {
				"width": "100%",
				"height": "100%",
				"position": "relative"
			},
			"#videoElementParent": {
				"width": "100%",
				"height": "100%",
				"position": "absolute",
				"backgroundColor": "black"
			},
			"#uiFeatures": {
				"width": "100%",
				"height": "100%",
				"zIndex": "30",
				"position": "relative",
				"color": "var(--colour2)",
				"pointerEvents": "none",
				"overflow": "hidden"
			},
			".UiTool .tooltiptext": {
				"visibility": "hidden",
				"width": "auto",
				"color": "var(--colour2)",
				"textAlign": "center",
				"borderRadius": "15px",
				"padding": "0px 10px",
				"fontFamily": "'Montserrat', sans-serif",
				"fontSize": "0.75rem",
				"letterSpacing": "0.75px",
				"position": "absolute",
				"top": "0",
				"transform": "translateY(25%)",
				"left": "125%",
				"zIndex": "20"
			},
			".UiTool:hover .tooltiptext": {
				"visibility": "visible",
				"backgroundColor": "var(--colour7)"
			},
			"#connection .tooltiptext": {
				"top": "125%",
				"transform": "translateX(-25%)",
				"left": "0",
				"zIndex": "20",
				"padding": "5px 10px"
			},
			"#connection": {
				"position": "absolute",
				"bottom": "8%",
				"left": "5%",
				"fontFamily": "'Michroma', sans-serif",
				"height": "3rem",
				"width": "3rem",
				"pointerEvents": "all"
			},
			"#settings-panel .tooltiptext": {
				"display": "block",
				"top": "125%",
				"transform": "translateX(-50%)",
				"left": "0",
				"zIndex": "20",
				"padding": "5px 10px",
				"border": "3px solid var(--colour3)",
				"width": "max-content",
				"fallbacks": [
					{
						"width": "max-content"
					},
					{
						"border": "3px solid var(--colour3)"
					},
					{
						"padding": "5px 10px"
					},
					{
						"zIndex": "20"
					},
					{
						"left": "0"
					},
					{
						"transform": "translateX(-50%)"
					},
					{
						"top": "125%"
					},
					{
						"display": "block"
					}
				]
			},
			"#controls": {
				"position": "absolute",
				"top": "3%",
				"left": "2%",
				"fontFamily": "'Michroma', sans-serif",
				"pointerEvents": "all",
				"display": "block"
			},
			"#controls>*": {
				"marginBottom": "0.5rem",
				"borderRadius": "50%",
				"display": "block",
				"height": "2rem",
				"lineHeight": "1.75rem",
				"padding": "0.5rem"
			},
			"#controls #additionalinfo": {
				"textAlign": "center",
				"fontFamily": "'Montserrat', sans-serif"
			},
			"#fullscreen-btn": {
				"padding": "0.6rem !important"
			},
			"#minimizeIcon": {
				"display": "none"
			},
			"#settingsBtn, #statsBtn": {
				"cursor": "pointer"
			},
			"#uiFeatures button": {
				"backgroundColor": "var(--colour7)",
				"border": "1px solid var(--colour7)",
				"color": "var(--colour2)",
				"position": "relative",
				"width": "3rem",
				"height": "3rem",
				"padding": "0.5rem",
				"textAlign": "center"
			},
			"#uiFeatures button:hover": {
				"backgroundColor": "var(--colour3)",
				"border": "3px solid var(--colour3)",
				"transition": "0.25s ease",
				"paddingLeft": "0.55rem",
				"paddingTop": "0.55rem"
			},
			"#uiFeatures button:active": {
				"border": "3px solid var(--colour3)",
				"backgroundColor": "var(--colour7)",
				"paddingLeft": "0.55rem",
				"paddingTop": "0.55rem"
			},
			".btn-flat": {
				"backgroundColor": "transparent",
				"color": "var(--colour2)",
				"fontFamily": "'Montserrat'",
				"fontWeight": "bold",
				"border": "3px solid var(--colour3)",
				"borderRadius": "1rem",
				"fontSize": "0.75rem",
				"paddingLeft": "0.5rem",
				"paddingRight": "0.5rem",
				"cursor": "pointer",
				"textAlign": "center"
			},
			".btn-flat:hover": {
				"backgroundColor": "var(--colour3)",
				"transition": "ease 0.3s"
			},
			".btn-flat:disabled": {
				"background": "var(--colour7)",
				"borderColor": "var(--colour3)",
				"color": "var(--colour3)",
				"cursor": "default"
			},
			".btn-flat:active": {
				"backgroundColor": "transparent"
			},
			".btn-flat:focus": {
				"outline": "none"
			},
			"#uiFeatures img": {
				"width": "100%",
				"height": "100%"
			},
			".panel-wrap": {
				"position": "absolute",
				"top": "0",
				"bottom": "0",
				"right": "0",
				"height": "100%",
				"minWidth": "20vw",
				"maxWidth": "100vw",
				"transform": "translateX(100%)",
				"transition": ".3s ease-out",
				"pointerEvents": "all",
				"backdropFilter": "blur(10px)",
				"webkitBackdropFilter": "blur(10px)",
				"overflowY": "auto",
				"overflowX": "hidden",
				"backgroundColor": "rgba(30, 29, 34, 0.5)"
			},
			".panel-wrap-visible": {
				"transform": "translateX(0%)"
			},
			".panel": {
				"color": "#eee",
				"overflowY": "auto",
				"padding": "1em"
			},
			"#settingsHeading, #statsHeading": {
				"display": "inline-block",
				"fontSize": "2em",
				"marginBlockStart": "0.67em",
				"marginBlockEnd": "0.67em",
				"marginInlineStart": "0px",
				"marginInlineEnd": "0px",
				"position": "relative",
				"padding": "0 0 0 2rem"
			},
			"#settingsClose, #statsClose": {
				"margin": "0.5rem",
				"paddingTop": "0.5rem",
				"paddingBottom": "0.5rem",
				"paddingRight": "0.5rem",
				"fontSize": "2em",
				"float": "right"
			},
			"#settingsClose:after, #statsClose:after": {
				"paddingLeft": "0.5rem",
				"display": "inline-block",
				"content": "\"\\00d7\""
			},
			"#settingsClose:hover, #statsClose:hover": {
				"color": "var(--colour3)",
				"transition": "ease 0.3s"
			},
			"#settingsContent, #statsContent": {
				"marginLeft": "2rem",
				"marginRight": "2rem"
			},
			".setting": {
				"display": "flex",
				"flexDirection": "row",
				"justifyContent": "space-between",
				"padding": "0.15rem 10px 0.15rem 10px"
			},
			".settings-text": {
				"color": "var(--colour2)",
				"verticalAlign": "middle",
				"fontWeight": "normal"
			},
			"#connectOverlay, #playOverlay, #infoOverlay, #errorOverlay, #afkOverlay, #disconnectOverlay": {
				"zIndex": "30",
				"position": "absolute",
				"color": "var(--colour2)",
				"fontSize": "1.8em",
				"width": "100%",
				"height": "100%",
				"backgroundColor": "black",
				"alignItems": "center",
				"justifyContent": "center",
				"textTransform": "uppercase"
			},
			".clickableState": {
				"alignItems": "center",
				"justifyContent": "center",
				"display": "flex",
				"cursor": "pointer"
			},
			".textDisplayState": {
				"display": "flex"
			},
			".hiddenState": {
				"display": "none"
			},
			"#playButton, #connectButton": {
				"display": "inline-block",
				"height": "auto",
				"zIndex": "30"
			},
			"img#playButton": {
				"maxWidth": "241px",
				"width": "10%"
			},
			"#uiInteraction": {
				"position": "fixed"
			},
			"#UIInteractionButtonBoundary": {
				"padding": "2px"
			},
			"#UIInteractionButton": {
				"cursor": "pointer"
			},
			"#hiddenInput": {
				"position": "absolute",
				"left": "-10%",
				"width": "0px",
				"opacity": "0"
			},
			"#editTextButton": {
				"position": "absolute",
				"height": "40px",
				"width": "40px"
			},
			".btn-overlay": {
				"verticalAlign": "middle",
				"display": "inline-block"
			},
			".tgl-switch": {
				"verticalAlign": "middle",
				"display": "inline-block"
			},
			".tgl-switch .tgl": {
				"display": "none"
			},
			".tgl, .tgl:after, .tgl:before, .tgl *, .tgl *:after, .tgl *:before, .tgl+.tgl-slider": {
				"webkitBoxSizing": "border-box",
				"boxSizing": "border-box"
			},
			".tgl::-moz-selection, .tgl:after::-moz-selection, .tgl:before::-moz-selection, .tgl *::-moz-selection, .tgl *:after::-moz-selection, .tgl *:before::-moz-selection, .tgl+.tgl-slider::-moz-selection": {
				"background": "none"
			},
			".tgl::selection, .tgl:after::selection, .tgl:before::selection, .tgl *::selection, .tgl *:after::selection, .tgl *:before::selection, .tgl+.tgl-slider::selection": {
				"background": "none"
			},
			".tgl-slider": {},
			".tgl+.tgl-slider": {
				"outline": "0",
				"display": "block",
				"width": "40px",
				"height": "18px",
				"position": "relative",
				"cursor": "pointer",
				"userSelect": "none"
			},
			".tgl+.tgl-slider:after, .tgl+.tgl-slider:before": {
				"position": "relative",
				"display": "block",
				"content": "\"\"",
				"width": "50%",
				"height": "100%"
			},
			".tgl+.tgl-slider:after": {
				"left": "0"
			},
			".tgl+.tgl-slider:before": {
				"display": "none"
			},
			".tgl-flat+.tgl-slider": {
				"padding": "2px",
				"webkitTransition": "all .2s ease",
				"transition": "all .2s ease",
				"background": "var(--colour6)",
				"border": "3px solid var(--colour7)",
				"borderRadius": "2em"
			},
			".tgl-flat+.tgl-slider:after": {
				"webkitTransition": "all .2s ease",
				"transition": "all .2s ease",
				"background": "var(--colour7)",
				"content": "\"\"",
				"borderRadius": "1em"
			},
			".tgl-flat:checked+.tgl-slider": {
				"border": "3px solid var(--colour3)"
			},
			".tgl-flat:checked+.tgl-slider:after": {
				"left": "50%",
				"background": "var(--colour3)"
			},
			".btn-apply": {
				"display": "block !important",
				"marginLeft": "auto",
				"marginRight": "auto",
				"width": "40%"
			},
			".form-control": {
				"backgroundColor": "var(--colour7)",
				"border": "2px solid var(--colour7)",
				"borderRadius": "4px",
				"color": "var(--colour2)",
				"textAlign": "right",
				"fontFamily": "inherit"
			},
			".form-control:hover": {
				"borderColor": "var(--colour7)"
			},
			".form-group": {
				"paddingTop": "4px",
				"display": "grid",
				"gridTemplateColumns": "50% 50%",
				"rowGap": "4px",
				"paddingRight": "10px",
				"paddingLeft": "10px"
			},
			".form-group label": {
				"verticalAlign": "middle",
				"fontWeight": "normal"
			},
			".settingsContainer": {
				"display": "flex",
				"flexDirection": "column",
				"borderBottom": "1px solid var(--colour7)",
				"paddingTop": "10px",
				"paddingBottom": "10px"
			},
			".settingsContainer> :first-child": {
				"marginTop": "4px",
				"marginBottom": "4px",
				"fontWeight": "bold",
				"justifyContent": "space-between",
				"display": "flex",
				"flexDirection": "row",
				"alignItems": "baseline"
			},
			".collapse": {
				"paddingLeft": "5%"
			},
			"#streamTools": {
				"borderBottomRightRadius": "5px",
				"borderBottomLeftRadius": "5px",
				"userSelect": "none",
				"position": "absolute",
				"top": "0",
				"right": "2%",
				"zIndex": "100",
				"border": "4px solid var(--colour8)",
				"borderTopWidth": "0px"
			},
			".settingsHeader": {
				"fontStyle": "italic"
			},
			"#streamToolsHeader": {
				"display": "flex",
				"flexDirection": "row",
				"justifyContent": "space-between",
				"borderBottom": "1px solid var(--colour8)",
				"backgroundColor": "var(--colour7)"
			},
			".streamTools": {
				"backgroundColor": "var(--colour2)",
				"fontFamily": "var(--buttonFont)",
				"fontWeight": "lighter",
				"color": "var(--colour7)"
			},
			".streamTools-shown>#streamToolsSettings, .streamTools-shown>#streamToolsStats": {
				"display": "block"
			},
			"#streamToolsToggle": {
				"width": "100%"
			},
			"#qualityStatus": {
				"fontSize": "37px",
				"paddingRight": "4px"
			},
			".svgIcon": {
				"fill": "var(--colour2)"
			}
		}
	};

	constructor() {
		// One time setup with default plugins and settings.
		const jssOptions = {
			// JSS has many interesting plugins we may wish to turn on
			//plugins: [functions(), template(), global(), extend(), nested(), compose(), camelCase(), defaultUnit(options.defaultUnit), expand(), vendorPrefixer(), propsSort()]
			plugins: [global(), camelCase()]
		}

		jss.setup(jssOptions);

		this.applyStyleSheet()
	}

	applyStyleSheet() {
		// Todo: refactor codebase to use jss at a component level, classes can be grabbed like so:
		//const {pixelStreamingClasses} = jss.createStyleSheet(styles).attach();

		// attach generated style sheet to page
		jss.createStyleSheet(this.styles).attach();
	}

}


