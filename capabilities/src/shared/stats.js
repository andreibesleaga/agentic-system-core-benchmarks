'use strict';
/** Statistics. The bootstrap and the sign-flip test are the engine's own (bench/metrics.js), not re-written. */
const path = require('node:path');
const cfg = require('./config');
const m = require(path.join(cfg.ENGINE, 'bench/metrics.js'));

const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const median = (v) => m.median(v);

/** Mean with a 95 % bootstrap interval over the sample (questions are the resampled unit). */
function meanCI(values) {
  const ci = m.bootstrapCI(values, { statistic: mean, seed: 1, resamples: 10000 });
  return ci && { value: ci.estimate, low: ci.low, high: ci.high, n: values.length };
}

/** Median with a 95 % bootstrap interval. */
function medianCI(values) {
  const ci = m.bootstrapCI(values, { statistic: median, seed: 1, resamples: 10000 });
  return ci && { value: ci.estimate, low: ci.low, high: ci.high, n: values.length };
}

/** log of the binomial coefficient, by sums (n is small). */
function logChoose(n, k) { let s = 0; for (let i = 1; i <= k; i += 1) s += Math.log(n - k + i) - Math.log(i); return s; }

/** Exact two-sided sign test on the non-tied pairs. */
function signTest(wins, losses) {
  const n = wins + losses;
  if (n === 0) return 1;
  const k = Math.min(wins, losses);
  let p = 0;
  for (let i = 0; i <= k; i += 1) p += Math.exp(logChoose(n, i) - n * Math.log(2));
  return Math.min(1, 2 * p);
}

/** Paired comparison a vs b over the same questions (a, b: per-question numbers, same order). */
function paired(a, b) {
  const diff = a.map((x, i) => x - b[i]);
  const wins = diff.filter((d) => d > 1e-9).length; const losses = diff.filter((d) => d < -1e-9).length;
  const perm = m.pairedPermutationTest(a, b, { seed: 1, resamples: 10000 });
  const ci = m.bootstrapCI(diff, { statistic: mean, seed: 1, resamples: 10000 });
  return {
    n: a.length, mean_difference: ci.estimate, low: ci.low, high: ci.high, wins_a: wins, wins_b: losses,
    ties: a.length - wins - losses, p_sign: signTest(wins, losses), p_permutation: perm.p,
  };
}

const holm = (ps) => m.holm(ps);

module.exports = { mean, median, meanCI, medianCI, signTest, paired, holm };
