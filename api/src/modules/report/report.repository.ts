import mongoose, { Types } from "mongoose";
import { Report, IReport } from "./report.model";

export class ReportRepository {
  async create(data: Partial<IReport>): Promise<IReport> {
    const report = new Report(data);
    return report.save();
  }

  async find(
    filter: any,
    skip: number,
    limit: number
  ): Promise<IReport[]> {
    return Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reporter", "firstName lastName email name");
  }

  async count(filter: any): Promise<number> {
    return Report.countDocuments(filter);
  }

  async updateStatus(
    id: string,
    status: "Open" | "Resolved"
  ): Promise<IReport | null> {
    return Report.findByIdAndUpdate(id, { status }, { new: true });
  }
}
