import { Input, Button } from "antd";
import { useState } from "react";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";
import { useNavigate, useSearchParams } from "react-router-dom";
import MoveBack from "../../components/MoveBack";
import { useResetPassword } from "../../hooks/useResetPassword";

function ResetPassword() {
  const { resetPasswordAPI, isPending } = useResetPassword();
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [searchParams] = useSearchParams();
  const phone = searchParams.get("phone");
  const navigate = useNavigate();

  function submitData() {
    if (!otp || !newPassword || !phone) {
      toast.error("All fields are required");
      return;
    }
    const data = { code: otp, newPassword, phone };

    resetPasswordAPI(data, {
      onSuccess: (dt) => {
        if (dt?.success == true) {
          navigate("/login");
        }
      },
    });
  }
  return (
    <div className="bg-bgBody min-h-screen w-full overflow-x-auto">
      <MoveBack />
      <div className="flex justify-between items-center flex-col bg-bgBody min-h-screen w-full overflow-x-auto">
        <div className="bg-bgheader rounded-lg mx-4  p-6">
          <p className="text-base font-bold text-textGrey">
            Enter new password
          </p>
          <div className="flex justify-start flex-col">
            <p className="mt-3">Enter Otp code</p>{" "}
            <div className="my-6">
              <Input
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="Enter six-digit reset code"
                className="text-center tracking-[0.5em]"
              />
            </div>
          </div>
          <Input
            placeholder="new password"
            className="border-black my-4"
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button
            type="primar"
            style={{ backgroundColor: "#000", color: "#fff" }}
            className="bg-green-600 w-full mt-10 text-white"
            onClick={() => submitData()}
          >
            {isPending ? <Loader /> : "Reset password"}
          </Button>
        </div>
        <div className="md:px-4 px-4 py-4 mt-10"></div>
      </div>
    </div>
  );
}

export default ResetPassword;
