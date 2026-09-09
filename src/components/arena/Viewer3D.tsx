"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RotateCw, Move3d, ZoomIn, LibraryBig, Search, Upload, X, Box } from "lucide-react";
import FloatingPanel from "@/components/shell/FloatingPanel";
import { cn } from "@/lib/utils";
import {
  RECIPES_3D,
  MODEL_3D_CATS,
  PRESET_3D_IDS,
  recipeById,
  type Part3D,
} from "@/lib/models-3d";
/**
 * Visor 3D real (WebGL) del chat de todólogo.ai:
 * - 8 modelos clásicos animados (cohete, robot…).
 * - 125 modelos «ya hechos» construidos por recetas (133 en total).
 * - Modelos personalizados: recetas creadas por la IA al vuelo y archivos .glb/.gltf propios.
 */

export const MODEL_3D_PRESETS = PRESET_3D_IDS.map((id) => ({ id, label: id }));

const PALETTE = {
  bg: 0xf3efe9,
  ground: 0xe7e1d8,
  white: 0xfaf8f5,
  red: 0xd94f3d,
  orange: 0xe8863a,
  yellow: 0xf4c406,
  blue: 0x4a7dbd,
  navy: 0x2e4a6b,
  green: 0x5d9c59,
  darkGreen: 0x3f7a3c,
  wood: 0x8a5a34,
  grey: 0x9aa0a6,
  dark: 0x35312d,
  pink: 0xd98ca0,
  purple: 0x7a6bb5,
  teal: 0x4fa3a5,
};

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.16, ...opts });
}

/* ── Modelos clásicos (animados) ── */

