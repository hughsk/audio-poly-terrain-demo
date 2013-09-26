var shell = require('gl-now')({ clearColor: [1, 1, 1, 0] })
var camera = require('game-shell-orbit-camera')(shell)
var analyze = require('web-audio-analyser')
var badge = require('soundcloud-badge')
var fs = require('fs')

var createTexture = require('gl-texture2d')
var createShader  = require('gl-shader')
var GLMatrix      = require('gl-matrix')
var createBuffer  = require('gl-buffer')
var createVAO     = require('gl-vao')

var mat4 = GLMatrix.mat4
var quat = GLMatrix.quat

shell.on('gl-init', init)
shell.on('gl-render', render)

var analyzer

badge({
    client_id: 'ded451c6d8f9ff1c62f72523f49dab68'
  , song: 'https://soundcloud.com/dylan_king/modern-housing'
  , dark: true
  , getFonts: true
}, function(err, src, json, div) {
  if (err) throw err

  var audio = new Audio

  audio.loop = true
  audio.addEventListener('canplay', function() {
    audio.play()
    analyzer = analyze(audio)
    analyzer.waveform(wave)
  })

  audio.src = src
  document.body.appendChild(div)
})

var waveform = document.createElement('canvas')
var wctx = waveform.getContext('2d')
var wave = new Uint8Array(1024)

waveform.style.position = 'absolute'
waveform.style.left = '0'
waveform.style.bottom = '0'
waveform.style.zIndex = 9999

waveform.height = 1
waveform.width = 1024

wctx.fillStyle = '#000'
wctx.fillRect(0, 0, 1024, 1)

var meshes = []
var shader
var wtex
var gl

function init() {
  gl = shell.gl

  camera.center[0] = +64
  camera.center[1] = +32
  camera.center[2] = -64
  quat.rotateX(camera.rotation, camera.rotation, -0.35)

  meshes.push(createMesh(0, 0))
  wtex = createTexture(gl, waveform)
  wtex.minFilter = gl.LINEAR
  wtex.maxFilter = gl.LINEAR
  shader = createShader(gl
    , fs.readFileSync(__dirname + '/shaders/terrain.vert', 'utf8')
    , fs.readFileSync(__dirname + '/shaders/terrain.frag', 'utf8')
  )
}

var t = 0
function render() {
  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)
  t += 1

  var projection = mat4.perspective(new Float32Array(16), 0.25*Math.PI, shell.width/shell.height, 0.05, 1000)
  var model = mat4.identity(new Float32Array(16))
  var view = camera.view()

  // WebGL won't let you pass through uniforms
  // that are very large, like say 1024 elements
  // large. So, we can hack around that by storing
  // the data in a texture! This is actually a bottleneck
  // at the moment - could be sped up by using an FBO/GLSL
  // instead of a <canvas>, but there hasn't been the
  // need quite yet :)
  if (analyzer) {
    analyzer.waveform(wave)
    for (var i = 0; i < wave.length; i += 1) {
      var r = +Math.abs((wave[i]) - 128)|0
      var g = r & 255
      var b = wave[i] > 0 ? 255 : 0
      wctx.fillStyle = 'rgb('+(r>>8)+','+g+','+b+')'
      wctx.fillRect(i, 0, 1, 1)
    }
  }

  wtex.bind(0)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, waveform)
  shader.bind()

  shader.uniforms.uProjection = projection
  shader.uniforms.uModel = model
  shader.uniforms.uView = view
  shader.uniforms.uWaveform = 0
  shader.uniforms.tNoise = 1
  shader.uniforms.t = t / 100

  shader.attributes.aPosition.location = 0
  shader.attributes.aVertex1.location = 1
  shader.attributes.aVertex2.location = 2
  shader.attributes.aVertex3.location = 3

  for (var i = 0; i < meshes.length; i += 1) {
    meshes[i].vao.bind()
    gl.drawArrays(gl.TRIANGLES, 0, meshes[i].length)
    meshes[i].vao.unbind()
  }
}

function createMesh(xoffset, yoffset) {
  var count = 64 * 64
  var size = count * 12
  var aPositionData = new Float32Array(size)
  var aVertex1Data  = new Float32Array(size)
  var aVertex2Data  = new Float32Array(size)
  var aVertex3Data  = new Float32Array(size)
  xoffset = xoffset || 0
  yoffset = yoffset || 0
  var xscale = 2
  var yscale = 2

  var i = 0
  for (var X = 0; X < 64; X++)
  for (var Y = 0; Y < 64; Y++, i += 12) {
    var x = X * xscale + xoffset * xscale
    var y = Y * yscale + yoffset * yscale

    // Triangle 1
    aPositionData[i   ] = x+xscale
    aPositionData[i+1 ] = y
    aPositionData[i+2 ] = x
    aPositionData[i+3 ] = y
    aPositionData[i+4 ] = x
    aPositionData[i+5 ] = y+yscale

    // Triangle 2
    aPositionData[i+6 ] = x
    aPositionData[i+7 ] = y+yscale

    aPositionData[i+8 ] = x+xscale
    aPositionData[i+9 ] = y+yscale

    aPositionData[i+10] = x+xscale
    aPositionData[i+11] = y

    aVertex1Data[i   ] = x+xscale
    aVertex1Data[i+1 ] = y
    aVertex1Data[i+2 ] = x+xscale
    aVertex1Data[i+3 ] = y
    aVertex1Data[i+4 ] = x+xscale
    aVertex1Data[i+5 ] = y
    aVertex1Data[i+6 ] = x
    aVertex1Data[i+7 ] = y+yscale
    aVertex1Data[i+8 ] = x
    aVertex1Data[i+9 ] = y+yscale
    aVertex1Data[i+10] = x
    aVertex1Data[i+11] = y+yscale

    aVertex2Data[i   ] = x
    aVertex2Data[i+1 ] = y
    aVertex2Data[i+2 ] = x
    aVertex2Data[i+3 ] = y
    aVertex2Data[i+4 ] = x
    aVertex2Data[i+5 ] = y
    aVertex2Data[i+6 ] = x+xscale
    aVertex2Data[i+7 ] = y+yscale
    aVertex2Data[i+8 ] = x+xscale
    aVertex2Data[i+9 ] = y+yscale
    aVertex2Data[i+10] = x+xscale
    aVertex2Data[i+11] = y+yscale

    aVertex3Data[i   ] = x
    aVertex3Data[i+1 ] = y+yscale
    aVertex3Data[i+2 ] = x
    aVertex3Data[i+3 ] = y+yscale
    aVertex3Data[i+4 ] = x
    aVertex3Data[i+5 ] = y+yscale
    aVertex3Data[i+6 ] = x+xscale
    aVertex3Data[i+7 ] = y
    aVertex3Data[i+8 ] = x+xscale
    aVertex3Data[i+9 ] = y
    aVertex3Data[i+10] = x+xscale
    aVertex3Data[i+11] = y
  }

  function createAttribute(data) {
    return {
      buffer: createBuffer(gl, data)
      , type: gl.FLOAT
      , size: 2
      , offset: 0
      , stride: 0
      , normalized: false
    }
  }

  var attributes
  var vao = createVAO(gl, null, attributes = [
      createAttribute(aPositionData)
    , createAttribute(aVertex1Data)
    , createAttribute(aVertex2Data)
    , createAttribute(aVertex3Data)
  ])

  return { vao: vao, length: size / 2 }
}
