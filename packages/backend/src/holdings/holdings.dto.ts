import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsArray } from 'class-validator';

@InputType()
export class AddHoldingTagInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  holdingSymbol!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  tagId!: string;
}

@InputType()
export class RemoveHoldingTagInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  holdingSymbol!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  tagId!: string;
}

@InputType()
export class SetHoldingTagsInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  holdingSymbol!: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  tagIds!: string[];
}
