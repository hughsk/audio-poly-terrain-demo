precision mediump float;

uniform sampler2D tMap;

varying vec3 vNormal;
varying vec2 vPos;

void main() {
  vec3 terrainColor = vNormal;
  float shine = texture2D(tMap, vec2(vPos.x / 128.0, 0.5)).g * 4.0 * vNormal.y;
  terrainColor.r = 1.4 * vNormal.y - shine * 0.1;
  // terrainColor.g = shine;
  terrainColor.b = shine;
  gl_FragColor = vec4(terrainColor, 1.0);
}
