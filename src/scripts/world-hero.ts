// WorldHero：mimo 风格 3D 首屏——悬浮岛群 + 小机器人 + 水晶 + 能量环 + 萤火
// 全程序化几何（零模型文件）；拖拽旋转 / 鼠标视差 / 入场动画 / 待机动画（眨眼摆臂/点击跳跃）
// 后台标签页暂停 / reduced-motion 静帧 / WebGL 失败自动移除（CSS 轨道环兜底）
import * as THREE from 'three';

export interface WorldHeroHandle {
  dispose: () => void;
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
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';
  if (!isMobile) renderer.domElement.style.cursor = 'grab';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(0, 1.2, 6.2);

  // 雾随主题变色（背景透明，雾色对齐页面底色产生纵深）
  const fogColor = new THREE.Color(
    document.documentElement.dataset.theme === 'light' ? 0xfaf7f1 : 0x262322,
  );
  scene.fog = new THREE.Fog(fogColor, 7, 13);
  const fogObserver = new MutationObserver(() => {
    fogColor.set(
      document.documentElement.dataset.theme === 'light' ? 0xfaf7f1 : 0x262322,
    );
  });
  fogObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ── 灯光 ──
  scene.add(new THREE.HemisphereLight(0xf4e7d3, 0x1e1c1b, 0.95));
  const sun = new THREE.DirectionalLight(0xffe8c9, 1.7);
  sun.position.set(3, 5, 2);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x9ad7c8, 0.6); // 冷色轮廓光
  rim.position.set(-4, 2, -3);
  scene.add(rim);
  const under = new THREE.PointLight(0x6db3a3, 8, 10); // 岛底青绿辉光
  under.position.set(-1.4, -1.6, 1.2);
  scene.add(under);

  const flat = (color: number) =>
    new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.92, metalness: 0.05 });
  const glow = (color: number, intensity = 1.6) =>
    new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: intensity, roughness: 0.35,
    });

  // ── 岛生成器 ──
  function makeIsland(size: number, withTree: boolean, withPond: boolean) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18 * size, 1), flat(0x453e38));
    top.scale.set(1, 0.36, 1);
    g.add(top);
    const soil = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95 * size, 1), flat(0x2e2a27));
    soil.scale.set(1, 1.5, 1);
    soil.position.y = -0.6 * size;
    soil.rotation.y = 0.6;
    g.add(soil);
    const key = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 * size, 0), flat(0x262322));
    key.position.set(0.14 * size, -1.45 * size, -0.08 * size);
    key.rotation.set(0.4, 0.8, 0.2);
    g.add(key);
    if (withTree) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.34, 6), flat(0x5a4a3a));
      trunk.position.set(-0.5 * size, 0.5 * size, 0.16);
      g.add(trunk);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), flat(0x4e9a8a));
      crown.position.set(-0.5 * size, 0.86 * size, 0.16);
      crown.rotation.set(0.3, 0.5, 0.2);
      g.add(crown);
      const crown2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), flat(0x3d7a6d));
      crown2.position.set(-0.32 * size, 1.02 * size, 0.1);
      g.add(crown2);
    }
    if (withPond) {
      const pond = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.26, 0.03, 20),
        new THREE.MeshStandardMaterial({
          color: 0x6db3a3, emissive: 0x6db3a3, emissiveIntensity: 0.5,
          roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.9,
        }),
      );
      pond.position.set(0.42 * size, 0.44 * size, -0.3 * size);
      g.add(pond);
    }
    for (const [x, z, s] of [[0.4, 0.5, 1], [-0.15, 0.62, 0.8], [0.62, -0.28, 1.2], [-0.6, -0.3, 0.9], [0.1, 0.66, 0.7]]) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.16 * s, 5), flat(0x5fa898));
      blade.position.set(x * size, 0.47 * size, z * size);
      g.add(blade);
    }
    return g;
  }

  // 主岛
  const island = makeIsland(1, true, true);
  island.scale.setScalar(0.92);
  island.position.x = 0.55;
  scene.add(island);

  // 卫星岛 ×2（各自浮动）
  const sat1 = makeIsland(0.38, false, false);
  sat1.position.set(-1.7, 0.9, -1.4);
  scene.add(sat1);
  const sat2 = makeIsland(0.28, false, false);
  sat2.position.set(1.9, -0.7, -1.8);
  scene.add(sat2);

  // 岛下悬浮碎岩 ×4（绕岛缓转）
  const debris = new THREE.Group();
  for (const [x, y, z, s] of [[0.9, -1.1, 0.4, 0.14], [-0.7, -1.5, 0.2, 0.1], [0.2, -1.9, -0.5, 0.16], [1.3, -0.6, -0.6, 0.09]]) {
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), flat(0x332e2a));
    rock.position.set(x, y, z);
    rock.rotation.set(Math.random(), Math.random(), 0);
    debris.add(rock);
  }
  scene.add(debris);

  // 发光水晶簇（岛侧）
  const crystals = new THREE.Group();
  const crystalMat = glow(0x6db3a3, 1.1);
  for (const [x, y, z, s, rz] of [[-0.85, -0.35, 0.3, 0.22, 0.5], [-0.7, -0.15, -0.3, 0.15, -0.3], [0.95, -0.5, 0.1, 0.18, 0.9]]) {
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(s, 0), crystalMat);
    c.position.set(x, y, z);
    c.rotation.set(0.2, 0.4, rz);
    crystals.add(c);
  }
  island.add(crystals);

  // 能量环（两道细环绕岛缓转）
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x6db3a3, transparent: true, opacity: 0.28, side: THREE.DoubleSide,
  });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.012, 8, 90), ringMat);
  ring1.rotation.x = Math.PI / 2.25;
  ring1.position.set(0.55, 0.15, 0);
  scene.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.008, 8, 90), ringMat);
  ring2.rotation.x = Math.PI / 1.9;
  ring2.rotation.y = 0.35;
  ring2.position.set(0.55, 0.3, 0);
  scene.add(ring2);

  // ── 小机器人（大头比例 + 待机动画 + 点击跳跃） ──
  const robot = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: 0xd8d0c4, roughness: 0.5, metalness: 0.15 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e1c1b, roughness: 0.4, metalness: 0.3 });
  const eyeMat = glow(0x6db3a3, 2.4);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.16, 6, 16), shellMat);
  robot.add(body);
  const head = new THREE.Group();
  head.position.y = 0.34;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.185, 26, 20), shellMat);
  head.add(skull);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.145, 22, 16, 0, Math.PI * 2, 0.9, 0.85), darkMat);
  visor.position.z = 0.038;
  head.add(visor);
  const eyes: THREE.Mesh[] = [];
  for (const ex of [-0.055, 0.055]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), eyeMat);
    eye.position.set(ex, 0.01, 0.115);
    head.add(eye);
    eyes.push(eye);
  }
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6), darkMat);
  antenna.position.y = 0.22;
  head.add(antenna);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), eyeMat);
  antTip.position.y = 0.28;
  head.add(antTip);
  robot.add(head);
  const arms: THREE.Mesh[] = [];
  for (const ax of [-0.19, 0.19]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.15, 4, 10), shellMat);
    arm.position.set(ax, -0.02, 0);
    arm.rotation.z = ax > 0 ? -0.3 : 0.3;
    robot.add(arm);
    arms.push(arm);
  }
  // 悬浮暗影（假 blob shadow）
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.2, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.42;
  robot.add(shadow);
  robot.position.set(0.38, 0.86, 0.42);
  robot.rotation.y = 0.4;
  island.add(robot);

  // ── 萤火粒子 ──
  const COUNT = isMobile ? 80 : 170;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const seeds: { base: THREE.Vector3; phase: number; speed: number; amp: number }[] = [];
  const teal = new THREE.Color(0x6db3a3);
  const warm = new THREE.Color(0xe8c9a0);
  for (let i = 0; i < COUNT; i++) {
    const base = new THREE.Vector3(
      (Math.random() - 0.5) * 5.5,
      Math.random() * 3.4 - 0.7,
      (Math.random() - 0.5) * 5.5,
    );
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
    if (drag.active && drag.moved < 6) jumpStart = performance.now() / 1000; // 点击 = 机器人跳一下
    drag.active = false;
    renderer.domElement.style.cursor = 'grab';
  };
  if (!isMobile && !reduced) {
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
  }

  // ── 渲染循环 ──
  const born = performance.now() / 1000; // 入场动画起点
  let raf = 0;
  let visible = true;
  let lastBlink = 0;
  let nextBlink = 2.5;
  const camTarget = new THREE.Vector3();

  const tick = () => {
    const t = performance.now() / 1000;
    const age = t - born;

    // 入场：0~1.4s 岛从下方浮起 + 由小到大 + 相机推进
    const intro = Math.min(Math.max(age / 1.4, 0), 1);
    const eased = 1 - Math.pow(1 - intro, 3);
    const introSet = reduced ? 1 : eased;
    island.position.y = (1 - introSet) * -1.6 + Math.sin(t * 0.8) * 0.08;
    island.scale.setScalar(0.92 * (0.7 + 0.3 * introSet));
    camera.position.z = 6.2 + (1 - introSet) * 1.6;

    // 岛自转 + 拖拽惯性
    island.rotation.y += 0.0016 + drag.velY;
    drag.velY *= 0.93;
    island.rotation.x = THREE.MathUtils.lerp(island.rotation.x, drag.rotX * 0.5, 0.06);

    // 卫星岛 / 碎岩 / 能量环 / 水晶
    sat1.position.y = 0.9 + Math.sin(t * 0.7 + 1.5) * 0.1;
    sat1.rotation.y += 0.002;
    sat2.position.y = -0.7 + Math.sin(t * 0.55 + 3) * 0.09;
    sat2.rotation.y -= 0.0016;
    debris.rotation.y += 0.0009;
    debris.children.forEach((rock, i) => {
      rock.position.y += Math.sin(t * 0.9 + i * 1.8) * 0.0009;
    });
    ring1.rotation.z += 0.0012;
    ring2.rotation.z -= 0.0008;
    crystals.children.forEach((c, i) => {
      c.rotation.y += 0.004;
      c.position.y += Math.sin(t * 1.3 + i * 2) * 0.0006;
    });

    // 机器人：悬浮呼吸 + 待机摆臂 + 看鼠标 + 眨眼 + 点击跳跃
    let jump = 0;
    const jt = t - jumpStart;
    if (jt >= 0 && jt < 0.6) {
      jump = Math.sin((jt / 0.6) * Math.PI) * 0.28;
      robot.rotation.z = Math.sin((jt / 0.6) * Math.PI * 2) * 0.08;
    } else {
      robot.rotation.z = 0;
    }
    robot.position.y = 0.86 + Math.sin(t * 1.15) * 0.05 + jump;
    robot.rotation.y = -island.rotation.y + 0.35; // 抵消岛自转，始终面向镜头
    arms[0].rotation.x = Math.sin(t * 1.6) * 0.1;
    arms[1].rotation.x = Math.sin(t * 1.6 + 1) * 0.1;
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
    camTarget.set(pointer.x * 0.5, 1.2 + pointer.y * 0.28, 6.2);
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
