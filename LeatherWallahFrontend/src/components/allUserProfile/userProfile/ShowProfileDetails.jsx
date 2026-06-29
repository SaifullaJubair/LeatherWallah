"use client";

import { useEffect, useState } from "react";
import { FaRegEdit, FaEnvelope, FaCheck, FaTimes } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { toast } from "react-toastify";
import ProfileSetting from "./ProfileSetting";
import { BASE_URL } from "@/components/utils/baseURL";

const ShowProfileDetails = ({ userInfo, refetch }) => {
  const [userupdateModalOpen, setUserupdateModalOpen] = useState(false);
  const [userupdateModaldata, setUserupdateModaldata] = useState();

  // S4+S5 Phase 1C — opt-in email row. Inline editor (no modal) since
  // it hits a separate single-field endpoint and is order-of-magnitude
  // simpler than the full profile-update flow.
  const currentEmail = userInfo?.data?.user_email || "";
  const [emailEditing, setEmailEditing] = useState(false);
  const [emailInput, setEmailInput] = useState(currentEmail);
  const [emailSaving, setEmailSaving] = useState(false);

  useEffect(() => {
    setEmailInput(currentEmail);
  }, [currentEmail]);

  const saveEmail = async () => {
    const val = (emailInput || "").trim();
    if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setEmailSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/user/me/email`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: val }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Email saved.", { autoClose: 1200 });
        setEmailEditing(false);
        refetch?.();
      } else {
        toast.error(data?.message || "Failed to save email.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setEmailSaving(false);
    }
  };

  //updateUser function
  const handleUpdateUser = () => {
    setUserupdateModalOpen(true);
    setUserupdateModaldata();
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FiSettings size={16} className="text-primary" />
          <h2 className="text-base font-semibold text-gray-900">Profile Details</h2>
        </div>
        <button
          type="button"
          onClick={() => handleUpdateUser()}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          <FaRegEdit size={12} /> Edit Profile
        </button>
      </div>

      <div className="p-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6">
          {userInfo?.data?.user_image ? (
            <img
              src={userInfo.data.user_image}
              alt=""
              className="w-16 h-16 object-cover rounded-full ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary ring-2 ring-primary/20">
              {userInfo?.data?.user_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {userInfo?.data?.user_name || "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{userInfo?.data?.user_phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Name",             value: userInfo?.data?.user_name },
            { label: "Phone",            value: userInfo?.data?.user_phone },
            { label: "Additional Phone", value: userInfo?.data?.user_additional_phone },
            { label: "Gender",           value: userInfo?.data?.user_gender },
            { label: "Division",         value: userInfo?.data?.user_division },
            { label: "District",         value: userInfo?.data?.user_district },
            { label: "Address",          value: userInfo?.data?.user_address },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-sm text-gray-800 font-medium">{value || <span className="text-gray-300 font-normal">—</span>}</p>
            </div>
          ))}
        </div>

          {/* Phase 1C — email row */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-3 text-base md:text-lg">
              <FaEnvelope className="text-gray-500" />
              <span className="font-medium">Email :</span>
              {!emailEditing ? (
                <>
                  <span className="text-gray-700">
                    {currentEmail || (
                      <span className="text-gray-400 text-sm italic">
                        not set
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEmailEditing(true)}
                    className="text-sm text-primary underline ml-2"
                  >
                    {currentEmail ? "Change" : "Add email"}
                  </button>
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    maxLength={120}
                    className="border px-3 py-1.5 text-sm rounded outline-primary min-w-[220px]"
                  />
                  <button
                    type="button"
                    onClick={saveEmail}
                    disabled={emailSaving}
                    className="bg-primary text-white px-3 py-1.5 rounded text-sm inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <FaCheck size={11} />
                    {emailSaving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailEditing(false);
                      setEmailInput(currentEmail);
                    }}
                    disabled={emailSaving}
                    className="bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded text-sm inline-flex items-center gap-1"
                  >
                    <FaTimes size={11} />
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Optional — used for order receipts and tracking links. Never
              shared with third parties.
            </p>
          </div>
        </div>

      {userupdateModalOpen && (
        <ProfileSetting
          setUserupdateModalOpen={setUserupdateModalOpen}
          userInfo={userInfo}
          refetch={refetch}
        />
      )}
    </div>
  );
};

export default ShowProfileDetails;
