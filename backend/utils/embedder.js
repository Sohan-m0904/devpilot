import axios from "axios";
const HF_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2";

export async function embedBatch(texts) {
  const { HUGGINGFACE_API_KEY } = process.env;
  const res = await axios.post(HF_URL, { inputs: texts }, {
    headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}` },
    timeout: 30000
  });
  // Normalize to unit length
  return res.data.map(vec => {
    const norm = Math.sqrt(vec.reduce((s,v)=>s+v*v,0)) || 1;
    return vec.map(v=>v/norm);
  });
}
