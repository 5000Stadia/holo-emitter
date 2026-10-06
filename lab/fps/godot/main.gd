# The fps lab, Godot side: one case of spec.json, built from layout.json exactly as three.html
# builds it, measured on the same camera orbit. On the web: ?case=<id>, and the result goes to
# window.__result. Natively: --case=<id> after "--", and the result is printed as one JSON line.
extends Node3D

var spec: Dictionary
var layout: Dictionary
var C: Dictionary
var case_id := "base"
var cam: Camera3D
var times: Array = []
var t0 := 0.0
var last := 0.0
var bodies: Array = []
var boxes: MultiMesh
var physics_ms: Array = []
var done := false
var aim_tower := false

func _ready() -> void:
	spec = JSON.parse_string(FileAccess.get_file_as_string("res://spec.json"))
	layout = JSON.parse_string(FileAccess.get_file_as_string("res://layout.json"))
	if OS.has_feature("web"):
		case_id = str(JavaScriptBridge.eval("new URLSearchParams(location.search).get('case') || 'base'"))
		aim_tower = str(JavaScriptBridge.eval("new URLSearchParams(location.search).get('aim') || ''")) == "tower"
	else:
		for a in OS.get_cmdline_user_args():
			if a.begins_with("--case="):
				case_id = a.substr(7)
	C = spec.base.duplicate(true)
	for c in spec.cases:
		if c.id == case_id and c.has("set"):
			for k in c.set:
				C[k] = c.set[k]
	build()
	t0 = Time.get_ticks_usec() / 1000.0
	last = t0

func material() -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(1, 1, 1)
	m.roughness = 0.6
	match C.material:
		"basic": m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		"lambert":
			m.diffuse_mode = BaseMaterial3D.DIFFUSE_LAMBERT
			m.specular_mode = BaseMaterial3D.SPECULAR_DISABLED
		"physical":
			m.roughness = 0.4
			m.clearcoat_enabled = true
			m.clearcoat = 1.0
			m.clearcoat_roughness = 0.1
	return m

func build() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color8(0x8f, 0xa3, 0xb5)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color8(0xdd, 0xe6, 0xee)
	env.ambient_light_energy = 0.6
	if "ao" in C.post:
		env.ssao_enabled = true
	if "bloom" in C.post:
		env.glow_enabled = true
		env.glow_intensity = 0.6
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	get_viewport().msaa_3d = Viewport.MSAA_4X if C.msaa else Viewport.MSAA_DISABLED
	cam = Camera3D.new()
	cam.fov = 60
	cam.near = 0.1
	cam.far = 300
	add_child(cam)
	var sun := DirectionalLight3D.new()
	sun.light_energy = 2.5
	sun.look_at_from_position(Vector3(30, 50, 20), Vector3.ZERO)
	if C.shadows > 0:
		sun.shadow_enabled = true
		sun.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL
		sun.directional_shadow_max_distance = 90
		RenderingServer.directional_shadow_atlas_set_size(int(C.shadows), true)
	add_child(sun)
	for i in range(int(C.point_lights)):
		var L = layout.lights[i]
		var o := OmniLight3D.new()
		o.position = Vector3(L[0], L[1], L[2])
		o.light_color = Color(L[3], L[4], L[5])
		o.light_energy = 4.0
		o.omni_range = 20
		add_child(o)
	var ground := MeshInstance3D.new()
	var gm := BoxMesh.new()
	gm.size = Vector3(200, 1, 200)
	var gmat := StandardMaterial3D.new()
	gmat.albedo_color = Color8(0x6b, 0x6b, 0x5e)
	gm.material = gmat
	ground.mesh = gm
	ground.position.y = -0.5
	add_child(ground)
	if C.far:
		cam.far = 10000
		build_far()
	if C.physics > 0:
		build_physics()
		return
	if C.street > 0:
		build_street()
		return
	var sphere := SphereMesh.new()
	sphere.radius = 1.0
	sphere.height = 2.0
	sphere.radial_segments = int(C.segments[0])
	sphere.rings = int(C.segments[1]) - 1
	var n := int(C.objects)
	if C.instanced:
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.use_colors = true
		mm.mesh = sphere
		mm.instance_count = n
		for i in range(n):
			var o = layout.objects[i]
			mm.set_instance_transform(i, Transform3D(Basis().scaled(Vector3(o[3], o[3], o[3])), Vector3(o[0], o[1], o[2])))
			mm.set_instance_color(i, Color(o[4], o[5], o[6]))
		var mat := material()
		mat.vertex_color_use_as_albedo = true
		sphere.material = mat
		var mmi := MultiMeshInstance3D.new()
		mmi.multimesh = mm
		add_child(mmi)
	else:
		var shared := material()
		for i in range(n):
			var o = layout.objects[i]
			var mi := MeshInstance3D.new()
			mi.mesh = sphere
			var mat := shared if C.shared_material else material()
			if not C.shared_material:
				mat.albedo_color = Color(o[4], o[5], o[6])
			mi.material_override = mat
			if C.shadows > 0 and C.casters == "big" and o[3] <= 0.88:
				mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			mi.position = Vector3(o[0], o[1], o[2])
			mi.scale = Vector3(o[3], o[3], o[3])
			add_child(mi)

