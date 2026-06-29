"use client";
// S6 (2026-06-04) — Saved shipping addresses screen for the logged-in user.
// Backend: GET /user/addresses, POST /user/address, PATCH/DELETE
// /user/address/:id, PATCH /user/address/:id/default.
//
// UX:
//   - List of address cards; default one gets a primary-color border + chip
//   - "Add address" button opens an inline form (no nested modal)
//   - Per-card: Edit / Delete / Set as default
//   - Friendly empty state for first-time users
//
// The default address is what DeliveryInformation auto-fills at checkout —
// see the S6 hook there. Existing user_division/district/address fields are
// NOT removed; addresses[] is additive.

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import Select from "react-select";
import {
  FaMapMarkedAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaStar,
  FaRegStar,
  FaTimes,
  FaCheck,
} from "react-icons/fa";
import { BASE_URL } from "@/components/utils/baseURL";
import { cities } from "@/data/cites";
import useGetZoneData from "@/components/lib/getZoneData";

const emptyForm = {
  label: "",
  recipient_name: "",
  recipient_phone: "",
  division: "",
  district: "",
  address_line: "",
  is_default: false,
};

const Addresses = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [divisionID, setDivisionID] = useState(null);
  const [isZoneOpen, setIsZoneOpen] = useState(true);
  const { data: zoneData, isLoading: zoneLoading } = useGetZoneData(divisionID);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/user/addresses`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data?.success) setList(data?.data || []);
      else toast.error(data?.message || "Failed to load addresses");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, is_default: list.length === 0 });
    setDivisionID(null);
    setIsZoneOpen(true);
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditingId(addr._id);
    setForm({
      label: addr.label || "",
      recipient_name: addr.recipient_name || "",
      recipient_phone: addr.recipient_phone || "",
      division: addr.division || "",
      district: addr.district || "",
      address_line: addr.address_line || "",
      is_default: !!addr.is_default,
    });
    setDivisionID(null);
    setIsZoneOpen(true);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.recipient_name?.trim() || !form.address_line?.trim()) {
      toast.error("Recipient name and address are required");
      return;
    }
    setBusy(true);
    try {
      const url = editingId
        ? `${BASE_URL}/user/address/${editingId}`
        : `${BASE_URL}/user/address`;
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(data?.message || "Saved", { autoClose: 1200 });
        setList(data?.data || []);
        cancelForm();
      } else {
        toast.error(data?.message || "Save failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  const removeOne = async (addr) => {
    const ok = await Swal.fire({
      title: "Remove this address?",
      text: addr?.label || addr?.address_line,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: "#d33",
    });
    if (!ok.isConfirmed) return;
    try {
      const res = await fetch(`${BASE_URL}/user/address/${addr._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Removed", { autoClose: 1000 });
        setList(data?.data || []);
      } else {
        toast.error(data?.message || "Remove failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const promote = async (addr) => {
    if (addr.is_default) return;
    try {
      const res = await fetch(
        `${BASE_URL}/user/address/${addr._id}/default`,
        { method: "PATCH", credentials: "include" },
      );
      const data = await res.json();
      if (data?.success) {
        toast.success("Default updated", { autoClose: 900 });
        setList(data?.data || []);
      } else {
        toast.error(data?.message || "Update failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FaMapMarkedAlt size={16} className="text-primary" />
          <h2 className="text-base font-semibold text-gray-900">My Addresses</h2>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={openAdd}
            className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 hover:opacity-90 transition-opacity"
          >
            <FaPlus size={11} /> Add address
          </button>
        )}
      </div>
      <div className="p-5">

      {showForm && (
        <form
          onSubmit={submit}
          className="bg-white border rounded-lg p-5 mb-6 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h5 className="font-semibold text-gray-800">
              {editingId ? "Edit address" : "New address"}
            </h5>
            <button
              type="button"
              onClick={cancelForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Label (Home / Office)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              maxLength={50}
              className="border px-3 py-2 text-sm rounded outline-primary"
            />
            <input
              type="text"
              placeholder="Recipient name *"
              value={form.recipient_name}
              onChange={(e) =>
                setForm({ ...form, recipient_name: e.target.value })
              }
              maxLength={100}
              required
              className="border px-3 py-2 text-sm rounded outline-primary"
            />
            <input
              type="text"
              placeholder="Recipient phone"
              value={form.recipient_phone}
              onChange={(e) =>
                setForm({ ...form, recipient_phone: e.target.value })
              }
              maxLength={20}
              className="border px-3 py-2 text-sm rounded outline-primary"
            />
            <Select
              placeholder="City"
              options={cities}
              value={form.division ? { city_name: form.division } : null}
              getOptionLabel={(x) => x?.city_name}
              getOptionValue={(x) => x?.city_id}
              onChange={(opt) => {
                setIsZoneOpen(false);
                setForm({ ...form, division: opt?.city_name || "", district: "" });
                setDivisionID(opt?.city_id);
                setTimeout(() => setIsZoneOpen(true), 100);
              }}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 999 }) }}
            />
            <Select
              placeholder="Zone / Thana"
              options={zoneData?.data}
              value={form.district ? { zone_name: form.district } : null}
              isDisabled={!isZoneOpen || !divisionID}
              isLoading={zoneLoading}
              getOptionLabel={(x) => x?.zone_name}
              getOptionValue={(x) => x?.zone_id}
              onChange={(opt) => {
                setForm({ ...form, district: opt?.zone_name || "" });
              }}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 999 }) }}
            />
          </div>
          <textarea
            placeholder="Address line (street + landmark) *"
            value={form.address_line}
            onChange={(e) =>
              setForm({ ...form, address_line: e.target.value })
            }
            maxLength={250}
            required
            rows={2}
            className="w-full border px-3 py-2 text-sm rounded outline-primary"
          />
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) =>
                  setForm({ ...form, is_default: e.target.checked })
                }
                disabled={list.length === 0 && !editingId}
              />
              Set as default
              {list.length === 0 && !editingId && (
                <span className="text-[10px] text-gray-400">
                  (first address is always default)
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelForm}
                disabled={busy}
                className="bg-gray-200 hover:bg-gray-300 text-sm px-4 py-1.5 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="bg-primary text-white text-sm px-4 py-1.5 rounded hover:opacity-90 inline-flex items-center gap-1"
              >
                <FaCheck size={11} />
                {busy ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-sm text-gray-500 py-10">Loading…</div>
      ) : list.length === 0 ? (
        // Empty state — owner-flagged this as a common cold-start issue.
        <div className="flex flex-col items-center justify-center py-16 bg-white border rounded">
          <FaMapMarkedAlt className="text-gray-300 mb-3" size={56} />
          <p className="text-gray-700 font-medium">No saved addresses yet.</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Add your first address so checkout fills automatically next time.
          </p>
          {!showForm && (
            <button
              onClick={openAdd}
              className="bg-primary text-white text-sm px-5 py-2 rounded hover:opacity-90 inline-flex items-center gap-2"
            >
              <FaPlus size={11} /> Add your first address
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((addr) => (
            <div
              key={addr._id}
              className={`bg-white border rounded-lg p-4 relative ${
                addr.is_default ? "border-primary shadow-sm" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {addr.label && (
                    <span className="text-sm font-bold text-gray-800">
                      {addr.label}
                    </span>
                  )}
                  {addr.is_default && (
                    <span className="bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <FaStar size={9} /> Default
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => openEdit(addr)}
                    className="p-1.5 text-gray-400 hover:text-primary"
                  >
                    <FaEdit size={13} />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => removeOne(addr)}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                  >
                    <FaTrash size={13} />
                  </button>
                </div>
              </div>

              {addr.recipient_name && (
                <p className="text-sm font-medium text-gray-800">
                  {addr.recipient_name}
                </p>
              )}
              {addr.recipient_phone && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {addr.recipient_phone}
                </p>
              )}
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {addr.address_line}
              </p>
              {(addr.district || addr.division) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {[addr.district, addr.division].filter(Boolean).join(", ")}
                </p>
              )}

              {!addr.is_default && (
                <button
                  type="button"
                  onClick={() => promote(addr)}
                  className="mt-3 text-[11px] font-medium text-gray-500 hover:text-primary inline-flex items-center gap-1"
                >
                  <FaRegStar size={10} /> Set as default
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
};

export default Addresses;
