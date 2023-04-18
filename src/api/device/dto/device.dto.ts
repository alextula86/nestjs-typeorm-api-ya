import { IsNotEmpty } from 'class-validator';

export class CreateDeviceDto {
  @IsNotEmpty({
    message: 'The deviceId field is required',
  })
  deviceId: string;

  @IsNotEmpty({
    message: 'The ip field is required',
  })
  ip: string;

  @IsNotEmpty({
    message: 'The title field is required',
  })
  title: string;

  @IsNotEmpty({
    message: 'The userId field is required',
  })
  userId: string;

  @IsNotEmpty({
    message: 'The lastActiveDate field is required',
  })
  lastActiveDate: string;
}

export class UpdateLastActiveDateDeviceDto {
  @IsNotEmpty({
    message: 'The lastActiveDate field is required',
  })
  lastActiveDate: string;
}
