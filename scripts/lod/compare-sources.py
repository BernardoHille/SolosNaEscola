"""
Compara, splat a splat, o SOG publicado (decodificado para PLY) com a fonte candidata ao LOD 0.

Para uma amostra aleatória de splats do SOG, procura o vizinho mais próximo (posição) na fonte e
mede: distância, diferença de cor DC, de opacidade e de escala. Se a fonte for o mesmo modelo, as
distâncias ficam na ordem do erro de quantização do SOG (sub-milimétrico) e as cores coincidem.

Uso: python scripts/lod/compare-sources.py publicado.ply candidato.ply [amostra]
"""
import json
import sys

import numpy as np
from scipy.spatial import cKDTree


def read_ply(path, fields):
    with open(path, "rb") as f:
        header = []
        while True:
            line = f.readline().decode("ascii").strip()
            header.append(line)
            if line == "end_header":
                break
        offset = f.tell()
    props = []
    count = 0
    for line in header:
        parts = line.split()
        if parts[:2] == ["element", "vertex"]:
            count = int(parts[2])
        elif parts[0] == "property":
            props.append((parts[2], {"float": "<f4", "double": "<f8", "uchar": "u1", "int": "<i4", "uint": "<u4"}[parts[1]]))
    dtype = np.dtype(props)
    data = np.memmap(path, dtype=dtype, mode="r", offset=offset, shape=(count,))
    return {k: np.asarray(data[k], dtype=np.float64) for k in fields if k in dtype.names}, count, dtype.names


def main():
    pub_path, cand_path = sys.argv[1], sys.argv[2]
    sample = int(sys.argv[3]) if len(sys.argv) > 3 else 300_000
    fields = ["x", "y", "z", "f_dc_0", "f_dc_1", "f_dc_2", "opacity", "scale_0", "scale_1", "scale_2"]
    pub, n_pub, names_pub = read_ply(pub_path, fields)
    cand, n_cand, names_cand = read_ply(cand_path, fields)
    print("publicado:", n_pub, "candidato:", n_cand)
    rng = np.random.default_rng(42)
    idx = rng.choice(n_pub, size=min(sample, n_pub), replace=False)
    tree = cKDTree(np.stack([cand["x"], cand["y"], cand["z"]], axis=1))
    q = np.stack([pub["x"][idx], pub["y"][idx], pub["z"][idx]], axis=1)
    dist, nn = tree.query(q, k=1, workers=-1)
    result = {
        "publicado": n_pub,
        "candidato": n_cand,
        "amostra": int(idx.size),
        "dist_m_p50": float(np.percentile(dist, 50)),
        "dist_m_p99": float(np.percentile(dist, 99)),
        "dist_m_max": float(dist.max()),
        "frac_dist_lt_1mm": float(np.mean(dist < 1e-3)),
    }
    for k in ["f_dc_0", "f_dc_1", "f_dc_2", "opacity", "scale_0"]:
        if k in pub and k in cand:
            diff = np.abs(pub[k][idx] - cand[k][nn])
            result[f"{k}_absdiff_p50"] = float(np.percentile(diff, 50))
            result[f"{k}_absdiff_p99"] = float(np.percentile(diff, 99))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
