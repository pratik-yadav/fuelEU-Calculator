/** The database PK (id) of the route to designate as baseline. */
export class SetBaselineCommand {
  constructor(public readonly routeDbId: string) {}
}
