import { useState } from "react";
import { useAuth } from "../auth";
import Filters from "../components/Filters";
import { Bar, EditModal, StockModal } from "../components/forms";
import { Modal } from "../components/ui";
import { Ic } from "../lib/icons";
import { MUTE, money, stc } from "../lib/utils";
import { useStore } from "../store";

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const { items, create, update, remove, addStock, loadError } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [modal, setModal] = useState(null);
  const [delErr, setDelErr] = useState("");
  const close = () => {
    setModal(null);
    setDelErr("");
  };
  const list = items.filter(
    (i) => (cat === "All" || i.cat === cat) && (!q.trim() || i.n.includes(q.trim())),
  );

  const confirmDelete = async () => {
    try {
      await remove(modal.i.id);
      close();
    } catch (e) {
      setDelErr(e.message);
    }
  };

  return (
    <div>
      {loadError && (
        <p className="mb-4 text-sm font-semibold" style={{ color: "var(--bad)" }}>
          {loadError}
        </p>
      )}
      {isAdmin && <Bar onNew={create} names={items.map((i) => i.n.trim())} />}
      <Filters q={q} setQ={setQ} cat={cat} setCat={setCat} />
      <div className="grid grid-cols-1 min-[460px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {list.length ? (
          list.map((i, k) => (
            <div key={i.id} className="card p-4 rv flex flex-col relative" style={{ "--i": k }}>
              {isAdmin && (
                <button
                  className="btn dng absolute top-3 left-3 !p-1.5"
                  aria-label="Delete"
                  onClick={() => setModal({ t: "del", i })}
                >
                  <Ic n="trash" s={16} />
                </button>
              )}
              <div className="h-px w-8 mb-3" style={{ background: "var(--acc)" }} />
              <div className="font-bold line-clamp-2 pl-10">{i.n}</div>
              <span
                className="tag self-start mt-1"
                style={{ background: "var(--card2)", color: "var(--mute)" }}
              >
                {i.cat}
              </span>
              <div className="flex items-center justify-between gap-2 mt-3">
                <span className="text-lg font-extrabold">{money(i.p)} EGP</span>
                <span className={"tag " + stc(i)}>{i.q <= 0 ? "Out of stock" : "Available: " + i.q}</span>
              </div>
              {isAdmin && (
                <div className="grid grid-cols-2 gap-2 mt-auto pt-3">
                  <button className="btn" onClick={() => setModal({ t: "stock", i })}>
                    <Ic n="plus" s={16} /> Quantity
                  </button>
                  <button className="btn" onClick={() => setModal({ t: "edit", i })}>
                    <Ic n="edit" s={16} /> Edit
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="col-span-full text-center py-10" style={MUTE}>
            No matching items.
          </p>
        )}
      </div>

      {modal?.t === "edit" && (
        <EditModal
          item={modal.i}
          names={items.filter((x) => x.id !== modal.i.id).map((x) => x.n.trim())}
          onSave={async (o) => {
            await update(o);
            close();
          }}
          onClose={close}
        />
      )}
      {modal?.t === "stock" && (
        <StockModal
          item={modal.i}
          onSave={async (n) => {
            await addStock(modal.i.id, n);
            close();
          }}
          onClose={close}
        />
      )}
      {modal?.t === "del" && (
        <Modal title="Confirm deletion" onClose={close}>
          <p className="mb-4">
            Delete <b>{modal.i.n}</b> permanently?
          </p>
          {delErr && (
            <p className="mb-3 text-sm font-semibold" style={{ color: "var(--bad)" }}>
              {delErr}
            </p>
          )}
          <div className="flex gap-2">
            <button className="btn dng flex-1" onClick={confirmDelete}>
              <Ic n="trash" s={16} /> Yes, delete
            </button>
            <button className="btn" onClick={close}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
