import { Input, Button } from "antd";
import MoveBack from "../../components/MoveBack";
import { useForgotPassword } from "../../hooks/useForgotPassword";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPasswordPage() {
  return (
    <div className="bg-gray-50 min-h-screen w-full overflow-x-auto">
      <MoveBack />
      <div className="flex justify-between items-center flex-col min-h-screen w-full overflow-x-auto">
        <ForgotCard />
        <div className="md:px-4 px-4 py-4 mt-10"></div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;

function ForgotCard() {
  const { forgotPasswordAPI, isPending } = useForgotPassword();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");

  function submitData() {
    forgotPasswordAPI(phone, {
      onSuccess: () => {
        navigate(`/reset?phone=${phone}`);
      },
    });
  }

  return (
    <div className="bg-white shadow rounded-lg mx-4  p-6">
      <p className="text-base font-bold text-textGrey">Forgot Password</p>
      <p className="text-textGrey font-normal text-sm my-4">
        Enter your phone number to receive a reset code
      </p>
      <Input
        placeholder="Phone number"
        className="border-bgheader"
        onChange={(e) => setPhone(e.target.value)}
      />
      <Button
        type="primar"
        style={{ backgroundColor: "#000", color: "#fff" }}
        className="bg-green-600 w-full mt-10 text-white"
        onClick={() => submitData()}
      >
        {isPending ? "Sending code" : "Send code"}
      </Button>
      <p
        className="text-orange1 my-6 cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          if (!isPending) {
            submitData();
          }
        }}
      >
        Resend code
      </p>
    </div>
  );
}