function buildPreset(id: string): THREE.Group {
  const g = new THREE.Group();
  const add = (mesh: THREE.Mesh, x = 0, y = 0, z = 0) => {
    mesh.position.set(x, y, z);
    g.add(mesh);
    return mesh;
  };

  if (id === "cohete") {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 2.6, 24), mat(PALETTE.white)), 0, 1.3, 0);
    add(new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 24), mat(PALETTE.red)), 0, 3.15, 0);
    const win = add(new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), mat(PALETTE.teal, { metalness: 0.4, roughness: 0.2 })), 0, 1.9, 0);
    win.position.z = 0.52;
    for (const [dx, rz] of [[1, -0.5], [-1, 0.5]] as const) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.7), mat(PALETTE.red));
      fin.position.set(dx * 0.72, 0.5, 0);
      fin.rotation.z = rz;
      g.add(fin);
    }
    const flame = add(new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.2, 16), mat(PALETTE.orange, { emissive: 0xff7733, emissiveIntensity: 0.9 })), 0, -0.9, 0);
    flame.rotation.x = Math.PI;
    flame.name = "flame";
    g.userData.animate = (t: number) => flame.scale.setScalar(0.9 + Math.sin(t * 9) * 0.12);
  } else if (id === "robot") {
    add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 0.7), mat(PALETTE.grey, { metalness: 0.35, roughness: 0.35 })), 0, 1.5, 0);
    const head = add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.62, 0.7), mat(PALETTE.white, { metalness: 0.3, roughness: 0.35 })), 0, 2.5, 0);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), mat(PALETTE.dark)), 0, 3.0, 0);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), mat(PALETTE.red, { emissive: 0xff4444, emissiveIntensity: 0.8 })), 0, 3.28, 0);
    const eyes: THREE.Mesh[] = [];
    for (const dx of [-0.18, 0.18]) {
      eyes.push(add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 14), mat(0x39c6ff, { emissive: 0x39c6ff, emissiveIntensity: 1.2 })), dx, 2.55, 0.36));
    }
    for (const dx of [-1, 1]) {
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.15, 12), mat(PALETTE.grey, { metalness: 0.3 })), dx * 0.75, 1.5, 0);
      add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), mat(PALETTE.dark)), dx * 0.75, 0.88, 0);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 12), mat(PALETTE.dark)), dx * 0.3, 0.45, 0);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 14), mat(PALETTE.dark)), dx * 0.3, 0.09, 0.08);
    }
    g.userData.animate = (t: number) => {
      head.rotation.y = Math.sin(t * 1.2) * 0.25;
      eyes.forEach((e) => e.scale.setScalar(1 + Math.sin(t * 4) * 0.08));
    };
  } else if (id === "casa") {
    add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 1.8), mat(PALETTE.white)), 0, 0.65, 0);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.85, 1.0, 4), mat(PALETTE.red));
    roof.position.set(0, 1.8, 0);
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.85, 0.08), mat(PALETTE.wood)), 0, 0.42, 0.92);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.06), mat(PALETTE.teal, { transparent: true, opacity: 0.85 })), -0.7, 0.85, 0.92);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.06), mat(PALETTE.teal, { transparent: true, opacity: 0.85 })), 0.7, 0.85, 0.92);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.8, 10), mat(PALETTE.grey)), 0.75, 2.15, -0.4);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat(PALETTE.dark)), 0.75, 2.65, -0.4);
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.6, 10), mat(PALETTE.wood));
    trunk.position.y = 0.3;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), mat(PALETTE.green));
    crown.position.y = 0.85;
    tree.add(trunk, crown);
    tree.position.set(-1.6, 0, 0.4);
    g.add(tree);
  } else if (id === "coche") {
    add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.55, 1.2), mat(PALETTE.red, { metalness: 0.45, roughness: 0.3 })), 0, 0.62, 0);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 1.05), mat(PALETTE.blue, { metalness: 0.4, roughness: 0.25, transparent: true, opacity: 0.92 }));
    cabin.position.set(-0.1, 1.12, 0);
    g.add(cabin);
    const wheels: THREE.Mesh[] = [];
    for (const [dx, dz] of [[-0.85, 0.62], [0.85, 0.62], [-0.85, -0.62], [0.85, -0.62]] as const) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 18), mat(PALETTE.dark, { roughness: 0.9 }));
      wheel.position.set(dx, 0.3, dz);
      wheel.rotation.x = Math.PI / 2;
      wheel.name = "wheel";
      g.add(wheel);
      wheels.push(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.24, 12), mat(PALETTE.grey, { metalness: 0.6 }));
      hub.position.copy(wheel.position);
      hub.rotation.x = Math.PI / 2;
      g.add(hub);
    }
    for (const dx of [-1, 1]) {
      add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), mat(PALETTE.yellow, { emissive: 0xffdd55, emissiveIntensity: 0.9 })), dx * 0.75, 0.62, 1.16);
    }
    g.userData.animate = (t: number) => wheels.forEach((w) => (w.rotation.y = t * 3));
  } else if (id === "planeta") {
    const planet = new THREE.Mesh(new THREE.SphereGeometry(1.05, 40, 40), mat(PALETTE.blue, { roughness: 0.55 }));
    planet.position.y = 1.5;
    g.add(planet);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.09, 2, 80), mat(PALETTE.yellow, { transparent: true, opacity: 0.8 }));
    ring.position.y = 1.5;
    ring.rotation.x = Math.PI / 2.35;
    g.add(ring);
    const moonA = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), mat(PALETTE.grey));
    const moonB = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), mat(PALETTE.pink));
    g.add(moonA, moonB);
    const starGeo = new THREE.SphereGeometry(0.02, 6, 6);
    const starMat = mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 });
    for (let i = 0; i < 40; i++) {
      const s = new THREE.Mesh(starGeo, starMat);
      s.position.set((Math.random() - 0.5) * 16, Math.random() * 9 + 0.5, (Math.random() - 0.5) * 16);
      g.add(s);
    }
    g.userData.animate = (t: number) => {
      planet.rotation.y = t * 0.35;
      moonA.position.set(Math.cos(t * 0.9) * 2.1, 1.5 + Math.sin(t * 0.9) * 0.35, Math.sin(t * 0.9) * 2.1);
      moonB.position.set(Math.cos(t * 1.4 + 2) * 1.45, 1.5 - Math.sin(t * 1.4 + 2) * 0.5, Math.sin(t * 1.4 + 2) * 1.45);
    };
  } else if (id === "arbol") {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.8, 12), mat(PALETTE.wood)), 0, 0.9, 0);
    const c1 = add(new THREE.Mesh(new THREE.SphereGeometry(0.95, 20, 20), mat(PALETTE.green)), 0, 2.2, 0);
    const c2 = add(new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 20), mat(PALETTE.darkGreen)), 0.6, 1.9, 0.25);
    const c3 = add(new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 20), mat(PALETTE.darkGreen)), -0.55, 2.05, -0.2);
    const appleGeo = new THREE.SphereGeometry(0.09, 10, 10);
    const appleMat = mat(PALETTE.red, { roughness: 0.35 });
    for (let i = 0; i < 6; i++) {
      const a = new THREE.Mesh(appleGeo, appleMat);
      a.position.set((Math.random() - 0.5) * 1.3, 2.1 + Math.random() * 0.7, (Math.random() - 0.5) * 1.1);
      g.add(a);
    }
    g.userData.animate = (t: number) => {
      c1.rotation.z = Math.sin(t * 0.8) * 0.03;
      c2.rotation.z = Math.sin(t * 0.8 + 1) * 0.05;
      c3.rotation.z = Math.sin(t * 0.8 + 2) * 0.05;
    };
  } else if (id === "ciudad") {
    const colors = [PALETTE.blue, PALETTE.red, PALETTE.yellow, PALETTE.teal, PALETTE.purple, PALETTE.green, PALETTE.pink];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let gx = -2; gx <= 2; gx++) {
      for (let gz = -2; gz <= 2; gz++) {
        if (Math.abs(gx) === 1 && Math.abs(gz) === 1 && rnd() > 0.4) continue;
        const h = 0.5 + rnd() * 2.3;
        const w = 0.55 + rnd() * 0.25;
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat(colors[Math.floor(rnd() * colors.length)], { roughness: 0.7 }));
        b.position.set(gx * 0.95, h / 2, gz * 0.95);
        g.add(b);
        if (h > 1.9) {
          const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(PALETTE.red, { emissive: 0xff3333, emissiveIntensity: 1 }));
          tip.position.set(gx * 0.95, h + 0.08, gz * 0.95);
          g.add(tip);
        }
      }
    }
  } else {
    // terreno
    const hillGeo = new THREE.ConeGeometry(1, 1, 5);
    const hspec: [number, number, number, number][] = [
      [-2.4, 0, -1.4, 1.5], [-1.2, 0, -2.1, 2.1], [1.6, 0, -1.8, 1.2], [2.6, 0, 0.4, 1.7], [-2.7, 0, 1.1, 1.3],
    ];
    const lakeMat = mat(PALETTE.teal, { roughness: 0.15, metalness: 0.3 });
    for (const [x, , z, s] of hspec) {
      const m = new THREE.Mesh(hillGeo, mat(PALETTE.green, { flatShading: true }));
      m.scale.set(s, s * 0.9, s);
      m.position.set(x, (s * 0.9) / 2 - 0.1, z);
      g.add(m);
      const snow = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.5, 5), mat(PALETTE.white, { flatShading: true }));
      snow.scale.setScalar(s * 0.42);
      snow.position.set(x, s * 0.9 - 0.28, z);
      g.add(snow);
    }
    const lake = new THREE.Mesh(new THREE.CircleGeometry(1.15, 28), lakeMat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(0.7, 0.012, 1.5);
    g.add(lake);
    for (const [x, z] of [[-0.9, 1.6], [-1.7, 2.2], [2.1, 2.3]] as const) {
      const t = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.4, 8), mat(PALETTE.wood));
      trunk.position.y = 0.2;
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 8), mat(PALETTE.darkGreen, { flatShading: true }));
      crown.position.y = 0.7;
      t.add(trunk, crown);
      t.position.set(x, 0, z);
      g.add(t);
    }
    g.userData.animate = (t: number) => {
      lake.position.y = 0.012 + Math.sin(t * 1.4) * 0.008;
    };
  }
  return g;
}

