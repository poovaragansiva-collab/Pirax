import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common';
import { DatabaseService } from './modules/database';
import { QdrantService } from './modules/qdrant';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: boolean;
    qdrant: boolean;
  };
}

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private readonly database: DatabaseService,
    private readonly qdrant: QdrantService,
  ) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async health(): Promise<HealthStatus> {
    const [dbHealth, qdrantHealth] = await Promise.all([
      this.database.healthCheck().catch(() => false),
      this.qdrant.healthCheck().catch(() => false),
    ]);

    const allHealthy = dbHealth && qdrantHealth;
    const anyHealthy = dbHealth || qdrantHealth;

    return {
      status: allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbHealth,
        qdrant: qdrantHealth,
      },
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({ status: 200, description: 'API info' })
  root() {
    return {
      name: 'PIRAX API',
      version: process.env.npm_package_version || '1.0.0',
      documentation: '/api/docs',
    };
  }
}
