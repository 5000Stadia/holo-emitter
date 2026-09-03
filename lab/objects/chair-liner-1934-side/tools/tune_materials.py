#!/usr/bin/env python3
"""Set measured albedo/response values on the spec's materials, then rebuild and re-port.

Usage: tools/tune_materials.py '{"blue-wool": {"baseColor": "#263457", "sheen": 0.10}}'
Keys understood per material: baseColor, roughness, clearcoat, clearcoatRoughness, sheen,
envMapIntensity.
"""
import json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPEC = ROOT / 'object-sculpt-spec.json'
SKILL = Path.home() / '.claude/skills/img2threejs'


def apply(changes):
    spec = json.loads(SPEC.read_text())
    for m in spec['materials']:
        c = changes.get(m['id'])
        if not c:
            continue
        if 'baseColor' in c:
            m['baseColor'] = m['color'] = c['baseColor']
            m['albedo']['dominant'] = c['baseColor']
        if 'roughness' in c:
            m['roughness']['base'] = c['roughness']
        if 'clearcoat' in c:
            if c['clearcoat']:
                m['clearcoat'] = {'base': c['clearcoat'], 'notes': m.get('clearcoat', {}).get('notes', '')}
            else:
                m.pop('clearcoat', None); m.pop('clearcoatRoughness', None)
        if 'clearcoatRoughness' in c:
            m['clearcoatRoughness'] = {'base': c['clearcoatRoughness']}
        if 'sheen' in c:
            m['sheen'] = {'base': c['sheen'], 'notes': m.get('sheen', {}).get('notes', '')}
        if 'envMapIntensity' in c:
            m['envMapIntensity'] = c['envMapIntensity']
    SPEC.write_text(json.dumps(spec, indent=2, ensure_ascii=False))


def rebuild(pass_id):
    out = ROOT / 'src/createChairLiner1934Model.ts'
    if out.exists():
        out.unlink()
    subprocess.run([sys.executable, str(SKILL / 'forge/stage2_spec/validate_sculpt_spec.py'),
                    str(SPEC), '--strict-quality'], cwd=ROOT, check=True)
    subprocess.run([sys.executable, str(SKILL / 'forge/stage3_build/generate_threejs_factory.py'),
                    str(SPEC), '--out', str(out), '--pass-id', pass_id, '--force'], cwd=ROOT, check=True)
    subprocess.run([sys.executable, str(ROOT / 'tools/port_ts_to_js.py'), str(out),
                    str(ROOT / 'src/createChairLiner1934Model.js')], cwd=ROOT, check=True)


if __name__ == '__main__':
    apply(json.loads(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1] != '-' else {})
    rebuild(sys.argv[2] if len(sys.argv) > 2 else 'blockout')
