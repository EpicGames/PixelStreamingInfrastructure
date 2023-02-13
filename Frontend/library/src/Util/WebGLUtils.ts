// Copyright Epic Games, Inc. All Rights Reserved.

export class WebGLUtils {
    static vertexShader(): string {
        return `
		attribute vec2 a_position;
		attribute vec2 a_texCoord;

		// input
		uniform vec2 u_resolution;
		uniform vec4 u_offset;

		//
		varying vec2 v_texCoord;

		void main() {
		   // convert the rectangle from pixels to 0.0 to 1.0
		   vec2 zeroToOne = a_position / u_resolution;

		   // convert from 0->1 to 0->2
		   vec2 zeroToTwo = zeroToOne * 2.0;

		   // convert from 0->2 to -1->+1 (clipspace)
		   vec2 clipSpace = zeroToTwo - 1.0;

		   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
		   // pass the texCoord to the fragment shader
		   // The GPU will interpolate this value between points.
		   v_texCoord = (a_texCoord * u_offset.xy) + u_offset.zw;
		}
		`;
    }

    static fragmentShader(): string {
        return `
		precision mediump float;

		// our texture
		uniform sampler2D u_image;

		// the texCoords passed in from the vertex shader.
		varying vec2 v_texCoord;

		void main() {
		   gl_FragColor = texture2D(u_image, v_texCoord);
		}
		`;
    }
}
