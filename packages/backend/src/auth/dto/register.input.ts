import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field(() => String)
  @IsEmail()
  email: string;

  @Field(() => String)
  @IsString()
  @MinLength(8)
  password: string;
}
