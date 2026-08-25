/* eslint-disable react/prop-types */
import { Button, ConfigProvider, DatePicker, Modal, Table, Tag, message } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { MdOutlinePayments } from "react-icons/md";
import { FaRegEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  useGetDriverPayoutHistoryQuery,
  useGetDriverPayoutsQuery,
  usePayDriverMutation,
} from "../../../Redux/features/payout/driverPayoutApi";

const { RangePicker } = DatePicker;

const money = (value) => `AED ${Number(value || 0).toFixed(2)}`;
const positiveMoney = (value) => money(Math.abs(Number(value || 0)));

const statusColor = {
  Ready: "green",
  Settled: "blue",
  OffsetDue: "orange",
  Paid: "green",
  Pending: "gold",
  Failed: "red",
};

const statusLabel = {
  Ready: "Due to Driver",
  Settled: "Settled",
  OffsetDue: "Due to Admin",
  Paid: "Paid",
  Pending: "Pending",
  Failed: "Failed",
};

function DriverPayouts() {
  const navigate = useNavigate();
  const [range, setRange] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const params = useMemo(() => {
    if (!range?.[0] || !range?.[1]) return {};
    return {
      dateFrom: range[0].format("YYYY-MM-DD"),
      dateTo: range[1].format("YYYY-MM-DD"),
    };
  }, [range]);

  const { data, isLoading } = useGetDriverPayoutsQuery(params);
  const { data: historyData, isFetching: isHistoryLoading } =
    useGetDriverPayoutHistoryQuery(
      selectedDriver
        ? {
            riderId: selectedDriver.rider._id,
          }
        : undefined,
      { skip: !selectedDriver }
    );
  const [payDriver, { isLoading: isSettling }] = usePayDriverMutation();

  const rows = Array.isArray(data?.data) ? data.data : [];
  const historyRows = Array.isArray(historyData?.data) ? historyData.data : [];

  const handleMakeSettlement = (record) => {
    const settlementAmount = Number(record.payoutDue || 0);
    const driverName = record.rider?.name || "this driver";
    const isAdminDue = settlementAmount < 0;

    Modal.confirm({
      title: "Make settlement",
      content: isAdminDue
        ? `Confirm you received ${positiveMoney(settlementAmount)} from ${driverName}. This will settle the included orders in the dashboard.`
        : `Confirm you paid ${positiveMoney(settlementAmount)} to ${driverName} by hand. This will settle the included orders in the dashboard.`,
      okText: "Make Settlement",
      okButtonProps: { className: "bg-[#2D8C3C]" },
      onOk: async () => {
        try {
          const res = await payDriver({
            riderId: record.rider._id,
            body: {
              ...params,
              currency: "AED",
              paymentMethod: "hand_to_hand",
            },
          }).unwrap();
          message.success(res.message || "Driver settlement completed");
        } catch (error) {
          message.error(error?.data?.message || error?.message || "Failed to complete settlement");
        }
      },
    });
  };

  const columns = [
    {
      title: "Driver Name",
      key: "driver",
      render: (_, record) => (
        <div>
          <p className="font-bold text-gray-900">{record.rider?.name || "Driver"}</p>
          <p className="text-xs text-gray-500">{record.rider?.email}</p>
        </div>
      ),
    },
    {
      title: "Stripe Status",
      key: "stripeStatus",
      render: (_, record) => {
        const isConnected =
          record.rider?.payoutAccount?.status === "Connected" &&
          record.rider?.payoutAccount?.payoutsEnabled;
        const isPending =
          record.rider?.payoutAccount?.status === "Pending" ||
          (record.rider?.payoutAccount?.stripeAccountId && !isConnected);

        if (isConnected) {
          return <Tag color="green">Stripe Active</Tag>;
        }
        if (isPending) {
          return <Tag color="orange">Stripe Pending</Tag>;
        }
        return <Tag color="default">Not Connected</Tag>;
      },
    },
    {
      title: "Total Revenue",
      dataIndex: "totalRevenue",
      render: money,
    },
    {
      title: "Direct Stripe Paid",
      dataIndex: "stripeTransferredEarnings",
      render: (value, record) => money(value ?? record.paidEarnings),
    },
    {
      title: "Total Earnings",
      dataIndex: "totalEarnings",
      render: money,
    },
    {
      title: "Paid Earnings",
      dataIndex: "paidEarnings",
      render: money,
    },
    {
      title: "Pending Earnings",
      dataIndex: "pendingEarnings",
      render: (value) => (
        <span className={Number(value) < 0 ? "text-orange-600 font-semibold" : "font-semibold"}>
          {money(value)}
        </span>
      ),
    },
    {
      title: "Net Settlement",
      dataIndex: "payoutDue",
      render: (value) => (
        <span className={Number(value) < 0 ? "text-orange-600 font-semibold" : "font-semibold"}>
          {money(value)}
        </span>
      ),
    },
    {
      title: "Last Settlement Date",
      dataIndex: "lastPayoutDate",
      render: (value) => (value ? dayjs(value).format("MMM D, YYYY") : "Never"),
    },
    {
      title: "Settlement Status",
      dataIndex: "payoutStatus",
      render: (value) => <Tag color={statusColor[value] || "default"}>{statusLabel[value] || value}</Tag>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedDriver(record)} title="View settlement history">
            <FaRegEye className="w-5 h-5 text-blue-500 hover:text-blue-700" />
          </button>
          <Button
            type="primary"
            disabled={Number(record.payoutDue || 0) === 0}
            loading={isSettling}
            onClick={() => handleMakeSettlement(record)}
            style={{ backgroundColor: "#2D8C3C" }}
          >
            Make Settlement
          </Button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    {
      title: "Date",
      dataIndex: "paidAt",
      render: (value, record) => dayjs(value || record.createdAt).format("MMM D, YYYY h:mm A"),
    },
    { title: "Amount", dataIndex: "amount", render: money },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => <Tag color={statusColor[value] || "default"}>{statusLabel[value] || value}</Tag>,
    },
    { title: "Method", dataIndex: "provider", render: (value) => value || "Manual" },
    { title: "Reference", dataIndex: "referenceId", render: (value) => value || "N/A" },
    {
      title: "Orders",
      dataIndex: "orders",
      render: (orders) => `${orders?.length || 0} order${orders?.length === 1 ? "" : "s"}`,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-[#2D8C3C] px-5 py-4 rounded-xl flex flex-wrap items-center gap-3 shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <IoChevronBack className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <MdOutlinePayments className="w-7 h-7 text-white" />
          <h1 className="text-white text-2xl font-bold">Driver Settlements</h1>
        </div>
        <div className="ml-auto">
          <RangePicker value={range} onChange={setRange} allowClear />
        </div>
      </div>

      <ConfigProvider
        theme={{
          components: {
            Table: {
              headerBg: "#2D8C3C",
              headerColor: "#fff",
              headerSplitColor: "#2D8C3C",
            },
            Pagination: {
              colorPrimary: "#2D8C3C",
            },
          },
        }}
      >
        <Table
          rowKey={(record) => record.rider._id}
          loading={isLoading}
          dataSource={rows}
          columns={columns}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
      </ConfigProvider>

      <Modal
        open={!!selectedDriver}
        width={900}
        centered
        footer={null}
        onCancel={() => setSelectedDriver(null)}
        title={selectedDriver ? `${selectedDriver.rider.name || "Driver"} settlement history` : "Settlement history"}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
          <Summary label="Total Revenue" value={selectedDriver?.totalRevenue} />
          <Summary label="Total Earnings" value={selectedDriver?.totalEarnings} />
          <Summary label="Paid Earnings" value={selectedDriver?.paidEarnings} />
          <Summary label="Net Settlement" value={selectedDriver?.payoutDue} />
        </div>
        <Table
          rowKey="_id"
          loading={isHistoryLoading}
          dataSource={historyRows}
          columns={historyColumns}
          pagination={{ pageSize: 5 }}
          expandable={{
            expandedRowRender: (record) => (
              <div className="space-y-2">
                {(record.orders || []).map((order) => (
                  <div
                    key={order._id}
                    className="flex flex-wrap justify-between gap-3 rounded-lg bg-gray-50 p-3"
                  >
                    <span className="font-semibold">{order._id}</span>
                    <span>{order.paymentMethod}</span>
                    <span>{money(order.price)}</span>
                    <span>{order.dropoff?.addressLine || "Destination"}</span>
                  </div>
                ))}
              </div>
            ),
          }}
        />
      </Modal>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-bold uppercase text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-black ${Number(value) < 0 ? "text-orange-600" : "text-gray-900"}`}>
        {money(value)}
      </p>
    </div>
  );
}

export default DriverPayouts;
