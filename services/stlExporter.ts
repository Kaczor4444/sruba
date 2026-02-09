import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as fflate from 'fflate';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import { BoltParams, HeadType, SocketType, TipType } from '../types.ts';

// ===== HELPER FUNCTIONS FOR HEAD GEOMETRY =====

const createHeadGeometry = (params: BoltParams): THREE.BufferGeometry => {
  const hR = params.headS / 2;
  const hH = params.headH;

  switch (params.headType) {
    case HeadType.HEX: {
      const shape = new THREE.Shape();
      for (let i = 0; i < 6; i++) {
        const a = (i * 60 + 30) * Math.PI / 180;
        const x = hR * Math.cos(a);
        const y = hR * Math.sin(a);
        if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
      }
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth: hH, bevelEnabled: false });
    }

    case HeadType.SQUARE: {
      const shape = new THREE.Shape();
      for (let i = 0; i < 4; i++) {
        const a = (i * 90 + 45) * Math.PI / 180;
        const x = hR * Math.cos(a);
        const y = hR * Math.sin(a);
        if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
      }
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth: hH, bevelEnabled: false });
    }

    case HeadType.BUTTON_HEAD: {
      // Uproszczony button head - cylinder (TODO: dodać dome)
      const shape = new THREE.Shape();
      shape.absarc(0, 0, hR, 0, Math.PI * 2, false);
      return new THREE.ExtrudeGeometry(shape, { depth: hH, bevelEnabled: false });
    }

    case HeadType.COUNTERSUNK: {
      const topR = hR * 0.6;
      const bottomR = hR;
      const coneGeo = new THREE.CylinderGeometry(topR, bottomR, hH, 32);
      coneGeo.rotateX(Math.PI / 2);
      coneGeo.translate(0, 0, hH / 2);
      return coneGeo;
    }

    case HeadType.ROUND:
    default: {
      // Okrągły cylindryczny łeb
      const shape = new THREE.Shape();
      shape.absarc(0, 0, hR, 0, Math.PI * 2, false);
      return new THREE.ExtrudeGeometry(shape, { depth: hH, bevelEnabled: false });
    }
  }
};

//  ===== HELPER FUNCTIONS FOR SOCKET GEOMETRY =====

const createSocketGeometry = (params: BoltParams): THREE.BufferGeometry | null => {
  if (params.socketType === SocketType.NONE) {
    return null;
  }

  const hR = params.headS / 2;
  const socketR = hR * 0.6;
  const shape = new THREE.Shape();

  switch (params.socketType) {
    case SocketType.HEX: {
      for (let i = 0; i < 6; i++) {
        const a = (i * 60 + 30) * Math.PI / 180;
        const x = socketR * Math.cos(a);
        const y = socketR * Math.sin(a);
        if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
      }
      shape.closePath();
      break;
    }

    case SocketType.TORX: {
      for (let i = 0; i < 12; i++) {
        const a = (i * 30) * Math.PI / 180;
        const r = i % 2 === 0 ? socketR : socketR * 0.7;
        const x = r * Math.cos(a);
        const y = r * Math.sin(a);
        if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
      }
      shape.closePath();
      break;
    }

    case SocketType.SLOT: {
      const slotW = hR * 1.4;
      const slotH = hR * 0.2;
      shape.moveTo(-slotW/2, -slotH/2);
      shape.lineTo(slotW/2, -slotH/2);
      shape.lineTo(slotW/2, slotH/2);
      shape.lineTo(-slotW/2, slotH/2);
      shape.closePath();
      break;
    }

    case SocketType.PHILLIPS: {
      const pw = hR * 1.6;
      const ph = hR * 0.35;
      const c = ph/2;
      shape.moveTo(-c, -pw/2);
      shape.lineTo(c, -pw/2);
      shape.lineTo(c, -c);
      shape.lineTo(pw/2, -c);
      shape.lineTo(pw/2, c);
      shape.lineTo(c, c);
      shape.lineTo(c, pw/2);
      shape.lineTo(-c, pw/2);
      shape.lineTo(-c, c);
      shape.lineTo(-pw/2, c);
      shape.lineTo(-pw/2, -c);
      shape.lineTo(-c, -c);
      shape.closePath();
      break;
    }

    default:
      return null;
  }

  const socketDepth = params.headH * (params.socketDepthPercent / 100);
  return new THREE.ExtrudeGeometry(shape, { depth: socketDepth, bevelEnabled: false });
};

// ===== MAIN FUNCTION =====


