import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

@InputType()
export class CreateBrokerageAccountInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  brokerName!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  apiKey!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  apiSecret?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  apiBaseUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

@InputType()
export class UpdateBrokerageAccountInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  apiSecret?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  apiBaseUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}
