import { Input } from "antd";
import { useState } from "react";
import { usePauseDeposit } from "../hooks/usePauseDeposit";
import toast from "react-hot-toast";

function ModalView({ actionKey }) {
  return <div>{renderComponent(actionKey)}</div>;
}

function renderComponent(key) {
  const [depositPhone, setDepositPhone] = useState();
  const [Withdrawalphone, setWithdrawalPhone] = useState();
  const [depositTransactionCode, setDepositTransactionCode] = useState();
  const [withdrawalTransactionCode, setWithdrawalTransactionCode] = useState();

  const { pauseDepositFn, isLoading } = usePauseDeposit();

  function handlePauseDeposit() {
    if (!id) return;
    const data = { id };
    pauseDepositFn(data, {
      onSuccess: () => {
        toast.success("Account paused successfully");
      },
    });
  }
  switch (Number(key)) {
    case 1:
      return (
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <Input
              placeholder="0712 345 678"
              type="tel"
              value={depositPhone}
              onChange={(e) => setDepositPhone(e.target.value)}
              className="py-2"
              style={{ paddingTop: "12px", paddingBottom: "12px" }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Code
            </label>
            <Input
              placeholder="TCN3E1ZC7"
              type="text"
              value={depositTransactionCode}
              onChange={(e) => setDepositTransactionCode(e.target.value)}
              className="py-2"
              required
            />
          </div>
        </div>
      );
    case 2:
      return (
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <Input
              placeholder="0712 345 678"
              type="tel"
              value={Withdrawalphone}
              onChange={(e) => setWithdrawalPhone(e.target.value)}
              className="py-2"
              style={{ paddingTop: "12px", paddingBottom: "12px" }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Code
            </label>
            <Input
              placeholder="TCN3E1ZC7"
              type="text"
              value={withdrawalTransactionCode}
              onChange={(e) => setWithdrawalTransactionCode(e.target.value)}
              className="py-2"
              required
            />
          </div>
        </div>
      );
    case 3:
      return (
        <p className="my-6">
          Are you sure you want to pause all withdrawals? This action will
          prevent the user from withdrawing funds until withdrawals are
          re-enabled
        </p>
      );
    case 4:
      return (
        <p className="my-6">
          Are you sure you want to pause all deposits? The users will be unable
          to add funds until deposits are re-enabled.
        </p>
      );
    case 5:
      return (
        <p className="my-6">
          Are you sure you want to delete this account? This action is permanent
          and cannot be undone. All your data will be lost.
        </p>
      );
    case 6:
      return (
        <p className="my-6">
          Are you sure you want to pause this user’s account? While paused, they
          will be unable to log in or perform any actions until reactivated.
        </p>
      );
    case 7:
      return (
        <p>
          Are you sure you want to ban this user’s account? This action will
          permanently restrict their access, and they will not be able to log in
          or use any platform features.
        </p>
      );
    default:
      return <p>Manual deposit</p>;
  }
}

export default ModalView;
