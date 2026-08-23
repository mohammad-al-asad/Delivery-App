import { useGetDashboardOverviewQuery } from "../../../Redux/features/dashboard/dashboardApi";
import EarningsTable from "./EarningsTable";

function Earnings() {
  const { data: earningsData } = useGetDashboardOverviewQuery();
  const totalPayments =
    earningsData?.data?.totalPayments ?? earningsData?.data?.totalRevenue;
  const totalCommission =
    earningsData?.data?.totalCommission ?? earningsData?.data?.totalEarnings ?? 0;
  const thisMonthPayments =
    earningsData?.data?.thisMonthPayments ?? earningsData?.data?.thisMonthRevenue;
  const todayPayments =
    earningsData?.data?.todayPayments ?? earningsData?.data?.todayRevenue;

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="flex flex-col justify-center items-center p-8 bg-[#F2F2F2] rounded-xl gap-2">
          <p className="text-[#2D8C3C] text-2xl font-bold">
            {Number(totalPayments || 0).toFixed(2)} AED
          </p>
          <p className="text-xl font-semibold">Total Payments</p>
        </div>
        <div className="flex flex-col justify-center items-center p-8 bg-[#F2F2F2] rounded-xl gap-2">
          <p className="text-[#2D8C3C] text-2xl font-bold">
            {Number(totalCommission || 0).toFixed(2)} AED
          </p>
          <p className="text-xl font-semibold">Total Commission</p>
        </div>
        <div className="flex flex-col justify-center items-center p-8 bg-[#F2F2F2] rounded-xl gap-2">
          <p className="text-[#2D8C3C] text-2xl font-bold">
            {Number(thisMonthPayments || 0).toFixed(2)} AED
          </p>
          <p className="text-xl font-semibold">Payments This Month</p>
        </div>
        <div className="flex flex-col justify-center items-center p-8 bg-[#F2F2F2] rounded-xl gap-2">
          <p className="text-[#2D8C3C] text-2xl font-bold">
            {Number(todayPayments || 0).toFixed(2)} AED
          </p>
          <p className="text-xl font-semibold">Payments Today</p>
        </div>
      </div>
      <div className="mt-8">
        <EarningsTable />
      </div>
    </div>
  );
}

export default Earnings;
