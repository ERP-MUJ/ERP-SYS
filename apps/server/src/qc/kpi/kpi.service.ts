import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { UserRole, Prisma } from '@repo/db/prisma/client';
import type { KpiTemplateInstance, KpiFormData, KpiCalculatedMetrics } from '@workspace/types/types';

/**
 * Service for managing KPI templates
 * Handles CRUD operations for KPI templates that can be created by QAC users
 * and associated with pillar templates
 */
@Injectable()
export class KpiService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures only QAC users can perform KPI template operations
   * @param userRole - The role of the current user
   * @throws ForbiddenException if user is not QAC
   */
  private assertQacRole(userRole: UserRole) {
    if (userRole !== UserRole.QAC) {
      throw new ForbiddenException('Only QAC users can perform this action');
    }
  }

  /**
   * Transforms Prisma KPI result to shared KpiTemplateInstance type
   * @param kpi - Raw KPI data from Prisma
   * @returns Properly typed KpiTemplateInstance
   */
  private transformToKpiTemplate(kpi: {
    id: string;
    pillar_template_id: string | null;
    kpi_number: number;
    kpi_metric_name: string;
    kpi_description: string | null;
    kpi_value: number | null;
    percentage_target_achieved: number | null;
    performance: number | null;
    data_provided_by: string | null;
    kpi_data: Prisma.JsonValue;
    academic_year: number;
    kpi_calculated_metrics: Prisma.JsonValue;
    created_by_user: string;
    created_at: Date;
    updated_at: Date;
  }): KpiTemplateInstance {
    return {
      id: kpi.id,
      pillar_template_id: kpi.pillar_template_id!,
      kpi_number: kpi.kpi_number,
      kpi_metric_name: kpi.kpi_metric_name,
      kpi_description: kpi.kpi_description || undefined,
      kpi_value: kpi.kpi_value || undefined,
      percentage_target_achieved: kpi.percentage_target_achieved || undefined,
      performance: kpi.performance || undefined,
      data_provided_by: kpi.data_provided_by || undefined,
      kpi_data: kpi.kpi_data as unknown as KpiFormData,
      academic_year: kpi.academic_year,
      kpi_calculated_metrics: kpi.kpi_calculated_metrics as unknown as KpiCalculatedMetrics,
      created_by_user: kpi.created_by_user,
      created_at: kpi.created_at.toISOString(),
      updated_at: kpi.updated_at.toISOString(),
    };
  }

  async createKpi(
    userId: string,
    userRole: UserRole,
    pillarId: string,
    dto: CreateKpiDto,
  ): Promise<{ message: string; data: KpiTemplateInstance }> {
    this.assertQacRole(userRole);

    // Validate pillar ownership
    const pillar = await this.prisma.pillarTemplate.findFirst({
      where: { id: pillarId, created_by_user: userId },
    });
    if (!pillar) throw new BadRequestException('Pillar template not found or not owned by you');

    // Check for duplicate KPI number across all pillars for the same academic year
    const existingKpi = await this.prisma.kpiTemplate.findFirst({
      where: {
        kpi_number: dto.kpi_number,
        academic_year: dto.academic_year,
        created_by_user: userId, // Only check within user's templates
      },
    });

    if (existingKpi) {
      throw new BadRequestException(
        `KPI number ${dto.kpi_number} already exists in academic year ${dto.academic_year}. Please choose a different KPI number.`,
      );
    }

    const kpiTemplate = await this.prisma.kpiTemplate.create({
      data: {
        pillar_template_id: pillarId,
        ...dto,
        kpi_data: dto.kpi_data as unknown as Prisma.InputJsonValue,
        kpi_calculated_metrics: dto.kpi_calculated_metrics as unknown as Prisma.InputJsonValue,
        created_by_user: userId,
      },
    });

    return {
      message: 'KPI template created successfully',
      data: this.transformToKpiTemplate(kpiTemplate),
    };
  }

  async updateKpi(userId: string, userRole: UserRole, kpiId: string, dto: UpdateKpiDto): Promise<KpiTemplateInstance> {
    this.assertQacRole(userRole);

    // Get the existing KPI to validate pillar ownership
    const existingKpi = await this.prisma.kpiTemplate.findFirst({
      where: { id: kpiId, created_by_user: userId },
    });

    if (!existingKpi) {
      throw new BadRequestException('KPI not found or not owned by you');
    }

    // Check for duplicate KPI number if kpi_number is being updated
    if (dto.kpi_number !== undefined && dto.kpi_number !== existingKpi.kpi_number) {
      const duplicateKpi = await this.prisma.kpiTemplate.findFirst({
        where: {
          kpi_number: dto.kpi_number,
          academic_year: dto.academic_year || existingKpi.academic_year,
          created_by_user: userId, // Only check within user's templates
          id: { not: kpiId }, // Exclude current KPI
        },
      });

      if (duplicateKpi) {
        throw new BadRequestException(
          `KPI number ${dto.kpi_number} already exists in academic year ${dto.academic_year || existingKpi.academic_year}. Please choose a different KPI number.`,
        );
      }
    }

    const updatedKpi = await this.prisma.kpiTemplate.update({
      where: { id: kpiId, created_by_user: userId },
      data: {
        ...(dto.kpi_number !== undefined && { kpi_number: dto.kpi_number }),
        ...(dto.kpi_metric_name !== undefined && { kpi_metric_name: dto.kpi_metric_name }),
        ...(dto.kpi_description !== undefined && { kpi_description: dto.kpi_description }),
        ...(dto.kpi_value !== undefined && { kpi_value: dto.kpi_value }),
        ...(dto.percentage_target_achieved !== undefined && {
          percentage_target_achieved: dto.percentage_target_achieved,
        }),
        ...(dto.performance !== undefined && { performance: dto.performance }),
        ...(dto.data_provided_by !== undefined && { data_provided_by: dto.data_provided_by }),
        ...(dto.academic_year !== undefined && { academic_year: dto.academic_year }),
        ...(dto.kpi_data && { kpi_data: dto.kpi_data as unknown as Prisma.InputJsonValue }),
        ...(dto.kpi_calculated_metrics && {
          kpi_calculated_metrics: dto.kpi_calculated_metrics as unknown as Prisma.InputJsonValue,
        }),
      },
    });

    return this.transformToKpiTemplate(updatedKpi);
  }

  async checkKpiNumberExists(
    userId: string,
    userRole: UserRole,
    pillarId: string,
    kpiNumber: number,
    academicYear: number,
    excludeKpiId?: string,
  ): Promise<{ exists: boolean; kpiNumber?: number }> {
    this.assertQacRole(userRole);

    const existingKpi = await this.prisma.kpiTemplate.findFirst({
      where: {
        kpi_number: kpiNumber,
        academic_year: academicYear,
        created_by_user: userId, // Only check within user's templates
        ...(excludeKpiId && { id: { not: excludeKpiId } }),
      },
    });

    return {
      exists: !!existingKpi,
      kpiNumber: existingKpi?.kpi_number,
    };
  }

  async deleteKpi(userId: string, userRole: UserRole, kpiId: string): Promise<KpiTemplateInstance> {
    this.assertQacRole(userRole);

    const deletedKpi = await this.prisma.kpiTemplate.delete({
      where: { id: kpiId, created_by_user: userId },
    });

    return this.transformToKpiTemplate(deletedKpi);
  }

  /**
   * Retrieves all KPI templates for a specific pillar created by the current QAC user
   * @param userId - ID of the QAC user
   * @param userRole - Role of the current user (must be QAC)
   * @param pillarId - Pillar ID to filter KPIs by specific pillar
   * @returns Array of KPI templates with associated pillar information
   */
  async getKpis(userId: string, userRole: UserRole, pillarId: string): Promise<KpiTemplateInstance[]> {
    this.assertQacRole(userRole);

    const kpis = await this.prisma.kpiTemplate.findMany({
      where: {
        created_by_user: userId,
        pillar_template_id: pillarId,
      },
      include: {
        pillar_template: {
          select: {
            id: true,
            pillar_name: true,
            academic_year: true,
          },
        },
      },
      orderBy: [{ academic_year: 'desc' }, { kpi_number: 'asc' }],
    });

    return kpis.map((kpi) => this.transformToKpiTemplate(kpi));
  }

  async getKpiById(userId: string, userRole: UserRole, kpiId: string): Promise<KpiTemplateInstance> {
    this.assertQacRole(userRole);

    const kpi = await this.prisma.kpiTemplate.findUniqueOrThrow({
      where: { id: kpiId, created_by_user: userId },
    });

    return this.transformToKpiTemplate(kpi);
  }
}
