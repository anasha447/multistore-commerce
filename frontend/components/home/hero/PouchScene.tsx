"use client";

// The 3D half of the landing hero: one stand-up zipper pouch (front + back pack art) that
// stands on the ground, sways, can be dragged round or tapped to flip, and spins a full turn
// to change flavor (the art swaps while it is edge-on). The active flavor's ingredient
// cut-outs orbit it on two tilted rings, passing behind and in front. Loaded lazily by
// HeroFlavorCycler — never rendered on the server, under reduced motion, or on low-power
// devices.
//
// Shape (matched to the product photos in public/packaging details):
//   - top: a flat, crimped heat-seal strip with fine seal lines, then the zip track (two
//     raised beads) 10% down from the top edge, above the logo;
//   - body: thin under the zip, flaring out to its fullest in the lower third;
//   - base: a bottom gusset — the faces stay apart at the bottom and a lens-shaped base
//     closes them, so the pouch stands on its own footprint instead of tapering to a line;
//   - sides: sealed fins where front and back meet, with soft creases near the top corners.
// Volume reads through baked ambient occlusion (seams, under the zip, the base fold), a
// room environment map for soft reflections, a key light with soft self-shadowing, a rim
// light that outlines the profile, and a contact + cast shadow on the ground.

import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HERO_FLAVORS, HERO_SPRITES, PACK_ASPECT } from "./flavors";

const POUCH_H = 3.2;
const POUCH_W = POUCH_H * PACK_ASPECT;
/** Fullest half-thickness of the filled body (front face to the centre plane). */
const BELLY = 0.29;
/** Half-thickness of the flat, double-layer heat-seal areas. */
const SEAL_Z = 0.012;
// Zip 10% below the top edge (as on the product photos): the pack art keeps its logo below it.
/** Heights from the bottom (0) to the top (1) of the face. */
const ZIP_V = 0.9;
const SEAL_V = 0.918;
/** Rounded-corner radius of the pack art, as a fraction of its width. */
const CORNER = 0.045;
const SPIN_SECONDS = 1.5;
const TAU = Math.PI * 2;

interface Controls {
  rotY: number;
  rotX: number;
  /** Where rotY settles when nobody is dragging: a multiple of PI (front or back). */
  rest: number;
  dragging: boolean;
  /** Flavor whose art is on the mesh right now (lags `active` until mid-spin). */
  shown: number;
  /** Spin progress 0..1, or -1 when idle. */
  spin: number;
  orbit: number;
  orbitSpeed: number;
}

export interface PouchSceneProps {
  active: number;
  selected: string | null;
  onSelect: (ingredient: string | null) => void;
  onReady: () => void;
  onInteract: () => void;
}

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const bell = (x: number, centre: number, width: number) => Math.exp(-(((x - centre) / width) ** 2));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (from: number, to: number, lambda: number, dt: number) => from + (to - from) * (1 - Math.exp(-lambda * dt));

// ── Shape ─────────────────────────────────────────────────────────────────────────────

/** Extra depth of the filled body on the centre line, at height v (0 bottom .. 1 top). */
function bodyDepth(v: number) {
  const start = ZIP_V - 0.012;
  if (v >= start) return 0;
  const t = Math.min(1, (start - v) / 0.46);
  let d = BELLY * Math.pow(Math.sin((t * Math.PI) / 2), 0.7); // flares out under the zip: a teardrop side profile
  d *= 1 - 0.08 * smooth((0.3 - v) / 0.3); // the gusset pulls the lowest part in a touch
  d *= 0.9 + 0.1 * Math.sqrt(smooth(v / 0.03)); // rounded fold into the base
  return d;
}

/** How full the body is across the width: a lens at the base, a pillow higher up. */
function across(uu: number, v: number) {
  const k = smooth(v / 0.4);
  const e = lerp(2.0, 2.6, k);
  const p = lerp(0.5, 0.62, k);
  return Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, uu), e)), p);
}

