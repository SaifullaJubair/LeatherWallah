// src/app/(auth)/set-password/page.jsx
import SetPassword from "@/components/frontend/auth/setPassword/SetPassword";
import { buildPageMeta } from "@/components/lib/buildPageMeta";
export async function generateMetadata() {
  return buildPageMeta("setPassword");
}
const SetPasswordPage = () => {
  return (
    <div>
      <SetPassword />
    </div>
  );
};

export default SetPasswordPage;
