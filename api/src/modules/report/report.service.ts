import { ReportRepository } from "./report.repository";
import { apiError } from "../../errors/api-error";
import { HttpCodes } from "../../constants/status-codes";

export class ReportService {
  constructor(private reportRepository: ReportRepository) {}

  async createReport(data: {
    reporter: string;
    reporterRole: string;
    title: string;
    description: string;
  }) {
    return this.reportRepository.create(data as any);
  }

  async getReports(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [result, total] = await Promise.all([
      this.reportRepository.find({}, skip, limit),
      this.reportRepository.count({}),
    ]);

    return {
      data: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async resolveReport(id: string) {
    const report = await this.reportRepository.updateStatus(id, "Resolved");
    if (!report) {
      throw new apiError(HttpCodes.NotFound, "Report not found");
    }
    return report;
  }
}