/* ── Modelos por receta (125 ya hechos + personalizados de la IA) ── */

function buildFromParts(parts: Part3D[]): THREE.Group {
  const g = new THREE.Group();
  for (const p of parts) {
    const [shape, x, y, z, a, b, c] = p;
    const color = new THREE.Color(p[7]);
    const [rx, ry, rz] = [p[8] ?? 0, p[9] ?? 0, p[10] ?? 0];
    let geo: THREE.BufferGeometry;
    if (shape === "bx") geo = new THREE.BoxGeometry(a, b, c);
    else if (shape === "sp") geo = new THREE.SphereGeometry(Math.max(0.01, a), 32, 24);
    else if (shape === "cy") geo = new THREE.CylinderGeometry(Math.max(0.01, a), Math.max(0.01, b), Math.max(0.01, c), 28);
    else if (shape === "co") geo = new THREE.ConeGeometry(Math.max(0.01, a), Math.max(0.01, b), 28);
    else geo = new THREE.TorusGeometry(Math.max(0.02, a), Math.max(0.01, b), 16, 48);
    const mesh = new THREE.Mesh(geo, mat(color.getHex(), { roughness: 0.62 }));
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    g.add(mesh);
  }
  return g;
}

/** Receta personalizada generada por la IA (JSON tolerante). */
function parseRecipe(json: string): Part3D[] | null {
  try {
    const data = JSON.parse(json) as unknown;
    const raw = Array.isArray(data)
      ? data
      : ((data as { p?: unknown[]; parts?: unknown[] }).p ?? (data as { parts?: unknown[] }).parts);
    if (!Array.isArray(raw)) return null;
    const parts: Part3D[] = [];
    for (const item of raw.slice(0, 40)) {
      if (!Array.isArray(item) || item.length < 8) continue;
      const shape = item[0] === "bx" || item[0] === "box" ? "bx"
        : item[0] === "sp" || item[0] === "sphere" ? "sp"
        : item[0] === "cy" || item[0] === "cyl" ? "cy"
        : item[0] === "co" || item[0] === "cone" ? "co"
        : item[0] === "to" || item[0] === "torus" ? "to" : null;
      if (!shape) continue;
      const nums = (item.slice(1, 7) as unknown[]).map((n) => Number(n) || 0);
      parts.push([shape, nums[0], nums[1], nums[2], nums[3], nums[4], nums[5], String(item[7]), Number(item[8]) || 0, Number(item[9]) || 0, Number(item[10]) || 0]);
    }
    return parts.length > 0 ? parts : null;
  } catch {
    return null;
  }
}

