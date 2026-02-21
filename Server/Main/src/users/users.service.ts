import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { Notification, NotificationDocument } from './entities/notification.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const newUser = new this.userModel(createUserDto);
    const savedUser = await newUser.save();
    const userObj = (savedUser.toObject && savedUser.toObject()) || savedUser;
    const { password, _id, __v, ...userWithoutPassword } = userObj as any;
    return { ...userWithoutPassword, id: _id.toString() };
  }

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOneById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken }, { new: true });
  }

  async update(userId: string, updateUserDto: any): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(userId, updateUserDto, { new: true }).exec();
  }

  async addPushToken(userId: string, token: string) {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { pushTokens: token } },
      { new: true, upsert: false },
    ).exec();
    return this.findOneById(userId);
  }

  async setLocation(userId: string, location: string) {
    await this.userModel.findByIdAndUpdate(
      userId,
      { location },
      { new: true, upsert: false },
    ).exec();
    return this.findOneById(userId);
  }

  // ── In-App Notifications ──────────────────────────────────────────────────

  /**
   * Persist a new in-app notification for a user.
   * Called by the NotificationMicroservice via RabbitMQ consumer on the Main server.
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
  ): Promise<NotificationDocument> {
    const n = new this.notificationModel({
      userId,
      type,
      title,
      message,
      timestamp: new Date(),
    });
    return n.save();
  }

  /**
   * Fetch the most recent 50 notifications for a user, newest first.
   */
  async getNotifications(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  /**
   * Mark a single notification as read.
   */
  async markNotificationRead(notificationId: string, userId: string): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findOneAndUpdate(
        { _id: notificationId, userId },
        { read: true },
        { new: true },
      )
      .exec();
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllNotificationsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany({ userId, read: false }, { read: true });
  }

  /**
   * Broadcast a notification to all users.
   */
  async broadcastNotification(type: string, title: string, message: string): Promise<void> {
    const users = await this.userModel.find({}, '_id').exec();
    const notifications = users.map(user => ({
      userId: user._id.toString(),
      type: type || 'GENERAL',
      title,
      message,
      timestamp: new Date(),
    }));

    if (notifications.length > 0) {
      await this.notificationModel.insertMany(notifications);
    }
  }

  /**
   * Send a notification to specific users.
   */
  async sendNotificationsToUsers(userIds: string[], type: string, title: string, message: string): Promise<void> {
    const notifications = userIds.map(userId => ({
      userId,
      type: type || 'GENERAL',
      title,
      message,
      timestamp: new Date(),
    }));

    if (notifications.length > 0) {
      await this.notificationModel.insertMany(notifications);
    }
  }

  /**
   * Get the total number of users.
   */
  async countAllUsers(): Promise<number> {
    return this.userModel.countDocuments({}).exec();
  }
}
