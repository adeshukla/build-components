// Decorative circuit traces for board sections: they draw in once, then gold signals travel along two of them.
// Signals are hidden for reduced motion; the drawn traces stay.

const traces = [
  "M0 118 H360 L420 178 H740 L790 228 H1200",
  "M0 478 H250 L310 418 H690 L750 358 H1200",
  "M110 600 V520 L170 460 H520 L560 420",
  "M1200 70 H990 L940 120 V310 L900 350",
  "M640 0 V60 L690 110 H860",
  "M1200 560 H1010 L960 510 H840",
];

const pads = [
  [360, 118],
  [740, 178],
  [250, 478],
  [690, 418],
  [520, 460],
  [940, 310],
  [860, 110],
  [840, 510],
];

export function BoardTraces() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 -z-10 size-full"
    >
      <g fill="none" className="stroke-board-line" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {traces.map((d, i) => (
          <path key={d} d={d} pathLength={1} className="trace-path" style={{ animationDelay: `${i * 90}ms` }} />
        ))}
      </g>
      <g className="fill-board-raised stroke-pad" strokeWidth="2">
        {pads.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6" />
        ))}
      </g>
      <g className="fill-pad motion-reduce:hidden">
        {[0, 1].map((i) => (
          <circle key={i} r="4">
            <animateMotion dur={`${7 + i * 2}s`} begin={`${1.2 + i * 1.5}s`} repeatCount="indefinite" path={traces[i]} />
          </circle>
        ))}
      </g>
    </svg>
  );
}
