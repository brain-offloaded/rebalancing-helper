import { InputType, Field } from '@nestjs/graphql';
import type { DecimalInput } from '@rebalancing-helper/common';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { DecimalScalar } from '../common/scalars/decimal.scalar';
import {
  DecimalMin,
  DecimalPositive,
  IsDecimalValue,
} from '../common/validators/decimal.validators';

@InputType()
export class AddHoldingTagInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  holdingSymbol: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  tagId: string;
}

@InputType()
export class RemoveHoldingTagInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  holdingSymbol: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  tagId: string;
}

@InputType()
export class SetHoldingTagsInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  holdingSymbol: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  tagIds: string[];
}

@InputType()
export class ManualHoldingIdentifierInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  market: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  symbol: string;
}

@InputType()
export class CreateManualHoldingInput extends ManualHoldingIdentifierInput {
  @Field(() => DecimalScalar)
  @IsDecimalValue()
  @DecimalMin(0)
  quantity: DecimalInput;
}

@InputType()
export class IncreaseManualHoldingInput extends ManualHoldingIdentifierInput {
  @Field(() => DecimalScalar)
  @IsDecimalValue()
  @DecimalPositive()
  quantityDelta: DecimalInput;
}

@InputType()
export class SetManualHoldingQuantityInput extends ManualHoldingIdentifierInput {
  @Field(() => DecimalScalar)
  @IsDecimalValue()
  @DecimalMin(0)
  quantity: DecimalInput;
}

@InputType()
export class SetHoldingAliasInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  holdingId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  alias: string | null;
}
