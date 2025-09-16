import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsHexColor } from 'class-validator';

@InputType()
export class CreateTagInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @Field()
  @IsString()
  @IsHexColor()
  color: string;
}

@InputType()
export class UpdateTagInput {
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
  description?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsHexColor()
  color?: string;
}
