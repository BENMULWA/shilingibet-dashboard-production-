import { Spin } from "antd";
import { useGetSecondaryWallet } from "../hooks/useTransfer";

export default function AccountOverview() {
  const { secondaryWalletBalance, isLoading, error } = useGetSecondaryWallet();

  if (isLoading) {
    return <Spin />;
  }

  return (
    <div className="w-full mx-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Account Summary</h2>

      {error ? (
        <div className="rounded-xl bg-red-50 p-4 text-red-700">
          Unable to load the withdrawal treasury.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-semibold text-gray-700">
                Withdrawal Treasury
              </h3>
              <span className="text-xs bg-[#f9ce36]/20 text-amber-700 px-2 py-1 rounded-full">
                {secondaryWalletBalance?.currency || "KES"}
              </span>
            </div>
            <p className="text-sm text-gray-500">Available for withdrawals</p>
            <p className="mt-2 text-2xl font-semibold text-gray-800">
              {Number(secondaryWalletBalance?.balance || 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
