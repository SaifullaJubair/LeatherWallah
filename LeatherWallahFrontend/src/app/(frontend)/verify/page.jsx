import Contain from "@/components/common/Contain";
import VerifyForm from "@/components/frontend/auth/verify/VerifyForm";

const verifyPage = () => {
  return (
    <Contain>
      <div className="mt-8">
        <VerifyForm />
      </div>
    </Contain>
  );
};

export default verifyPage;
