attribute vec2 aPosition;
attribute vec2 aVertex1;
attribute vec2 aVertex2;
attribute vec2 aVertex3;
attribute float uWaveform;

uniform sampler2D tMap;
uniform mat4 uProjection;
uniform mat4 uModel;
uniform mat4 uView;
uniform float t;

varying vec3 vNormal;
varying vec2 vPos;

float getHeight(vec2 pos, float wave) {
  vec3 tex = texture2D(tMap, vec2((pos.x) / (128.0), 0.0)).rgb;
  float h = (tex.b > 0.5 ? 1.0 : -1.0) * (tex.r * 256.0 + tex.g);
  return h * h * 50.0 * 0.5
       +(sin(sin(pos.x * 0.1 + t) * cos(pos.y * 0.1 + t)) * 10.0
       + cos(pos.x * 0.3 - t * 0.25) * sin(pos.y * 0.2 + t * 0.25) * 2.5
       + cos(pos.x * 1.25 - t) * sin(pos.y * 0.75 + t) * 0.5
       + clamp(abs(tan((pos.y-pos.x*0.25) * 0.015 + t * 0.8)), -10.0, 10.0) * 0.7)*0.8
      ;
}
    // + texture2D(tNoise, pos / 256.0).r * 50.0
    // + texture2D(tNoise, pos / 48.5).r * 5.0
    // ;
    // + snoise(vec3(pos / 82.1 + vec2(452.5), 35.4 + t * 0.2)) * 15.0
    // + snoise(vec3(pos / 22.3 - vec2(252.5), 35.4 + t * 0.2)) * 7.0
    // + snoise(vec3(vec2(324.2) + pos / 5.0, 10.2 + t * 0.05)) * 1.0
    // + clamp(abs(tan((pos.y-pos.x*0.25) * 0.015 + t * 0.8)), -10.0, 10.0) * 0.7
    // ;

void main() {
  vec3 position = vec3(aPosition.x, getHeight(aPosition, uWaveform), aPosition.y);
  vec3 p1 = vec3(aVertex1.x, getHeight(aVertex1, uWaveform), aVertex1.y);
  vec3 p2 = vec3(aVertex2.x, getHeight(aVertex2, uWaveform), aVertex2.y);
  vec3 p3 = vec3(aVertex3.x, getHeight(aVertex3, uWaveform), aVertex3.y);
  vec3 normal = normalize(cross(p2 - p1, p3 - p1));

  vPos = aPosition;
  vNormal = normal;
  gl_Position = uProjection * uView * uModel * vec4(position, 1.0);
}
