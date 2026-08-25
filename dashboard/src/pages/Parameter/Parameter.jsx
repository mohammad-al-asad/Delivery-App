import { useState, useEffect } from "react";
import { IoChevronBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { ConfigProvider, InputNumber, message, Select, Spin } from "antd";
import { useGetCommonQuery } from "../../../Redux/features/settings/commonApi";
import { useUpdateDeliverySettingsMutation } from "../../../Redux/features/settings/deliverySettingsApi";

const VISIBILITY_OPTIONS = [
  { label: "300 meters", value: "300" },
  { label: "500 meters", value: "500" },
  { label: "1 kilometer", value: "1000" },
  { label: "5 kilometers", value: "5000" },
  { label: "Infinite", value: "infinite" },
];

const Parameter = () => {
  const navigate = useNavigate();
  const [baseCharge, setBaseCharge] = useState(5.0);
  const [chargePerMile, setChargePerMile] = useState(1.5);
  const [minDistance, setMinDistance] = useState(2);
  const [commissionPercent, setCommissionPercent] = useState(10);
  const [requestVisibility, setRequestVisibility] = useState("infinite");
  const { data: commonData, isLoading } = useGetCommonQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateDeliverySettingsMutation();

  useEffect(() => {
    if (commonData?.data?.deliverySettings) {
      const settings = commonData.data.deliverySettings;
      setBaseCharge(settings.baseDeliveryCharge ?? 5.0);
      setChargePerMile(settings.chargePerMile ?? 1.5);
      setMinDistance(settings.minimumDistanceMiles ?? 2);
      setCommissionPercent(settings.adminCommissionPercent ?? 10);
      setRequestVisibility(
        settings.requestVisibilityInfinite
          ? "infinite"
          : String(settings.requestVisibilityDistanceMeters ?? 500),
      );
    }
  }, [commonData]);

  const handleSave = async () => {
    try {
      const payload = {
        baseDeliveryCharge: baseCharge,
        chargePerMile: chargePerMile,
        minimumDistanceMiles: minDistance,
        adminCommissionPercent: commissionPercent,
        requestVisibilityInfinite: requestVisibility === "infinite",
        requestVisibilityDistanceMeters:
          requestVisibility === "infinite" ? null : Number(requestVisibility),
      };
      const res = await updateSettings(payload).unwrap();
      if (res.success) {
        message.success(res.message || "Parameters updated successfully!");
      }
    } catch (err) {
      message.error(err?.data?.message || "Failed to update parameters.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-[#2D8C3C] px-5 py-4 rounded-xl flex items-center gap-3 shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <IoChevronBack className="w-6 h-6" />
        </button>
        <h1 className="text-white text-2xl font-bold">Parameter Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        {/* Delivery Charge Settings Card */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-2xl">
              <Spin size="large" />
            </div>
          )}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-8 bg-[#2D8C3C] rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800">
              Delivery Charge Settings
            </h2>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Base Delivery Charge
              </label>
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: "#2D8C3C",
                    borderRadius: 12,
                    controlHeight: 52,
                  },
                }}
              >
                <InputNumber
                  min={0}
                  value={baseCharge}
                  onChange={setBaseCharge}
                  className="w-full font-semibold text-lg"
                  prefix={<span className="text-gray-400 mr-1">AED</span>}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                />
              </ConfigProvider>
              <p className="text-xs text-gray-400 italic">
                The minimum fee charged for any delivery.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Charge Per Mile
              </label>
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: "#2D8C3C",
                    borderRadius: 12,
                    controlHeight: 52,
                  },
                }}
              >
                <InputNumber
                  min={0}
                  value={chargePerMile}
                  onChange={setChargePerMile}
                  className="w-full font-semibold text-lg"
                  prefix={<span className="text-gray-400 mr-1">AED</span>}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                />
              </ConfigProvider>
              <p className="text-xs text-gray-400 italic">
                Additional fee applied for every mile beyond the minimum
                distance.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Minimum Distance (Miles)
              </label>
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: "#2D8C3C",
                    borderRadius: 12,
                    controlHeight: 52,
                  },
                }}
              >
                <InputNumber
                  min={0}
                  value={minDistance}
                  onChange={setMinDistance}
                  className="w-full font-semibold text-lg"
                  suffix={<span className="text-gray-400 ml-1">mi</span>}
                />
              </ConfigProvider>
              <p className="text-xs text-gray-400 italic">
                The base charge covers up to this distance.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Admin Commission
              </label>
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: "#2D8C3C",
                    borderRadius: 12,
                    controlHeight: 52,
                  },
                }}
              >
                <InputNumber
                  min={0}
                  max={100}
                  value={commissionPercent}
                  onChange={setCommissionPercent}
                  className="w-full font-semibold text-lg"
                  suffix={<span className="text-gray-400 ml-1">%</span>}
                />
              </ConfigProvider>
              <p className="text-xs text-gray-400 italic">
                The platform keeps this percentage from each paid order.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Request Visibility Distance
              </label>
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: "#2D8C3C",
                    borderRadius: 12,
                    controlHeight: 52,
                  },
                }}
              >
                <Select
                  value={requestVisibility}
                  onChange={setRequestVisibility}
                  options={VISIBILITY_OPTIONS}
                  className="w-full"
                  size="large"
                />
              </ConfigProvider>
              <p className="text-xs text-gray-400 italic">
                Only eligible matching drivers inside this radius can see new requests.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="w-full bg-[#2D8C3C] text-white font-bold py-4 rounded-xl hover:bg-[#256a2f] shadow-lg shadow-green-200 transition-all active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Updating..." : "Update Parameters"}
            </button>
          </div>
        </div>

        {/* Info Card / Preview */}
        <div className="bg-green-50/50 p-8 rounded-2xl border border-green-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#2D8C3C] mb-4">
              Pricing Logic Preview
            </h3>
            <div className="bg-white p-6 rounded-xl border border-green-100 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Base Price (up to {minDistance} mi)</span>
                <span className="font-bold text-gray-800">
                  AED {baseCharge.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-gray-600">Price per extra mile</span>
                <span className="font-bold text-gray-800">
                  AED {chargePerMile.toFixed(2)}
                </span>
              </div>
              <div className="pt-2">
                <p className="text-sm text-gray-500 mb-3">Example calculation for 5 miles:</p>
                <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg">
                  <span className="font-semibold text-green-800">Total Delivery Fee</span>
                  <span className="text-xl font-black text-[#2D8C3C]">
                    AED {(baseCharge + Math.max(0, 5 - minDistance) * chargePerMile).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Admin Commission</p>
                  <p className="text-lg font-black text-gray-900">{commissionPercent}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Driver Earnings</p>
                  <p className="text-lg font-black text-gray-900">
                    {Math.max(0, 100 - (commissionPercent || 0))}%
                  </p>
                </div>
              </div>
              <div className="bg-white border border-green-100 p-4 rounded-lg">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Request Visibility
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {requestVisibility === "infinite"
                    ? "Every eligible driver can see matching requests."
                    : `Only matching drivers within ${Number(requestVisibility).toLocaleString()} meters can see requests.`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white/60 rounded-xl border border-white space-y-2">
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-bold text-[#2D8C3C]">Real-Time Split Payouts:</span> Every delivery payment made online via Stripe is automatically split upon ride completion. The platform keeps the <b>{commissionPercent}% Admin Commission</b> and transfers the <b>{Math.max(0, 100 - (commissionPercent || 0))}% Driver Share</b> directly to the driver&apos;s linked Stripe account.
            </p>
            <p className="text-xs text-gray-500 italic">
              Changes to pricing and commission percentages take effect immediately for all subsequent orders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parameter;
