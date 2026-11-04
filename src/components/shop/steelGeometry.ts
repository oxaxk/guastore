import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

/** Outline traced from the supplied front photograph; units are relative, not measured millimetres. */
export function steelOutline() {
  const shape = new THREE.Shape();
  const x = (v: number) => (v - 235) / 220;
  const y = (v: number) => (295 - v) / 220;
  const curve = (a: number, b: number, c: number, d: number, e: number, f: number) =>
    shape.bezierCurveTo(x(a), y(b), x(c), y(d), x(e), y(f));
  shape.moveTo(x(113), y(32));
  curve(64, 20, 23, 54, 24, 98);
  curve(32, 164, 47, 248, 61, 332);
  curve(68, 420, 68, 495, 103, 530);
  curve(128, 560, 176, 548, 220, 528);
  curve(347, 470, 420, 392, 435, 289);
  curve(446, 218, 420, 143, 383, 113);
  curve(343, 77, 317, 98, 283, 124);
  curve(247, 153, 218, 152, 190, 124);
  curve(170, 105, 163, 60, 139, 41);
  curve(130, 34, 123, 32, 113, 32);
  shape.closePath();
  return shape;
}

export function createSteelGeometry() {
  const raw = new THREE.ExtrudeGeometry(steelOutline(), {
    depth: 0.004,
    bevelEnabled: true,
    bevelThickness: 0.034,
    bevelSize: 0.034,
    bevelSegments: 16,
    curveSegments: 48,
    steps: 1,
  });
  raw.translate(0, 0, -0.002);
  // Average adjacent bevel normals so the edge rolls continuously into both faces.
  raw.deleteAttribute('normal');
  raw.deleteAttribute('uv');
  const geometry = mergeVertices(raw, 0.00001);
  geometry.computeVertexNormals();
  const smoothPositions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const normal = new THREE.Vector3();
  for (let i = 0; i < smoothPositions.count; i++) {
    const x = smoothPositions.getX(i);
    const y = smoothPositions.getY(i);
    const z = smoothPositions.getZ(i);
    // A subtle optical crown reflects the reference's softly polished face.
    // Keeping the cap coplanar avoids cracks at tessellation junctions.
    if (Math.abs(z) > 0.035) {
      normal.set(0.074 * 0.72 ** 2 * x, 0.074 * 0.69 ** 2 * y, Math.sign(z)).normalize();
      normals.setXYZ(i, normal.x, normal.y, normal.z);
    }
  }
  raw.dispose();
  return geometry;
}

export function createSteelObject() {
  const group = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({
    color: 0xc6c9cc,
    metalness: 1,
    roughness: 0.09,
    envMapIntensity: 1.15,
  });
  group.add(new THREE.Mesh(createSteelGeometry(), steel));

  // The fine outline engraving shown on the original, on the front face only.
  const points = steelOutline().getSpacedPoints(180).map(p => {
    const x = p.x * 0.195 - 0.40;
    const y = p.y * 0.195 - 0.49;
    return new THREE.Vector3(x, y, 0.0382);
  });
  const curve = new THREE.CatmullRomCurve3(points, true);
  const engraving = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 180, 0.0021, 5, true),
    new THREE.MeshStandardMaterial({ color: 0x5e6264, metalness: 0.8, roughness: 0.4 }),
  );
  group.add(engraving);
  return group;
}

export function createSteelStudio(renderer: THREE.WebGLRenderer) {
  const studio = new THREE.Scene();
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(18, 18, 18),
    new THREE.MeshBasicMaterial({ color: 0x91979d, side: THREE.BackSide }),
  );
  studio.add(room);
  const panel = (w: number, h: number, position: [number, number, number], color: number, strength = 1) => {
    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    material.color.multiplyScalar(strength);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    mesh.position.set(...position);
    mesh.lookAt(0, 0, 0);
    studio.add(mesh);
  };
  // Large softboxes and dark flags give polished steel its moving white/black reflections.
  panel(2.8, 9, [-4, 2, 5], 0xffffff, 2.4);
  panel(1.1, 8, [4, 0, 4], 0xffffff, 3.5);
  panel(6, 3, [0, 6, 2], 0xffffff, 2);
  panel(1.6, 10, [-2.0, -1, 5], 0x10151a);
  panel(2.5, 9, [1.6, -1, 5], 0x202831);
  panel(9, 4, [0, -5, 1], 0x40474e);
  panel(3, 7, [-3, 0, -5], 0xffffff, 2.3);
  panel(2, 7, [3, 1, -5], 0x222a32);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.035);
  pmrem.dispose();
  studio.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    }
  });
  return environment;
}