export default function Viewer3D({
  model,
  recipe,
  className,
}: {
  model: string;
  recipe?: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const placeRef = useRef<((id: string) => void) | null>(null);
  const loadGlbRef = useRef<((file: File) => void) | null>(null);
  const customRef = useRef<Part3D[] | null>(null);
  const [currentId, setCurrentId] = useState(model);
  const [glbName, setGlbName] = useState<string | null>(null);
  const [spin, setSpin] = useState(true);
  const spinRef = useRef(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const galleryAnchorRef = useRef<HTMLButtonElement>(null);
  const [galQuery, setGalQuery] = useState("");
  const [galCat, setGalCat] = useState("Todas");
  const glbInputRef = useRef<HTMLInputElement>(null);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    spinRef.current = spin;
  }, [spin]);

  useEffect(() => {
    const host = canvasHostRef.current;
    const wrap = wrapRef.current;
    if (!host || !wrap) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(PALETTE.bg);
    scene.fog = new THREE.Fog(PALETTE.bg, 18, 34);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    let renderer: THREE.WebGLRenderer;
    let envTex: THREE.Texture | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      setWebglError(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Realismo: tone mapping cinematográfico + espacio de color correcto + sombras suaves.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    // Entorno PBR (reflejos realistas en metales y superficies brillantes).
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
      scene.environment = envTex;
      scene.environmentIntensity = 0.5;
    } catch {
      envTex = null;
    }

    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b0a4, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 1.7);
    dir.position.set(5, 8, 6);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.left = -8;
    dir.shadow.camera.right = 8;
    dir.shadow.camera.top = 8;
    dir.shadow.camera.bottom = -8;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 40;
    dir.shadow.normalBias = 0.03;
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xfff2dd, 0.35);
    fill.position.set(-6, 4, -5);
    scene.add(fill);

    const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 64), mat(PALETTE.ground, { roughness: 0.95, metalness: 0 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 22;
    controls.maxPolarAngle = Math.PI / 2.02;
    controls.autoRotateSpeed = 1.4;
    controls.target.set(0, 1.2, 0);

    let group: THREE.Group | null = null;

    const disposeGroup = (g: THREE.Group | null) => {
      if (!g) return;
      g.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
    };

    const swap = (next: THREE.Group, flat: boolean) => {
      if (group) scene.remove(group);
      disposeGroup(group);
      group = next;
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      scene.add(group);
      camera.position.set(flat ? 7.5 : 6.2, flat ? 5.5 : 3.4, flat ? 7.5 : 6.2);
      controls.target.set(0, flat ? 0.8 : 1.25, 0);
      controls.update();
    };

    const place = (id: string) => {
      if (id === "__custom__" && customRef.current) {
        swap(buildFromParts(customRef.current), false);
        return;
      }
      const rec = recipeById(id);
      const next = rec ? buildFromParts(rec.parts) : buildPreset(id);
      swap(next, id === "ciudad" || id === "terreno");
    };

    place(currentId);
    placeRef.current = (id) => place(id);

    loadGlbRef.current = (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const loader = new GLTFLoader();
          loader.parse(reader.result as ArrayBuffer, "", (gltf) => {
            const root = gltf.scene;
            const box = new THREE.Box3().setFromObject(root);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = 2.6 / maxDim;
            root.position.sub(center);
            root.position.y += (size.y * scale) / 2;
            root.scale.setScalar(scale);
            root.traverse((o) => {
              if (o instanceof THREE.Mesh) {
                o.castShadow = true;
                o.receiveShadow = true;
              }
            });
            setGlbName(file.name);
            swap(root as unknown as THREE.Group, false);
          });
        } catch {
          setGlbName("error al leer el archivo");
        }
      };
      reader.readAsArrayBuffer(file);
    };

    const resize = () => {
      const w = wrap.clientWidth || 320;
      const h = wrap.clientHeight || 300;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    const clock = new THREE.Clock();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();
      controls.autoRotate = spinRef.current;
      controls.update();
      group?.userData.animate?.(t);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      disposeGroup(group);
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      envTex?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const recipeParts = useMemo(() => (recipe ? parseRecipe(recipe) : null), [recipe]);

  useEffect(() => {
    if (!recipeParts) return;
    const t = setTimeout(() => {
      customRef.current = recipeParts;
      setGlbName(null);
      setCurrentId("__custom__");
      placeRef.current?.("__custom__");
    }, 0);
    return () => clearTimeout(t);
  }, [recipeParts]);

  const galleryList = useMemo(() => {
    const q = galQuery.trim().toLowerCase();
    const all = [
      { id: "cohete", name: "Cohete", cat: "Clásicos" },
      { id: "robot", name: "Robot", cat: "Clásicos" },
      { id: "casa", name: "Casa", cat: "Clásicos" },
      { id: "coche", name: "Coche", cat: "Clásicos" },
      { id: "planeta", name: "Planeta", cat: "Clásicos" },
      { id: "arbol", name: "Árbol", cat: "Clásicos" },
      { id: "ciudad", name: "Ciudad", cat: "Clásicos" },
      { id: "terreno", name: "Terreno", cat: "Clásicos" },
      ...RECIPES_3D.map((r) => ({ id: r.id, name: r.name, cat: r.cat })),
    ];
    return all.filter(
      (m) =>
        (galCat === "Todas" || m.cat === galCat) &&
        (q === "" || m.name.toLowerCase().includes(q) || m.id.includes(q))
    );
  }, [galQuery, galCat]);

  return (
    <div
      ref={wrapRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f && /\.(glb|gltf)$/i.test(f.name)) loadGlbRef.current?.(f);
      }}
      className={cn("relative h-[300px] w-full overflow-hidden rounded-xl border border-border bg-card sm:h-[340px]", className)}
    >
      {webglError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <Box className="h-5 w-5 text-muted-foreground" />
          <p className="text-[12.5px] font-semibold">El visor 3D necesita WebGL</p>
          <p className="max-w-[280px] text-[11.5px] leading-relaxed text-muted-foreground">
            Tu navegador no pudo iniciar el motor 3D. Prueba con Chrome, Edge o Firefox
            actualizados y con la aceleración gráfica activada.
          </p>
        </div>
      ) : (
        <div ref={canvasHostRef} className="absolute inset-0 [&>canvas]:!block [&>canvas]:h-full [&>canvas]:w-full" />
      )}

      {/* Galería + cargar archivo propio */}
      <div className="absolute right-2 top-2 flex gap-1">
        <button
          ref={galleryAnchorRef}
          onClick={() => setGalleryOpen(!galleryOpen)}
          title="Galería de 133 modelos ya hechos"
          className={cn(
            "flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11.5px] font-medium backdrop-blur",
            galleryOpen ? "border-foreground bg-foreground text-background" : "border-border bg-background/85 hover:bg-accent"
          )}
        >
          <LibraryBig className="h-3.5 w-3.5" />
          Galería
        </button>
        <button
          onClick={() => glbInputRef.current?.click()}
          title="Cargar tu propio modelo (.glb o .gltf)"
          className="flex items-center gap-1 rounded-lg border border-border bg-background/85 px-2 py-1.5 text-[11.5px] font-medium backdrop-blur hover:bg-accent"
        >
          <Upload className="h-3.5 w-3.5" />
          .glb
        </button>
        <input
          ref={glbInputRef}
          type="file"
          accept=".glb,.gltf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) loadGlbRef.current?.(f);
            e.target.value = "";
          }}
        />
      </div>
      <FloatingPanel anchorRef={galleryAnchorRef} open={galleryOpen} onClose={() => setGalleryOpen(false)} width={300}>
        <div className="p-2">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <Box className="h-3.5 w-3.5" /> Galería · 133 modelos
            </p>
            <button onClick={() => setGalleryOpen(false)} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Cerrar galería">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={galQuery}
              onChange={(e) => setGalQuery(e.target.value)}
              placeholder="Buscar: perro, cohete, pizza…"
              className="w-full bg-transparent text-[12.5px] outline-none"
            />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {["Todas", ...MODEL_3D_CATS].map((c) => (
              <button
                key={c}
                onClick={() => setGalCat(c)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
                  galCat === c ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent"
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-1.5 grid max-h-[240px] grid-cols-2 gap-1 overflow-y-auto scrollbar-thin">
            {galleryList.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setGlbName(null);
                  setCurrentId(m.id);
                  placeRef.current?.(m.id);
                }}
                className={cn(
                  "truncate rounded-lg border px-2 py-1.5 text-left text-[12px] font-medium",
                  currentId === m.id && !glbName ? "border-foreground bg-secondary" : "border-border hover:bg-accent"
                )}
                title={m.name}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      </FloatingPanel>

      {/* Giro + reinicio */}
      <div className="absolute right-2 top-11 flex flex-col gap-1">
        <button
          onClick={() => setSpin(!spin)}
          title={spin ? "Parar giro automático" : "Girar automáticamente"}
          className={cn(
            "rounded-lg border p-1.5 backdrop-blur",
            spin ? "border-foreground bg-foreground text-background" : "border-border bg-background/85 hover:bg-accent"
          )}
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => placeRef.current?.(currentId)}
          title="Reiniciar vista"
          className="rounded-lg border border-border bg-background/85 p-1.5 backdrop-blur hover:bg-accent"
        >
          <Move3d className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="pointer-events-none absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5 px-2 text-center text-[11px] text-muted-foreground/90">
        <ZoomIn className="h-3 w-3 shrink-0" />
        {glbName
          ? `Modelo propio: ${glbName} · arrastra para girar`
          : recipeParts
            ? "Modelo 3D personalizado creado por la IA · arrastra para girarlo"
            : "Arrastra para girar · rueda para acercar · 133 modelos + los tuyos (.glb)"}
      </p>
    </div>
  );
}