# long distance, as three.html: a tower and 200 buildings out to 5 km, each with a panel 5 cm proud of its wall
func build_far() -> void:
	var wall := StandardMaterial3D.new()
	wall.albedo_color = Color8(0xb8, 0xa8, 0x90)
	var panel := StandardMaterial3D.new()
	panel.albedo_color = Color8(0x5a, 0x6e, 0x88)
	var tower := MeshInstance3D.new()
	var tb := BoxMesh.new(); tb.size = Vector3(40, 300, 40); tb.material = wall
	tower.mesh = tb; tower.position = Vector3(0, 150, -4000); add_child(tower)
	var tp := MeshInstance3D.new()
	var tq := QuadMesh.new(); tq.size = Vector2(30, 280); tq.material = panel
	tp.mesh = tq; tp.position = Vector3(0, 150, -4000 + 20.05); add_child(tp)
	var s2 := 77
	var bmm := MultiMesh.new(); bmm.transform_format = MultiMesh.TRANSFORM_3D; var bb := BoxMesh.new(); bb.material = wall; bmm.mesh = bb; bmm.instance_count = 200
	var pmm := MultiMesh.new(); pmm.transform_format = MultiMesh.TRANSFORM_3D; var pq := QuadMesh.new(); pq.material = panel; pmm.mesh = pq; pmm.instance_count = 200
	for i in range(200):
		var vals: Array = []
		for j in range(4):
			s2 = (((s2 ^ (s2 >> 15)) * 2246822507) + 0x9e3779b9) & 0xffffffff
			s2 = s2 ^ (s2 >> 13)
			vals.append(float(s2) / 4294967296.0)
		var a: float = -PI / 2 + (vals[0] - 0.5) * 1.6
		var d: float = 1000 + vals[1] * 4000
		var w: float = 20 + vals[2] * 40
		var h: float = 20 + vals[3] * 120
		var x := cos(a) * d
		var z := sin(a) * d
		bmm.set_instance_transform(i, Transform3D(Basis().scaled(Vector3(w, h, w)), Vector3(x, h / 2, z)))
		pmm.set_instance_transform(i, Transform3D(Basis().scaled(Vector3(w * 0.8, h * 0.8, 1)), Vector3(x, h / 2, z + w / 2 + 0.05)))
	var bi := MultiMeshInstance3D.new(); bi.multimesh = bmm; add_child(bi)
	var pi := MultiMeshInstance3D.new(); pi.multimesh = pmm; add_child(pi)

# mesh k of the street's fifty, made as three.html's streetShape makes it
func street_shape(k: int) -> Mesh:
	var w := 0.6 + (k % 7) * 0.15
	var h := 0.8 + (k % 5) * 0.4
	var seg := 6 + (k % 6) * 2
	var m: Mesh
	match k % 4:
		0:
			var b := BoxMesh.new(); b.size = Vector3(w, h, w * 0.8); m = b
		1:
			var c := CylinderMesh.new(); c.top_radius = w / 2; c.bottom_radius = w / 2; c.height = h; c.radial_segments = seg; c.rings = 0; m = c
		2:
			var c := CylinderMesh.new(); c.top_radius = 0.0; c.bottom_radius = w / 2; c.height = h; c.radial_segments = seg; c.rings = 0; m = c
		_:
			var s := SphereMesh.new(); s.radius = w / 2; s.height = w; s.radial_segments = seg; s.rings = max(4, seg / 2) - 1; m = s
	return m

# the busy street: 5,000 objects of 50 different meshes, each its own instance, or one MultiMesh per mesh
func build_street() -> void:
	var n := int(C.street)
	var meshes: Array = []
	for k in range(50):
		meshes.append(street_shape(k))
	var lift := func(k: int) -> float:
		var w := 0.6 + (k % 7) * 0.15
		var h := 0.8 + (k % 5) * 0.4
		return w / 2 if k % 4 == 3 else h / 2
	var shared := material()
	if C.batched or C.instanced:
		shared.vertex_color_use_as_albedo = true
		var groups: Array = []
		for k in range(50):
			groups.append([])
		for i in range(n):
			groups[i % 50].append(i)
		for k in range(50):
			var mm := MultiMesh.new()
			mm.transform_format = MultiMesh.TRANSFORM_3D
			mm.use_colors = true
			var mesh: PrimitiveMesh = meshes[k].duplicate()
			mesh.material = shared
			mm.mesh = mesh
			mm.instance_count = groups[k].size()
			for j in range(groups[k].size()):
				var o = layout.objects[groups[k][j]]
				mm.set_instance_transform(j, Transform3D(Basis().scaled(Vector3(o[3], o[3], o[3])), Vector3(o[0], o[1] + lift.call(k) * o[3], o[2])))
				mm.set_instance_color(j, Color(o[4], o[5], o[6]))
			var mmi := MultiMeshInstance3D.new()
			mmi.multimesh = mm
			mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if C.shadows > 0 else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			add_child(mmi)
		return
	for i in range(n):
		var o = layout.objects[i]
		var mi := MeshInstance3D.new()
		mi.mesh = meshes[i % 50]
		var mat := shared if C.shared_material else material()
		if not C.shared_material:
			mat.albedo_color = Color(o[4], o[5], o[6])
		mi.material_override = mat
		mi.position = Vector3(o[0], o[1] + lift.call(i % 50) * o[3], o[2])
		mi.scale = Vector3(o[3], o[3], o[3])
		add_child(mi)

