let useFaiss = true;
let faiss;
try { faiss = await import("faiss-node"); }
catch { useFaiss = false; console.warn("FAISS not available, using cosine fallback."); }

const RAM = { vectors: [], meta: [] }; // fallback store

export function buildIndex(vectors, meta) {
  if (useFaiss) {
    const dim = vectors[0].length;
    const index = new faiss.IndexFlatIP(dim); // cosine if vectors are normalized
    index.add(vectors);
    return { index, meta };
  } else {
    RAM.vectors = vectors;
    RAM.meta = meta;
    return { index:null, meta };
  }
}

export function topK(queryVec, idx, k=5) {
  if (useFaiss) {
    const { index, meta } = idx;
    const { distances, labels } = index.search([queryVec], k);
    return labels[0].map((i,rank)=>({ rank, score: distances[0][rank], meta: meta[i] }));
  } else {
    // cosine fallback
    const scores = RAM.vectors.map((v,i)=>({
      i,
      score: v.reduce((s,val,j)=>s + val*queryVec[j],0)
    }));
    scores.sort((a,b)=>b.score-a.score);
    return scores.slice(0,k).map((s,rank)=>({ rank, score:s.score, meta: RAM.meta[s.i] }));
  }
}
