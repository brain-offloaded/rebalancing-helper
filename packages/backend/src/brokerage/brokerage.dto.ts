import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsNumber,
  Min,
} from 'class-validator';

@InputType()
export class CreateBrokerInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  code: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  apiBaseUrl?: string;
}

@InputType()
export class UpdateBrokerInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  code?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  apiBaseUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class CreateBrokerageAccountInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  brokerId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  apiSecret?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class UpdateBrokerageAccountInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  brokerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  apiSecret?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class IncrementHoldingQuantityInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  holdingId: string;

  @Field(() => Number)
  @IsNumber()
  @Min(0.0000001)
  quantityDelta: number;
}

@InputType()
export class SetHoldingQuantityInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  holdingId: string;

  @Field(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;
}

@InputType()
export class SyncHoldingPriceInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  holdingId: string;
}
