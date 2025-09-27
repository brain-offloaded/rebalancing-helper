import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';

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
  market: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  symbol: string;
}

@InputType()
export class CreateManualHoldingInput extends ManualHoldingIdentifierInput {
  @Field(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;
}

@InputType()
export class IncreaseManualHoldingInput extends ManualHoldingIdentifierInput {
  @Field(() => Number)
  @IsNumber()
  @IsPositive()
  quantityDelta: number;
}

@InputType()
export class SetManualHoldingQuantityInput extends ManualHoldingIdentifierInput {
  @Field(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;
}
