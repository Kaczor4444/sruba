import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
// @ts-ignore - BufferGeometryUtils doesn't have types
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as fflate from 'fflate';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import { BoltParams, HeadType, SocketType, TipType } from '../types.ts';

// ===== 3D PRINTING TOLERANCE CALCULATOR =====

/**
 * Calculate 3D printing offsets based on nozzle size
 * Larger nozzles need more clearance due to filament spread and lower precision
 */
const calculate3DPrintingOffsets = (nozzleSize: number) => {
  // Bolt offset: how much to reduce bolt diameter (makes bolt thinner)
  // Nut clearance: extra space in nut hole (makes nut hole larger)

  if (nozzleSize <= 0.2) {
    return { boltOffset: 0.15, nutClearance: 0.25 };
  } else if (nozzleSize <= 0.4) {
    return { boltOffset: 0.2, nutClearance: 0.35 };
  } else if (nozzleSize <= 0.6) {
    return { boltOffset: 0.3, nutClearance: 0.5 };
  } else {
    return { boltOffset: 0.4, nutClearance: 0.6 };
  }
};

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

  // Calculate 3D printing offsets
  const offsets = calculate3DPrintingOffsets(params.nozzleSize);

  // Łeb
  const head = createHeadWithSocket(params);
  group.add(head);

  // Trzpień - REDUCED by boltOffset for 3D printing clearance
  const shaftRadius = (params.d / 2) - params.threadDepth - offsets.boltOffset;
  const shaftGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, params.length, 32);
  shaftGeo.rotateX(Math.PI / 2);
  shaftGeo.translate(0, 0, params.headH + params.length / 2);
  group.add(new THREE.Mesh(shaftGeo, material));

  // Gwinty (uproszczone pierścienie) - also adjusted
  const numThreads = Math.floor(params.length / params.pitch);
  for (let i = 0; i < numThreads; i++) {
    // Increased from 8 to 12 radial segments for better manifold geometry
    const threadGeo = new THREE.TorusGeometry(shaftRadius + params.threadDepth/2, params.threadDepth/2, 12, 32);
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

  // Calculate 3D printing offsets
  const offsets = calculate3DPrintingOffsets(params.nozzleSize);

  // Inner hole INCREASED by nutClearance for 3D printing fit
  // Bolt outer diameter after offset = d - (2 * boltOffset)
  // Nut needs additional clearance for smooth threading
  const innerRadius = (params.d / 2) + offsets.nutClearance;
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
    // Increased from 8 to 12 radial segments for better manifold geometry
    const threadGeo = new THREE.TorusGeometry(threadRadius, params.threadDepth / 2, 12, 32);
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

// Helper function to merge Group into single Mesh for STL export
const mergeGroupToMesh = (group: THREE.Group): THREE.Mesh => {
  const geometries: THREE.BufferGeometry[] = [];

  group.traverse((child: any) => {
    if (child instanceof THREE.Mesh) {
      let geo = child.geometry.clone();
      child.updateWorldMatrix(true, false);
      geo.applyMatrix4(child.matrixWorld);

      // CRITICAL FIX: Remove indices to ensure all geometries are compatible
      // BufferGeometryUtils.mergeGeometries requires all geometries to have
      // the same index configuration (all indexed or all non-indexed)
      if (geo.index !== null) {
        geo = geo.toNonIndexed();
      }

      console.log('Added geometry with vertices:', geo.attributes.position?.count || 0);
      geometries.push(geo);
    }
  });

  console.log('Total geometries to merge:', geometries.length);

  if (geometries.length === 0) {
    console.error('No geometries found in group');
    return new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial());
  }

  const mergedGeo = mergeGeometries(geometries, false) as THREE.BufferGeometry;

  if (!mergedGeo) {
    console.error('mergeGeometries returned null');
    return new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial());
  }

  console.log('Merged geometry vertices before cleanup:', mergedGeo.attributes.position?.count || 0);

  // CRITICAL: Merge duplicate vertices to fix non-manifold edges
  const cleanedGeo = mergeVertices(mergedGeo, 0.0001);
  cleanedGeo.computeVertexNormals();

  console.log('Final geometry vertices after mergeVertices:', cleanedGeo.attributes.position?.count || 0);

  return new THREE.Mesh(cleanedGeo, new THREE.MeshStandardMaterial());
};

