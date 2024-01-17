"use strict";

class EdgeShader {
    constructor() {
        //2024-01-16: copied from https://jsfiddle.net/prisoner849/kmau6591/
        this.vertexShader = `
            varying vec2 vUv;
            void main()	{
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }
        `;
        this.fragmentShader = `
            //#extension GL_OES_standard_derivatives : enable

            varying vec2 vUv;
            uniform float thickness;
            uniform vec3 edgeColor;
            uniform vec3 faceColor;

            float edgeFactor(vec2 p){
                vec2 grid = abs(fract(p - 0.5) - 0.5) / fwidth(p) / thickness;
                return min(grid.x, grid.y);
            }

            void main() {

                float a = edgeFactor(vUv);

                vec3 c = mix(edgeColor, faceColor, a);

                gl_FragColor = vec4(c, 1.0);
            }
        `;
    }
}
