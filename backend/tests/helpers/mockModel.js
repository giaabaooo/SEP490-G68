// Tao mot "query mock" bat chuoc Mongoose Query: ho tro .select().sort().skip().limit().populate().lean()
// va la mot thenable de "await" ra thang gia tri cuoi cung.
function mockQuery(result) {
  const query = {
    select: jest.fn(() => query),
    sort: jest.fn(() => query),
    skip: jest.fn(() => query),
    limit: jest.fn(() => query),
    populate: jest.fn(() => query),
    lean: jest.fn(() => query),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject)
  };
  return query;
}

module.exports = { mockQuery };
