import { UseGuards, NotFoundException } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './users.entities';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActiveUserData } from '../auth/auth.types';
import { GqlAuthGuard } from '../auth/gql-auth.guard';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => User)
  async me(@CurrentUser() user: ActiveUserData): Promise<User> {
    const record = await this.usersService.findById(user.userId);

    if (!record) {
      throw new NotFoundException('User not found');
    }

    return record;
  }
}
