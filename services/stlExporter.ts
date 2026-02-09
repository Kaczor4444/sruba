import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as fflate from 'fflate';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import { BoltParams, HeadType, TipType } from '../types.ts';

const createHeadWithSocket = (params: BoltParams): THREE.Mesh => {
  const hR = params.headS / 2;
  const hH = params.headH;
  const socketDepth = hH * 0.7;

  const isExternalHex = params.headType === HeadType.HEX;
  const isExternalSquare = params.headType === HeadType.SQUARE;

  // Tworzymy kształt łba (PEŁNY, bez dziury)
  const shape = new THREE.Shape();
  if (isExternalHex) {
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 + 30) * Math.PI / 180;
      const x = hR * Math.cos(a);
      const y = hR * Math.sin(a);
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
  } else if (isExternalSquare) {
    for (let i = 0; i < 4; i++) {
      const a = (i * 90 + 45) * Math.PI / 180;
      const x = hR * Math.cos(a);
      const y = hR * Math.sin(a);
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
  } else {
    shape.absarc(0, 0, hR, 0, Math.PI * 2, false);
  }

  // Definicja zagłębienia (socket)
  const socketR = hR * 0.6;
  const socketShape = new THREE.Path();
  let hasSocket = true;

  switch (params.headType) {
    case HeadType.HEX_SOCKET:
      for (let i = 0; i < 6; i++) {
        const a = (i * 60 + 30) * Math.PI / 180;
        const x = socketR * Math.cos(a);
        const y = socketR * Math.sin(a);
        if (i === 0) socketShape.moveTo(x, y); else socketShape.lineTo(x, y);
      }
      socketShape.closePath();
      break;
    case HeadType.TORX:
      for (let i = 0; i < 12; i++) {
        const a = (i * 30) * Math.PI / 180;
        const r = i % 2 === 0 ? socketR : socketR * 0.7;
        const x = r * Math.cos(a);
        const y = r * Math.sin(a);
        if (i === 0) socketShape.moveTo(x, y); else socketShape.lineTo(x, y);
      }
      socketShape.closePath();
      break;
    case HeadType.ROUND_SLOT:
      const sw = hR * 1.8;
      const sh = hR * 0.35;
      socketShape.moveTo(-sw/2, -sh/2);
      socketShape.lineTo(sw/2, -sh/2);
      socketShape.lineTo(sw/2, sh/2);
      socketShape.lineTo(-sw/2, sh/2);
      socketShape.closePath();
      break;
    case HeadType.ROUND_PHILLIPS:
      const pw = hR * 1.6;
      const ph = hR * 0.35;
      const c = ph/2;
      socketShape.moveTo(-c, -pw/2); socketShape.lineTo(c, -pw/2); socketShape.lineTo(c, -c);
      socketShape.lineTo(pw/2, -c); socketShape.lineTo(pw/2, c); socketShape.lineTo(c, c);
      socketShape.lineTo(c, pw/2); socketShape.lineTo(-c, pw/2); socketShape.lineTo(-c, c);
      socketShape.lineTo(-pw/2, c); socketShape.lineTo(-pw/2, -c); socketShape.lineTo(-c, -c);
      socketShape.closePath();
      break;
    default:
      hasSocket = false;
  }

  // Jeśli ma zagłębienie, użyj CSG do stworzenia płytkiego zagłębienia
  if (hasSocket) {
    try {
      // Tworzę pełny łeb
      const fullHeadGeo = new THREE.ExtrudeGeometry(shape, { depth: hH, bevelEnabled: false });

      // Tworzę zagłębienie
      const socketShapeForExtrude = new THREE.Shape();
      // Kopiuję punkty z socketShape do Shape
      if (params.headType === HeadType.HEX_SOCKET) {
        for (let i = 0; i < 6; i++) {
          const a = (i * 60 + 30) * Math.PI / 180;
          const x = socketR * Math.cos(a);
          const y = socketR * Math.sin(a);
          if (i === 0) socketShapeForExtrude.moveTo(x, y); else socketShapeForExtrude.lineTo(x, y);
        }
        socketShapeForExtrude.closePath();
      } else if (params.headType === HeadType.TORX) {
        for (let i = 0; i < 12; i++) {
          const a = (i * 30) * Math.PI / 180;
          const r = i % 2 === 0 ? socketR : socketR * 0.7;
          const x = r * Math.cos(a);
          const y = r * Math.sin(a);
          if (i === 0) socketShapeForExtrude.moveTo(x, y); else socketShapeForExtrude.lineTo(x, y);
        }
        socketShapeForExtrude.closePath();
      } else if (params.headType === HeadType.ROUND_SLOT) {
        const sw = hR * 1.8;
        const sh = hR * 0.35;
        socketShapeForExtrude.moveTo(-sw/2, -sh/2);
        socketShapeForExtrude.lineTo(sw/2, -sh/2);
        socketShapeForExtrude.lineTo(sw/2, sh/2);
        socketShapeForExtrude.lineTo(-sw/2, sh/2);
        socketShapeForExtrude.closePath();
      } else if (params.headType === HeadType.ROUND_PHILLIPS) {
        const pw = hR * 1.6;
        const ph = hR * 0.35;
        const c = ph/2;
        socketShapeForExtrude.moveTo(-c, -pw/2);
        socketShapeForExtrude.lineTo(c, -pw/2);
        socketShapeForExtrude.lineTo(c, -c);
        socketShapeForExtrude.lineTo(pw/2, -c);
        socketShapeForExtrude.lineTo(pw/2, c);
        socketShapeForExtrude.lineTo(c, c);
        socketShapeForExtrude.lineTo(c, pw/2);
        socketShapeForExtrude.lineTo(-c, pw/2);
        socketShapeForExtrude.lineTo(-c, c);
        socketShapeForExtrude.lineTo(-pw/2, c);
        socketShapeForExtrude.lineTo(-pw/2, -c);
        socketShapeForExtrude.lineTo(-c, -c);
        socketShapeForExtrude.closePath();
      } else {
        // Fallback dla innych typów - pełna dziura
        shape.holes.push(socketShape);
        const headWithHoleGeo = new THREE.ExtrudeGeometry(shape, { depth: hH, bevelEnabled: false });
        return new THREE.Mesh(headWithHoleGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      }

      const socketGeo = new THREE.ExtrudeGeometry(socketShapeForExtrude, { depth: socketDepth, bevelEnabled: false });

      // Tworze Brush'e dla CSG
      const headBrush = new Brush(fullHeadGeo);
      const socketBrush = new Brush(socketGeo);

      headBrush.updateMatrixWorld();
      socketBrush.updateMatrixWorld();

      // Operacja CSG - odejmij zagłębienie od łba
      const evaluator = new Evaluator();
      const resultBrush = evaluator.evaluate(headBrush, socketBrush, SUBTRACTION);

      return new THREE.Mesh(resultBrush.geometry, new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    } catch (error) {
      console.error('CSG error, using fallback:', error);
      // Fallback
      shape.holes.push(socketShape);
      const headWithHoleGeo = new THREE.ExtrudeGeometry(shape, { depth: hH, bevelEnabled: false });
      return new THREE.Mesh(headWithHoleGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    }
  }

  // Łeb bez zagłębienia (HEX, SQUARE)
  const fullHeadGeo = new THREE.ExtrudeGeometry(shape, { depth: hH, bevelEnabled: false });
  return new THREE.Mesh(fullHeadGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
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

const createSingleNut = (params: BoltParams): THREE.Mesh => {
  const innerRadius = (params.d / 2) + 0.4;
  const outerRadius = params.headS / 2;
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 + 30) * Math.PI / 180;
    shape.lineTo(outerRadius * Math.cos(a), outerRadius * Math.sin(a));
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, { depth: params.nutHeight, bevelEnabled: false });
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
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