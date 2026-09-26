// WorldHero v3：mimo 风格 3D 首屏——精修悬浮岛群 + 小机器人 + 云 + 水晶 + 能量环 + 萤火
// 全程序化（零模型文件）：顶点噪声形变有机岩石 / 软阴影 / ACES 调色 / 辉光贴片
// 拖拽旋转 / 鼠标视差 / 入场动画 / 待机（眨眼·摆臂·挥手·点击跳跃）/ 主题自适应雾
// 后台标签页暂停 / reduced-motion 静帧 / WebGL 失败自动移除（CSS 轨道环兜底）
import * as THREE from 'three';

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
  // @ts-ignore three 新版本标记弃用但仍是软阴影标准实现
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';
  if (!isMobile) renderer.domElement.style.cursor = 'grab';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(0, 1.2, 6.2);

  // 雾随主题变色
  const fogColor = new THREE.Color(
    document.documentElement.dataset.theme === 'light' ? 0xfaf7f1 : 0x262322,
  );
  scene.fog = new THREE.Fog(fogColor, 8, 15);
  const fogObserver = new MutationObserver(() => {
    fogColor.set(document.documentElement.dataset.theme === 'light' ? 0xfaf7f1 : 0x262322);
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
  under.position.set(-1.5, -1.8, 1.3);
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

  // ── 岛生成器（有机岩石 + 草地顶盖） ──
  function makeIsland(size: number): { group: THREE.Group; topY: number } {
    const g = new THREE.Group();
    // 岩石主体：向下拉长的有机岩石
    const soil = new THREE.Mesh(makeRock(0.98 * size, 2, 0.16, 1.6), mat(0x322d29));
    soil.position.y = -0.52 * size;
    soil.castShadow = true;
    soil.receiveShadow = true;
    g.add(soil);
    // 底部尖岩
    const key = new THREE.Mesh(makeRock(0.34 * size, 1, 0.2, 1.9), mat(0x262322));
    key.position.y = -1.28 * size;
    key.castShadow = true;
    g.add(key);
    // 草地顶盖：扁平有机圆盘微微超出岩石边缘
    const grass = new THREE.Mesh(makeRock(1.14 * size, 2, 0.08, 0.32), mat(0x4e9a8a));
    grass.position.y = 0.18 * size;
    grass.scale.y = 0.55;
    grass.castShadow = true;
    grass.receiveShadow = true;
    g.add(grass);
    return { group: g, topY: 0.38 * size };
  }

  // ── 装饰生成器 ──
  function makeTree(size: number) {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * size, 0.055 * size, 0.34 * size, 7), mat(0x5a4a3a, 0.9));
    trunk.position.y = 0.17 * size;
    trunk.castShadow = true;
    t.add(trunk);
    for (const [x, y, z, r, c] of [[0, 0.42, 0, 0.24, 0x4e9a8a], [0.14, 0.34, 0.06, 0.16, 0x44897b], [-0.12, 0.36, -0.05, 0.15, 0x5aa897]]) {
      const blob = new THREE.Mesh(makeRock(r * size, 1, 0.12), mat(c));
      blob.position.set(x * size, y * size, z * size);
      blob.castShadow = true;
      t.add(blob);
    }
    return t;
  }

  function makeCrystal(size: number): THREE.Mesh {
    const geo = new THREE.OctahedronGeometry(0.16 * size, 0);
    geo.scale(1, 1.9, 1);
    const m = new THREE.Mesh(geo, glowMat(0x8fe0cf, 1.15));
    m.castShadow = true;
    return m;
  }

  // ── 主岛 ──
  const island = new THREE.Group();
  const main = makeIsland(1);
  island.add(main.group);
  island.scale.setScalar(0.86);
  island.position.x = 0.55;
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

  // 发光水晶簇（岛侧，嵌入岩体）
  for (const [x, y, z, s, rz] of [[-0.88, -0.3, 0.3, 1, 0.5], [-0.74, -0.62, -0.2, 0.7, -0.4], [0.95, -0.42, 0.05, 0.85, 0.9]]) {
    const c = makeCrystal(s);
    c.position.set(x, y, z);
    c.rotation.set(0.15, 0.3, rz);
    island.add(c);
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
    const rock = new THREE.Mesh(makeRock(s, 1, 0.22), mat(0x302b27));
    rock.position.set(x, y, z);
    rock.castShadow = true;
    debris.push(rock);
    island.add(rock);
  }
  // 岛底辉光
  addGlow(island, 0x6db3a3, 3.4, [0, -1.5, 0], 0.4);

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
  ring1.position.set(0.55, 0.1, 0);
  scene.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.006, 8, 100), ringMat);
  ring2.rotation.x = Math.PI / 1.85;
  ring2.rotation.y = 0.4;
  ring2.position.set(0.55, 0.25, 0);
  scene.add(ring2);

  // ── 小机器人 v3：大头比例 / 耳罩 / 胸口核心 / 挥手 ──
  const robot = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: 0xd8d0c4, roughness: 0.42, metalness: 0.12 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e1c1b, roughness: 0.35, metalness: 0.3 });
  const eyeMat = glowMat(0x6db3a3, 2.6);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.135, 0.14, 8, 20), shellMat);
  body.castShadow = true;
  robot.add(body);
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
    arm.position.set(ax, 0.05, 0);
    arm.rotation.z = ax > 0 ? -0.25 : 0.25;
    robot.add(arm);
    arms.push(arm);
  }
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
    if (drag.active && drag.moved < 6) jumpStart = performance.now() / 1000;
    drag.active = false;
    renderer.domElement.style.cursor = 'grab';
  };
  if (!isMobile && !reduced) {
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
  }

  // ── 渲染循环 ──
  const born = performance.now() / 1000;
  let raf = 0;
  let visible = true;
  let lastBlink = 0;
  let nextBlink = 2.5;
  const nextWaveIn = () => 6 + Math.random() * 5;
  let lastWave = -10;
  let nextWave = nextWaveIn();
  const camTarget = new THREE.Vector3();

  const tick = () => {
    const t = performance.now() / 1000;
    const age = t - born;

    // 入场：岛浮起 + 相机推进
    const intro = Math.min(Math.max(age / 1.5, 0), 1);
    const eased = 1 - Math.pow(1 - intro, 3);
    const introSet = reduced ? 1 : eased;
    island.position.y = (1 - introSet) * -1.6 + Math.sin(t * 0.8) * 0.07;
    island.scale.setScalar(0.86 * (0.72 + 0.28 * introSet));
    camera.position.z = 6.4 + (1 - introSet) * 1.7;

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
    arms[0].rotation.x = Math.sin(t * 1.6) * 0.09;
    // 周期性挥手（右臂举起摆动）
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
    camTarget.set(pointer.x * 0.5, 1.2 + pointer.y * 0.28, 6.4);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTarget.x, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, camTarget.y, 0.05);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTarget.z, 0.05);
    camera.lookAt(0.55, 0.3, 0);
    renderer.render(scene, camera);
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
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
