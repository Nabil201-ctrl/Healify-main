// backend/src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

  async create(createUserDto: CreateUserDto) {
    const newUser = new this.userModel(createUserDto);
    const savedUser = await newUser.save();
    // Convert to plain object and exclude password, add id field
    const userObj = (savedUser.toObject && savedUser.toObject()) || savedUser;
    const { password, _id, __v, ...userWithoutPassword } = userObj as any;
    return {
      ...userWithoutPassword,
      id: _id.toString(),
    };
  }

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOneById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    await this.userModel.findByIdAndUpdate(
      userId,
      { refreshToken },
      { new: true },
    );
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
}
