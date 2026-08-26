import { ConfigProvider, Image, Input, Modal, Select, Table, Tag, message } from "antd";
import { useMemo, useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { MdCancel, MdCheckCircle, MdOutlineVerifiedUser } from "react-icons/md";
import { FaRegEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useApproveRiderMutation, useGetAllRiderQuery } from "../../../Redux/features/user/userApi";
import { imageUrl } from "../../../utils/server";

const statusColors = {
  Approved: "green",
  Active: "green",
  Pending: "gold",
  Blocked: "red",
  Rejected: "volcano",
};

const checks = [
  ["vehicleInfoSubmitted", "Vehicle"],
  ["documentsUploaded", "Documents"],
  ["adminApproved", "Approval"],
  ["stripeConnected", "Stripe"],
];

const getRiders = (payload) => {
  if (Array.isArray(payload?.data?.result)) return payload.data.result;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const DocumentPreview = ({ label, value }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
    <p className="text-xs font-bold uppercase text-gray-500 mb-2">{label}</p>
    {value?.startsWith?.("http") ? (
      <Image src={value} width={120} height={80} className="rounded object-cover" />
    ) : (
      <p className="text-sm font-semibold text-gray-500">{value || "Not uploaded"}</p>
    )}
  </div>
);

function DriverVerification() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetAllRiderQuery();
  const [updateRiderStatus, { isLoading: isUpdating }] = useApproveRiderMutation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const riders = getRiders(data);
  const filteredDrivers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return riders.filter((driver) => {
      const fullName = `${driver.firstName || ""} ${driver.lastName || ""}`.trim();
      const searchable = [
        fullName,
        driver.email,
        driver.phoneNumber,
        driver.vehicle?.type,
        driver.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (!statusFilter || driver.status === statusFilter) && (!q || searchable.includes(q));
    });
  }, [riders, searchQuery, statusFilter]);

  const setDriverStatus = async (driver, status) => {
    try {
      const formData = new FormData();
      formData.append("status", status);
      const res = await updateRiderStatus({
        riderId: driver._id,
        data: formData,
      }).unwrap();

      if (res.success) {
        message.success(`Driver ${status === "Approved" ? "approved" : "rejected"} successfully`);
        setSelectedDriver(null);
      }
    } catch (error) {
      message.error(error?.data?.message || "Failed to update driver status");
    }
  };

  const columns = [
    {
      title: "Driver",
      key: "driver",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <img
            src={imageUrl(record.profileImage, `${record.firstName} ${record.lastName}`)}
            className="w-10 h-10 rounded-full object-cover"
            alt="Driver"
          />
          <div>
            <p className="font-bold text-gray-900 leading-tight">
              {record.firstName} {record.lastName}
            </p>
            <p className="text-xs text-gray-500">{record.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Vehicle",
      key: "vehicle",
      render: (_, record) => (
        <div>
          <p className="font-bold">{record.vehicle?.type || "Not selected"}</p>
          <p className="text-xs text-gray-500">{record.vehicle?.plateNumber || "No plate"}</p>
        </div>
      ),
    },
    {
      title: "Checklist",
      key: "checklist",
      render: (_, record) => (
        <div className="flex flex-wrap gap-1">
          {checks.map(([key, label]) => {
            const done = Boolean(record.onboarding?.checks?.[key]);
            return (
              <Tag key={key} color={done ? "green" : "default"}>
                {label}
              </Tag>
            );
          })}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={statusColors[status] || "default"}>{status}</Tag>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedDriver(record)} title="View Details">
            <FaRegEye className="w-5 h-5 text-blue-500 hover:text-blue-700" />
          </button>
          {record.status !== "Approved" && (
            <button onClick={() => setDriverStatus(record, "Approved")} title="Approve">
              <MdCheckCircle className="w-5 h-5 text-green-500 hover:text-green-700" />
            </button>
          )}
          {record.status !== "Rejected" && (
            <button onClick={() => setDriverStatus(record, "Rejected")} title="Reject">
              <MdCancel className="w-5 h-5 text-red-500 hover:text-red-700" />
            </button>
          )}
        </div>
      ),
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
          <MdOutlineVerifiedUser className="w-7 h-7 text-white" />
          <h1 className="text-white text-2xl font-bold">Driver Verification</h1>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Input
            placeholder="Search drivers"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-56"
          />
          <Select
            allowClear
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-40"
            options={[
              { label: "Pending", value: "Pending" },
              { label: "Approved", value: "Approved" },
              { label: "Rejected", value: "Rejected" },
              { label: "Blocked", value: "Blocked" },
            ]}
          />
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
          rowKey="_id"
          loading={isLoading || isUpdating}
          dataSource={filteredDrivers}
          columns={columns}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
      </ConfigProvider>

      <Modal
        open={!!selectedDriver}
        centered
        width={760}
        footer={null}
        onCancel={() => setSelectedDriver(null)}
      >
        {selectedDriver && (
          <div>
            <div className="bg-[#2D8C3C] p-6 -m-6 mb-6 rounded-t-lg text-white">
              <h2 className="text-2xl font-bold">
                {selectedDriver.firstName} {selectedDriver.lastName}
              </h2>
              <p className="text-white/80">{selectedDriver.email}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Phone</p>
                <p className="font-semibold">{selectedDriver.phoneNumber || "N/A"}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Vehicle</p>
                <p className="font-semibold">{selectedDriver.vehicle?.type || "N/A"}</p>
                <p className="text-xs text-gray-500">{selectedDriver.vehicle?.plateNumber || "No plate"}</p>
              </div>
            </div>

            <h3 className="text-base font-bold text-gray-800 mb-3">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <DocumentPreview label="Emirates ID" value={selectedDriver.emaratesId} />
              <DocumentPreview label="Driving License" value={selectedDriver.drivingLicense} />
              <DocumentPreview label="Vehicle Registration" value={selectedDriver.vehicleRegistration} />
            </div>

            <div className="rounded-xl border border-gray-200 p-4 mb-6">
              <p className="text-sm font-bold text-gray-800 mb-2">Missing Requirements</p>
              {selectedDriver.onboarding?.missingRequirements?.length ? (
                <div className="flex flex-wrap gap-2">
                  {selectedDriver.onboarding.missingRequirements.map((item) => (
                    <Tag key={item} color="gold">{item}</Tag>
                  ))}
                </div>
              ) : (
                <Tag color="green">Ready for approval</Tag>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDriverStatus(selectedDriver, "Rejected")}
                className="bg-red-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-red-600"
              >
                Reject
              </button>
              <button
                onClick={() => setDriverStatus(selectedDriver, "Approved")}
                className="bg-[#2D8C3C] text-white font-semibold px-6 py-2 rounded-lg hover:bg-[#256a2f]"
              >
                Approve
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default DriverVerification;
