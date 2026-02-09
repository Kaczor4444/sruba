
import { BoltParams, HeadType, TipType } from '../types.ts';

export const generateBlenderScript = (params: BoltParams): string => {
  const {
    d, pitch, headS, headH, length, threadDepth,
    headType, socketType, socketDepthPercent, tipType, tipLength, quantity,
    hasNut, nutHeight, hasWasher, washerThickness, washerOuterD
  } = params;

  const isExternalHex = headType === HeadType.HEX;
  const isSquare = headType === HeadType.SQUARE;
  const headVertices = isExternalHex ? 6 : isSquare ? 4 : 64;
  const shaftRadius = d / 2 - threadDepth;

  // Convert JavaScript booleans to Python booleans
  const pyBool = (val: boolean) => val ? 'True' : 'False';

  // Socket parameters
  const socketRadius = (headS / 2) * 0.6;
  const socketDepth = headH * (socketDepthPercent / 100);
  const socketVertices = socketType === 'HEX' ? 6 : socketType === 'TORX' ? 6 : 32;

  return `import bpy
import math

# --- GENERATED BOLT KIT SCRIPT v1.6.0 ---
D = ${d.toFixed(2)}
PITCH = ${pitch.toFixed(2)}
HEAD_S = ${headS.toFixed(2)}
HEAD_H = ${headH.toFixed(2)}
LENGTH = ${length.toFixed(2)}
THREAD_DEPTH = ${threadDepth.toFixed(2)}
SOCKET_TYPE = "${socketType}"
SOCKET_RADIUS = ${socketRadius.toFixed(2)}
SOCKET_DEPTH = ${socketDepth.toFixed(2)}
SOCKET_VERTICES = ${socketVertices}
QUANTITY = ${quantity}
HAS_NUT = ${pyBool(hasNut)}
NUT_H = ${nutHeight.toFixed(2)}
HAS_WASHER = ${pyBool(hasWasher)}
W_THICK = ${washerThickness.toFixed(2)}
W_OUTER = ${washerOuterD.toFixed(2)}

# Minimal safe clearance for 3D printing separation
CLEARANCE = 0.8

def cleanup():
    if bpy.context.object and bpy.context.object.mode == 'EDIT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def create_bolt(idx, x_off, y_off):
    bpy.ops.mesh.primitive_cylinder_add(vertices=${headVertices}, radius=HEAD_S/2, depth=HEAD_H, location=(x_off, y_off, HEAD_H/2))
    head = bpy.context.active_object
    head.name = f"Bolt_{idx}_Head"
    if ${pyBool(headType === HeadType.HEX)}: head.rotation_euler[2] = math.pi/6
    if ${pyBool(headType === HeadType.SQUARE)}: head.rotation_euler[2] = math.pi/4

    # Add socket (key hole) if not NONE
    if SOCKET_TYPE != "NONE":
        socket_z = HEAD_H - SOCKET_DEPTH/2
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=SOCKET_VERTICES,
            radius=SOCKET_RADIUS,
            depth=SOCKET_DEPTH + 0.1,
            location=(x_off, y_off, socket_z)
        )
        socket_cutter = bpy.context.active_object
        if SOCKET_TYPE == "HEX":
            socket_cutter.rotation_euler[2] = math.pi/6

        # Boolean subtract socket from head
        mod = head.modifiers.new(name="Socket", type='BOOLEAN')
        mod.object = socket_cutter
        mod.operation = 'DIFFERENCE'
        bpy.context.view_layer.objects.active = head
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(socket_cutter, do_unlink=True)

    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=${shaftRadius.toFixed(4)}, depth=LENGTH, location=(x_off, y_off, HEAD_H + LENGTH/2))
    shaft = bpy.context.active_object
    shaft.name = f"Bolt_{idx}_Shaft"

    # Add threads (simplified as torus rings)
    num_threads = int(LENGTH / PITCH)
    for t in range(num_threads):
        z_pos = HEAD_H + (t * PITCH)
        bpy.ops.mesh.primitive_torus_add(
            major_radius=${shaftRadius.toFixed(4)} + THREAD_DEPTH/2,
            minor_radius=THREAD_DEPTH/2,
            major_segments=32,
            minor_segments=12,
            location=(x_off, y_off, z_pos)
        )
        thread = bpy.context.active_object
        thread.name = f"Bolt_{idx}_Thread_{t}"

    if "${tipType}" == "POINTED":
        bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=${shaftRadius.toFixed(4)}, radius2=0.0, depth=${tipLength}, location=(x_off, y_off, HEAD_H + LENGTH + ${tipLength}/2))
    elif "${tipType}" == "DOG_POINT":
        bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=${(shaftRadius * 0.7).toFixed(4)}, depth=${tipLength}, location=(x_off, y_off, HEAD_H + LENGTH + ${tipLength}/2))

def create_nut(idx, x_off, y_off):
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=HEAD_S/2, depth=NUT_H, location=(x_off, y_off, NUT_H/2))
    nut = bpy.context.active_object
    nut.name = f"Nut_{idx}"
    nut.rotation_euler[2] = math.pi/6
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=(D/2)+0.2, depth=NUT_H+1.0, location=(x_off, y_off, NUT_H/2))
    cutter = bpy.context.active_object
    mod = nut.modifiers.new(name="NutHole", type='BOOLEAN')
    mod.object = cutter
    mod.operation = 'DIFFERENCE'
    bpy.context.view_layer.objects.active = nut
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)

    # Add internal threads (simplified as torus rings)
    thread_radius = (D/2) + 0.2 - THREAD_DEPTH/2
    num_threads = int(NUT_H / PITCH)
    for t in range(num_threads):
        z_pos = (t * PITCH) + PITCH/2
        bpy.ops.mesh.primitive_torus_add(
            major_radius=thread_radius,
            minor_radius=THREAD_DEPTH/2,
            major_segments=32,
            minor_segments=12,
            location=(x_off, y_off, z_pos)
        )
        thread = bpy.context.active_object
        thread.name = f"Nut_{idx}_Thread_{t}"

def create_washer(idx, x_off, y_off):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=W_OUTER/2, depth=W_THICK, location=(x_off, y_off, W_THICK/2))
    washer = bpy.context.active_object
    washer.name = f"Washer_{idx}"
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=(D/2)+0.15, depth=W_THICK+1.0, location=(x_off, y_off, W_THICK/2))
    cutter = bpy.context.active_object
    mod = washer.modifiers.new(name="WasherHole", type='BOOLEAN')
    mod.object = cutter
    mod.operation = 'DIFFERENCE'
    bpy.context.view_layer.objects.active = washer
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)

cleanup()

bolt_r = HEAD_S / 2
nut_r = HEAD_S / 2
washer_r = W_OUTER / 2
max_r = max(bolt_r, nut_r, washer_r)

kit_w = bolt_r * 2
if HAS_NUT: kit_w += (CLEARANCE + nut_r * 2)
if HAS_WASHER: kit_w += (CLEARANCE + washer_r * 2)

cols = math.ceil(math.sqrt(QUANTITY))
for i in range(QUANTITY):
    row = i // cols
    col = i % cols
    origin_x = col * (kit_w + 4.0)
    origin_y = row * (max_r * 2 + 2.0)
    
    create_bolt(i, origin_x + bolt_r, origin_y)
    curr_x = origin_x + bolt_r * 2 + CLEARANCE
    if HAS_NUT:
        create_nut(i, curr_x + nut_r, origin_y)
        curr_x += (nut_r * 2 + CLEARANCE)
    if HAS_WASHER:
        create_washer(i, curr_x + washer_r, origin_y)

print(f"Batch Generation Complete: {QUANTITY} sets created.")
`;
};
