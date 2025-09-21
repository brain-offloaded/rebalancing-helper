import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/users.entities';

@ObjectType()
export class AuthPayload {
  @Field(() => String)
  accessToken: string;

  @Field(() => User)
  user: User;
}
