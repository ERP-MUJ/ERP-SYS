import { Module } from '@nestjs/common';
import { ExcelService, ExcelValidationService } from './excel.service';

@Module({
  providers: [ExcelService, ExcelValidationService],
  exports: [ExcelService, ExcelValidationService],
})
export class ServicesModule {}
