export class CreatePoolCommand {
  constructor(
    public readonly year: number,
    public readonly memberShipIds: string[],
  ) {}
}
