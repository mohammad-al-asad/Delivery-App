import { CommonRepository } from "./common.repository";

export class CommonService {
  constructor(
    private readonly commonRepository: CommonRepository
  ) { }

  getNotification = async (query: any) => {
    const notifications = await this.commonRepository.getNotification(query);
    return notifications;
  };

  getSettings = async () => {
    return this.commonRepository.getSettings();
  };

  updateSettings = async (updateObj: any) => {
    return this.commonRepository.updateSettings(updateObj);
  };

  markNotificationRead = async (notificationId: string, userId: string) => {
    return this.commonRepository.markNotificationRead(notificationId, userId);
  };

  markAllNotificationsRead = async (userId: string) => {
    return this.commonRepository.markAllNotificationsRead(userId);
  };

  getMyStats = async (user: any, periodType?: string, date?: Date) => {
    return null;
  };

  getUserStatsById = async (userId: string, periodType?: string, date?: Date) => {
    return this.commonRepository.getUserStatsById(userId, periodType, date);
  };
}
