import ForgetPasswordForm from "@/components/frontend/auth/ForgetPassword/ForgetPasswordForm";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("forgetPassword");
}
const ForgetPasswordPage = () => {
  return (
    <div>
      <ForgetPasswordForm />;
    </div>
  );
};

export default ForgetPasswordPage;