# rigid bodies through Godot's own physics server, drawn as one multimesh (as three.html draws its boxes)
func build_physics() -> void:
	var space := get_world_3d().space
	var ground_shape := PhysicsServer3D.box_shape_create()
	PhysicsServer3D.shape_set_data(ground_shape, Vector3(100, 0.5, 100))
	var ground := PhysicsServer3D.body_create()
	PhysicsServer3D.body_set_mode(ground, PhysicsServer3D.BODY_MODE_STATIC)
	PhysicsServer3D.body_add_shape(ground, ground_shape)
	PhysicsServer3D.body_set_state(ground, PhysicsServer3D.BODY_STATE_TRANSFORM, Transform3D(Basis(), Vector3(0, -0.5, 0)))
	PhysicsServer3D.body_set_space(ground, space)
	var shape := PhysicsServer3D.box_shape_create()
	PhysicsServer3D.shape_set_data(shape, Vector3(0.4, 0.4, 0.4))
	var n := int(C.physics)
	boxes = MultiMesh.new()
	boxes.transform_format = MultiMesh.TRANSFORM_3D
	boxes.use_colors = true
	var bm := BoxMesh.new()
	bm.size = Vector3(0.8, 0.8, 0.8)
	var mat := material()
	mat.vertex_color_use_as_albedo = true
	bm.material = mat
	boxes.mesh = bm
	boxes.instance_count = n
	for i in range(n):
		var b = layout.boxes[i]
		var body := PhysicsServer3D.body_create()
		PhysicsServer3D.body_set_mode(body, PhysicsServer3D.BODY_MODE_RIGID)
		PhysicsServer3D.body_add_shape(body, shape)
		PhysicsServer3D.body_set_param(body, PhysicsServer3D.BODY_PARAM_MASS, 1.0)
		PhysicsServer3D.body_set_state(body, PhysicsServer3D.BODY_STATE_TRANSFORM, Transform3D(Basis(Vector3.UP, b[3]), Vector3(b[0], b[1], b[2])))
		PhysicsServer3D.body_set_space(body, space)
		bodies.append(body)
		boxes.set_instance_color(i, Color(b[4], b[5], b[6]))
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = boxes
	add_child(mmi)

func _physics_process(_delta: float) -> void:
	if bodies.size() > 0:
		physics_ms.append(Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS) * 1000.0)

func _process(_delta: float) -> void:
	if done:
		return
	var now := Time.get_ticks_usec() / 1000.0
	var el := (now - t0) / 1000.0
	var R = spec.camera
	var a: float = el * R.turn_per_second
	cam.look_at_from_position(Vector3(sin(a) * R.orbit_radius, R.height, cos(a) * R.orbit_radius), Vector3(R.look_at[0], R.look_at[1], R.look_at[2]))
	if aim_tower:
		cam.fov = 4
		cam.look_at_from_position(Vector3(0, 20, 0), Vector3(0, 150, -4000))
	for i in range(bodies.size()):
		boxes.set_instance_transform(i, PhysicsServer3D.body_get_state(bodies[i], PhysicsServer3D.BODY_STATE_TRANSFORM))
	if now - t0 > spec.warmup_seconds * 1000.0:
		times.append(now - last)
	last = now
	if now - t0 > (spec.warmup_seconds + spec.seconds) * 1000.0:
		done = true
		report()

func report() -> void:
	var sorted := times.duplicate()
	sorted.sort()
	var sum := 0.0
	for t in times:
		sum += t
	var mean := sum / times.size()
	var pms := 0.0
	for p in physics_ms:
		pms += p
	var engine := "godot-web" if OS.has_feature("web") else "godot-native"
	var result := {
		"engine": engine, "case": case_id, "fps": snappedf(1000.0 / mean, 0.1), "mean_ms": snappedf(mean, 0.01),
		"p99_ms": snappedf(sorted[int(sorted.size() * 0.99)], 0.01), "frames": times.size(),
		"draws": Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
		"triangles": Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),
		"physics_ms": snappedf(pms / physics_ms.size(), 0.01) if physics_ms.size() > 0 else null,
		"renderer": RenderingServer.get_video_adapter_name() + " / " + str(ProjectSettings.get_setting("rendering/renderer/rendering_method")),
	}
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.__result = " + JSON.stringify(result))
	else:
		print("FPSLAB " + JSON.stringify(result))
		get_tree().quit()
