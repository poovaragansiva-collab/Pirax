import { Module } from '@nestjs/common';
import { ExamCloneService } from './exam-clone.service';
import { ExamCloneController } from './exam-clone.controller';
import { ExamCloneGateway } from './exam-clone.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ExamCloneController],
  providers: [ExamCloneService, ExamCloneGateway],
  exports: [ExamCloneService],
})
export class ExamCloneModule {}
