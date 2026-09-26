// WorldHero：mimo 风格 3D 首屏——悬浮岛 + 小机器人 + 萤火粒子
// 全程序化几何（零模型文件）；拖拽旋转 / 鼠标视差 / 后台标签页暂停 / reduced-motion 静帧 / WebGL 失败自动移除
import * as THREE from 'three';

export interface WorldHeroHandle {
  dispose: () => void;
}

export function initWorldHero(container: HTMLElement): WorldHeroHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch {
    return null; // WebGL 不可用：保留 CSS 轨道环兜底
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 767px)').matches;

  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(width, height);
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';
  if (!isMobile) renderer.domElement.style.cursor = 'grab';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(0, 1.2, 6.2);
  camera.lookAt(0.55, 0.3, 0);

  // ── 灯光：暖主光 + 冷环境 + 岛底青绿点光 ──
  scene.add(new THREE.HemisphereLight(0xf4e7d3, 0x1e1c1b, 0.9));
  const sun = new THREE.DirectionalLight(0xffe8c9, 1.6);
  sun.position.set(3, 5, 2);
  scene.add(sun);
  const rim = new THREE.PointLight(0x6db3a3, 6, 9);
  rim.position.set(-1.6, -1.4, 1.2);
  scene.add(rim);

  const flat = (color: number) =>
    new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.92, metalness: 0.05 });

  // ── 悬浮岛 ──
  const island = new THREE.Group();
  island.scale.setScalar(0.82);
  island.position.x = 0.55;
  scene.add(island);

  const top = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18, 1), flat(0x453e38));
  top.scale.set(1, 0.38, 1);
  island.add(top);

  const soil = new THREE.Mesh(new THREE.IcosahedronGeometry(0.98, 1), flat(0x2e2a27));
  soil.scale.set(1, 1.5, 1);
  soil.position.y = -0.62;
  soil.rotation.y = 0.6;
  island.add(soil);

  const keystone = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), flat(0x262322));
  keystone.position.set(0.15, -1.5, -0.1);
  keystone.rotation.set(0.4, 0.8, 0.2);
  island.add(keystone);

  // 一棵小树
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.34, 6), flat(0x5a4a3a));
  trunk.position.set(-0.52, 0.52, 0.18);
  island.add(trunk);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), flat(0x4e9a8a));
  crown.position.set(-0.52, 0.86, 0.18);
  crown.rotation.set(0.3, 0.5, 0.2);
  island.add(crown);

  // 草簇
  for (const [x, z] of [[0.4, 0.5], [-0.15, 0.62], [0.62, -0.28], [-0.6, -0.3]]) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 5), flat(0x6db3a3));
    blade.position.set(x, 0.48, z);
    island.add(blade);
  }

  // ── 小机器人（奶油壳 + 青绿眼睛，悬浮小幅浮动） ──
  const robot = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: 0xd8d0c4, roughness: 0.55, metalness: 0.15 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e1c1b, roughness: 0.4, metalness: 0.3 });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x6db3a3, emissive: 0x6db3a3, emissiveIntensity: 2.2, roughness: 0.3,
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.2, 6, 16), shellMat);
  body.position.y = 0;
  robot.add(body);
  const head = new THREE.Group();
  head.position.y = 0.36;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 18), shellMat);
  head.add(skull);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.125, 20, 14, 0, Math.PI * 2, 0.9, 0.85), darkMat);
  visor.position.z = 0.035;
  head.add(visor);
  for (const ex of [-0.05, 0.05]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 10), eyeMat);
    eye.position.set(ex, 0.015, 0.12);
    head.add(eye);
  }
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 6), darkMat);
  antenna.position.y = 0.19;
  head.add(antenna);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), eyeMat);
  antTip.position.y = 0.24;
  head.add(antTip);
  robot.add(head);
  for (const ax of [-0.21, 0.21]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.16, 4, 10), shellMat);
    arm.position.set(ax, -0.02, 0);
    arm.rotation.z = ax > 0 ? -0.25 : 0.25;
    robot.add(arm);
  }
  robot.position.set(0.34, 0.82, 0.34);
  robot.rotation.y = 0.4;
  island.add(robot);

  // ── 萤火粒子 ──
  const COUNT = isMobile ? 70 : 150;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const seeds: { base: THREE.Vector3; phase: number; speed: number; amp: number }[] = [];
  const teal = new THREE.Color(0x6db3a3);
  const warm = new THREE.Color(0xe8c9a0);
  for (let i = 0; i < COUNT; i++) {
    const base = new THREE.Vector3(
      (Math.random() - 0.5) * 5,
      Math.random() * 3.2 - 0.6,
      (Math.random() - 0.5) * 5,
    );
    positions.set([base.x, base.y, base.z], i * 3);
    const c = Math.random() > 0.35 ? teal : warm;
    colors.set([c.r, c.g, c.b], i * 3);
    seeds.push({ base, phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.5, amp: 0.1 + Math.random() * 0.25 });
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.045, vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(particles);

  // ── 交互：拖拽旋转 + 鼠标视差 ──
  const pointer = { x: 0, y: 0 };
  const drag = { active: false, lastX: 0, lastY: 0, rotY: 0, rotX: 0 };
  const onPointerMove = (e: PointerEvent) => {
    if (drag.active && e.pointerType !== 'touch') {
      drag.rotY += (e.clientX - drag.lastX) * 0.006;
      drag.rotX = THREE.MathUtils.clamp(drag.rotX + (e.clientY - drag.lastY) * 0.003, -0.25, 0.35);
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      return;
    }
    const rect = container.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  };
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    drag.active = true;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    renderer.domElement.style.cursor = 'grabbing';
  };
  const onPointerUp = () => {
    drag.active = false;
    renderer.domElement.style.cursor = 'grab';
  };
  if (!isMobile && !reduced) {
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
  }

  // ── 渲染循环 ──
  let raf = 0;
  let visible = true;
  const camTarget = new THREE.Vector3();

  const tick = () => {
    const t = performance.now() / 1000;
    island.rotation.y += 0.0016 + drag.rotY; // 自动旋转 + 拖拽惯性
    drag.rotY *= 0.94;
    island.rotation.x = THREE.MathUtils.lerp(island.rotation.x, drag.rotX * 0.5, 0.06);
    island.position.y = Math.sin(t * 0.8) * 0.08;
    robot.position.y = 0.82 + Math.sin(t * 1.15) * 0.055;
    head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, pointer.x * 0.7, 0.08);
    head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, pointer.y * 0.35, 0.08);

    const pos = pGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      pos.setY(i, s.base.y + Math.sin(t * s.speed + s.phase) * s.amp);
      pos.setX(i, s.base.x + Math.cos(t * s.speed * 0.6 + s.phase) * s.amp * 0.6);
    }
    pos.needsUpdate = true;

    camTarget.set(pointer.x * 0.5, 1.2 + pointer.y * 0.28, 6.2);
    camera.position.lerp(camTarget, 0.05);
    camera.lookAt(0.55, 0.3, 0);
    renderer.render(scene, camera);
    if (visible && !reduced) raf = requestAnimationFrame(tick);
  };

  if (reduced) {
    renderer.render(scene, camera); // 静帧
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
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const m = obj.material;
          (Array.isArray(m) ? m : [m]).forEach((mat) => mat.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