/** Half-thickness of one face at (u, v); u is -1..1 across, v 0..1 up. */
function faceZ(u: number, v: number) {
  const au = Math.abs(u);
  const uu = au / 0.97; // the outer 3% is the flat side seal
  // Front and back meet along the sides and the top edge (crimped seal).
  const crimp = smooth((1 - au) / 0.02) * smooth((1 - v) / 0.012);
  const zipAcross = 1 - smooth((au - 0.9) / 0.07);
  const zip = 0.016 * (bell(v, ZIP_V, 0.0035) + 0.8 * bell(v, ZIP_V + 0.008, 0.003)) * zipAcross;
  const sealLines =
    v > SEAL_V + 0.008 && v < 0.986 ? 0.0018 * (0.5 + 0.5 * Math.cos((TAU * (v - SEAL_V)) / 0.0075)) * zipAcross : 0;
  const body = bodyDepth(v) * across(uu, v);
  // Film creases: diagonal near the upper sides, and where the gusset pulls the base corners.
  const sideBand = smooth((au - 0.55) / 0.4) * smooth((0.99 - au) / 0.08);
  const creases =
    sideBand *
    (0.006 * bell(v, 0.66, 0.17) * Math.sin(26 * (au * 0.7 + v * 1.15)) +
      0.004 * bell(v, 0.06, 0.06) * Math.sin(30 * (au - v * 1.4)));
  return crimp * (SEAL_Z + body + zip + sealLines) + creases * (body > 0.02 ? 1 : 0);
}

/** Baked ambient occlusion for the face: darker in the seams, under the zip and at the base. */
function faceAO(u: number, v: number, z: number) {
  const au = Math.abs(u);
  const seam = 1 - 0.24 * (1 - smooth((0.97 - au) / 0.2)) * (v < ZIP_V ? 1 : 0.4);
  const underZip = 1 - 0.2 * bell(v, ZIP_V - 0.02, 0.012);
  const base = 1 - 0.3 * (1 - smooth(v / 0.08));
  const crown = 0.9 + 0.1 * Math.min(1, Math.max(0, (z - SEAL_Z) / BELLY));
  return seam * underZip * base * crown;
}

function axis(n: number, warp: (x: number) => number) {
  return Array.from({ length: n + 1 }, (_, i) => warp(i / n));
}

/** One face of the pouch, built as a grid that is denser where the shape changes fast. */
function makeFaceGeometry() {
  // Columns: a little denser towards the side seals.
  const us = axis(64, (t) => {
    const x = t * 2 - 1;
    return Math.sign(x) * Math.pow(Math.abs(x), 0.8);
  });
  // Rows: fine at the top (zip + seal lines) and at the base fold.
  const vs: number[] = [];
  for (let v = 0; v < 1; v += v > 0.84 ? 0.0016 : v < 0.05 ? 0.004 : 0.008) vs.push(v);
  vs.push(1);

  const cols = us.length;
  const rows = vs.length;
  const position = new Float32Array(cols * rows * 3);
  const uv = new Float32Array(cols * rows * 2);
  const color = new Float32Array(cols * rows * 3);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const u = us[c];
      const v = vs[r];
      const z = faceZ(u, v);
      position.set([(u * POUCH_W) / 2, (v - 0.5) * POUCH_H, z], i * 3);
      uv.set([(u + 1) / 2, v], i * 2);
      const ao = faceAO(u, v, z);
      color.set([ao, ao, ao], i * 3);
    }
  }
  const index: number[] = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const d = a + cols;
      const e = d + 1;
      index.push(a, b, d, b, e, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(position, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.BufferAttribute(color, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** The bottom gusset: a lens that closes the base between the front and back faces. */
function makeBaseGeometry() {
  const shape = new THREE.Shape();
  const n = 48;
  const reach = 1 - CORNER * 0.8; // stay inside the rounded corners of the art
  for (let i = 0; i <= n; i++) {
    const u = -reach + (2 * reach * i) / n;
    const x = (u * POUCH_W) / 2;
    const z = faceZ(u, 0);
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  }
  for (let i = n; i >= 0; i--) {
    const u = -reach + (2 * reach * i) / n;
    shape.lineTo((u * POUCH_W) / 2, -faceZ(u, 0));
  }
  const g = new THREE.ShapeGeometry(shape, 1);
  g.rotateX(Math.PI / 2); // shape y -> depth (z); faces the ground
  g.translate(0, -POUCH_H / 2 + 0.002, 0);
  return g;
}

/** A soft dark lens for the contact shadow under the base. */
function makeContactTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(20,24,12,0.9)");
    grad.addColorStop(0.45, "rgba(20,24,12,0.55)");
    grad.addColorStop(1, "rgba(20,24,12,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The pack art's own colour at the very bottom, for the gusset. */
function baseColour(tex: THREE.Texture) {
  const img = tex.image as (CanvasImageSource & { width: number; height: number }) | undefined;
  const fallback = new THREE.Color("#24401f");
  if (!img?.width) return fallback;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return fallback;
  ctx.drawImage(img, img.width * 0.5, img.height * 0.965, 1, 1, 0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace).multiplyScalar(0.82);
}

function usePackTextures() {
  const urls = useMemo(() => HERO_FLAVORS.flatMap((f) => [f.front, f.back]), []);
  const textures = useLoader(THREE.TextureLoader, urls);
  return useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    });
    return HERO_FLAVORS.map((_, i) => ({
      front: textures[i * 2],
      back: textures[i * 2 + 1],
      base: baseColour(textures[i * 2]),
    }));
  }, [textures]);
}

