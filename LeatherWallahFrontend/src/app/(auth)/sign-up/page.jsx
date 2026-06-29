// src/app/(auth)/sign-up/page.jsx
import SignUpForm from "@/components/frontend/auth/SignUp/SignUpForm";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("signUp");
}
const SignUpPage = () => {
  return (
    <div>
      <SignUpForm />
    </div>
  );
};

export default SignUpPage;
