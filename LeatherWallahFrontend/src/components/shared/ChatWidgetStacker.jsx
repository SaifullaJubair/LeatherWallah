"use client";

import { useEffect } from "react";
import useGetSettingData from "@/components/lib/getSettingData";
import { FaFacebookMessenger } from "react-icons/fa";

const ChatWidgetStacker = () => {
  const { data: settingData } = useGetSettingData();
  const setting = settingData?.data?.[0];

  // DB fields are chat_messenger_show / chat_livechat_show (setting.model.ts) —
  // earlier this read *_enabled which never existed, so the button never rendered.
  const messengerEnabled = setting?.chat_messenger_show;
  const messengerPageId = setting?.chat_messenger_page_id;
  const livechatEnabled = setting?.chat_livechat_show;
  const livechatEmbed = setting?.chat_livechat_embed_code;
  const position = setting?.chat_widgets_position || "bottom-right";

  // Live-chat embed (Tawk.to / Crisp / etc.): the admin pastes a full
  // <script>…</script> snippet. React's dangerouslySetInnerHTML does NOT execute
  // injected <script> tags (DOM spec), so we parse the snippet and re-create real
  // <script> elements at runtime — inline code runs, and src scripts load.
  useEffect(() => {
    if (!livechatEnabled || !livechatEmbed) return;
    if (document.getElementById("livechat-embed-root")) return; // guard double-inject

    const root = document.createElement("div");
    root.id = "livechat-embed-root";
    root.style.display = "none";
    document.body.appendChild(root);

    // Parse the admin snippet, then clone each <script> into a fresh element so
    // the browser actually executes it (cloned-via-innerHTML scripts are inert).
    const holder = document.createElement("div");
    holder.innerHTML = livechatEmbed;
    holder.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      [...old.attributes].forEach((a) => s.setAttribute(a.name, a.value));
      if (old.textContent) s.textContent = old.textContent;
      document.body.appendChild(s);
    });

    return () => {
      // Best-effort cleanup on unmount (widget itself may persist its own nodes).
      document.getElementById("livechat-embed-root")?.remove();
    };
  }, [livechatEnabled, livechatEmbed]);

  // Inject the Facebook Messenger customer-chat SDK once enabled + page id set.
  useEffect(() => {
    if (!messengerEnabled || !messengerPageId) return;
    if (document.getElementById("fb-messenger-sdk")) return;

    window.fbAsyncInit = function () {
      FB.init({ xfbml: true, version: "v18.0" });
    };

    const script = document.createElement("script");
    script.id = "fb-messenger-sdk";
    script.src = "https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [messengerEnabled, messengerPageId]);

  // No Messenger → render nothing visible. Live-chat is handled entirely by the
  // useEffect above (runs before this return), so it still works when only
  // live-chat is enabled and Messenger is off.
  if (!messengerEnabled || !messengerPageId) return null;

  const positionClass =
    position === "bottom-left"
      ? "bottom-36 left-4 md:bottom-24 md:left-6"
      : "bottom-36 right-4 md:bottom-24 md:right-6";

  return (
    <>
      {/* FB Customer Chat plugin root — SDK injects the actual chat bubble */}
      {messengerEnabled && messengerPageId && (
        <>
          <div id="fb-root" />
          <div
            className="fb-customerchat"
            attribution="biz_inbox"
            page_id={messengerPageId}
          />
        </>
      )}

      {/* Fallback visible Messenger button if plugin doesn't load */}
      <a
        href={`https://m.me/${messengerPageId}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on Messenger"
        className={`fixed ${positionClass} z-50 w-12 h-12 bg-[#0099FF] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}
      >
        <FaFacebookMessenger size={24} className="text-white" />
      </a>
    </>
  );
};

export default ChatWidgetStacker;
