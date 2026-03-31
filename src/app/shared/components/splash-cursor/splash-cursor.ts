import {
  Component,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface PointerData {
  id: number;
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: number;
  prevTexcoordY: number;
  deltaX: number;
  deltaY: number;
  down: boolean;
  moved: boolean;
  color: ColorRGB;
}

interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
}

interface DoubleFBO {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
}

@Component({
  selector: 'app-splash-cursor',
  standalone: true,
  templateUrl: './splash-cursor.html',
  styleUrl: './splash-cursor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashCursor implements AfterViewInit, OnDestroy {
  @ViewChild('fluidCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() SIM_RESOLUTION = 128;
  @Input() DYE_RESOLUTION = 1440;
  @Input() DENSITY_DISSIPATION = 3.5;
  @Input() VELOCITY_DISSIPATION = 2;
  @Input() PRESSURE = 0.1;
  @Input() PRESSURE_ITERATIONS = 20;
  @Input() CURL = 3;
  @Input() SPLAT_RADIUS = 0.2;
  @Input() SPLAT_FORCE = 6000;
  @Input() SHADING = true;
  @Input() COLOR_UPDATE_SPEED = 10;
  @Input() TRANSPARENT = true;

  private animationId?: number;
  private cleanupFns: (() => void)[] = [];
  isDesktop = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    // Only run on non-touch desktop devices
    this.isDesktop = !window.matchMedia('(hover: none)').matches && navigator.maxTouchPoints === 0;
    if (!this.isDesktop) return;
    // Trigger @if to render the canvas, then init
    this.cdr.detectChanges();
    setTimeout(() => this.initFluid(), 0);
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];
  }

  private initFluid(): void {
    const canvas = this.canvasRef.nativeElement;
    if (!canvas) return;

    const pointers: PointerData[] = [this.makePointer()];

    const config = {
      SIM_RESOLUTION: this.SIM_RESOLUTION,
      DYE_RESOLUTION: this.DYE_RESOLUTION,
      DENSITY_DISSIPATION: this.DENSITY_DISSIPATION,
      VELOCITY_DISSIPATION: this.VELOCITY_DISSIPATION,
      PRESSURE: this.PRESSURE,
      PRESSURE_ITERATIONS: this.PRESSURE_ITERATIONS,
      CURL: this.CURL,
      SPLAT_RADIUS: this.SPLAT_RADIUS,
      SPLAT_FORCE: this.SPLAT_FORCE,
      SHADING: this.SHADING,
      COLOR_UPDATE_SPEED: this.COLOR_UPDATE_SPEED,
      TRANSPARENT: this.TRANSPARENT,
    };

    // ── WebGL context ────────────────────────────────────────────────────────
    const { gl, ext } = this.getWebGLContext(canvas);
    if (!gl || !ext) return;

    if (!ext.supportLinearFiltering) {
      config.DYE_RESOLUTION = 256;
      config.SHADING = false;
    }

    // ── Shaders ──────────────────────────────────────────────────────────────
    const baseVertexShader = compileShader(gl, gl.VERTEX_SHADER, `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;
      void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `);

    const copyShader = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      uniform sampler2D uTexture;
      void main () { gl_FragColor = texture2D(uTexture, vUv); }
    `);

    const clearShader = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      uniform sampler2D uTexture;
      uniform float value;
      void main () { gl_FragColor = value * texture2D(uTexture, vUv); }
    `);

    const displayShaderSource = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uTexture;
      uniform vec2 texelSize;
      vec3 linearToGamma (vec3 color) {
        color = max(color, vec3(0));
        return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
      }
      void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        #ifdef SHADING
          vec3 lc = texture2D(uTexture, vL).rgb;
          vec3 rc = texture2D(uTexture, vR).rgb;
          vec3 tc = texture2D(uTexture, vT).rgb;
          vec3 bc = texture2D(uTexture, vB).rgb;
          float dx = length(rc) - length(lc);
          float dy = length(tc) - length(bc);
          vec3 n = normalize(vec3(dx, dy, length(texelSize)));
          vec3 l = vec3(0.0, 0.0, 1.0);
          float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
          c *= diffuse;
        #endif
        float a = max(c.r, max(c.g, c.b));
        gl_FragColor = vec4(c, a);
      }
    `;

    const splatShader = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `);

    const advectionShader = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform vec2 dyeTexelSize;
      uniform float dt;
      uniform float dissipation;
      vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;
        vec2 iuv = floor(st);
        vec2 fuv = fract(st);
        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
      }
      void main () {
        #ifdef MANUAL_FILTERING
          vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
          vec4 result = bilerp(uSource, coord, dyeTexelSize);
        #else
          vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
          vec4 result = texture2D(uSource, coord);
        #endif
        float decay = 1.0 + dissipation * dt;
        gl_FragColor = result / decay;
      }
    `, ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']);

    const divergenceShader = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `);

    const curlShader = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `);

    const vorticityShader = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;
      void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity += force * dt;
        velocity = min(max(velocity, -1000.0), 1000.0);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `);

    const pressureShader = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;
      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `);

    const gradientSubtractShader = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `);

    // ── Programs ─────────────────────────────────────────────────────────────
    const copyProgram    = new GLProgram(gl, baseVertexShader!, copyShader!);
    const clearProgram   = new GLProgram(gl, baseVertexShader!, clearShader!);
    const splatProgram   = new GLProgram(gl, baseVertexShader!, splatShader!);
    const advectionProgram    = new GLProgram(gl, baseVertexShader!, advectionShader!);
    const divergenceProgram   = new GLProgram(gl, baseVertexShader!, divergenceShader!);
    const curlProgram         = new GLProgram(gl, baseVertexShader!, curlShader!);
    const vorticityProgram    = new GLProgram(gl, baseVertexShader!, vorticityShader!);
    const pressureProgram     = new GLProgram(gl, baseVertexShader!, pressureShader!);
    const gradientSubtractProgram = new GLProgram(gl, baseVertexShader!, gradientSubtractShader!);
    const displayMaterial = new GLMaterial(gl, baseVertexShader!, displayShaderSource);

    // ── Blit quad ────────────────────────────────────────────────────────────
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const elemBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const blit = (target: FBO | null, doClear = false) => {
      if (!target) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      if (doClear) {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };

    // ── FBO helpers ──────────────────────────────────────────────────────────
    const createFBO = (w: number, h: number, internalFormat: number, format: number, type: number, param: number): FBO => {
      gl.activeTexture(gl.TEXTURE0);
      const texture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return {
        texture, fbo, width: w, height: h,
        texelSizeX: 1 / w, texelSizeY: 1 / h,
        attach(id: number) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        }
      };
    };

    const createDoubleFBO = (w: number, h: number, internalFormat: number, format: number, type: number, param: number): DoubleFBO => {
      let read = createFBO(w, h, internalFormat, format, type, param);
      let write = createFBO(w, h, internalFormat, format, type, param);
      return {
        width: w, height: h,
        texelSizeX: read.texelSizeX, texelSizeY: read.texelSizeY,
        get read() { return read; },
        get write() { return write; },
        swap() { const tmp = read; read = write; write = tmp; }
      };
    };

    const resizeFBO = (target: FBO, w: number, h: number, internalFormat: number, format: number, type: number, param: number): FBO => {
      const newFBO = createFBO(w, h, internalFormat, format, type, param);
      copyProgram.bind();
      gl.uniform1i(copyProgram.uniforms['uTexture'], target.attach(0));
      blit(newFBO, false);
      return newFBO;
    };

    const resizeDoubleFBO = (target: DoubleFBO, w: number, h: number, internalFormat: number, format: number, type: number, param: number): DoubleFBO => {
      if (target.width === w && target.height === h) return target;
      target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
      target.write = createFBO(w, h, internalFormat, format, type, param);
      target.width = w;
      target.height = h;
      target.texelSizeX = 1 / w;
      target.texelSizeY = 1 / h;
      return target;
    };

    // ── Resolution helpers ───────────────────────────────────────────────────
    const scaleByPixelRatio = (input: number) => Math.floor(input * (window.devicePixelRatio || 1));

    const getResolution = (resolution: number) => {
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      const aspect = w > h ? w / h : h / w;
      const min = Math.round(resolution);
      const max = Math.round(resolution * aspect);
      return w > h ? { width: max, height: min } : { width: min, height: max };
    };

    // ── Framebuffers ─────────────────────────────────────────────────────────
    let dye!: DoubleFBO;
    let velocity!: DoubleFBO;
    let divergence!: FBO;
    let curl!: FBO;
    let pressure!: DoubleFBO;

    const initFramebuffers = () => {
      const simRes = getResolution(config.SIM_RESOLUTION);
      const dyeRes = getResolution(config.DYE_RESOLUTION);
      const texType = ext.halfFloatTexType;
      const rgba = ext.formatRGBA!;
      const rg   = ext.formatRG!;
      const r    = ext.formatR!;
      const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
      gl.disable(gl.BLEND);

      dye      = dye      ? resizeDoubleFBO(dye,      dyeRes.width,  dyeRes.height,  rgba.internalFormat, rgba.format, texType, filtering)
                           : createDoubleFBO(          dyeRes.width,  dyeRes.height,  rgba.internalFormat, rgba.format, texType, filtering);
      velocity = velocity ? resizeDoubleFBO(velocity,  simRes.width,  simRes.height,  rg.internalFormat,   rg.format,   texType, filtering)
                           : createDoubleFBO(           simRes.width,  simRes.height,  rg.internalFormat,   rg.format,   texType, filtering);
      divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      curl       = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      pressure   = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    };

    // ── Color helpers ────────────────────────────────────────────────────────
    // Portfolio palette: blue, green, amber, purple, cyan
    const PALETTE: ColorRGB[] = [
      { r: 0.145, g: 0.388, b: 0.922 }, // #2563EB primary blue
      { r: 0.063, g: 0.725, b: 0.506 }, // #10B981 secondary green
      { r: 0.961, g: 0.620, b: 0.043 }, // #F59E0B accent amber
      { r: 0.545, g: 0.361, b: 0.965 }, // #8B5CF6 purple
      { r: 0.024, g: 0.714, b: 0.831 }, // #06B6D4 cyan
    ];

    const generateColor = (): ColorRGB => {
      const base = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      return { r: base.r * 0.15, g: base.g * 0.15, b: base.b * 0.15 };
    };

    const wrap = (value: number, min: number, max: number) => {
      const range = max - min;
      if (range === 0) return min;
      return ((value - min) % range) + min;
    };

    // ── Keywords / display material ──────────────────────────────────────────
    const updateKeywords = () => {
      const kw: string[] = [];
      if (config.SHADING) kw.push('SHADING');
      displayMaterial.setKeywords(kw);
    };

    // ── Splat ────────────────────────────────────────────────────────────────
    const splat = (x: number, y: number, dx: number, dy: number, color: ColorRGB) => {
      splatProgram.bind();
      gl.uniform1i(splatProgram.uniforms['uTarget'], velocity.read.attach(0));
      gl.uniform1f(splatProgram.uniforms['aspectRatio'], canvas.width / canvas.height);
      gl.uniform2f(splatProgram.uniforms['point'], x, y);
      gl.uniform3f(splatProgram.uniforms['color'], dx, dy, 0);
      gl.uniform1f(splatProgram.uniforms['radius'], correctRadius(config.SPLAT_RADIUS / 100));
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(splatProgram.uniforms['uTarget'], dye.read.attach(0));
      gl.uniform3f(splatProgram.uniforms['color'], color.r, color.g, color.b);
      blit(dye.write);
      dye.swap();
    };

    const correctRadius = (radius: number) => {
      const ar = canvas.width / canvas.height;
      if (ar > 1) radius *= ar;
      return radius;
    };

    const splatPointer = (p: PointerData) => {
      splat(p.texcoordX, p.texcoordY, p.deltaX * config.SPLAT_FORCE, p.deltaY * config.SPLAT_FORCE, p.color);
    };

    const clickSplat = (p: PointerData) => {
      const color = generateColor();
      color.r *= 20; color.g *= 20; color.b *= 20;
      splat(p.texcoordX, p.texcoordY, 10 * (Math.random() - 0.5), 30 * (Math.random() - 0.5), color);
    };

    // ── Pointer data helpers ─────────────────────────────────────────────────
    const correctDeltaX = (delta: number) => {
      const ar = canvas.width / canvas.height;
      if (ar < 1) delta *= ar;
      return delta;
    };

    const correctDeltaY = (delta: number) => {
      const ar = canvas.width / canvas.height;
      if (ar > 1) delta /= ar;
      return delta;
    };

    const updatePointerDown = (p: PointerData, id: number, posX: number, posY: number) => {
      p.id = id; p.down = true; p.moved = false;
      p.texcoordX = posX / canvas.width;
      p.texcoordY = 1 - posY / canvas.height;
      p.prevTexcoordX = p.texcoordX;
      p.prevTexcoordY = p.texcoordY;
      p.deltaX = 0; p.deltaY = 0;
      p.color = generateColor();
    };

    const updatePointerMove = (p: PointerData, posX: number, posY: number, color: ColorRGB) => {
      p.prevTexcoordX = p.texcoordX;
      p.prevTexcoordY = p.texcoordY;
      p.texcoordX = posX / canvas.width;
      p.texcoordY = 1 - posY / canvas.height;
      p.deltaX = correctDeltaX(p.texcoordX - p.prevTexcoordX);
      p.deltaY = correctDeltaY(p.texcoordY - p.prevTexcoordY);
      p.moved = Math.abs(p.deltaX) > 0 || Math.abs(p.deltaY) > 0;
      p.color = color;
    };

    // ── Simulation step ──────────────────────────────────────────────────────
    const step = (dt: number) => {
      gl.disable(gl.BLEND);

      curlProgram.bind();
      gl.uniform2f(curlProgram.uniforms['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(curlProgram.uniforms['uVelocity'], velocity.read.attach(0));
      blit(curl);

      vorticityProgram.bind();
      gl.uniform2f(vorticityProgram.uniforms['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(vorticityProgram.uniforms['uVelocity'], velocity.read.attach(0));
      gl.uniform1i(vorticityProgram.uniforms['uCurl'],     curl.attach(1));
      gl.uniform1f(vorticityProgram.uniforms['curl'],      config.CURL);
      gl.uniform1f(vorticityProgram.uniforms['dt'],        dt);
      blit(velocity.write); velocity.swap();

      divergenceProgram.bind();
      gl.uniform2f(divergenceProgram.uniforms['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(divergenceProgram.uniforms['uVelocity'], velocity.read.attach(0));
      blit(divergence);

      clearProgram.bind();
      gl.uniform1i(clearProgram.uniforms['uTexture'], pressure.read.attach(0));
      gl.uniform1f(clearProgram.uniforms['value'],    config.PRESSURE);
      blit(pressure.write); pressure.swap();

      pressureProgram.bind();
      gl.uniform2f(pressureProgram.uniforms['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(pressureProgram.uniforms['uDivergence'], divergence.attach(0));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms['uPressure'], pressure.read.attach(1));
        blit(pressure.write); pressure.swap();
      }

      gradientSubtractProgram.bind();
      gl.uniform2f(gradientSubtractProgram.uniforms['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gradientSubtractProgram.uniforms['uPressure'], pressure.read.attach(0));
      gl.uniform1i(gradientSubtractProgram.uniforms['uVelocity'], velocity.read.attach(1));
      blit(velocity.write); velocity.swap();

      advectionProgram.bind();
      gl.uniform2f(advectionProgram.uniforms['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
      if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms['dyeTexelSize'], velocity.texelSizeX, velocity.texelSizeY);
      const velId = velocity.read.attach(0);
      gl.uniform1i(advectionProgram.uniforms['uVelocity'],   velId);
      gl.uniform1i(advectionProgram.uniforms['uSource'],     velId);
      gl.uniform1f(advectionProgram.uniforms['dt'],          dt);
      gl.uniform1f(advectionProgram.uniforms['dissipation'], config.VELOCITY_DISSIPATION);
      blit(velocity.write); velocity.swap();

      if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms['dyeTexelSize'], dye.texelSizeX, dye.texelSizeY);
      gl.uniform1i(advectionProgram.uniforms['uVelocity'],   velocity.read.attach(0));
      gl.uniform1i(advectionProgram.uniforms['uSource'],     dye.read.attach(1));
      gl.uniform1f(advectionProgram.uniforms['dissipation'], config.DENSITY_DISSIPATION);
      blit(dye.write); dye.swap();
    };

    const drawDisplay = (target: FBO | null) => {
      const w = target ? target.width : gl.drawingBufferWidth;
      const h = target ? target.height : gl.drawingBufferHeight;
      displayMaterial.bind();
      if (config.SHADING) gl.uniform2f(displayMaterial.uniforms['texelSize'], 1 / w, 1 / h);
      gl.uniform1i(displayMaterial.uniforms['uTexture'], dye.read.attach(0));
      blit(target, false);
    };

    const render = (target: FBO | null) => {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      drawDisplay(target);
    };

    const resizeCanvas = () => {
      const w = scaleByPixelRatio(canvas.clientWidth);
      const h = scaleByPixelRatio(canvas.clientHeight);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        return true;
      }
      return false;
    };

    // ── Animation loop ───────────────────────────────────────────────────────
    let lastUpdateTime = Date.now();
    let colorUpdateTimer = 0;

    const updateFrame = () => {
      const now = Date.now();
      let dt = Math.min((now - lastUpdateTime) / 1000, 0.016666);
      lastUpdateTime = now;

      if (resizeCanvas()) initFramebuffers();

      colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
      if (colorUpdateTimer >= 1) {
        colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
        pointers.forEach(p => { p.color = generateColor(); });
      }

      for (const p of pointers) {
        if (p.moved) { p.moved = false; splatPointer(p); }
      }

      step(dt);
      render(null);
      this.animationId = requestAnimationFrame(updateFrame);
    };

    // ── Event listeners ──────────────────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      const p = pointers[0];
      updatePointerDown(p, -1, scaleByPixelRatio(e.clientX), scaleByPixelRatio(e.clientY));
      clickSplat(p);
    };

    const onMouseMove = (e: MouseEvent) => {
      const p = pointers[0];
      updatePointerMove(p, scaleByPixelRatio(e.clientX), scaleByPixelRatio(e.clientY), p.color);
    };

    const onTouchStart = (e: TouchEvent) => {
      const touches = e.targetTouches;
      const p = pointers[0];
      for (let i = 0; i < touches.length; i++) {
        updatePointerDown(p, touches[i].identifier, scaleByPixelRatio(touches[i].clientX), scaleByPixelRatio(touches[i].clientY));
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const touches = e.targetTouches;
      const p = pointers[0];
      for (let i = 0; i < touches.length; i++) {
        updatePointerMove(p, scaleByPixelRatio(touches[i].clientX), scaleByPixelRatio(touches[i].clientY), p.color);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        pointers[0].down = false;
      }
    };

    // First mouse move kicks off the loop
    const handleFirstMouseMove = (e: MouseEvent) => {
      const p = pointers[0];
      updatePointerMove(p, scaleByPixelRatio(e.clientX), scaleByPixelRatio(e.clientY), generateColor());
      updateKeywords();
      initFramebuffers();
      updateFrame();
      document.body.removeEventListener('mousemove', handleFirstMouseMove);
    };

    // First touch start kicks off the loop
    const handleFirstTouchStart = (e: TouchEvent) => {
      const touches = e.targetTouches;
      const p = pointers[0];
      for (let i = 0; i < touches.length; i++) {
        updatePointerDown(p, touches[i].identifier, scaleByPixelRatio(touches[i].clientX), scaleByPixelRatio(touches[i].clientY));
      }
      updateKeywords();
      initFramebuffers();
      updateFrame();
      document.body.removeEventListener('touchstart', handleFirstTouchStart);
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchstart', onTouchStart, false);
    window.addEventListener('touchmove', onTouchMove, false);
    window.addEventListener('touchend', onTouchEnd);
    document.body.addEventListener('mousemove', handleFirstMouseMove);
    document.body.addEventListener('touchstart', handleFirstTouchStart);

    // Store cleanup functions
    this.cleanupFns = [
      () => window.removeEventListener('mousedown', onMouseDown),
      () => window.removeEventListener('mousemove', onMouseMove),
      () => window.removeEventListener('touchstart', onTouchStart),
      () => window.removeEventListener('touchmove', onTouchMove),
      () => window.removeEventListener('touchend', onTouchEnd),
      () => document.body.removeEventListener('mousemove', handleFirstMouseMove),
      () => document.body.removeEventListener('touchstart', handleFirstTouchStart),
    ];
  }

  // ── WebGL context bootstrap ────────────────────────────────────────────────
  private getWebGLContext(canvas: HTMLCanvasElement) {
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    let gl = canvas.getContext('webgl2', params) as WebGL2RenderingContext | null;
    if (!gl) gl = (canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params)) as WebGL2RenderingContext | null;
    if (!gl) return { gl: null, ext: null };

    const isWebGL2 = 'drawBuffers' in gl;
    let supportLinearFiltering = false;
    let halfFloat: any = null;

    if (isWebGL2) {
      (gl as WebGL2RenderingContext).getExtension('EXT_color_buffer_float');
      supportLinearFiltering = !!(gl as WebGL2RenderingContext).getExtension('OES_texture_float_linear');
    } else {
      halfFloat = gl.getExtension('OES_texture_half_float');
      supportLinearFiltering = !!gl.getExtension('OES_texture_half_float_linear');
    }

    gl.clearColor(0, 0, 0, 1);
    const halfFloatTexType = isWebGL2
      ? (gl as WebGL2RenderingContext).HALF_FLOAT
      : (halfFloat?.HALF_FLOAT_OES ?? 0);

    const getSupportedFormat = (internalFormat: number, format: number): { internalFormat: number; format: number } | null => {
      if (!supportRenderTextureFormat(gl!, internalFormat, format, halfFloatTexType)) {
        if (isWebGL2) {
          const g2 = gl as WebGL2RenderingContext;
          if (internalFormat === g2.R16F)  return getSupportedFormat(g2.RG16F,   (g2 as any).RG);
          if (internalFormat === g2.RG16F) return getSupportedFormat(g2.RGBA16F, g2.RGBA);
        }
        return null;
      }
      return { internalFormat, format };
    };

    let formatRGBA, formatRG, formatR;
    if (isWebGL2) {
      const g2 = gl as WebGL2RenderingContext;
      formatRGBA = getSupportedFormat(g2.RGBA16F, gl.RGBA);
      formatRG   = getSupportedFormat(g2.RG16F,   (g2 as any).RG);
      formatR    = getSupportedFormat(g2.R16F,    (g2 as any).RED);
    } else {
      formatRGBA = getSupportedFormat(gl.RGBA, gl.RGBA);
      formatRG   = getSupportedFormat(gl.RGBA, gl.RGBA);
      formatR    = getSupportedFormat(gl.RGBA, gl.RGBA);
    }

    return { gl, ext: { formatRGBA, formatRG, formatR, halfFloatTexType, supportLinearFiltering } };
  }

  private makePointer(): PointerData {
    return { id: -1, texcoordX: 0, texcoordY: 0, prevTexcoordX: 0, prevTexcoordY: 0, deltaX: 0, deltaY: 0, down: false, moved: false, color: { r: 0, g: 0, b: 0 } };
  }
}

// ── Standalone WebGL helpers (module-level) ──────────────────────────────────

function supportRenderTextureFormat(gl: WebGLRenderingContext, internalFormat: number, format: number, type: number): boolean {
  const tex = gl.createTexture();
  if (!tex) return false;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
  const fbo = gl.createFramebuffer();
  if (!fbo) return false;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string, keywords: string[] | null = null): WebGLShader | null {
  if (keywords) source = keywords.map(k => `#define ${k}`).join('\n') + '\n' + source;
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function createGLProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

function getUniforms(gl: WebGLRenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation> {
  const uniforms: Record<string, WebGLUniformLocation> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) {
      const loc = gl.getUniformLocation(program, info.name);
      if (loc) uniforms[info.name] = loc;
    }
  }
  return uniforms;
}

class GLProgram {
  program: WebGLProgram | null;
  uniforms: Record<string, WebGLUniformLocation>;
  private gl: WebGLRenderingContext;

  constructor(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader) {
    this.gl = gl;
    this.program = createGLProgram(gl, vs, fs);
    this.uniforms = this.program ? getUniforms(gl, this.program) : {};
  }

  bind() { if (this.program) this.gl.useProgram(this.program); }
}

class GLMaterial {
  private gl: WebGLRenderingContext;
  private vs: WebGLShader;
  private fragmentSource: string;
  private programs: Record<number, WebGLProgram | null> = {};
  private activeProgram: WebGLProgram | null = null;
  uniforms: Record<string, WebGLUniformLocation> = {};

  constructor(gl: WebGLRenderingContext, vs: WebGLShader, fragmentSource: string) {
    this.gl = gl;
    this.vs = vs;
    this.fragmentSource = fragmentSource;
  }

  setKeywords(keywords: string[]) {
    let hash = keywords.reduce((h, k) => {
      for (let i = 0; i < k.length; i++) h = (h << 5) - h + k.charCodeAt(i) | 0;
      return h;
    }, 0);

    let prog = this.programs[hash];
    if (prog == null) {
      const fs = compileShader(this.gl, this.gl.FRAGMENT_SHADER, this.fragmentSource, keywords);
      prog = createGLProgram(this.gl, this.vs, fs!);
      this.programs[hash] = prog;
    }
    if (prog === this.activeProgram) return;
    if (prog) this.uniforms = getUniforms(this.gl, prog);
    this.activeProgram = prog;
  }

  bind() { if (this.activeProgram) this.gl.useProgram(this.activeProgram); }
}
