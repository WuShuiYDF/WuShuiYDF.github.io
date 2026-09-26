// WorldHero v3：mimo 风格 3D 首屏——精修悬浮岛群 + 小机器人 + 云 + 水晶 + 能量环 + 萤火
// 全程序化（零模型文件）：顶点噪声形变有机岩石 / 软阴影 / ACES 调色 / 辉光贴片
// 拖拽旋转 / 鼠标视差 / 入场动画 / 待机（眨眼·摆臂·挥手·点击跳跃）/ 主题自适应雾
// 后台标签页暂停 / reduced-motion 静帧 / WebGL 失败自动移除（CSS 轨道环兜底）
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export interface WorldHeroHandle {
  dispose: () => void;
}

/** 伪噪声：多频正弦叠加（确定性，无依赖） */
function noise3(x: number, y: number, z: number): number {
  return (
    Math.sin(x * 3.1 + 0.4) * 0.5 +
    Math.sin(y * 2.7 + 1.3) * 0.3 +
    Math.sin(z * 3.7 + 2.1) * 0.2
  );
}

/** 有机岩石：icosphere 顶点沿法线噪声形变 + 平滑着色 */
function makeRock(radius: number, detail: number, amp: number, squash = 1): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = noise3(v.x * 1.4 / radius, v.y * 1.4 / radius, v.z * 1.4 / radius);
    v.multiplyScalar(1 + n * amp);
    v.y *= squash;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** 径向渐变辉光贴图（Sprite 用） */
function makeGlowTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.32)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function initWorldHero(container: HTMLElement): WorldHeroHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch {
    return null;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 767px)').matches;

  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = !isMobile;
  renderer.shadowMap.type = THREE.PCFShadowMap; // 新版 three 移除了 PCFSoft，PCF + 大 radius 等效柔影
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';
  if (!isMobile) renderer.domElement.style.cursor = 'grab';
  container.appendChild(renderer.domElement);


  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(0, 1.2, 6.2);

  // 背景/雾同色随主题（canvas 全幅，泛光后期需要不透明背景）
  const fogColor = new THREE.Color(
    document.documentElement.dataset.theme === 'light' ? 0xfaf7f1 : 0x262322,
  );
  scene.fog = new THREE.Fog(fogColor, 8, 15);

  // 渐变天幕：暖地平线 → 深顶部（主题切换时换色）
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      cTop: { value: new THREE.Color(0x1a1714) },
      cBottom: { value: new THREE.Color(0x453b33) },
    },
    vertexShader:
      'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader:
      'varying vec3 vP; uniform vec3 cTop; uniform vec3 cBottom; void main(){ float h = normalize(vP).y * 0.5 + 0.5; gl_FragColor = vec4(mix(cBottom, cTop, smoothstep(0.18, 0.9, h)), 1.0); }',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(42, 32, 15), skyMat);
  scene.add(sky);

  // 场景内地面网格（雾中渐隐，替代 CSS 格栅）
  const grid = new THREE.GridHelper(36, 46, 0x6db3a3, 0x6b6259);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.14;
  grid.position.set(0.9, -2.8, 0);
  scene.add(grid);
  // Studio 环境贴图：给所有 PBR 材质带来陶瓷/塑料反光质感（threeui 式材质感的核心）
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  // 软渲染检测（SwiftShader/llvmpipe）：bloom 在其上会失败，自动降级
  let gpuName = '';
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) gpuName = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '');
  } catch { /* 忽略 */ }
  const isSoftware = /swiftshader|llvmpipe|software|basic render/i.test(gpuName);

  // Bloom 泛光：真硬件 GPU 默认开启
  const useBloom = !isMobile && !reduced && !isSoftware;
  let composer: EffectComposer | null = null;
  if (useBloom) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), 0.45, 0.75, 0.78));
    composer.addPass(new OutputPass());
  }
  const fogObserver = new MutationObserver(() => {
    const light = document.documentElement.dataset.theme === 'light';
    fogColor.set(light ? 0xfaf7f1 : 0x262322);
    skyMat.uniforms.cTop.value.set(light ? 0xffffff : 0x1a1714);
    skyMat.uniforms.cBottom.value.set(light ? 0xe9e2d5 : 0x453b33);
    grid.material.needsUpdate = true;
  });
  fogObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ── 灯光 ──
  scene.add(new THREE.HemisphereLight(0xf6e9d4, 0x241f1c, 1.0));
  const sun = new THREE.DirectionalLight(0xffe8c9, 2.1);
  sun.position.set(3.2, 5.5, 2.4);
  sun.castShadow = !isMobile;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -4;
  sun.shadow.camera.right = 4;
  sun.shadow.camera.top = 4;
  sun.shadow.camera.bottom = -4;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 14;
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const rimLight = new THREE.DirectionalLight(0x9ad7c8, 0.7);
  rimLight.position.set(-4, 2.4, -3);
  scene.add(rimLight);
  const under = new THREE.PointLight(0x6db3a3, 9, 11);
  under.position.set(-0.7, -1.9, 1.3);
  scene.add(under);

  const mat = (color: number, rough = 0.95) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.04 });
  const glowMat = (color: number, intensity = 1.4) =>
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.35 });

  const glowTex = makeGlowTexture();
  function addGlow(parent: THREE.Object3D, color: number, size: number, pos: [number, number, number], opacity = 0.55) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    s.scale.setScalar(size);
    s.position.set(...pos);
    parent.add(s);
    return s;
  }

  // ── 岛生成器：平坦台地 + 倒锥岩底 + 层叠岩架 + 缘石垂草（经典浮岛剖面） ──
  function makeIsland(size: number): { group: THREE.Group; topY: number } {
    const g = new THREE.Group();

    // 台地：宽扁有机圆盘（顶部平台）
    const plateau = new THREE.Mesh(makeRock(1.3 * size, 3, 0.05, 0.16), mat(0x3a342f));
    plateau.scale.y = 0.5;
    plateau.castShadow = true;
    plateau.receiveShadow = true;
    g.add(plateau);

    // 倒锥岩底：带噪声的锥体（上宽下尖，棱角参差）
    const coneGeo = new THREE.ConeGeometry(1.12 * size, 1.7 * size, 11, 5, true);
    coneGeo.rotateX(Math.PI);
    coneGeo.translate(0, -0.85 * size, 0);
    const cPos = coneGeo.getAttribute('position') as THREE.BufferAttribute;
    const cv = new THREE.Vector3();
    for (let i = 0; i < cPos.count; i++) {
      cv.fromBufferAttribute(cPos, i);
      const n = noise3(cv.x * 2.2 / size, cv.y * 1.6 / size, cv.z * 2.2 / size);
      cv.x += n * 0.09 * size;
      cv.z += n * 0.07 * size;
      if (cv.y < -0.2 * size) cv.y += n * 0.05 * size;
      cPos.setXYZ(i, cv.x, cv.y, cv.z);
    }
    coneGeo.computeVertexNormals();
    const cone = new THREE.Mesh(coneGeo, mat(0x322d29));
    cone.position.y = -0.18 * size;
    cone.castShadow = true;
    g.add(cone);

    // 底部尖岩
    const key = new THREE.Mesh(makeRock(0.3 * size, 2, 0.14, 1.9), mat(0x262322));
    key.position.y = -1.75 * size;
    key.castShadow = true;
    g.add(key);

    // 层叠岩架：锥体侧面不同高度探出的石板
    for (const [ly, lr, ls] of [[-0.55, 0.55, 1], [-1.0, 0.38, 0.8], [-0.35, 0.3, 0.6]]) {
      const ledge = new THREE.Mesh(makeRock(lr * size, 2, 0.08, 0.35), mat(0x2e2a27));
      ledge.position.set(0.35 * size, ly * size, -0.2 * size);
      ledge.scale.y = 0.5;
      ledge.rotation.y = 0.6;
      ledge.castShadow = true;
      g.add(ledge);
    }

    // 草地顶盖：覆盖台地、边缘微微垂下
    const grass = new THREE.Mesh(makeRock(1.36 * size, 3, 0.04, 0.3), mat(0x4e9a8a));
    grass.position.y = 0.3 * size;
    grass.scale.y = 0.5;
    grass.castShadow = true;
    grass.receiveShadow = true;
    g.add(grass);

    // 缘石：草缘嵌着的圆润巨石
    for (const [bx, bz, bs] of [[1.02, 0.3, 0.14], [-0.9, -0.45, 0.11], [0.5, -1.0, 0.1]]) {
      const boulder = new THREE.Mesh(makeRock(bs * size, 2, 0.12), mat(0x5a534b));
      boulder.position.set(bx * size, 0.26 * size, bz * size);
      boulder.castShadow = true;
      g.add(boulder);
    }

    // 垂草簇：台地边缘向下的小草锥
    for (const [tx, tz] of [[1.18, 0.15], [0.75, 1.0], [-0.35, 1.22], [-1.22, -0.2], [0.2, -1.25]]) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.05 * size, 0.2 * size, 5), mat(0x44897b));
      tuft.position.set(tx * size, -0.05 * size, tz * size);
      tuft.rotation.x = Math.PI;
      g.add(tuft);
    }

    return { group: g, topY: 0.42 * size };
  }

  // ── 装饰生成器 ──
  function makeTree(size: number) {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * size, 0.055 * size, 0.34 * size, 7), mat(0x5a4a3a, 0.9));
    trunk.position.y = 0.17 * size;
    trunk.castShadow = true;
    t.add(trunk);
    for (const [x, y, z, r, c] of [[0, 0.42, 0, 0.24, 0x4e9a8a], [0.14, 0.34, 0.06, 0.16, 0x44897b], [-0.12, 0.36, -0.05, 0.15, 0x5aa897]]) {
      const blob = new THREE.Mesh(makeRock(r * size, 2, 0.07), mat(c));
      blob.position.set(x * size, y * size, z * size);
      blob.castShadow = true;
      t.add(blob);
    }
    // 果子（奶油色小圆点）
    const berryMat = mat(0xead9bd, 0.5);
    for (const [bx, by, bz] of [[0.16, 0.5, 0.1], [-0.1, 0.56, 0.12], [0.05, 0.48, -0.14]]) {
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.022 * size, 10, 8), berryMat);
      berry.position.set(bx * size, by * size, bz * size);
      t.add(berry);
    }
    return t;
  }

  function makeCrystal(size: number): THREE.Mesh {
    const geo = new THREE.OctahedronGeometry(0.16 * size, 0);
    geo.scale(1, 1.9, 1);
    const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
      color: 0x8fe0cf, emissive: 0x6db3a3, emissiveIntensity: 0.9,
      roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.92,
      clearcoat: 1, clearcoatRoughness: 0.06, // 玻璃水晶感
    }));
    m.castShadow = true;
    return m;
  }

  // ── 主岛 ──
  const island = new THREE.Group();
  const main = makeIsland(1);
  island.add(main.group);
  island.scale.setScalar(0.92);
  island.position.x = 0.9;
  scene.add(island);

  const tree = makeTree(1);
  tree.position.set(-0.52, main.topY - 0.05, 0.18);
  island.add(tree);
  const tree2 = makeTree(0.55);
  tree2.position.set(0.16, main.topY - 0.04, -0.55);
  tree2.rotation.y = 1.2;
  island.add(tree2);

  // 草簇
  for (const [x, z, s] of [[0.4, 0.5, 1], [-0.15, 0.62, 0.8], [0.62, -0.28, 1.2], [-0.6, -0.32, 0.9], [0.1, 0.66, 0.7], [-0.36, 0.4, 0.6]]) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.045 * s, 0.15 * s, 5), mat(0x5fa898));
    blade.position.set(x, main.topY + 0.02, z);
    blade.castShadow = true;
    island.add(blade);
  }

  // 小花 ×3（细茎 + 奶油花瓣 + 青芯）
  const flowerSpots: [number, number][] = [[-0.3, 0.52], [0.5, 0.36], [-0.05, 0.4]];
  for (const [fx, fz] of flowerSpots) {
    const flower = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.09, 5), mat(0x44897b));
    stem.position.y = 0.045;
    flower.add(stem);
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), mat(0xead9bd, 0.5));
    petal.position.y = 0.1;
    petal.scale.y = 0.7;
    flower.add(petal);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), glowMat(0x6db3a3, 1.2));
    core.position.set(0, 0.115, 0.015);
    flower.add(core);
    flower.position.set(fx, main.topY + 0.05, fz);
    island.add(flower);
  }

  // 鹅卵石 ×3
  for (const [px, pz, ps] of [[0.6, 0.42, 0.07], [-0.52, 0.3, 0.05], [0.2, 0.58, 0.06]]) {
    const pebble = new THREE.Mesh(makeRock(ps, 1, 0.18), mat(0x5a534b));
    pebble.position.set(px, main.topY + 0.04, pz);
    pebble.castShadow = true;
    island.add(pebble);
  }

  // 垂藤 ×3（岛缘垂下，微微摇摆）
  const vines: THREE.Group[] = [];
  for (const [vx, vz, vl] of [[-1.02, -0.18, 0.55], [0.9, -0.55, 0.42], [0.3, -1.05, 0.6]]) {
    const vine = new THREE.Group();
    const stemM = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.005, vl, 5), mat(0x44897b));
    stemM.position.y = -vl / 2;
    vine.add(stemM);
    for (const ly of [-vl * 0.35, -vl * 0.7, -vl * 0.95]) {
      const leaf = new THREE.Mesh(makeRock(0.035, 1, 0.15), mat(0x5aa897));
      leaf.position.set(0.02, ly, 0);
      leaf.scale.y = 0.5;
      vine.add(leaf);
    }
    vine.position.set(vx, 0.05, vz);
    island.add(vine);
    vines.push(vine);
  }

  // 小瀑布：池塘沿岛缘倾泻（循环水滴 + 底部水雾辉光）
  const DROP_COUNT = isMobile ? 26 : 48;
  const dropPositions = new Float32Array(DROP_COUNT * 3);
  const dropSeeds: { phase: number; sway: number }[] = [];
  for (let i = 0; i < DROP_COUNT; i++) {
    dropSeeds.push({ phase: Math.random(), sway: (Math.random() - 0.5) * 0.12 });
    dropPositions.set([0, -10, 0], i * 3);
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dropPositions, 3));
  const waterfall = new THREE.Points(dGeo, new THREE.PointsMaterial({
    size: 0.035, color: 0x9adfd2, transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  island.add(waterfall);
  addGlow(island, 0x6db3a3, 0.8, [0.75, -1.35, -0.52], 0.3);

  // 发光水晶簇（岛侧，嵌入岩体）
  for (const [x, y, z, s, rz] of [[-0.88, -0.3, 0.3, 1, 0.5], [-0.74, -0.62, -0.2, 0.7, -0.4], [0.95, -0.42, 0.05, 0.85, 0.9]]) {
    const cluster = new THREE.Group();
    const main2 = makeCrystal(s);
    cluster.add(main2);
    for (const [ox, oz, ss, orz] of [[0.09, 0.05, 0.55, 0.9], [-0.07, -0.06, 0.4, -0.5]]) {
      const sub = makeCrystal(s * ss);
      sub.position.set(ox, -0.03, oz);
      sub.rotation.z = orz;
      cluster.add(sub);
    }
    cluster.position.set(x, y, z);
    cluster.rotation.set(0.15, 0.3, rz);
    island.add(cluster);
    addGlow(island, 0x6db3a3, 0.9, [x, y, z], 0.35);
  }
  // 发光池塘
  const pondMat = glowMat(0x6db3a3, 0.55);
  pondMat.roughness = 0.12;
  pondMat.metalness = 0.5;
  const pond = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.025, 24), pondMat);
  pond.position.set(0.45, main.topY + 0.03, -0.3);
  island.add(pond);

  // 岛下悬浮碎岩
  const debris: THREE.Mesh[] = [];
  for (const [x, y, z, s] of [[0.95, -1.15, 0.4, 0.15], [-0.75, -1.55, 0.2, 0.11], [0.25, -1.95, -0.5, 0.17], [1.35, -0.7, -0.6, 0.09]]) {
    const rock = new THREE.Mesh(makeRock(s, 2, 0.15), mat(0x302b27));
    rock.position.set(x, y, z);
    rock.castShadow = true;
    debris.push(rock);
    island.add(rock);
  }
  // 岛底辉光
  addGlow(island, 0x6db3a3, 3.4, [0, -1.5, 0], 0.4);

  // 流星（每 7~13s 一颗，从右上划向左下）
  const meteor = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0xbfeee2, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  meteor.scale.set(2.2, 0.35, 1);
  scene.add(meteor);
  let meteorStart = -10;
  const nextMeteorIn = () => 7 + Math.random() * 6;

  // ── 卫星岛 ×2 ──
  const sat1 = makeIsland(0.36);
  sat1.group.position.set(-1.85, 1.0, -1.6);
  scene.add(sat1.group);
  const satTree = makeTree(0.5);
  satTree.position.y = sat1.topY - 0.04;
  sat1.group.add(satTree);
  const sat2 = makeIsland(0.26);
  sat2.group.position.set(2.1, -0.85, -2.0);
  scene.add(sat2.group);
  const satCrystal = makeCrystal(0.6);
  satCrystal.position.y = sat2.topY + 0.05;
  sat2.group.add(satCrystal);

  // ── 云 ×4（会漂的棉花云） ──
  const clouds = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d2, roughness: 1, transparent: true, opacity: 0.92 });
  for (const [x, y, z, s] of [[-2.6, 1.9, -1.2, 1], [2.8, 2.4, -2.0, 1.3], [-3.2, -0.6, -2.4, 0.9], [1.2, 2.9, -3.2, 0.8]]) {
    const cloud = new THREE.Group();
    for (const [dx, dy, dz, r] of [[0, 0, 0, 0.32], [0.3, -0.04, 0.05, 0.24], [-0.28, -0.05, 0.04, 0.22], [0.06, 0.16, -0.02, 0.2]]) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r * s, 14, 12), cloudMat);
      puff.position.set(dx * s, dy * s, dz * s);
      cloud.add(puff);
    }
    cloud.position.set(x, y, z);
    clouds.add(cloud);
  }
  scene.add(clouds);

  // ── 能量环 ──
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x6db3a3, transparent: true, opacity: 0.22, side: THREE.DoubleSide });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.009, 8, 100), ringMat);
  ring1.rotation.x = Math.PI / 2.15;
  ring1.position.set(0.9, 0.42, 0);
  scene.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.006, 8, 100), ringMat);
  ring2.rotation.x = Math.PI / 1.85;
  ring2.rotation.y = 0.4;
  ring2.position.set(0.9, 0.62, 0);
  scene.add(ring2);

  // ── 小机器人 v3：大头比例 / 耳罩 / 胸口核心 / 挥手 ──
  const robot = new THREE.Group();
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: 0xd8d0c4, roughness: 0.3, metalness: 0.05,
    clearcoat: 0.65, clearcoatRoughness: 0.25, // 陶瓷玩具质感
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e1c1b, roughness: 0.35, metalness: 0.3 });
  const eyeMat = glowMat(0x6db3a3, 2.6);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.135, 0.14, 8, 20), shellMat);
  body.castShadow = true;
  robot.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.05, 12), darkMat);
  neck.position.y = 0.16;
  robot.add(neck);
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.035, 18), glowMat(0x6db3a3, 1.8));
  core.position.set(0, 0.02, 0.137);
  robot.add(core);

  const head = new THREE.Group();
  head.position.y = 0.33;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 30, 24), shellMat);
  skull.castShadow = true;
  head.add(skull);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.155, 24, 18, 0, Math.PI * 2, 0.95, 0.8), darkMat);
  visor.position.z = 0.045;
  head.add(visor);
  const eyes: THREE.Mesh[] = [];
  for (const ex of [-0.06, 0.06]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 12), eyeMat);
    eye.position.set(ex, 0.005, 0.125);
    head.add(eye);
    eyes.push(eye);
  }
  for (const ex of [-0.185, 0.185]) { // 耳罩
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.035, 16), darkMat);
    ear.rotation.z = Math.PI / 2;
    ear.position.set(ex, 0, 0);
    head.add(ear);
    const earDot = new THREE.Mesh(new THREE.CircleGeometry(0.022, 14), glowMat(0x6db3a3, 1.5));
    earDot.position.set(ex * 1.12, 0, 0);
    earDot.rotation.y = ex > 0 ? Math.PI / 2 : -Math.PI / 2;
    head.add(earDot);
  }
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6), darkMat);
  antenna.position.y = 0.24;
  head.add(antenna);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), eyeMat);
  antTip.position.y = 0.3;
  head.add(antTip);
  addGlow(head, 0x6db3a3, 0.5, [0, 0.3, 0], 0.4);
  robot.add(head);

  const arms: THREE.Group[] = [];
  for (const ax of [-0.17, 0.17]) {
    const arm = new THREE.Group();
    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.13, 6, 14), shellMat);
    limb.position.y = -0.09;
    limb.castShadow = true;
    arm.add(limb);
    const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 12), shellMat);
    wrist.position.y = -0.17;
    arm.add(wrist);
    arm.position.set(ax, 0.05, 0);
    arm.rotation.z = ax > 0 ? -0.25 : 0.25;
    robot.add(arm);
    arms.push(arm);
  }
  // 悬停喷口（底部两只小喷嘴 + 辉光）
  for (const jx of [-0.06, 0.06]) {
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.035, 10), darkMat);
    jet.position.set(jx, -0.16, 0);
    robot.add(jet);
  }
  addGlow(robot, 0x6db3a3, 0.32, [0, -0.2, 0], 0.5);
  const shadowBlob = new THREE.Mesh(
    new THREE.CircleGeometry(0.17, 22),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 }),
  );
  shadowBlob.rotation.x = -Math.PI / 2;
  shadowBlob.position.y = -0.38;
  robot.add(shadowBlob);
  robot.position.set(0.3, main.topY + 0.45, 0.62);
  robot.rotation.y = 0.35;
  island.add(robot);

  // ── 真模型机器人（RobotExpressive，CC0，含 13 个骨骼动画）──
  let mixer: THREE.AnimationMixer | null = null;
  const actions: Record<string, THREE.AnimationAction> = {};
  let gltfRobot: THREE.Group | null = null;
  new GLTFLoader().load(
    '/models/RobotExpressive.glb',
    (gltf) => {
      const model = gltf.scene;
      model.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          o.castShadow = true;
          const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (m && 'envMapIntensity' in m) m.envMapIntensity = 0.7;
        }
      });
      // 归一化：目标身高 0.6，脚底落地
      const box = new THREE.Box3().setFromObject(model);
      model.scale.setScalar(0.6 / (box.max.y - box.min.y));
      const box2 = new THREE.Box3().setFromObject(model);
      model.position.y = -box2.min.y;
      const wrapper = new THREE.Group();
      wrapper.add(model);
      wrapper.position.set(0.3, main.topY + 0.4, 0.62);
      island.add(wrapper);
      robot.visible = false; // 程序化机器人退役（加载失败时保留兜底）
      gltfRobot = wrapper;
      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);
        actions['Idle']?.play();
        mixer.addEventListener('finished', () => {
          actions['Idle']?.reset().fadeIn(0.25).play();
        });
      }
    },
    undefined,
    () => { /* 加载失败：静默保留程序化机器人兜底 */ },
  );

  /** 播放一次动画后回落 Idle */
  let waveStart = -10;
  function playOnce(name: string) {
    const a = actions[name];
    if (!a || !mixer) return;
    a.reset();
    a.setLoop(THREE.LoopOnce, 1);
    a.clampWhenFinished = false;
    a.fadeIn(0.15).play();
  }

  // ── 萤火粒子 ──
  const COUNT = isMobile ? 80 : 170;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const seeds: { base: THREE.Vector3; phase: number; speed: number; amp: number }[] = [];
  const teal = new THREE.Color(0x6db3a3);
  const warm = new THREE.Color(0xe8c9a0);
  for (let i = 0; i < COUNT; i++) {
    const base = new THREE.Vector3((Math.random() - 0.5) * 5.5, Math.random() * 3.4 - 0.7, (Math.random() - 0.5) * 5.5);
    positions.set([base.x, base.y, base.z], i * 3);
    const c = Math.random() > 0.35 ? teal : warm;
    colors.set([c.r, c.g, c.b], i * 3);
    seeds.push({ base, phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.5, amp: 0.1 + Math.random() * 0.28 });
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.05, vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(particles);

  // ── 交互 ──
  const pointer = { x: 0, y: 0 };
  const drag = { active: false, moved: 0, lastX: 0, lastY: 0, velY: 0, rotX: 0 };
  const onPointerMove = (e: PointerEvent) => {
    if (drag.active && e.pointerType !== 'touch') {
      const dx = e.clientX - drag.lastX;
      drag.velY += dx * 0.004;
      drag.rotX = THREE.MathUtils.clamp(drag.rotX + (e.clientY - drag.lastY) * 0.003, -0.25, 0.35);
      drag.moved += Math.abs(dx) + Math.abs(e.clientY - drag.lastY);
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      return;
    }
    const rect = container.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  };
  let jumpStart = -10;
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    drag.active = true;
    drag.moved = 0;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    renderer.domElement.style.cursor = 'grabbing';
  };
  const onPointerUp = () => {
    if (drag.active && drag.moved < 6) {
      jumpStart = performance.now() / 1000;
      playOnce('Jump'); // 真模型：播放骨骼跳跃动画
    }
    drag.active = false;
    renderer.domElement.style.cursor = 'grab';
  };
  if (!isMobile && !reduced) {
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
  }

  // 环境反射强度统一收敛（暖夜景氛围，不过曝）
  scene.traverse((obj) => {
    const m = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (m && 'envMapIntensity' in m) m.envMapIntensity = 0.55;
  });

  // ── 渲染循环 ──
  const born = performance.now() / 1000;
  let raf = 0;
  let visible = true;
  let lastBlink = 0;
  let nextBlink = 2.5;
  const nextWaveIn = () => 6 + Math.random() * 5;
  let lastWave = -10;
  let nextWave = nextWaveIn();
  let nextMeteor = 3 + Math.random() * 4;
  const camTarget = new THREE.Vector3();

  let lastT = performance.now() / 1000;
  const tick = () => {
    const t = performance.now() / 1000;
    const dt = Math.min(t - lastT, 0.05);
    lastT = t;
    const age = t - born;

    // 入场：岛浮起 + 相机推进
    const intro = Math.min(Math.max(age / 1.5, 0), 1);
    const eased = 1 - Math.pow(1 - intro, 3);
    const introSet = reduced ? 1 : eased;
    island.position.y = (1 - introSet) * -1.6 + Math.sin(t * 0.8) * 0.07;
    island.scale.setScalar(0.92 * (0.72 + 0.28 * introSet));
    camera.position.z = 6.7 + (1 - introSet) * 1.7;

    // 岛自转 + 拖拽惯性
    island.rotation.y += 0.0015 + drag.velY;
    drag.velY *= 0.93;
    island.rotation.x = THREE.MathUtils.lerp(island.rotation.x, drag.rotX * 0.5, 0.06);

    // 云漂移
    clouds.rotation.y += 0.00035;
    clouds.children.forEach((c, i) => {
      c.position.y += Math.sin(t * 0.4 + i * 1.7) * 0.0004;
    });

    // 卫星岛 / 碎岩 / 能量环
    sat1.group.position.y = 1.0 + Math.sin(t * 0.7 + 1.5) * 0.1;
    sat1.group.rotation.y += 0.002;
    sat2.group.position.y = -0.85 + Math.sin(t * 0.55 + 3) * 0.09;
    sat2.group.rotation.y -= 0.0016;
    debris.forEach((rock, i) => {
      rock.position.y += Math.sin(t * 0.9 + i * 1.8) * 0.0008;
      rock.rotation.y += 0.001;
    });
    ring1.rotation.z += 0.0011;
    ring2.rotation.z -= 0.0007;

    // 流星动画
    const mAge = t - meteorStart;
    if (mAge > nextMeteor) {
      meteorStart = t;
      nextMeteor = nextMeteorIn();
    }
    if (mAge >= 0 && mAge < 1.1) {
      const p = mAge / 1.1;
      meteor.position.set(2.6 - p * 5.2, 2.8 - p * 2.6, -2.2);
      (meteor.material as THREE.SpriteMaterial).opacity = Math.sin(p * Math.PI) * 0.9;
    } else {
      (meteor.material as THREE.SpriteMaterial).opacity = 0;
    }

    // 瀑布水滴循环下落（带抛物线外飘）
    const dpos = dGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < DROP_COUNT; i++) {
      const sd = dropSeeds[i];
      const p = (t * 0.55 + sd.phase) % 1;
      const fall = p * 2.6;
      dpos.setXYZ(
        i,
        0.66 + p * 0.35 + sd.sway * Math.sin(t * 2 + sd.phase * 9),
        main.topY - 0.05 - fall,
        -0.42 - p * 0.18,
      );
    }
    dpos.needsUpdate = true;
    // 垂藤摇摆
    vines.forEach((v, i) => {
      v.rotation.x = Math.sin(t * 0.8 + i * 2.1) * 0.06;
      v.rotation.z = Math.cos(t * 0.6 + i * 1.4) * 0.05;
    });

    // 池塘涟漪（呼吸缩放）+ 天线灯呼吸
    pond.scale.setScalar(1 + Math.sin(t * 1.8) * 0.04);
    const eyePulse = 2.2 + Math.sin(t * 2.4) * 0.6;
    (antTip.material as THREE.MeshStandardMaterial).emissiveIntensity = eyePulse;

    // 机器人：呼吸悬浮 / 摆臂 / 看鼠标 / 眨眼 / 挥手 / 跳跃
    let jump = 0;
    const jt = t - jumpStart;
    if (jt >= 0 && jt < 0.6) {
      jump = Math.sin((jt / 0.6) * Math.PI) * 0.26;
      robot.rotation.z = Math.sin((jt / 0.6) * Math.PI * 2) * 0.07;
    } else {
      robot.rotation.z = 0;
    }
    robot.position.y = main.topY + 0.5 + Math.sin(t * 1.15) * 0.045 + jump;
    robot.rotation.y = -island.rotation.y + 0.35; // 抵消岛自转，始终面向镜头
    arms[0].rotation.x = Math.sin(t * 1.6) * 0.09;
    // 真模型动画驱动 + 面向镜头 + 周期挥手
    if (mixer) mixer.update(dt);
    if (gltfRobot) {
      gltfRobot.rotation.y = -island.rotation.y + 0.3;
      gltfRobot.position.y = main.topY + 0.4 + Math.sin(t * 1.15) * 0.03;
      const waveAge2 = t - waveStart;
      if (waveAge2 > nextWave) {
        waveStart = t;
        nextWave = nextWaveIn();
        playOnce('Wave');
      }
    }

    // 周期性挥手（右臂举起摆动，程序化兜底机器人用）
    const waveAge = t - lastWave;
    if (waveAge > nextWave) {
      lastWave = t;
      nextWave = nextWaveIn();
    }
    if (waveAge < 1.6) {
      const w = Math.sin(waveAge * 10) * 0.5;
      arms[1].rotation.z = -2.2 + w * 0.4;
      arms[1].rotation.x = 0;
    } else {
      arms[1].rotation.z = THREE.MathUtils.lerp(arms[1].rotation.z, -0.25, 0.1);
      arms[1].rotation.x = Math.sin(t * 1.6 + 1) * 0.09;
    }
    head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, pointer.x * 0.75, 0.08);
    head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, pointer.y * 0.35, 0.08);
    if (t - lastBlink > nextBlink) {
      lastBlink = t;
      nextBlink = 2.4 + Math.random() * 2.6;
      eyes.forEach((eye) => {
        eye.scale.y = 0.08;
        setTimeout(() => (eye.scale.y = 1), 130);
      });
    }

    // 粒子漂移
    const pos = pGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      pos.setY(i, s.base.y + Math.sin(t * s.speed + s.phase) * s.amp);
      pos.setX(i, s.base.x + Math.cos(t * s.speed * 0.6 + s.phase) * s.amp * 0.6);
    }
    pos.needsUpdate = true;

    // 相机视差
    camTarget.set(pointer.x * 0.5, 1.2 + pointer.y * 0.28, 6.7);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTarget.x, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, camTarget.y, 0.05);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTarget.z, 0.05);
    camera.lookAt(0.55, 0.3, 0);
    if (composer) composer.render();
    else renderer.render(scene, camera);
    if (visible && !reduced) raf = requestAnimationFrame(tick);
  };

  if (reduced) {
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(tick);
  }

  const onVis = () => {
    visible = !document.hidden;
    if (visible && !reduced) {
      raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf);
    }
  };
  document.addEventListener('visibilitychange', onVis);

  const ro = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer?.setSize(w, h);
    if (reduced) renderer.render(scene, camera);
  });
  ro.observe(container);

  return {
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      fogObserver.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Sprite) {
          if ('geometry' in obj) (obj as THREE.Mesh).geometry.dispose();
          const m = (obj as THREE.Mesh).material;
          (Array.isArray(m) ? m : [m]).forEach((m2) => {
            if (m2 instanceof THREE.SpriteMaterial) m2.map?.dispose();
            m2.dispose();
          });
        }
      });
      composer?.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
