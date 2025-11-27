// TODO - is this to delete?

export const queryEntitiesByPartitionKey = async (tableName, partitionKey, queryFilter) => {
  // TODO 1182 impl
  return []

  // const events = []
  // if (tableName && partitionKey) {
  //   const tableClient = createTableClient(tableName)
  //   await tableClient.createTable(tableName)
  //   const eventResults = tableClient.listEntities({
  //     queryOptions: {
  //       filter: queryFilter
  //     }
  //   })

  //   for await (const event of eventResults) {
  //     events.push(event)
  //   }
  // }

  // return events
}
