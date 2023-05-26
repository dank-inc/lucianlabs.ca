const r = (threshold = 1) => (Math.random() - 0.5) * 2 * threshold
const ru = (threshold = 1) => Math.random() * threshold
const genArray = (n = 10, algo = r) => Array.from({ length: n }, () => algo())
const forN = (n, fn) => genArray(n).forEach((v, i) => fn(v, i))