const createHeadWithSocket = (params: BoltParams): THREE.Mesh => {
  const material = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });

  // Tworzę geometrię łba
  const headGeo = createHeadGeometry(params);

  // Jeśli nie ma zagłębienia, zwróć sam łeb
  if (params.socketType === SocketType.NONE) {
    return new THREE.Mesh(headGeo, material);
  }

  // Tworzę geometrię zagłębienia
  const socketGeo = createSocketGeometry(params);

  if (!socketGeo) {
    // Brak zagłębienia - zwróć sam łeb
    return new THREE.Mesh(headGeo, material);
  }

  // Użyj CSG do odjęcia zagłębienia od łba
  try {
    const headBrush = new Brush(headGeo) as any;
    const socketBrush = new Brush(socketGeo) as any;

    const evaluator = new Evaluator();
    const resultBrush = evaluator.evaluate(headBrush, socketBrush, SUBTRACTION) as any;

    return new THREE.Mesh(resultBrush.geometry, material);
  } catch (error) {
    console.error('CSG error:', error);
    // Fallback - zwróć łeb bez zagłębienia
    return new THREE.Mesh(headGeo, material);
  }
};
const createSingleBolt = (params: BoltParams): THREE.Group => {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
  
  // Łeb
  const head = createHeadWithSocket(params);
  group.add(head);

  // Trzpień
  const shaftRadius = (params.d / 2) - params.threadDepth;
  const shaftGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, params.length, 32);
  shaftGeo.rotateX(Math.PI / 2);
  shaftGeo.translate(0, 0, params.headH + params.length / 2);
  group.add(new THREE.Mesh(shaftGeo, material));

  // Gwinty (uproszczone pierścienie)
  const numThreads = Math.floor(params.length / params.pitch);
  for (let i = 0; i < numThreads; i++) {
    const threadGeo = new THREE.TorusGeometry(shaftRadius + params.threadDepth/2, params.threadDepth/2, 8, 32);
    threadGeo.translate(0, 0, params.headH + (i * params.pitch));
    group.add(new THREE.Mesh(threadGeo, material));
  }

  // Końcówka
  if (params.tipType !== TipType.FLAT) {
    let tipGeo: THREE.BufferGeometry;
    if (params.tipType === TipType.POINTED) {
      tipGeo = new THREE.ConeGeometry(shaftRadius, params.tipLength, 32);
    } else {
      tipGeo = new THREE.CylinderGeometry(shaftRadius * 0.7, shaftRadius * 0.7, params.tipLength, 32);
    }
    tipGeo.rotateX(Math.PI / 2);
    tipGeo.translate(0, 0, params.headH + params.length + params.tipLength / 2);
    group.add(new THREE.Mesh(tipGeo, material));
  }
  
  return group;
};

const createSingleNut = (params: BoltParams): THREE.Group => {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });

  const innerRadius = (params.d / 2) + 0.4;
  const outerRadius = params.headS / 2;

  // Hexagonal body - FIX: properly initialize shape with moveTo
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 + 30) * Math.PI / 180;
    const x = outerRadius * Math.cos(a);
    const y = outerRadius * Math.sin(a);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: params.nutHeight,
    bevelEnabled: true,
    bevelThickness: 0.15,
    bevelSize: 0.15,
    bevelSegments: 1
  });
  group.add(new THREE.Mesh(geo, material));

  // Add internal threads - FIX: thread should be INSIDE the hole
  const threadRadius = innerRadius - params.threadDepth / 2;
  const numThreads = Math.floor(params.nutHeight / params.pitch);

  for (let i = 0; i < numThreads; i++) {
    const threadGeo = new THREE.TorusGeometry(threadRadius, params.threadDepth / 2, 8, 32);
    threadGeo.translate(0, 0, (i * params.pitch) + params.pitch / 2);
    group.add(new THREE.Mesh(threadGeo, material));
  }

  return group;
};

const createSingleWasher = (params: BoltParams): THREE.Mesh => {
  const innerRadius = (params.d / 2) + 0.3;
  const outerRadius = params.washerOuterD / 2;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, { depth: params.washerThickness, bevelEnabled: false });
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x64748b }));
};

export const generateMesh = (params: BoltParams): THREE.Group => {
  const masterGroup = new THREE.Group();
  const spacing = 10.0;
  const cols = Math.ceil(Math.sqrt(params.quantity));

  for (let i = 0; i < params.quantity; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = col * spacing * 3;
    const y = row * spacing * 2;

    const bolt = createSingleBolt(params);
    bolt.position.set(x, y, 0);
    masterGroup.add(bolt);

    if (params.hasNut) {
      const nut = createSingleNut(params);
      nut.position.set(x + spacing, y, 0);
      masterGroup.add(nut);
    }

    if (params.hasWasher) {
      const washer = createSingleWasher(params);
      washer.position.set(x + spacing * 2, y, 0);
      masterGroup.add(washer);
    }
  }

  // Centrowanie całej grupy
  const box = new THREE.Box3().setFromObject(masterGroup);
  const center = new THREE.Vector3();
  box.getCenter(center);
  masterGroup.position.sub(center);

  return masterGroup;
};

export const downloadSTL = (params: BoltParams) => {
  const meshGroup = generateMesh(params);
  meshGroup.updateMatrixWorld(true);
  const exporter = new STLExporter();
  const stlString = exporter.parse(meshGroup, { binary: true });
  const blob = new Blob([stlString], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bolt_kit.stl`;
  link.click();
};

export const download3MF = async (params: BoltParams) => {
  const meshGroup = generateMesh(params);
  meshGroup.updateMatrixWorld(true);
  const exporter = new GLTFExporter();

  exporter.parse(
    meshGroup,
    (result) => {
      const output = JSON.stringify(result, null, 2);
      const blob = new Blob([output], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bolt_kit.gltf`;
      link.click();
    },
    (error) => {
      console.error('Export error:', error);
    },
    { binary: false }
  );
};