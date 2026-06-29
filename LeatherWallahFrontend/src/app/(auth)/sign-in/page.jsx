// src/app/(auth)/sign-in/page.jsx
import LoginForm from "@/components/frontend/auth/SignIn/LoginForm";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("signIn");
}
const SignInPage = () => {
  return (
    <div className=" min-h-screen">
      <LoginForm />
    </div>
  );
};

export default SignInPage;