export const downloadSTL = (params: BoltParams) => {
  try {
    const exporter = new STLExporter();
    const files: Record<string, Uint8Array> = {};

    // Generate individual parts
    for (let i = 0; i < params.quantity; i++) {
      const boltIndex = i + 1;

      // Export bolt - merge all meshes into one
      console.log('--- Exporting Bolt', boltIndex, '---');
      const boltGroup = createSingleBolt(params);
      const boltMesh = mergeGroupToMesh(boltGroup);
      const boltSTL = exporter.parse(boltMesh, { binary: true }) as DataView;
      console.log('Bolt STL size:', boltSTL.byteLength, 'bytes');

      // Convert DataView to Uint8Array for fflate
      const boltArray = new Uint8Array(boltSTL.buffer);
      console.log('Bolt array length:', boltArray.length);
      files[`bolt_${boltIndex}.stl`] = boltArray;

      // Export nut if enabled
      if (params.hasNut) {
        console.log('--- Exporting Nut', boltIndex, '---');
        const nutGroup = createSingleNut(params);
        const nutMesh = mergeGroupToMesh(nutGroup);
        const nutSTL = exporter.parse(nutMesh, { binary: true }) as DataView;
        console.log('Nut STL size:', nutSTL.byteLength, 'bytes');
        files[`nut_${boltIndex}.stl`] = new Uint8Array(nutSTL.buffer);
      }

      // Export washer if enabled
      if (params.hasWasher) {
        console.log('--- Exporting Washer', boltIndex, '---');
        const washer = createSingleWasher(params);
        const washerSTL = exporter.parse(washer, { binary: true }) as DataView;
        console.log('Washer STL size:', washerSTL.byteLength, 'bytes');
        files[`washer_${boltIndex}.stl`] = new Uint8Array(washerSTL.buffer);
      }
    }

    // Create ZIP archive with separate STL files
    const zipped = fflate.zipSync(files, { level: 6 });
    const blob = new Blob([zipped], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bolt_kit_${params.quantity}x.zip`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('STL Export Error:', error);
    alert('Export failed! Check console for details.');
  }
};

// Helper to convert mesh to 3MF XML vertices and triangles
const meshTo3MFGeometry = (mesh: THREE.Mesh): { vertices: string; triangles: string } => {
  const geometry = mesh.geometry;
  const position = geometry.attributes.position;
  const index = geometry.index;

  let verticesXML = '';
  let trianglesXML = '';

  // Generate vertices
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    verticesXML += `      <vertex x="${x.toFixed(3)}" y="${y.toFixed(3)}" z="${z.toFixed(3)}"/>\n`;
  }

  // Generate triangles
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const v1 = index.getX(i);
      const v2 = index.getX(i + 1);
      const v3 = index.getX(i + 2);
      trianglesXML += `      <triangle v1="${v1}" v2="${v2}" v3="${v3}"/>\n`;
    }
  } else {
    // Non-indexed geometry
    for (let i = 0; i < position.count; i += 3) {
      trianglesXML += `      <triangle v1="${i}" v2="${i + 1}" v3="${i + 2}"/>\n`;
    }
  }

  return { vertices: verticesXML, triangles: trianglesXML };
};

export const download3MF = (params: BoltParams) => {
  try {
    const files: Record<string, Uint8Array> = {};
    let objectsXML = '';
    let buildItemsXML = '';
    let objectId = 1;
    const spacing = 15; // Spacing between objects

    // Generate each set of objects
    for (let i = 0; i < params.quantity; i++) {
      const setIndex = i + 1;
      let xOffset = i * spacing * 3;

      // Add bolt
      console.log('--- Adding Bolt to 3MF', setIndex, '---');
      const boltGroup = createSingleBolt(params);
      const boltMesh = mergeGroupToMesh(boltGroup);
      const boltGeo = meshTo3MFGeometry(boltMesh);

      objectsXML += `  <object id="${objectId}" name="Bolt_${setIndex}" type="model">\n`;
      objectsXML += `    <mesh>\n`;
      objectsXML += `      <vertices>\n${boltGeo.vertices}      </vertices>\n`;
      objectsXML += `      <triangles>\n${boltGeo.triangles}      </triangles>\n`;
      objectsXML += `    </mesh>\n`;
      objectsXML += `  </object>\n`;

      buildItemsXML += `    <item objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 ${xOffset} 0 0"/>\n`;
      objectId++;
      xOffset += spacing;

      // Add nut if enabled
      if (params.hasNut) {
        console.log('--- Adding Nut to 3MF', setIndex, '---');
        const nutGroup = createSingleNut(params);
        const nutMesh = mergeGroupToMesh(nutGroup);
        const nutGeo = meshTo3MFGeometry(nutMesh);

        objectsXML += `  <object id="${objectId}" name="Nut_${setIndex}" type="model">\n`;
        objectsXML += `    <mesh>\n`;
        objectsXML += `      <vertices>\n${nutGeo.vertices}      </vertices>\n`;
        objectsXML += `      <triangles>\n${nutGeo.triangles}      </triangles>\n`;
        objectsXML += `    </mesh>\n`;
        objectsXML += `  </object>\n`;

        buildItemsXML += `    <item objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 ${xOffset} 0 0"/>\n`;
        objectId++;
        xOffset += spacing;
      }

      // Add washer if enabled
      if (params.hasWasher) {
        console.log('--- Adding Washer to 3MF', setIndex, '---');
        const washer = createSingleWasher(params);
        const washerGeo = meshTo3MFGeometry(washer);

        objectsXML += `  <object id="${objectId}" name="Washer_${setIndex}" type="model">\n`;
        objectsXML += `    <mesh>\n`;
        objectsXML += `      <vertices>\n${washerGeo.vertices}      </vertices>\n`;
        objectsXML += `      <triangles>\n${washerGeo.triangles}      </triangles>\n`;
        objectsXML += `    </mesh>\n`;
        objectsXML += `  </object>\n`;

        buildItemsXML += `    <item objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 ${xOffset} 0 0"/>\n`;
        objectId++;
      }
    }

    // Create 3D/3dmodel.model XML
    const modelXML = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objectsXML}  </resources>
  <build>
${buildItemsXML}  </build>
</model>`;

    // Create [Content_Types].xml
    const contentTypesXML = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;

    // Create _rels/.rels
    const relsXML = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

    // Add files to ZIP
    files['[Content_Types].xml'] = new TextEncoder().encode(contentTypesXML);
    files['_rels/.rels'] = new TextEncoder().encode(relsXML);
    files['3D/3dmodel.model'] = new TextEncoder().encode(modelXML);

    // Create 3MF (ZIP) file
    const zipped = fflate.zipSync(files, { level: 6 });
    const blob = new Blob([zipped], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bolt_kit_${params.quantity}x.3mf`;
    link.click();
    URL.revokeObjectURL(url);

    console.log('3MF exported successfully with', objectId - 1, 'objects');
  } catch (error) {
    console.error('3MF Export Error:', error);
    alert('3MF export failed! Check console for details.');
  }
};