/** Soft studio reflections from a generated room — no external HDR file. */
function addRoomEnvironment(gl: THREE.WebGLRenderer, scene: THREE.Scene) {
  const pmrem = new THREE.PMREMGenerator(gl);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.5;
  room.dispose?.();
  pmrem.dispose();
}

function Pouch({ ctlRef, active }: { ctlRef: React.RefObject<Controls>; active: number }) {
  const packs = usePackTextures();
  const face = useMemo(() => makeFaceGeometry(), []);
  const base = useMemo(() => makeBaseGeometry(), []);
  const contact = useMemo(() => makeContactTexture(), []);
  const root = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const frontMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const backMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const baseMat = useRef<THREE.MeshStandardMaterial>(null);
  const { viewport } = useThree();
  // Narrow stages (phones): shrink the pouch so the orbit still fits beside it.
  const fit = Math.min(1, viewport.width / 3.3);

  useEffect(
    () => () => {
      face.dispose();
      base.dispose();
      contact.dispose();
    },
    [face, base, contact],
  );

  useFrame((state, dt) => {
    const c = ctlRef.current;
    if (!c || !root.current || !turn.current || !tilt.current) return;
    const t = state.clock.elapsedTime;

    if (active !== c.shown && c.spin < 0) {
      c.spin = 0;
      c.rest = Math.round(c.rotY / TAU) * TAU; // always land on the front
    }
    let spinAngle = 0;
    if (c.spin >= 0) {
      c.spin = Math.min(1, c.spin + dt / SPIN_SECONDS);
      spinAngle = easeInOut(c.spin) * TAU;
      if (spinAngle >= Math.PI / 2 && c.shown !== active) {
        // Edge-on: nobody can see either face, so swap the art now.
        if (frontMat.current) frontMat.current.map = packs[active].front;
        if (backMat.current) backMat.current.map = packs[active].back;
        if (baseMat.current) baseMat.current.color.copy(packs[active].base);
        c.shown = active;
      }
      if (c.spin >= 1) {
        c.spin = -1;
        spinAngle = 0;
      }
    }

    if (!c.dragging) {
      c.rotY = damp(c.rotY, c.rest, 4.5, dt);
      c.rotX = damp(c.rotX, 0, 4.5, dt);
    }
    const sway = c.dragging ? 0 : 1;
    // It stands on the ground: turning about its own axis, rocking on its base — no bobbing.
    turn.current.rotation.y = c.rotY + spinAngle + Math.sin(t * 0.6) * 0.2 * sway;
    tilt.current.rotation.x = c.rotX + Math.sin(t * 0.45) * 0.015 * sway;
    root.current.scale.setScalar(damp(root.current.scale.x, fit, 4, dt));
  });

  const flip = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return; // that was a drag, not a tap
    e.stopPropagation();
    const c = ctlRef.current;
    if (c) c.rest = Math.round(c.rotY / Math.PI) * Math.PI + Math.PI;
  };

  const film = { alphaTest: 0.5, roughness: 0.5, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.42, vertexColors: true };

  return (
    <group ref={root} scale={0.86}>
      <group ref={turn}>
        {/* Rocks about its base, not its middle. */}
        <group ref={tilt} position-y={-POUCH_H / 2}>
          <group position-y={POUCH_H / 2}>
            <mesh geometry={face} onClick={flip} castShadow receiveShadow>
              <meshPhysicalMaterial ref={frontMat} map={packs[0].front} {...film} />
            </mesh>
            <mesh geometry={face} rotation-y={Math.PI} onClick={flip} castShadow receiveShadow>
              <meshPhysicalMaterial ref={backMat} map={packs[0].back} {...film} />
            </mesh>
            <mesh geometry={base} castShadow>
              <meshStandardMaterial ref={baseMat} color={packs[0].base} roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </group>
        {/* Contact shadow: the footprint pressing on the ground, turns with the pouch. */}
        <mesh rotation-x={-Math.PI / 2} position-y={-POUCH_H / 2 + 0.004} scale={[POUCH_W * 1.12, BELLY * 4.2, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={contact} transparent depthWrite={false} toneMapped={false} opacity={0.75} />
        </mesh>
      </group>
      {/* Ground: invisible except for the key light's soft cast shadow. */}
      <mesh rotation-x={-Math.PI / 2} position-y={-POUCH_H / 2} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <shadowMaterial transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  );
}

const RINGS = [
  { y: 0.62, tilt: 0.38, dir: 1 },
  { y: -0.78, tilt: -0.3, dir: 1 },
];

function Ingredients({
  ctlRef,
  selected,
  onSelect,
}: {
  ctlRef: React.RefObject<Controls>;
  selected: string | null;
  onSelect: (ingredient: string | null) => void;
}) {
  const textures = useLoader(
    THREE.TextureLoader,
    useMemo(() => HERO_SPRITES.map((s) => s.src), []),
  );
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const { viewport } = useThree();

  // Where each cut-out sits on its ring: spread evenly per flavor, alternating rings.
  const layout = useMemo(() => {
    const perFlavorRing = new Map<string, number>();
    const slots = HERO_SPRITES.map((s, i) => {
      const inFlavor = HERO_SPRITES.slice(0, i).filter((o) => o.flavor === s.flavor).length;
      const ring = inFlavor % 2;
      const key = `${s.flavor}:${ring}`;
      const index = perFlavorRing.get(key) ?? 0;
      perFlavorRing.set(key, index + 1);
      return { ring, index, key };
    });
    return slots.map((slot, i) => ({
      ring: slot.ring,
      phase: (slot.index / (perFlavorRing.get(slot.key) ?? 1)) * TAU + slot.ring * 1.1,
      tilt: ((i * 37) % 60) / 100 - 0.3,
    }));
  }, []);

  useEffect(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
    });
  }, [textures]);

  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const c = ctlRef.current;
    if (!c) return;
    const t = state.clock.elapsedTime;
    c.orbitSpeed = damp(c.orbitSpeed, selected ? 0 : 1, 3, dt);
    c.orbit += dt * 0.3 * c.orbitSpeed;

    const radiusX = Math.min(2.05, Math.max(1.12, viewport.width / 2 - 0.4));
    const radiusZ = radiusX * 0.62;
    const sizeMul = Math.min(1, Math.max(0.66, radiusX / 1.9));

    HERO_SPRITES.forEach((s, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const slot = layout[i];
      const ring = RINGS[slot.ring];
      const a = c.orbit * ring.dir + slot.phase;
      const isSelected = selected === s.ingredient;
      const visible = s.flavor === c.shown ? 1 : 0;

      if (isSelected && s.primary) {
        target.set(radiusX * 0.5, -0.35, 1.7);
      } else {
        target.set(
          Math.cos(a) * radiusX,
          ring.y + Math.sin(a + 0.8) * ring.tilt + Math.sin(t * 1.1 + slot.phase) * 0.05,
          Math.sin(a) * radiusZ,
        );
      }
      // First frame: start on the ring, not flying in from the centre.
      if (mesh.userData.placed) mesh.position.lerp(target, 1 - Math.exp(-5 * dt));
      else {
        mesh.position.copy(target);
        mesh.userData.placed = true;
      }

      const image = textures[i].image as { width: number; height: number } | undefined;
      const aspect = image ? image.width / image.height : 1;
      const base = 0.62 * sizeMul * (isSelected ? (s.primary ? 1.55 : 1.2) : selected ? 0.82 : 1) * visible;
      const sx = damp(mesh.scale.x, aspect >= 1 ? base : base * aspect, 6, dt);
      const sy = damp(mesh.scale.y, aspect >= 1 ? base / aspect : base, 6, dt);
      mesh.scale.set(sx, sy, 1);
      mesh.rotation.z = slot.tilt + Math.sin(t * 0.5 + slot.phase) * 0.14;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = damp(mat.opacity, selected && !isSelected ? 0.4 : 1, 6, dt);
    });
  });

  return (
    <>
      {HERO_SPRITES.map((s, i) => (
        <mesh
          key={`${s.flavor}-${s.src}`}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          scale={0}
          onClick={(e) => {
            if (e.delta > 6) return;
            e.stopPropagation();
            onSelect(selected === s.ingredient ? null : s.ingredient);
          }}
          onPointerOver={() => {
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={textures[i]} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

function Ready({ onReady }: { onReady: () => void }) {
  // Mounts only once every texture in the Suspense boundary has loaded.
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

export default function PouchScene({ active, selected, onSelect, onReady, onInteract }: PouchSceneProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const ctl = useRef<Controls>({
    rotY: -1.5,
    rotX: 0,
    rest: 0,
    dragging: false,
    shown: active,
    spin: -1,
    orbit: 0,
    orbitSpeed: 1,
  });
  const [onScreen, setOnScreen] = useState(true);

  // Stop rendering while the hero is scrolled out of view.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    [],
  );

  // Drag to turn the pouch. Listeners live on window so a drag can leave the canvas; the
  // canvas keeps `touch-action: pan-y`, so a vertical swipe still scrolls the page.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const c = ctl.current;
    const start = { x: e.clientX, y: e.clientY, rotY: c.rotY, rotX: c.rotX };
    let moved = false;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!moved && Math.abs(dx) < 5) return;
      if (!moved) {
        moved = true;
        c.dragging = true;
        onInteract();
      }
      c.rotY = start.rotY + dx * 0.011;
      // Rocking on its base: a little goes a long way.
      c.rotX = Math.min(0.16, Math.max(-0.16, start.rotX + dy * 0.002));
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (moved) {
        c.dragging = false;
        c.rest = Math.round(c.rotY / Math.PI) * Math.PI;
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  return (
    <div ref={wrap} onPointerDown={onPointerDown} style={{ position: "absolute", inset: 0, cursor: "grab" }}>
      <Canvas
        shadows="variance"
        dpr={[1, 2]}
        frameloop={onScreen ? "always" : "never"}
        camera={{ fov: 28, position: [0, 0.95, 8.9], near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl, camera, scene }) => {
          addRoomEnvironment(gl, scene);
          // Neutral tone mapping keeps the printed colours true while rolling off highlights.
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1.02;
          camera.lookAt(0, -0.08, 0); // a touch above the pouch: the base and its shadow read
        }}
        style={{ touchAction: "pan-y" }}
        onPointerMissed={() => onSelect(null)}
        aria-hidden="true"
      >
        <hemisphereLight args={["#fff7ea", "#6f5f45", 0.85]} />
        <directionalLight
          position={[-2.2, 9, 2.8]}
          intensity={2.3}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.03}
          shadow-radius={9}
          shadow-blurSamples={16}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-camera-near={1}
          shadow-camera-far={20}
        />
        {/* Warm fill from the right, and a rim from behind that outlines the profile. */}
        <directionalLight position={[4, 1.4, 3.6]} intensity={0.55} color="#ffe9cc" />
        <directionalLight position={[0.6, 3.2, -5]} intensity={1.5} color="#fffaf0" />
        <Suspense fallback={null}>
          <Pouch ctlRef={ctl} active={active} />
          <Ingredients ctlRef={ctl} selected={selected} onSelect={onSelect} />
          <Ready onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}
