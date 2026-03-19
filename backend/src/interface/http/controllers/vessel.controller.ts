import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { CreateVesselCommand } from '../../../application/commands/create-vessel.command';
import { UpdateVesselCommand } from '../../../application/commands/update-vessel.command';
import { DeleteVesselCommand } from '../../../application/commands/delete-vessel.command';
import { GetVesselByIdQuery } from '../../../application/queries/get-vessel-by-id.query';
import { GetAllVesselsQuery } from '../../../application/queries/get-all-vessels.query';
import type { CreateVesselHandler } from '../../../application/command-handler/create-vessel.handler';
import type { UpdateVesselHandler } from '../../../application/command-handler/update-vessel.handler';
import type { DeleteVesselHandler } from '../../../application/command-handler/delete-vessel.handler';
import type { GetVesselByIdHandler } from '../../../application/query-handlers/get-vessel-by-id.handler';
import type { GetAllVesselsHandler } from '../../../application/query-handlers/get-all-vessels.handler';
import {
  CreateVesselDtoSchema,
  UpdateVesselDtoSchema,
} from '../../../application/dto/vessel.dto';
import type { VesselQueryFilters } from '../../../domain/repositories/vessel.repository';
import type { VesselStatus, VesselType } from '../../../types';
import { successResponse } from '../../../utils/response.util';
import { ValidationError } from '../../../utils/error.util';

type IdParam = { Params: { id: string } };

type GetAllQuerystring = {
  Querystring: {
    page?: string;
    limit?: string;
    status?: string;
    vesselType?: string;
    flag?: string;
    name?: string;
  };
};

export class VesselController {
  constructor(
    private readonly createVesselHandler: CreateVesselHandler,
    private readonly updateVesselHandler: UpdateVesselHandler,
    private readonly deleteVesselHandler: DeleteVesselHandler,
    private readonly getVesselByIdHandler: GetVesselByIdHandler,
    private readonly getAllVesselsHandler: GetAllVesselsHandler,
  ) {}

  async create(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    let dto;
    try {
      dto = CreateVesselDtoSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError('Request validation failed.', error.errors);
      }
      throw error;
    }

    const vessel = await this.createVesselHandler.execute(
      new CreateVesselCommand(
        dto.imoNumber,
        dto.name,
        dto.flag,
        dto.vesselType,
        dto.grossTonnage,
        dto.yearBuilt,
      ),
    );

    reply.status(201).send(successResponse(vessel, 'Vessel created successfully.'));
  }

  async getAll(
    req: FastifyRequest<GetAllQuerystring>,
    reply: FastifyReply,
  ): Promise<void> {
    const { page, limit, status, vesselType, flag, name } = req.query;

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const filters: VesselQueryFilters = {
      ...(status && { status: status as VesselStatus }),
      ...(vesselType && { vesselType: vesselType as VesselType }),
      ...(flag && { flag }),
      ...(name && { name }),
    };

    const result = await this.getAllVesselsHandler.execute(
      new GetAllVesselsQuery(filters, pageNum, limitNum),
    );

    reply.send(
      successResponse(result.vessels, undefined, {
        total: result.total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(result.total / limitNum),
      }),
    );
  }

  async getById(
    req: FastifyRequest<IdParam>,
    reply: FastifyReply,
  ): Promise<void> {
    const vessel = await this.getVesselByIdHandler.execute(
      new GetVesselByIdQuery(req.params.id),
    );
    reply.send(successResponse(vessel));
  }

  async update(
    req: FastifyRequest<IdParam>,
    reply: FastifyReply,
  ): Promise<void> {
    let dto;
    try {
      dto = UpdateVesselDtoSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError('Request validation failed.', error.errors);
      }
      throw error;
    }

    const vessel = await this.updateVesselHandler.execute(
      new UpdateVesselCommand(
        req.params.id,
        dto.name,
        dto.flag,
        dto.vesselType,
        dto.grossTonnage,
        dto.status,
      ),
    );

    reply.send(successResponse(vessel, 'Vessel updated successfully.'));
  }

  async remove(
    req: FastifyRequest<IdParam>,
    reply: FastifyReply,
  ): Promise<void> {
    await this.deleteVesselHandler.execute(new DeleteVesselCommand(req.params.id));
    reply.status(204).send();
  }
}
