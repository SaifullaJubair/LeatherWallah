import Contain from "@/components/common/Contain";
import ChangePassword from "@/components/frontend/auth/changePassword/ChangePassword";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("changePassword");
}
const ChangePasswordPage = () => {
  return (
    <Contain>
      <div className="mt-8">
        <ChangePassword />
      </div>
    </Contain>
  );
};

export default ChangePasswordPage;
