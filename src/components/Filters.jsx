import { Ic } from "../lib/icons";
import { CATS, MUTE } from "../lib/utils";

export default function Filters({ q, setQ, cat, setCat }) {
  return (
    <div className="mb-4">
      <div className="relative mb-2">
        <span className="absolute top-2.5 right-3" style={MUTE}>
          <Ic n="search" s={18} />
        </span>
        <input
          type="search"
          className="w-full pr-10"
          placeholder="Search for an item"
          aria-label="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["All", ...CATS].map((c) => (
          <button key={c} className={"pill " + (cat === c ? "on" : "")} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
